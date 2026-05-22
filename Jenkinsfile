// ------------------------------------------------------------
// QR Attendance – Complete CI/CD + AWS EC2 Deployment Pipeline
// ------------------------------------------------------------

pipeline {
    agent any

    // ----------------------------------------------------
    // GLOBAL ENVIRONMENT
    // ----------------------------------------------------
    environment {

        BACKEND_IMG  = 'shubhamhalladamath/attendance-backend:latest'
        FRONTEND_IMG = 'shubhamhalladamath/attendance-frontend:latest'

        EC2_HOST = 'ec2-43-204-230-166.ap-south-1.compute.amazonaws.com'
        EC2_USER = 'ubuntu'

        // IMPORTANT:
        // Change this to your actual EC2 folder
        // where docker-compose.yml exists
        EC2_APP_DIR = '/home/ubuntu/attendance-app'
    }

    // ----------------------------------------------------
    // STAGES
    // ----------------------------------------------------
    stages {

        // ------------------------------------------------
        // Checkout Source Code
        // ------------------------------------------------
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // ------------------------------------------------
        // Docker Hub Login
        // ------------------------------------------------
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

        // ------------------------------------------------
        // Build Backend Image
        // ------------------------------------------------
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

        // ------------------------------------------------
        // Push Backend Image
        // ------------------------------------------------
        stage('Push Backend Image') {
            steps {

                sh '''
                    echo "=== Pushing Backend Docker Image ==="

                    docker push ${BACKEND_IMG}
                '''
            }
        }

        // ------------------------------------------------
        // Build Frontend Image
        // ------------------------------------------------
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

        // ------------------------------------------------
        // Push Frontend Image
        // ------------------------------------------------
        stage('Push Frontend Image') {
            steps {

                sh '''
                    echo "=== Pushing Frontend Docker Image ==="

                    docker push ${FRONTEND_IMG}
                '''
            }
        }

        // ------------------------------------------------
        // Deploy To AWS EC2
        // ------------------------------------------------
        stage('Deploy To AWS EC2') {

    steps {

        sshagent(credentials: ['aws-ec2-key']) {

            sh """
                ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '

                cd ${EC2_APP_DIR}

                docker pull ${BACKEND_IMG}

                docker pull ${FRONTEND_IMG}

                docker compose down

                docker compose up -d

                docker image prune -f
                '
            """
        }
    }
}
    }

    // ----------------------------------------------------
    // POST ACTIONS
    // ----------------------------------------------------
    post {

        success {
            echo '✅ Pipeline succeeded – application deployed to AWS EC2.'
        }

        failure {
            echo '❌ Pipeline failed – check console logs.'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}