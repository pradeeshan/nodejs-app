pipeline{
    agent any

    tools {
        nodejs "node24"
    }

    environment {
        DISCORD_WEBHOOK = 'https://canary.discord.com/api/webhooks/1377888904648331294/Cr0ASz-k7yzOq8aJ3iU76eH31bAoRExL72XKpA52_v0tU9Km_5UKa8wOSjNDVD7NAi12'
        DOCKER_USER = "pradeeshan"
        IMAGE_NAME = 'nodejs-app'
        IMAGE_TAG = 'latest'
        FULL_IMAGE_NAME = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
        
    }
    
    stages{
        stage('Notify: Deploy started') {
            steps {
                script {
                    withEnv(["DISCORD_MESSAGE=Deployment Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}"]) {
                        bat """
                            curl -X POST -H "Content-Type: application/json" ^
                            -d "{\\"content\\": \\"%DISCORD_MESSAGE%\\"}" ^
                            "%DISCORD_WEBHOOK%"
                        """
                    }
                }
            }
        }

        stage("Stop Existing Container") {
            options {
                timeout(time: 30, unit: 'SECONDS') // Set timeout to 30 seconds
            }
            steps {
                script {
                    echo "Checking for existing container: ${IMAGE_NAME}"
                    def result = bat(script: "docker ps -a -q -f name=${IMAGE_NAME}", returnStdout: true).trim()
                    if (result) {
                        echo "Stopping and removing container ${IMAGE_NAME}..."
                        bat "docker rm -f ${IMAGE_NAME}"
                        echo "removing image ${FULL_IMAGE_NAME}..."
                        bat "docker rmi ${FULL_IMAGE_NAME}"
                    } else {
                        echo "No existing container named ${IMAGE_NAME} found. Skipping..."
                    }
                }
            }
        }


        stage("Check Port Availability") {
            steps {
                script {
                    echo "Checking if port 3000 is available..."
                    def portUsed = bat(script: 'netstat -an | find ":3000"', returnStatus: true)
                    if (portUsed == 0) {
                        error("Port 3000 is already in use. Stopping pipeline.")
                    } else {
                        echo "Port 3000 is free. Continuing..."
                    }
                }
            }
        }

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

        //  stage("Push to Docker Hub") {
        //     steps {
        //         script {
        //             withDockerRegistry(credentialsId: 'docker') {
        //                 bat "docker push ${FULL_IMAGE_NAME}"
        //             }
        //         }
        //     }
        //  }

        stage("Deploy Container") {
            steps {
                script {
                    bat """
                        docker run -d --name ${IMAGE_NAME} -p 3000:3000 ${FULL_IMAGE_NAME}
                    """
                }
            }
        }



    }

    post {
        success {
            script {
                withEnv(["DISCORD_MESSAGE= SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER} deployed successfully"]) {
                    bat """
                        curl -X POST -H "Content-Type: application/json" ^
                        -d "{\\"content\\": \\"%DISCORD_MESSAGE%\\"}" ^
                        "%DISCORD_WEBHOOK%"
                    """
                }
            }
        }

        failure {
            script {
                withEnv(["DISCORD_MESSAGE= FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}. Check logs."]) {
                    bat """
                        curl -X POST -H "Content-Type: application/json" ^
                        -d "{\\"content\\": \\"%DISCORD_MESSAGE%\\"}" ^
                        "%DISCORD_WEBHOOK%"
                    """
                }
            }
        }
    }

}

