const express = require('express');
const path = require('path');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();

const PORT = process.env.PORT || 3000;
const DATABASE_NAME = process.env.MONGO_DB_NAME || 'my-db';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const MONGO_CLIENT_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 1200
};

const GENERATED_PORTFOLIO_PATH = path.join(__dirname, 'data', 'portfolio.generated.json');
const SEED_PORTFOLIO_PATH = path.join(__dirname, 'data', 'portfolio.seed.json');

const DEFAULT_PROFILE = {
  userid: 1,
  name: 'Hamed Kelardeh',
  email: 'hamed.kelardeh@example.com',
  interests: 'Physics, Programming, and Docker'
};

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse JSON file:', filePath, error.message);
    return null;
  }
}

function loadPortfolioModel() {
  const generated = readJsonIfPresent(GENERATED_PORTFOLIO_PATH);
  const seed = readJsonIfPresent(SEED_PORTFOLIO_PATH);

  if (generated) {
    return generated;
  }

  if (seed) {
    return seed;
  }

  return {
    source: {
      repo: process.env.CV_REPO || 'hamedtu/CV',
      ref: process.env.CV_REF || 'main',
      generatedAt: new Date().toISOString(),
      mode: 'fallback'
    },
    profile: {
      name: 'Hamed KoochakiKelardeh',
      title: 'Senior Data Platform Architect | DevOps & MLOps Engineer',
      summary: 'Designing secure, scalable data and ML platforms with strong delivery, observability, and governance practices.'
    },
    capabilities: [],
    caseStudies: [],
    impactMetrics: [],
    certifications: [],
    contact: {
      github: 'https://github.com/hamedtu',
      linkedin: '',
      email: ''
    }
  };
}

let portfolioModel = loadPortfolioModel();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static assets like images directly from the app folder.
app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', function (_req, res) {
  res.send({ status: 'ok' });
});

app.get('/api/portfolio', function (_req, res) {
  portfolioModel = loadPortfolioModel();
  res.send(portfolioModel);
});

app.post('/update-profile', function (req, res) {
  const userObj = {
    userid: 1,
    name: req.body.name || DEFAULT_PROFILE.name,
    email: req.body.email || DEFAULT_PROFILE.email,
    interests: req.body.interests || DEFAULT_PROFILE.interests
  };

  MongoClient.connect(MONGO_URL, MONGO_CLIENT_OPTIONS, function (err, client) {
    if (err) {
      console.error('Mongo connect failed in /update-profile:', err.message);
      return res.status(503).send({
        ...userObj,
        warning: 'Database unavailable, profile not persisted.'
      });
    }

    const db = client.db(DATABASE_NAME);
    const myquery = { userid: 1 };
    const newvalues = { $set: userObj };

    db.collection('users').updateOne(myquery, newvalues, { upsert: true }, function (err) {
      if (err) {
        console.error('Mongo write failed in /update-profile:', err.message);
        client.close();
        return res.status(500).send({
          ...userObj,
          warning: 'Database write failed.'
        });
      }
      client.close();
      res.send(userObj);
    });

  });
});

app.get('/get-profile', function (req, res) {
  MongoClient.connect(MONGO_URL, MONGO_CLIENT_OPTIONS, function (err, client) {
    if (err) {
      console.error('Mongo connect failed in /get-profile:', err.message);
      return res.send(DEFAULT_PROFILE);
    }

    const db = client.db(DATABASE_NAME);
    const myquery = { userid: 1 };

    db.collection('users').findOne(myquery, function (err, result) {
      if (err) {
        console.error('Mongo read failed in /get-profile:', err.message);
        client.close();
        return res.send(DEFAULT_PROFILE);
      }

      client.close();
      res.send(result ? result : DEFAULT_PROFILE);
    });
  });
});

app.listen(PORT, function () {
  console.log(`app listening on port ${PORT}!`);
});
