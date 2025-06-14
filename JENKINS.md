# Jenkins CI/CD Setup for GitHub Mastery Platform

This document outlines how to set up Jenkins CI/CD for the GitHub Mastery learning platform.

## Prerequisites

- Jenkins server (version 2.346.x or later)
- Docker installed on the Jenkins server
- Node.js installed on the Jenkins server
- Access to Docker Hub (or another container registry)

## Setup Instructions

### 1. Set Up Jenkins

You can use the provided `jenkins-setup.sh` script to install Jenkins and required plugins:

```bash
chmod +x jenkins-setup.sh
./jenkins-setup.sh
```

### 2. Configure Jenkins

After installation:

1. Navigate to Jenkins web UI (usually http://your-jenkins-server:8080)
2. Go to "Manage Jenkins" > "Global Tool Configuration"
3. Add a NodeJS installation with the name "NodeJS"
4. Go to "Manage Jenkins" > "Manage Credentials"
5. Add Docker Hub credentials with ID "dockerhub-credentials"

### 3. Create Pipeline Job

1. From the Jenkins dashboard, click "New Item"
2. Enter a name for your pipeline (e.g., "github-mastery-pipeline")
3. Select "Pipeline" and click "OK"
4. In the configuration:
   - Under "Pipeline", select "Pipeline script from SCM"
   - Select "Git" as the SCM
   - Enter your repository URL
   - Specify the branch to build (e.g., "*/main")
   - Script Path: "Jenkinsfile"
   - Click "Save"

### 4. Environment Variables

Set the following environment variables in Jenkins:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT authentication
- `REACT_APP_API_URL`: URL for the API (e.g., http://your-server:5001)

You can add these as environment variables in Jenkins:
1. Go to "Manage Jenkins" > "System Configuration" > "System"
2. Scroll to the "Global properties" section
3. Check "Environment variables"
4. Add the variables listed above

### 5. Run Your First Build

1. Go to your pipeline's page in Jenkins
2. Click "Build Now"
3. Monitor the build progress

## Pipeline Stages

The Jenkinsfile includes the following stages:

1. **Checkout**: Retrieves the code from the repository
2. **Install Dependencies**: Installs npm dependencies for both client and server
3. **Run Tests**: Executes test suites for both client and server
4. **Build**: Builds the React client application
5. **Build Docker Images**: Creates Docker images for client and server
6. **Push Docker Images**: Pushes images to the Docker registry
7. **Deploy**: Updates the docker-compose.prod.yml file and deploys the application (only on the main branch)

## Customizing the Pipeline

To customize the pipeline:

1. Modify the `Jenkinsfile` as needed
2. Update `docker-compose.prod.yml` for production deployment
3. Change Docker image names and registry in the environment section of the Jenkinsfile:
   ```groovy
   environment {
       DOCKER_REGISTRY = 'docker.io'
       DOCKER_REGISTRY_CREDENTIALS = 'dockerhub-credentials'
       DOCKER_IMAGE_CLIENT = 'yourusername/github-mastery-client'
       DOCKER_IMAGE_SERVER = 'yourusername/github-mastery-server'
       // ...
   }
   ```

## Troubleshooting

If you encounter issues:

- Check Jenkins console output for specific error messages
- Verify that all required plugins are installed
- Ensure Docker and Node.js are properly configured in Jenkins
- Validate that your Docker Hub credentials are correct
- Check network connectivity to Docker Hub and your deployment environment 