# GCP Deployment Guide for Beginners

This guide follows the same deployment principles already used in this repository for AWS and Azure:

1. Trigger: push to main or manual run.
2. Build Docker image in GitHub Actions.
3. Push image to cloud registry.
4. Update runtime service with new image.
5. Print and verify public endpoint.

For GCP, the matching stack is:

- Container Registry: Artifact Registry
- Runtime Service: Cloud Run
- CI/CD Auth: GitHub OIDC with Workload Identity Federation

## Deployment flow summary

1. One-time setup in GCP.
2. One-time setup in GitHub secrets.
3. Add GCP GitHub Actions workflow.
4. Deploy by pushing to main.
5. Verify URL and health.

## Interactive Step 1: Set project values

Run this in PowerShell and replace placeholder values first.

$PROJECT_ID = "nimble-unison-497015-d7"
$PROJECT_NUMBER = "471120028176"
$REGION = "europe-west1"
$REPOSITORY = "my-app"
$SERVICE_NAME = "my-app"
$POOL_ID = "github-pool"
$PROVIDER_ID = "github-provider"
$SERVICE_ACCOUNT_NAME = "github-actions-deployer"
$GITHUB_REPO = "hamedtu/ci-cd-app"

Checkpoint:

- Keep these values. You will reuse them in all later steps.

Current run values already confirmed in this workspace:

- Project ID: nimble-unison-497015-d7
- Project Number: 471120028176
- Region: europe-west1
- Artifact Registry repo: my-app
- Cloud Run service: my-app
- GitHub repository: hamedtu/ci-cd-app

## Interactive Step 2: Enable required APIs

gcloud services enable artifactregistry.googleapis.com run.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com --project $PROJECT_ID

Checkpoint:

- Command finishes without error.

## Interactive Step 3: Create Artifact Registry repository

gcloud artifacts repositories create $REPOSITORY --repository-format=docker --location=$REGION --description="Docker images for my-app" --project=$PROJECT_ID

If it already exists, continue.

Checkpoint:

- Repository exists in Artifact Registry.

## Interactive Step 4: Create Cloud Run service account for GitHub Actions

$SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME --display-name="GitHub Actions Deployer" --project=$PROJECT_ID

Grant required roles:

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/iam.serviceAccountUser"

Checkpoint:

- Service account exists.
- Role bindings succeed.

## Interactive Step 5: Create Workload Identity Federation for GitHub OIDC

Create pool:

gcloud iam workload-identity-pools create $POOL_ID --location="global" --display-name="GitHub Pool" --project=$PROJECT_ID

Create provider:

gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID --location="global" --workload-identity-pool=$POOL_ID --display-name="GitHub Provider" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --project=$PROJECT_ID

Allow your GitHub repo to impersonate this service account:

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$GITHUB_REPO" --project=$PROJECT_ID

Get provider resource name:

gcloud iam workload-identity-pools providers describe $PROVIDER_ID --workload-identity-pool=$POOL_ID --location=global --project=$PROJECT_ID --format="value(name)"

Checkpoint:

- Save the provider name output. You need it in GitHub secrets.

Current provider value from this setup:

- projects/471120028176/locations/global/workloadIdentityPools/github-pool/providers/github-provider

## Interactive Step 6: Add GitHub repository secrets

Add these secrets in GitHub repository settings:

- GCP_PROJECT_ID: your project id
- GCP_WIF_PROVIDER: full provider name output from Step 5
- GCP_SERVICE_ACCOUNT: service account email from Step 4

Current values from this setup:

- GCP_PROJECT_ID: nimble-unison-497015-d7
- GCP_WIF_PROVIDER: projects/471120028176/locations/global/workloadIdentityPools/github-pool/providers/github-provider
- GCP_SERVICE_ACCOUNT: github-actions-deployer@nimble-unison-497015-d7.iam.gserviceaccount.com

Optional secrets if you want workflow-driven config:

- GCP_REGION: europe-west1
- GCP_ARTIFACT_REPO: my-app
- GCP_CLOUD_RUN_SERVICE: my-app

Checkpoint:

- All required secrets added.

## Interactive Step 7: Add workflow file

Create file .github/workflows/gcp.yml with this pipeline logic:

1. Checkout source.
2. Authenticate to GCP using google-github-actions/auth with OIDC.
3. Setup gcloud SDK.
4. Configure docker auth for Artifact Registry host.
5. Build and push image using commit SHA tag.
6. Deploy image to Cloud Run.
7. Print service URL.

Reference environment values:

- GCP_REGION: europe-west1
- GCP_ARTIFACT_REPO: my-app
- IMAGE_NAME: my-app
- GCP_CLOUD_RUN_SERVICE: my-app
- CV_REPO: hamedtu/CV
- CV_REF: main

Image URI format:

- REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/IMAGE_NAME:GITHUB_SHA

This workflow has already been created in this repository:

- .github/workflows/gcp.yml

## Interactive Step 8: First deploy

Push to main:

git push origin main

Or run workflow manually.

Checkpoint:

- GitHub Action completes successfully.
- Cloud Run URL printed in logs.

## Interactive Step 9: Verify endpoint and health

Get URL:

gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)"

Health check:

curl <CLOUD_RUN_URL>/health

Expected:

{"status":"ok"}

## Post-deploy hardening checklist for GCP

1. Use least privilege roles for deployer service account.
2. Restrict Workload Identity provider condition to your exact repo and branch.
3. Keep Cloud Run minimum public access policy intentional.
4. Store all secrets in Secret Manager if sensitive runtime env vars are needed.
5. Enable Cloud Logging and Error Reporting dashboards.
6. Add retention/lifecycle policy to Artifact Registry images.

## Cleanup of unnecessary steps

After CI/CD is in place, skip these during normal releases:

- Manual local docker push to Artifact Registry
- Recreating IAM roles and Workload Identity pool each deploy
- Recreating Cloud Run service each deploy

Normal release should be only:

1. Push code.
2. GitHub Actions builds, pushes, deploys.
3. Verify endpoint.

## Principle mapping from existing pipelines

- Existing pattern: Checkout -> cloud OIDC auth -> registry login -> build and push image -> update service -> output endpoint
- GCP implementation: Checkout -> Workload Identity auth -> Artifact Registry auth -> build and push image -> deploy Cloud Run -> output URL
