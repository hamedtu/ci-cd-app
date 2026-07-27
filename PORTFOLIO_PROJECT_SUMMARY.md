# Project Portfolio Summary

## Project: TechWorld JS Docker Demo App

Built and deployed a containerized full-stack profile management application using a production-style CI/CD pipeline on AWS. The project started as a local Dockerized Node.js + MongoDB app, then evolved into a cloud deployment workflow with automated builds, image publishing, ECS rollout, runtime secret management, and stable routing through an Application Load Balancer.

## Project Description

This project delivers a lightweight user profile web application with a Node.js and Express backend, MongoDB persistence, and a simple HTML/CSS/JavaScript frontend. The backend exposes health and profile APIs, supports resilient fallback behavior when the database is unavailable, and is packaged as a Docker image for consistent runtime behavior across local and cloud environments.

The deployment pipeline automatically builds and pushes images to Amazon ECR, updates task definitions, and deploys to Amazon ECS on Fargate using GitHub Actions and OIDC-based AWS authentication.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Containerization: Docker, Docker Compose
- CI/CD: GitHub Actions
- Cloud Platform: AWS
- AWS Services: Amazon ECR, Amazon ECS (Fargate), IAM, Secrets Manager, CloudWatch Logs, Application Load Balancer
- Security and Access: OIDC role assumption, task and execution IAM roles, security groups

## Highlights

- Designed and implemented end-to-end CI/CD from GitHub to AWS ECS.
- Configured secure GitHub Actions authentication to AWS using OIDC instead of long-lived credentials.
- Built production-ready ECS task definition with health checks, centralized logging, and secret injection.
- Integrated ECS service with an internet-facing Application Load Balancer to provide a stable endpoint.
- Diagnosed and resolved real deployment failures including IAM permission issues, OIDC trust policy mismatches, and image tag pull errors.
- Improved container build quality with optimized Docker layering and production dependency installation.
- Delivered operational documentation and repeatable deployment guidance for future maintenance.

## Outcome

The application is successfully deployed on AWS, health checks pass through the ALB endpoint, and the CI/CD pipeline is stable for ongoing automated deployments from the main branch.
