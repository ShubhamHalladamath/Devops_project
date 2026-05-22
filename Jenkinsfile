// ------------------------------------------------------------
// QR Attendance – CI/CD pipeline (Declarative)
// ------------------------------------------------------------
pipeline {
    agent any

    // ----------------------------------------------------
    // GLOBAL ENVIRONMENT – credentials and static values
    // ----------------------------------------------------
    environment {
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
    }

    // ----------------------------------------------------
    // POST – notifications & cleanup
    // ----------------------------------------------------
    post {
        success {
            echo '✅ Pipeline succeeded – images built and pushed to Docker Hub.'
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