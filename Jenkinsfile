pipeline {
    agent any
    tools {
        nodejs "node18"
    }
    environment {
        DISCORD_WEBHOOK = 'https://canary.discord.com/api/webhooks/1377888904648331294/Cr0ASz-k7yzOq8aJ3iU76eH31bAoRExL72XKpA52_v0tU9Km_5UKa8wOSjNDVD7NAi12'
        DOCKER_USER = "pradeeshan"
        IMAGE_NAME = 'nodejs-app'
        IMAGE_TAG = 'latest'
        PORT = "10001"
        IS_DOCKER = 'false'
        PM2_HOME = '/var/jenkins_home/.pm2'
    }
    stages {
        // stage('Install System Dependencies') {
        //     steps {
        //         script {
        //             if (isUnix()) {
        //                 sh """
        //                     sudo apt-get update
        //                     sudo apt-get install -y net-tools curl
        //                     npm install -g pm2@latest
        //                 """
        //             }
        //         }
        //     }
        // }
        stage('Stop Existing Container / PM2') {
            steps {
                script {
                    def fullImageName = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                    if (env.IS_DOCKER == 'true') {
                        echo "Checking for existing container: ${IMAGE_NAME}"
                        def containerId = isUnix() ?
                            sh(script: "docker ps -a -q -f name=${IMAGE_NAME}", returnStdout: true).trim() :
                            bat(script: "docker ps -a -q -f name=${IMAGE_NAME}", returnStdout: true).trim()

                        if (containerId) {
                            echo "Stopping and removing container ${IMAGE_NAME}..."
                            if (isUnix()) {
                                sh "docker rm -f ${IMAGE_NAME}"
                                sh(script: "docker rmi ${fullImageName}", returnStatus: true)
                            } else {
                                bat "docker rm -f ${IMAGE_NAME}"
                                bat(script: "docker rmi ${fullImageName}", returnStatus: true)
                            }
                        } else {
                            echo "No existing container named ${IMAGE_NAME} found. Skipping..."
                        }
                    } else {
                        echo "Checking for existing PM2 process: ${IMAGE_NAME}"
                        def pm2Status = isUnix() ?
                            sh(script: "PM2_HOME=${PM2_HOME} pm2 list | grep '${IMAGE_NAME}' || true", returnStatus: true) :
                            bat(script: "pm2 list | findstr \"${IMAGE_NAME}\" || true", returnStatus: true)

                        if (isUnix()) {
                            sh "PM2_HOME=${PM2_HOME} pm2 list || true"
                            sh "netstat -tuln | grep ':${PORT}' || true"
                        } else {
                            bat "pm2 list || true"
                        }

                        def found = (pm2Status == 0)
                        echo "PM2 process found? ${found}"

                        if (found) {
                            echo "Stopping and deleting PM2 process ${IMAGE_NAME}..."
                            if (isUnix()) {
                                sh "PM2_HOME=${PM2_HOME} pm2 stop ${IMAGE_NAME} || true"
                                sh "PM2_HOME=${PM2_HOME} pm2 delete ${IMAGE_NAME} || true"
                            } else {
                                bat "pm2 stop ${IMAGE_NAME} || true"
                                bat "pm2 delete ${IMAGE_NAME} || true"
                            }
                        } else {
                            echo "No PM2 process named ${IMAGE_NAME} found. Skipping..."
                        }
                    }
                }
            }
        }
        stage('Cleanup Workspace') {
            steps {
                cleanWs()
            }
        }
        // stage('Notify: Deploy Started') {
        //     steps {
        //         script {
        //             sendDiscordNotification("Deployment Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        //         }
        //     }
        // }
        stage('Check Port Availability') {
            steps {
                script {
                    echo "Checking if port ${PORT} is available..."
                    def portCheck
                    def portCheck2
                    if (isUnix()) {
                        portCheck = sh(
                            script: "netstat -tuln | grep ':${PORT}' && exit 1 || true",
                            returnStatus: true
                        )
                        // Check port 8080 (invert the logic to return 1 if port is in use)
                        portCheck2 = sh(
                            script: "netstat -tuln | grep ':8080' && exit 1 || exit 0",
                            returnStatus: true
                        )
                    } else {
                        portCheck = powershell(script: """
                            \$port = ${PORT}
                            \$listener = Get-NetTCPConnection -LocalPort \$port -ErrorAction SilentlyContinue
                            if (\$listener) { exit 0 } else { exit 1 }
                        """, returnStatus: true)
                        portCheck = powershell(script: """
                            \$port = 8080
                            \$listener = Get-NetTCPConnection -LocalPort \$port -ErrorAction SilentlyContinue
                            if (\$listener) { exit 0 } else { exit 1 }
                        """, returnStatus: true)
                    }
                    echo "portCheck -> ${portCheck}"
                    echo "portCheck2 -> ${portCheck2}"
                    if (portCheck == 0) {
                        echo "Port ${PORT} is free. Continuing..."
                    } else {
                        error("Port ${PORT} is already in use. Stopping pipeline.")
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
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }
        stage('Build and Deploy') {
            steps {
                script {
                    def fullImageName = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                    if (env.IS_DOCKER == 'true') {
                        try {
                            if (isUnix()) {
                                sh "docker build -t ${fullImageName} ."
                                sh "docker run -d --name ${IMAGE_NAME} -p ${PORT}:3000 --restart unless-stopped ${fullImageName}"
                            } else {
                                bat "docker build -t ${fullImageName} ."
                                bat "docker run -d --name ${IMAGE_NAME} -p ${PORT}:3000 --restart unless-stopped ${fullImageName}"
                            }
                        } catch (Exception e) {
                            error("Failed to build or run Docker container: ${e.message}")
                        }
                    } else {
                        try {
                            echo "Checking for existing PM2 process: ${IMAGE_NAME}"
                            def pm2Status = isUnix() ?
                                sh(script: "PM2_HOME=${PM2_HOME} pm2 list | grep '${IMAGE_NAME}' || true", returnStatus: true) :
                                bat(script: "pm2 list | findstr \"${IMAGE_NAME}\" || true", returnStatus: true)

                            def found = (pm2Status == 0)
                            echo "PM2 process found? ${found}"

                            if (found) {
                                echo "Restarting PM2 process ${IMAGE_NAME}..."
                                if (isUnix()) {
                                    sh "PM2_HOME=${PM2_HOME} pm2 restart ${IMAGE_NAME} || true"
                                } else {
                                    bat "pm2 restart ${IMAGE_NAME} || true"
                                }
                            } else {
                                echo "Starting new PM2 process..."
                                if (isUnix()) {
                                    sh """
                                        export PM2_HOME=${PM2_HOME}
                                        PORT=${PORT} pm2 start "npm run pm2:consumer" \\
                                        --name "${IMAGE_NAME}" \\
                                        --merge-logs \\
                                        --log-date-format "YYYY-MM-DD HH:mm:ss" \\
                                        --output ~/.pm2/logs/${IMAGE_NAME}.log \\
                                        --error ~/.pm2/logs/${IMAGE_NAME}-error.log \\
                                        --exp-backoff-restart-delay=100 \\
                                        --max-restarts=5 \\
                                        --restart-delay=5000 \\
                                        --max-memory-restart=1G \\
                                        --watch \\
                                        --ignore-watch "\$(cat .gitignore 2>/dev/null || echo 'node_modules')"
                                        pm2 save
                                        pm2 ls
                                    """
                                } else {
                                    bat "pm2 start server.js --name ${IMAGE_NAME}"
                                    bat "pm2 save"
                                    bat "pm2 ls"
                                }
                            }
                        } catch (Exception e) {
                            error("Failed to start/restart PM2 process: ${e.message}")
                        }
                    }
                }
            }
        }
    }
    // post {
    //     success {
    //         script {
    //             sendDiscordNotification("SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER} deployed successfully")
    //         }
    //     }
    //     failure {
    //         script {
    //             sendDiscordNotification("FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}. Check logs.")
    //         }
    //     }
    // }
}

// def sendDiscordNotification(String message) {
//     if (isUnix()) {
//         echo "LINUX"
//         sh """
//             curl -X POST -H "Content-Type: application/json" \\
//             -d '{"content": "${message}"}' \\
//             "${DISCORD_WEBHOOK}"
//         """
//     } else {
//         echo "WINDOWS"
//         bat """
//             curl -X POST -H "Content-Type: application/json" ^
//             -d "{\\"content\\": \\"${message}\\"}" ^
//             "${DISCORD_WEBHOOK}"
//         """
//     }
// }
