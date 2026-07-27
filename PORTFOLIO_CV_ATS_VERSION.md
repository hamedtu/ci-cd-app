# CV Portfolio Version (ATS-Friendly)

## Project: Cloud CI/CD Deployment with AWS ECS and GitHub Actions

- Built and deployed a containerized full-stack web application (Node.js, Express, MongoDB) from GitHub to AWS ECS Fargate.
- Implemented CI/CD pipeline using GitHub Actions for Docker build, Amazon ECR push, ECS task definition render, and service deployment.
- Configured secure AWS authentication for CI/CD using OIDC role assumption and IAM least-privilege access patterns.
- Created and configured ECS resources including cluster, service, task definition, execution role, and task role.
- Integrated AWS Secrets Manager for runtime secret injection and CloudWatch Logs for centralized observability.
- Added application and infrastructure health checks to improve deployment reliability and rollback visibility.
- Provisioned and attached an internet-facing Application Load Balancer (ALB) with target group health checks to provide a stable URL.
- Diagnosed and resolved deployment issues including IAM AccessDenied errors, OIDC trust policy mismatch, and ECS image pull failures.
- Improved container build quality by optimizing Dockerfile layers and production dependency installation.
- Documented deployment workflow, troubleshooting steps, and operational runbook for repeatable delivery.

## Tech Stack

- Languages/Runtime: JavaScript, Node.js
- Backend: Express
- Database: MongoDB
- DevOps: Docker, Docker Compose, GitHub Actions
- Cloud: AWS ECS (Fargate), ECR, IAM, Secrets Manager, CloudWatch Logs, ALB
