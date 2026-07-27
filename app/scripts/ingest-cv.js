const fs = require('fs/promises');
const path = require('path');

const ownerRepo = process.env.CV_REPO || 'hamedtu/CV';
const sourceRef = process.env.CV_REF || 'main';
const githubToken = process.env.GITHUB_TOKEN || '';

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const seedPath = path.join(dataDir, 'portfolio.seed.json');
const outputPath = path.join(dataDir, 'portfolio.generated.json');

function buildHeaders() {
  const headers = {
    'User-Agent': 'cv-ingestion-bot',
    Accept: 'application/vnd.github+json'
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.text();
}

function parseSectionMap(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = { heading: 'root', lines: [] };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      sections.push(current);
      current = { heading: headingMatch[1].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }

  sections.push(current);
  return sections;
}

function pickFirstNonEmpty(lines) {
  for (const line of lines) {
    const clean = line.replace(/[*_`>#-]/g, '').trim();
    if (clean.length > 30) {
      return clean;
    }
  }
  return '';
}

function toBullets(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function findByHeading(sections, candidates) {
  const lowered = candidates.map((item) => item.toLowerCase());
  return sections.find((section) => lowered.some((needle) => section.heading.toLowerCase().includes(needle)));
}

function extractContactBlob(markdown) {
  const emailMatch = markdown.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const linkedinMatch = markdown.match(/https?:\/\/(www\.)?linkedin\.com\/[A-Za-z0-9_\-/?=&.%]+/gi);
  const githubMatch = markdown.match(/https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.\-/]+/gi);

  return {
    email: emailMatch ? emailMatch[0] : '',
    linkedin: linkedinMatch ? linkedinMatch[0] : '',
    github: githubMatch ? githubMatch[0] : 'https://github.com/hamedtu'
  };
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function buildModel(seed, markdownFiles) {
  const mergedText = markdownFiles.join('\n\n');
  const sections = parseSectionMap(mergedText);
  const profileSection = findByHeading(sections, ['summary', 'profile', 'about', 'professional summary']) || sections[0];
  const skillsSection = findByHeading(sections, ['skills', 'technologies', 'tooling']);
  const experienceSection = findByHeading(sections, ['experience', 'projects', 'work history']);
  const certSection = findByHeading(sections, ['certification', 'certifications']);

  const contact = extractContactBlob(mergedText);
  const summaryText = pickFirstNonEmpty(profileSection.lines) || seed.profile.summary;

  const inferredSkills = skillsSection ? toBullets(skillsSection.lines) : [];
  const inferredExperience = experienceSection ? toBullets(experienceSection.lines) : [];
  const inferredCerts = certSection ? toBullets(certSection.lines) : [];

  const model = {
    ...seed,
    source: {
      repo: ownerRepo,
      ref: sourceRef,
      generatedAt: new Date().toISOString(),
      mode: markdownFiles.length > 0 ? 'live' : 'seed-fallback'
    },
    profile: {
      ...seed.profile,
      summary: summaryText
    },
    capabilities: seed.capabilities.map((group, idx) => {
      if (idx !== 0 || inferredSkills.length === 0) {
        return group;
      }

      return {
        ...group,
        items: dedupe([...inferredSkills.slice(0, 8), ...group.items]).slice(0, 10)
      };
    }),
    caseStudies: seed.caseStudies.map((entry, idx) => {
      if (idx !== 0 || inferredExperience.length === 0) {
        return entry;
      }

      return {
        ...entry,
        approach: dedupe([...entry.approach, ...inferredExperience.slice(0, 4)])
      };
    }),
    certifications: dedupe([...inferredCerts, ...seed.certifications]).slice(0, 8),
    contact: {
      github: contact.github || seed.contact.github,
      linkedin: contact.linkedin || seed.contact.linkedin,
      email: contact.email || seed.contact.email
    }
  };

  return model;
}

async function listCandidateFiles() {
  const [owner, repo] = ownerRepo.split('/');
  if (!owner || !repo) {
    throw new Error(`CV_REPO must be owner/repo format. Received: ${ownerRepo}`);
  }

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sourceRef}?recursive=1`;
  const tree = await fetchJson(treeUrl);
  const allowList = /(readme|cv|resume|about|profile|experience|portfolio).*\.(md|markdown|txt)$/i;

  return tree.tree
    .filter((node) => node.type === 'blob' && allowList.test(node.path))
    .map((node) => node.path)
    .slice(0, 12);
}

async function pullMarkdownFiles() {
  const [owner, repo] = ownerRepo.split('/');
  const candidates = await listCandidateFiles();
  const markdownFiles = [];

  for (const filePath of candidates) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${sourceRef}/${filePath}`;
    try {
      const content = await fetchText(rawUrl);
      markdownFiles.push(content);
    } catch (error) {
      console.warn(`Skipping ${filePath}: ${error.message}`);
    }
  }

  return markdownFiles;
}

async function loadSeed() {
  const raw = await fs.readFile(seedPath, 'utf-8');
  return JSON.parse(raw);
}

async function writeModel(model) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(model, null, 2));
}

async function main() {
  const seed = await loadSeed();
  let markdownFiles = [];

  try {
    markdownFiles = await pullMarkdownFiles();
  } catch (error) {
    console.warn(`CV ingestion fallback enabled: ${error.message}`);
  }

  const model = buildModel(seed, markdownFiles);
  await writeModel(model);
  console.log(`Portfolio model generated (${model.source.mode}) from ${ownerRepo}@${sourceRef}`);
}

main().catch((error) => {
  console.error('Portfolio ingestion failed:', error.message);
  process.exit(1);
});
