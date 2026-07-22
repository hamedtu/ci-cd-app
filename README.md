## app - developing with Docker

This app shows a simple user profile app set up using 
- index.html with pure js and css styles
- nodejs backend with express module
- mongodb for data storage

All components are docker-based

### With Docker

#### To start the application

Step 1: Create docker network

    docker network create mongo-network 

Step 2: start mongodb 

    docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password --name mongodb --net mongo-network mongo    

Step 3: start mongo-express
    
    docker run -d -p 8081:8081 -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin -e ME_CONFIG_MONGODB_ADMINPASSWORD=password --net mongo-network --name mongo-express -e ME_CONFIG_MONGODB_SERVER=mongodb mongo-express   

_NOTE: creating docker-network in optional. You can start both containers in a default network. In this case, just emit `--net` flag in `docker run` command_

Step 4: open mongo-express from browser

    http://localhost:8081

Step 5: create `user-account` _db_ and `users` _collection_ in mongo-express

Step 6: Start your nodejs application locally - go to `app` directory of project 

    cd app
    npm install
    node server.js
    
Step 7: Access you nodejs application UI from browser

    http://localhost:3000

### With Docker Compose

#### To start the application

Step 1: start mongodb and mongo-express

    docker-compose -f docker-compose.yaml up
    
_You can access the mongo-express under localhost:8080 from your browser_
    
Step 2: in mongo-express UI - create a new database "my-db"

Step 3: in mongo-express UI - create a new collection "users" in the database "my-db"       
    
Step 4: start node server 

    cd app
    npm install
    node server.js
    
Step 5: access the nodejs application from browser 

    http://localhost:3000

#### To build a docker image from the application

    docker build -t my-app:1.0 .       
    
The dot "." at the end of the command denotes location of the Dockerfile.

## Deploy To Amazon ECS (via GitHub Actions)

This repository includes a workflow at `.github/workflows/aws.yml` that:

1. Builds the Docker image
2. Pushes it to Amazon ECR
3. Updates the ECS task definition
4. Deploys to an ECS service

### 1. Required AWS resources

Create these once in your AWS account:

- ECR repository (for example: `my-app`)
- ECS cluster and ECS service (Fargate or EC2 launch type)
- CloudWatch log group `/ecs/my-app`
- Secrets Manager secret for Mongo URL (for example `my-app/mongo-url`)

### 2. Configure task definition in repo

Edit `.aws/task-definition.json` and replace placeholder values:

- `executionRoleArn`
- `taskRoleArn`
- `image` (account id + region + repository)
- `secrets[].valueFrom` for `MONGO_URL`
- `logConfiguration.options.awslogs-region`

Container name must stay `my-app` unless you also update `CONTAINER_NAME` in the workflow.

### 3. Configure GitHub repository variables

In GitHub repository settings, add **Actions variables**:

- `AWS_REGION` (example: `eu-central-1`)
- `ECR_REPOSITORY` (example: `my-app`)
- `ECS_CLUSTER` (your cluster name)
- `ECS_SERVICE` (your service name)

### 4. Configure GitHub repository secret

Add **Actions secret**:

- `AWS_ROLE_TO_ASSUME` = IAM role ARN trusted for GitHub OIDC

Recommended best practice is OIDC role assumption (used by the workflow), not long-lived IAM user access keys.

### 5. Configure IAM trust for GitHub OIDC

Create an IAM role that trusts GitHub's OIDC provider and restrict it to your repo/branch. Attach policy permissions for:

- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:CompleteLayerUpload`
- `ecr:InitiateLayerUpload`
- `ecr:PutImage`
- `ecr:UploadLayerPart`
- `ecs:DescribeServices`
- `ecs:DescribeTaskDefinition`
- `ecs:RegisterTaskDefinition`
- `ecs:UpdateService`
- `iam:PassRole` (for your ECS execution/task roles)

### 6. Deploy

Push to `main` or trigger the workflow manually from GitHub Actions. The workflow deploys the image tagged with the commit SHA.
