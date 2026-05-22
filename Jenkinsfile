pipeline {
    agent any

    environment {
        EC2_HOST     = '13.203.219.213'
        EC2_WORKDIR  = '~/Devops_project'

        BACKEND_IMG  = 'shubhamhalladamath/attendance-backend:latest'
        FRONTEND_IMG = 'shubhamhalladamath/attendance-frontend:latest'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Docker Hub Login') {
            steps {
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

                    docker build \
                    -t ${BACKEND_IMG} \
                    ./Backend
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

                    docker build \
                    --build-arg VITE_API_URL=/api \
                    -t ${FRONTEND_IMG} \
                    ./Frontend
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

        stage('Deploy To EC2') {
            steps {

                sshagent(credentials: ['ec2-ssh']) {

                    sh '''
                        echo "=== Connecting to EC2 ==="

                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << EOF

                        set -e

                        echo "=== Moving to project directory ==="

                        cd ${EC2_WORKDIR}

                        echo "=== Pulling latest Docker images ==="

                        docker compose pull

                        echo "=== Restarting containers ==="

                        docker compose up -d

                        echo "=== Deployment completed ==="

                        EOF
                    '''
                }
            }
        }
    }

    post {

        success {
            echo 'Pipeline succeeded'
        }

        failure {
            echo 'Pipeline failed'
        }

        always {
            echo 'Pipeline finished'
        }
    }
}