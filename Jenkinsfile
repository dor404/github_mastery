pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        DOCKER_IMAGE_CLIENT = 'shoambendavid/github-mastery-client'
        DOCKER_IMAGE_SERVER = 'shoambendavid/github-mastery-server'
        DOCKER_IMAGE_TAG = "${env.BUILD_NUMBER}"
        OPENAI_API_KEY = credentials('openai-api-key')
        JWT_SECRET = credentials('jwt-secret')
        MONGODB_URI = credentials('mongodb-uri')
        SURVEY_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTiWwPJIbC97FhdhTvfkJJw6PxqvxCkPziek-I9F8JoeRAZuuVc5VeoC2X8SKIqCh7ICIkgmsKz4wh/pub?output=xlsx'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Survey Satisfaction') {
            steps {
                script {
                    // Run Python script in Docker container
                    sh """
                        docker run --rm \
                            -v "\$(pwd):/app" \
                            -w /app \
                            -e SURVEY_URL='${SURVEY_URL}' \
                            python:3.12-slim \
                            /bin/bash -c '\
                                python -m pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org openpyxl && \
                                python survey_check.py "\${SURVEY_URL}"\
                            '
                    """
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Client Dependencies') {
                    steps {
                        dir('client') {
                            sh 'docker run --rm -v "$(pwd):/app" -w /app node:16 npm ci'
                        }
                    }
                }
                stage('Server Dependencies') {
                    steps {
                        dir('server') {
                            sh 'docker run --rm -v "$(pwd):/app" -w /app node:16 npm ci'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Client Tests') {
                    steps {
                        dir('client') {
                            sh 'docker run --rm -v "$(pwd):/app" -w /app node:16 npm test -- --watchAll=false'
                        }
                    }
                }
                stage('Server Tests') {
                    steps {
                        dir('server') {
                            sh """
                                docker run --rm \
                                    -v "\$(pwd):/app" \
                                    -w /app \
                                    -e OPENAI_API_KEY='${OPENAI_API_KEY}' \
                                    -e JWT_SECRET='${JWT_SECRET}' \
                                    -e MONGODB_URI='${MONGODB_URI}' \
                                    --network host \
                                    node:16 \
                                    npm test -- --forceExit --detectOpenHandles
                            """
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                dir('client') {
                    sh 'docker run --rm -v "$(pwd):/app" -w /app node:16 npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            when {
                branch 'release'
            }
            steps {
                script {
                    docker.build("${DOCKER_IMAGE_CLIENT}:${DOCKER_IMAGE_TAG}", "-f client/Dockerfile ./client")
                    docker.build("${DOCKER_IMAGE_SERVER}:${DOCKER_IMAGE_TAG}", "-f server/Dockerfile ./server")
                }
            }
        }

        stage('Push Docker Images') {
            when {
                branch 'release'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_REGISTRY_CREDENTIALS) {
                        docker.image("${DOCKER_IMAGE_CLIENT}:${DOCKER_IMAGE_TAG}").push()
                        docker.image("${DOCKER_IMAGE_SERVER}:${DOCKER_IMAGE_TAG}").push()

                        docker.image("${DOCKER_IMAGE_CLIENT}:${DOCKER_IMAGE_TAG}").push('latest')
                        docker.image("${DOCKER_IMAGE_SERVER}:${DOCKER_IMAGE_TAG}").push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'release'
            }
            steps {
                script {
                    sh "sed -i 's|image: ${DOCKER_IMAGE_CLIENT}:.*|image: ${DOCKER_IMAGE_CLIENT}:${DOCKER_IMAGE_TAG}|g' docker-compose.prod.yml"
                    sh "sed -i 's|image: ${DOCKER_IMAGE_SERVER}:.*|image: ${DOCKER_IMAGE_SERVER}:${DOCKER_IMAGE_TAG}|g' docker-compose.prod.yml"

                    sh 'docker-compose -f docker-compose.prod.yml up -d'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo '✅ Build and deployment completed successfully!'
        }
        failure {
            echo '❌ Build or deployment failed!'
        }
    }
}
