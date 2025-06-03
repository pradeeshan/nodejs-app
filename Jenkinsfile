pipeline{
    agent any

    tools {
        nodejs "node24"
    }

    environment {
        DOCKER_USER = "pradeeshan"
        IMAGE_NAME = 'nodejs-app'
        IMAGE_TAG = 'latest'
        FULL_IMAGE_NAME = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
        
    }
    
    stages{
        stage("Cleanup Workspace"){
            steps {
                cleanWs()
            }

        }
    
        stage("Checkout from SCM"){
            steps {
                git 'https://github.com/pradeeshan/nodejs-app.git'
            }

        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage("Build Docker Image") {
            steps {
                script {
                    bat "docker build -t ${FULL_IMAGE_NAME} ."
                }
            }
        }

        stage("Push to Docker Hub") {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker') {
                        bat "docker push ${FULL_IMAGE_NAME}"
                    }
                }
            }
        }

        stage("Deploy Container") {
            steps {
                script {
                    
                    bat """
                        docker rm -f ${IMAGE_NAME} || true
                        docker run -d --name ${IMAGE_NAME} -p 3000:3000 ${FULL_IMAGE_NAME}
                    """
                }
            }
        }
    }
}

