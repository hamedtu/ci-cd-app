
## Project Overview

This is an end-to-end cloud deployment project that takes a Dockerized application and deploys it into AWS with CI/CD automation.

The application is a profile web app built with Node.js, MongoDB, and JavaScript. I containerized the app, implemented automated delivery with GitHub Actions, and deployed it on Amazon ECS.

## Architecture

1. Developer pushes code to `main`
2. GitHub Actions workflow runs
3. Docker image is built and tagged 
4. Image is pushed to Amazon ECR
5. ECS task definition is rendered with the new image URI
6. ECS service is updated and waits for stability
7. ALB routes public traffic to healthy ECS tasks

## Repository Files Used For Deployment

- `.github/workflows/aws.yml`: CI/CD workflow
- `.aws/task-definition.json`: ECS task definition
- `Dockerfile`: production image build
- `.dockerignore`: build context optimization

## Docker Containerization

Build locally:

```bash
docker build -t my-app:1.0 .
```

Run local stack with Docker Compose:

```bash
docker compose -f docker-compose.yaml up -d
```

Local endpoints:

- App: http://localhost:3000
- Mongo Express: http://localhost:8080

## CI/CD Workflow [ Deploy To Amazon ECS via GitHub Actions]

The workflow in `.github/workflows/aws.yml` performs:

1. Checkout repository
2. Configure AWS credentials using OIDC role assumption
3. Login to Amazon ECR
4. Build and push Docker image tagged with `${{ github.sha }}`
5. Render ECS task definition with the new image
6. Deploy updated task definition to ECS service

Trigger deployment:

```bash
git push origin main
```

Or run manually from GitHub Actions using `workflow_dispatch`.

## AWS Resources (Current Setup)

- Region: `eu-central-1`
- ECR repository: `my-app`
- ECS cluster: `my-app-github-action-cluster`
- ECS service: `my-app-github-action-service`
- Task definition family: `my-app-task`
- Runtime secret: `my-app/mongo-url` (Secrets Manager)
- Logs: CloudWatch log group `/ecs/my-app`
- ALB: `my-app-alb`

## Access The App On AWS Endpoint

Stable public endpoint (ALB DNS):

- App UI: http://my-app-alb-1500991790.eu-central-1.elb.amazonaws.com

