
## Project Overview

This is an end-to-end cloud deployment project that takes a Dockerized web application and deploys it into AWS with CI/CD automation using GitHub Actions.

The homepage is ingested from `https://github.com/hamedtu/CV` container build, and rendered by the Node.js app.

## Architecture

1. Code is pushed to `main` branch.
2. GitHub Actions workflow builds a Docker image.
3. CV ingestion runs at image build time.
4. Image is pushed to Amazon ECR.
5. ECS task definition is rendered with the new image URI.
6. ECS service is updated and checked for stability.
7. ALB routes traffic to healthy ECS tasks.

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
4. Build and push image tagged.
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
- Load balancer: `my-app-alb`

## Public Endpoint

- http://my-app-alb-1500991790.eu-central-1.elb.amazonaws.com

