// ------------------------------------------------------------
// QR Attendance – CI/CD pipeline (Declarative)
// ------------------------------------------------------------
pipeline {
    agent any

    // ----------------------------------------------------
    // GLOBAL ENVIRONMENT – credentials and static values
    // ----------------------------------------------------
    environment {
        // Docker Hub credentials (ID: dockerhub) → USERNAME & PASSWORD vars
        DOCKER_HUB = credentials('dockerhub')

        // EC2 SSH credentials (ID: ec2-ssh) → provides SSH_PRIVATE_KEY
        EC2_SSH_KEY = credentials('ec2-ssh')

        // Static configuration – edit if your setup changes
        EC2_HOST        = '13.203.219.213'                     // EC2 public IP
        EC2_WORKDIR     = '~/Devops_project'                  // folder on EC2 with docker‑compose.yml
        BACKEND_IMG     = 'shubhamhalladamath/attendance-backend:latest'
        FRONTEND_IMG    = 'shubhamhalladamath/attendance-frontend:latest'
    }

    // ----------------------------------------------------
    // TRIGGER – GitHub webhook (no polling needed)
    // ----------------------------------------------------
    triggers {
        // The GitHub plugin will invoke this job when it receives a push webhook.
        // No additional trigger syntax is required.
    }

    // ----------------------------------------------------
    // STAGES – sequential workflow
    // ----------------------------------------------------
    stages {

        stage('Checkout') {
            steps {
                // Pull the exact commit that triggered the webhook
                checkout scm
            }
        }

        stage('Docker Hub Login') {
            steps {
                script {
                    sh '''
                        echo "$PASSWORD" | docker login -u "$USERNAME" --password-stdin
                    '''
                }
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                script {
                    sh '''
                        echo "=== Building Backend Image ==="
                        docker build -t ${BACKEND_IMG} ./Backend
                        echo "=== Pushing Backend Image ==="
                        docker push ${BACKEND_IMG}
                    '''
                }
            }
        }

        stage('Build & Push Frontend Image') {
            steps {
                script {
                    sh '''
                        echo "=== Building Frontend Image ==="
                        docker build --build-arg VITE_API_URL=/api -t ${FRONTEND_IMG} ./Frontend
                        echo "=== Pushing Frontend Image ==="
                        docker push ${FRONTEND_IMG}
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                // Load the EC2 private key into ssh-agent
                sshagent (credentials: ['ec2-ssh']) {
                    sh '''
                        echo "=== Deploying to EC2 (${EC2_HOST}) ==="
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} <<'EOS'
                            set -e
                            cd ${EC2_WORKDIR}
                            echo "Pulling latest images from Docker Hub..."
                            docker compose pull
                            echo "Re‑creating containers..."
                            docker compose up -d
                        EOS
                    '''
                }
            }
        }
    }

    // ----------------------------------------------------
    // POST – notifications & cleanup
    // ----------------------------------------------------
    post {
        success {
            echo '✅ Pipeline succeeded – new images are live on EC2.'
        }
        failure {
            echo '❌ Pipeline failed – check the console output for details.'
        }
        always {
            // This block must contain at least one step.
            echo 'Pipeline execution finished (success or failure).'
        }
    }
}
