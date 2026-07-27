
## Project Overview

This repository hosts a production-focused profile platform deployed to AWS ECS using GitHub Actions.

The homepage is CV-driven: content is ingested from `https://github.com/hamedtu/CV` during container build, normalized into a portfolio model, and rendered by the Node.js app.

## Production Architecture

1. Code is pushed to `main`.
2. GitHub Actions workflow builds a Docker image.
3. CV ingestion runs at image build time.
4. Image is pushed to Amazon ECR.
5. ECS task definition is rendered with the new image URI.
6. ECS service is updated and checked for stability.
7. ALB routes traffic to healthy ECS tasks.

## Repository Scope (Kept on GitHub)

Only files required for the upgraded profile and deployment pipeline are tracked.

- `.github/workflows/aws.yml`: CI/CD workflow (build + deploy)
- `.aws/task-definition.json`: ECS runtime task definition
- `Dockerfile`: production image build including CV ingestion
- `.dockerignore`: Docker context optimization
- `.gitignore`: local-only and generated-file exclusions
- `app/server.js`: app server + `/api/portfolio` endpoint
- `app/index.html`: professional homepage UI
- `app/package.json`: scripts and dependencies
- `app/package-lock.json`: dependency lockfile
- `app/scripts/ingest-cv.js`: CV ingestion and normalization pipeline
- `app/data/portfolio.seed.json`: curated fallback content model

## Local-Only Files

Some older files are intentionally untracked for local reference and are excluded from GitHub.

- `docker-compose.yaml`
- `docker-compose.deploy.yaml`
- `app/images/profile-1.jpg`

## Build and Run

Build the production image locally:

```bash
docker build -t my-app:1.0 .
```

Run the app container locally:

```bash
docker run --rm -p 3000:3000 my-app:1.0
```

Open:

- http://localhost:3000

## CI/CD Workflow

Workflow file: `.github/workflows/aws.yml`

Main steps:

1. Checkout repository.
2. Configure AWS credentials with OIDC.
3. Login to ECR.
4. Build and push image tagged with `${{ github.sha }}`.
5. Render ECS task definition with image URI.
6. Deploy to ECS service and wait for stability.

Trigger deployment:

```bash
git push origin main
```

## AWS Deployment Context

- Region: `eu-central-1`
- ECR repository: `my-app`
- ECS cluster: `my-app-github-action-cluster`
- ECS service: `my-app-github-action-service`
- Task definition family: `my-app-task`
- CloudWatch log group: `/ecs/my-app`
- Load balancer: `my-app-alb`

## Public Endpoint

- http://my-app-alb-1500991790.eu-central-1.elb.amazonaws.com

