pipeline {
    agent any

    environment {
        DOCKER_HUB = credentials('dockerhub')
        EC2_SSH_KEY = credentials('ec2-ssh')

        EC2_HOST        = '13.203.219.213'
        EC2_WORKDIR     = '~/Devops_project'
        BACKEND_IMG     = 'shubhamhalladamath/attendance-backend:latest'
        FRONTEND_IMG    = 'shubhamhalladamath/attendance-frontend:latest'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Hub Login') {
            steps {
                sh '''
                    echo "$DOCKER_HUB_PSW" | docker login -u "$DOCKER_HUB_USR" --password-stdin
                '''
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                sh '''
                    docker build -t ${BACKEND_IMG} ./Backend
                    docker push ${BACKEND_IMG}
                '''
            }
        }

        stage('Build & Push Frontend Image') {
            steps {
                sh '''
                    docker build --build-arg VITE_API_URL=/api -t ${FRONTEND_IMG} ./Frontend
                    docker push ${FRONTEND_IMG}
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << EOF
                        cd ${EC2_WORKDIR}
                        docker compose pull
                        docker compose up -d
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