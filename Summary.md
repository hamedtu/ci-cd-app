# Summary and Roadmap for `techworld-js-docker-demo-app`

This document is a step-by-step guide for a new Docker user. It explains how the app works, how to run it locally, how to set up MongoDB and mongo-express with Docker, and how to build and run the application as a Docker image.

<!--
Quick overview:
- Node/Express app lives in `app/`
- The app serves `index.html` and static images
- MongoDB is optional for startup, but needed for saving/loading profiles
- mongo-express is a browser UI for MongoDB
-->

## 1. What This Project Contains

The project is a simple user profile application with these parts:

- `app/index.html` - front-end user profile page
- `app/server.js` - Node.js/Express backend
- `app/images/` - profile images
- `Dockerfile` - builds the Node application image
- `docker-compose.yaml` - starts MongoDB, mongo-express, and the app together

## 2. How the App Works

The backend does the following:

- Serves the homepage at `http://localhost:3000/`
- Serves static files like images from the `app/` folder
- Provides `GET /get-profile` to load profile data
- Provides `POST /update-profile` to save profile data
- Uses MongoDB when available
- Falls back to default profile data if MongoDB is not running

The front-end does the following:

- Loads the profile from the backend
- Shows the page content after the DOM is ready
- Lets the user edit and update the profile
- Uses relative API paths so it works on any local port

## 3. Project Structure

```text
techworld-js-docker-demo-app/
├── Dockerfile
├── Summary.md
├── README.md
├── docker-compose.yaml
└── app/
    ├── index.html
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── images/
        ├── profile-1.jpg
        └── profile-2.jpg
```

<!--
Important note:
The Node app is in the `app/` folder, not the repository root.
That is why you must run `node server.js` from `app/` when running locally.
-->

## 4. Prerequisites

Before you start, make sure you have:

- Docker Desktop installed and running
- WSL integration enabled if you are using WSL
- Node.js installed if you want to run the app locally without Docker
- A browser to open `http://localhost:3000` and `http://localhost:8080`

## 5. Run the App Locally Without Docker

This is the easiest way to understand the app first.

### Step 1: Go to the app folder

```bash
cd /mnt/c/Users/user/Desktop/TechWorld_Nana/techworld-js-docker-demo-app/app
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Start the server

```bash
PORT=3000 node server.js
```

### Step 4: Open the app in your browser

```text
http://localhost:3000
```

### What to expect

- The page should load even if MongoDB is not running.
- If MongoDB is unavailable, the app shows default profile data.

## 6. Set Up MongoDB, mongo-express, and the App with Docker Compose

This section explains the database side of the project.

### What each container does

- `mongodb` stores the profile data
- `mongo-express` provides a web UI to browse and manage the database

### Step 1: Start the complete stack with Docker Compose

Run this from the repository root:

```bash
docker compose -f docker-compose.yaml up -d
```

This command starts all three services:

- `mongodb`
- `mongo-express`
- `my-app`

Docker Compose also creates the network automatically, so you do not need to create it by hand.

### Step 2: Open mongo-express in your browser

```text
http://localhost:8081
```

### Step 3: Login credentials for mongo-express

Use these credentials in the browser prompt:

- Username: `admin`
- Password: `pass`

### Step 4: Create the database and collection

Inside mongo-express:

- Create database: `user-account`
- Create collection: `users`

<!--
This matches the backend code in `server.js`, which uses the `user-account` database and the `users` collection.
-->

## 7. Build the Docker Image for the App

The `Dockerfile` builds the Node app image.

### Step 1: Build the image

Run this from the repository root:

```bash
docker build -t my-app:1.0 .
```

### What this command does

- Reads the `Dockerfile`
- Copies `app/` into the image
- Runs `npm install` inside the image
- Sets the start command to `node server.js`

### Step 2: Check the image

```bash
docker images
```

You should see the image in the list.

## 8. Use Docker Compose

`docker-compose.yaml` starts MongoDB, mongo-express, and the app together.

### Step 1: Start the Compose stack

Run this from the repository root:

```bash
docker compose -f docker-compose.yaml up -d
```

### Step 2: Check the running containers

```bash
docker ps
```

### Step 3: Open mongo-express

```text
http://localhost:8080
```

### Step 4: Create the database and collection

Inside mongo-express:

- Database: `user-account`
- Collection: `users`

### Step 5: Open the app

```text
http://localhost:3000
```

### Optional: Run only the app container

If you want to practice `docker run` separately, you can still run just the app container after MongoDB is available on the same network:

```bash
docker run -d \
  -p 3000:3000 \
  --name my-app \
  --net mongo-network \
  -e MONGO_URL=mongodb://admin:password@mongodb:27017 \
  -e MONGO_DB_NAME=user-account \
  my-app:1.0
