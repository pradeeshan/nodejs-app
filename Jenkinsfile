pipeline {
    agent any

    tools {
        nodejs "node24"
    }

    environment {
        DISCORD_WEBHOOK = 'https://canary.discord.com/api/webhooks/1377888904648331294/Cr0ASz-k7yzOq8aJ3iU76eH31bAoRExL72XKpA52_v0tU9Km_5UKa8wOSjNDVD7NAi12'
        DOCKER_USER = "pradeeshan"
        IMAGE_NAME = 'nodejs-app'
        IMAGE_TAG = 'latest'
        PORT = "3000"
        FULL_IMAGE_NAME = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
        IS_DOCKER = 'false' // Changed to string for environment variable
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Notify: Deploy Started') {
            steps {
                script {
                    sendDiscordNotification("Deployment Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
                }
            }
        }

        stage('Stop Existing Container / PM2') {
            options {
                timeout(time: 30, unit: 'SECONDS')
            }
            steps {
                script {
                    if (env.IS_DOCKER == 'true') {
                        echo "Checking for existing container: ${IMAGE_NAME}"
                        def containerId = bat(script: "docker ps -a -q -f name=${IMAGE_NAME}", returnStdout: true).trim()
                        if (containerId) {
                            echo "Stopping and removing container ${IMAGE_NAME}..."
                            bat "docker rm -f ${IMAGE_NAME}"
                            echo "Removing image ${FULL_IMAGE_NAME}..."
                            bat(script: "docker rmi ${FULL_IMAGE_NAME}", returnStatus: true)
                        } else {
                            echo "No existing container named ${IMAGE_NAME} found. Skipping..."
                        }
                    } else {
                        echo "Checking for existing PM2 process: ${IMAGE_NAME}"
                        def pm2Raw = bat(script: 'pm2 jlist', returnStdout: true).trim()
                        echo "PM2 Raw Output: ${pm2Raw}"

                        // Extract only JSON (look for lines that start with '[' and end with ']')
                        def jsonStart = pm2Raw.indexOf('[')
                        def jsonEnd = pm2Raw.lastIndexOf(']')
                        def jsonText = pm2Raw.substring(jsonStart, jsonEnd + 1)
                        echo "Json Text: ${jsonText}"

                        if(jsonStart!=(jsonEnd-1)){
                            def pm2List = readJSON text: jsonText
                            echo "Parsed PM2 list: ${pm2List}"

                            def found = pm2List.any { it.name == "${IMAGE_NAME}" }
                            echo "Process found? ${found}"

                            if (found) {
                                echo "Stopping and deleting PM2 process ${IMAGE_NAME}..."
                                bat "pm2 stop ${IMAGE_NAME}"
                                bat "pm2 delete ${IMAGE_NAME}"
                            } else {
                                echo "No PM2 process named ${IMAGE_NAME} found. Skipping..."
                            }
                        } else {
                            echo "No PM2 process named ${IMAGE_NAME} found. Skipping..."
                        }
                    }
                }
            }
        }

        stage('Check Port Availability') {
            steps {
                script {
                    echo "Checking if port ${PORT} is available..."
                    def portCheck = powershell(script: """
                        \$port = ${PORT}
                        \$listener = Get-NetTCPConnection -LocalPort \$port -ErrorAction SilentlyContinue
                        if (\$listener) { exit 1 } else { exit 0 }
                    """, returnStatus: true)
                    if (portCheck == 1) {
                        error("Port ${PORT} is already in use. Stopping pipeline.")
                    } else {
                        echo "Port ${PORT} is free. Continuing..."
                    }
                }
            }
        }

        stage('Checkout from SCM') {
            steps {
                git 'https://github.com/pradeeshan/nodejs-app.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    if (env.IS_DOCKER == 'true') {
                        try {
                            bat "docker build -t ${FULL_IMAGE_NAME} ."
                            bat "docker run -d --name ${IMAGE_NAME} -p ${PORT}:3000 --restart unless-stopped ${FULL_IMAGE_NAME}"
                        } catch (Exception e) {
                            error("Failed to build or run Docker container: ${e.message}")
                        }
                    } else {
                        try {
                            echo "Checking for existing PM2 process: ${IMAGE_NAME}"
                            def pm2Raw = bat(script: 'pm2 jlist', returnStdout: true).trim()
                            echo "PM2 Raw Output: ${pm2Raw}"
                            
                            // Extract only JSON (look for lines that start with '[' and end with ']')
                            def jsonStart = pm2Raw.indexOf('[')
                            def jsonEnd = pm2Raw.lastIndexOf(']')
                            def jsonText = pm2Raw.substring(jsonStart, jsonEnd + 1)
                            echo "Json Text: ${jsonText}"

                            if(jsonStart!=(jsonEnd-1)){
                                def pm2List = readJSON text: jsonText
                                echo "Parsed PM2 list: ${pm2List}"

                                def found = pm2List.any { it.name == "${IMAGE_NAME}" }
                                echo "Process found? ${found}"

                                if (found) {
                                    echo "Stopping and deleting PM2 process ${IMAGE_NAME}..."
                                    bat "pm2 stop ${IMAGE_NAME}"
                                    bat "pm2 delete ${IMAGE_NAME}"
                                } else {
                                    echo "Starting new PM2 process..."
                                    bat "pm2 start server.js --name ${IMAGE_NAME}"
                                }
                            } else {
                                echo "Starting new PM2 process..."
                                bat "pm2 start server.js --name ${IMAGE_NAME}"
                            }
                        } catch (Exception e) {
                            error("Failed to start/restart PM2 process: ${e.message}")
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                sendDiscordNotification("SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER} deployed successfully")
            }
        }
        failure {
            script {
                sendDiscordNotification("FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}. Check logs.")
            }
        }
    }
}

// Helper function to send Discord notifications
def sendDiscordNotification(String message) {
    bat """
        curl -X POST -H "Content-Type: application/json" ^
        -d "{\\"content\\": \\"${message}\\"}" ^
        "${DISCORD_WEBHOOK}"
    """
}