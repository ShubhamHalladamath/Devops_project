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
        DOCKER_HUB = credentials('dockerhub')   // provides DOCKER_HUB_USERNAME & DOCKER_HUB_PASSWORD

        // EC2 SSH credentials (ID: ec2-ssh) → provides SSH_PRIVATE_KEY
        EC2_SSH_KEY = credentials('ec2-ssh')   // provides EC2_SSH_KEY

        // Static configuration – edit if your setup changes
        EC2_HOST        = '13.203.219.213'                     // EC2 public IP
        EC2_WORKDIR     = '~/Devops_project'                  // folder on EC2 with docker‑compose.yml
        BACKEND_IMG     = 'shubhamhalladamath/attendance-backend:latest'
        FRONTEND_IMG    = 'shubhamhalladamath/attendance-frontend:latest'
    }

 
    // ----------------------------------------------------
    // STAGES – sequential workflow
    // ----------------------------------------------------
    stages {

        stage('Checkout Code') {
            steps {
                // Pull the exact commit that triggered the webhook
                checkout scm
            }
        }

        stage('Docker Hub Login') {
            steps {
                // Use the injected Docker Hub credentials to log in.
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    echo "=== Building Backend Docker Image ==="
                    docker build -t ${BACKEND_IMG} ./Backend
                '''
            }
        }

        stage('Push Backend Image') {
            steps {
                sh '''
                    echo "=== Pushing Backend Docker Image ==="
                    docker push ${BACKEND_IMG}
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    echo "=== Building Frontend Docker Image ==="
                    docker build --build-arg VITE_API_URL=/api -t ${FRONTEND_IMG} ./Frontend
                '''
            }
        }

        stage('Push Frontend Image') {
            steps {
                sh '''
                    echo "=== Pushing Frontend Docker Image ==="
                    docker push ${FRONTEND_IMG}
                '''
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
                            echo "Pulling latest Docker images..."
                            docker compose pull
                            echo "Restarting containers..."
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
            echo '❌ Pipeline failed – check console output for details.'
        }
        always {
            echo 'Pipeline execution finished (success or failure).'
        }
    }
}


// changed it 