```

Then view logs with:

```bash
docker logs my-app
```

## 9. Useful Docker Commands 

Here is the command order a beginner should remember:

### Check Docker is working

```bash
docker --version
docker ps
```

### Create a network

```bash
docker network create mongo-network
```

### Start MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb --net mongo-network -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo
```

### Start mongo-express

```bash
docker run -d -p 8081:8081 --name mongo-express --net mongo-network -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin -e ME_CONFIG_MONGODB_ADMINPASSWORD=password -e ME_CONFIG_MONGODB_SERVER=mongodb -e ME_CONFIG_BASICAUTH_USERNAME=admin -e ME_CONFIG_BASICAUTH_PASSWORD=pass mongo-express
```

### Build the app image

```bash
docker build -t my-app:1.0 .
```

### Inspect running containers

```bash
docker ps
```

### See logs

```bash
docker logs my-app
```

### Stop and remove containers

```bash
docker stop my-app mongodb mongo-express
docker rm my-app mongodb mongo-express
```

### Remove the network when you are done

```bash
docker network rm mongo-network
```

## 10. Troubleshooting Notes

### If `docker` says it cannot find `/var/run/docker.sock`

- Docker Desktop may not be running
- WSL integration may not be enabled
- Restart Docker Desktop
- Run `wsl --shutdown` from Windows PowerShell and reopen WSL

### If mongo-express asks for a username and password

Use:

- Username: `admin`
- Password: `pass`

### If MongoDB is not reachable

Make sure:

- MongoDB container is running
- mongo-express and the app are on the same Docker network
- You used the container name `mongodb` in connection strings

### If the app shows a white page

Check these first:

- Open the browser console for JavaScript errors
- Confirm the app is running on the correct port
- Confirm `http://localhost:3000/health` returns `{"status":"ok"}`
- Make sure `index.html` is being served from the app folder

## 11. Recommended Learning Path

If you are new to Docker, follow this order:

1. Run the app locally with Node first
2. Start MongoDB in Docker
3. Start mongo-express in Docker
4. Open the mongo-express UI and create the database
5. Run the app against MongoDB
6. Build the app image with `docker build`
7. Run the app in a Docker container
8. Use Docker Compose to start multiple services together

<!--
Final note:
This project is already set up to work even when MongoDB is not installed.
That makes it easier for beginners to start learning one piece at a time.
-->

## 12. AWS ECR Permissions

To push images to ECR, the IAM user or role you use needs ECR permissions.

Your ECR repository is:

```text
929862311755.dkr.ecr.eu-central-1.amazonaws.com/my-app
```

### Required permissions

- `ecr:GetAuthorizationToken` - allows Docker to log in to ECR
- `ecr:BatchCheckLayerAvailability`, `ecr:CompleteLayerUpload`, `ecr:InitiateLayerUpload`, `ecr:PutImage`, `ecr:UploadLayerPart`, `ecr:BatchGetImage` - allow image push and pull operations

### Example IAM policy

Attach this to the IAM user or role that runs the Docker push:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrLogin",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EcrPushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
        "ecr:BatchGetImage"
      ],
      "Resource": "arn:aws:ecr:eu-central-1:929862311755:repository/my-app"
    }
  ]
}
```

## 13. Push the App Image to AWS ECR

Use these steps after you have built `my-app:1.0` locally.

### Step 1: Make sure the repository exists

If the repository does not exist yet, create it:

```bash
aws ecr create-repository --repository-name my-app --region eu-central-1
```

### Step 2: Log in to ECR

```bash
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 929862311755.dkr.ecr.eu-central-1.amazonaws.com
```

### Step 3: Tag the local image

```bash
docker tag my-app:1.0 929862311755.dkr.ecr.eu-central-1.amazonaws.com/my-app:1.0
```

### Step 4: Push the image

```bash
docker push 929862311755.dkr.ecr.eu-central-1.amazonaws.com/my-app:1.0
```

### Step 5: Confirm it in ECR

Go to the AWS Console and open the repository:

```text
929862311755.dkr.ecr.eu-central-1.amazonaws.com/my-app
```

## 14. Deployment

Use this flow on the target machine to deploy the app stack by pulling images (no local build needed).

### Step 1: Log in to ECR

```bash
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 929862311755.dkr.ecr.eu-central-1.amazonaws.com
```

### Step 2: Start the deployment stack

```bash
docker compose -f docker-compose.deploy.yaml up -d
```

### Step 3: Verify running services

```bash
docker compose -f docker-compose.deploy.yaml ps
```

The app should be available at `http://localhost:3000` and mongo-express at `http://localhost:8080`.
