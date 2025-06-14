#!/bin/bash

# Script to set up Jenkins with required plugins for the pipeline

# Make the script executable (chmod +x jenkins-setup.sh)

# Install Jenkins if not already installed
# This is a basic Ubuntu/Debian installation example
# For other OS, modify accordingly

echo "Checking if Jenkins is installed..."
if ! command -v jenkins &> /dev/null; then
    echo "Jenkins not found. Installing Jenkins..."
    
    # Add the Jenkins repository key
    wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
    
    # Add the Jenkins repository
    sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
    
    # Update package repository
    sudo apt-get update
    
    # Install Jenkins and Java
    sudo apt-get install -y jenkins openjdk-11-jdk
    
    # Start Jenkins service
    sudo systemctl start jenkins
    
    echo "Jenkins installed successfully."
else
    echo "Jenkins is already installed."
fi

# Wait for Jenkins to start
echo "Waiting for Jenkins to start..."
sleep 30

# Get initial admin password
JENKINS_INITIAL_PASSWORD=$(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)
echo "Jenkins initial admin password: $JENKINS_INITIAL_PASSWORD"

# Install Jenkins CLI
echo "Downloading Jenkins CLI..."
wget http://localhost:8080/jnlpJars/jenkins-cli.jar

# Install required plugins
echo "Installing required plugins..."
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:$JENKINS_INITIAL_PASSWORD install-plugin \
    git \
    docker-workflow \
    workflow-aggregator \
    pipeline-stage-view \
    nodejs \
    docker-build-step \
    credentials \
    timestamper \
    ws-cleanup \
    blueocean

# Restart Jenkins to apply changes
echo "Restarting Jenkins to apply changes..."
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:$JENKINS_INITIAL_PASSWORD safe-restart

echo "Jenkins setup complete! Please complete the following manual steps:"
echo "1. Navigate to Jenkins (http://localhost:8080)"
echo "2. Go to 'Manage Jenkins' > 'Global Tool Configuration'"
echo "3. Add NodeJS installation (name it 'NodeJS')"
echo "4. Go to 'Manage Jenkins' > 'Manage Credentials'"
echo "5. Add Docker Hub credentials with ID 'dockerhub-credentials'"
echo "6. Create a new Pipeline job pointing to your Git repository" 