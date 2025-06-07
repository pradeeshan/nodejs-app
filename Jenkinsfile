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
        PORT="3000"
        FULL_IMAGE_NAME = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
        iSDOCKER = false
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

        stage("Stop Existing Container / PM2") {
            options {
                timeout(time: 30, unit: 'SECONDS') // Set timeout to 30 seconds
            }
            steps {
                script {
                    if(iSDOCKER){
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
                    }else{
                        // TODO: Check and stop the pm2 
                    }
                }
            }
        }


        stage("Check Port Availability") {
            steps {
                script {
                    echo "Checking if port 3000 is available..."
                    def portUsed = bat(script: "netstat -an | find \":${PORT}\"", returnStatus: true)
                    if (portUsed == 0) {
                        error("Port ${PORT} is already in use. Stopping pipeline.")
                    } else {
                        echo "Port ${PORT} is free. Continuing..."
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

        stage("Build and Deploy Docker Image") {
            steps {
                script {
                    if (iSDOCKER) {
                        bat """
                            docker build -t ${FULL_IMAGE_NAME} .
                            docker run -d --name ${IMAGE_NAME} -p ${PORT}:3000 ${FULL_IMAGE_NAME}
                        """
                    } else {
                        echo "Checking for existing PM2 process..."
                        def pm2List = bat(script: 'pm2 jlist', returnStdout: true).trim()
                        if (pm2List.contains("${IMAGE_NAME}")) {
                            echo "Restarting existing PM2 process..."
                            bat "pm2 restart ${IMAGE_NAME}"
                        } else {
                            echo "No PM2 process found. Starting new one..."
                            bat """
                                PORT=\${PORT} pm2 start \"npm run pm2:server\" --name \"\${IMAGE_NAME}\" ^
                                --merge-logs --log-date-format \"YYYY-MM-DD HH:mm:ss\" ^
                                --output 0\"%USERPROFILE%\\.pm2\\logs\\\${IMAGE_NAME}.log\" ^
                                --error \"%USERPROFILE%\\.pm2\\logs\\\${IMAGE_NAME}.log\" ^
                                --exp-backoff-restart-delay 100 ^
                                --max-restarts 5 ^
                                --restart-delay 5000 ^
                                --max-memory-restart 1G ^
                                --watch --ignore-watch \"$(type .gitignore .dockerignore)\"
                            """
                        }
                    }
                }
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

