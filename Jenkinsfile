pipeline {
    agent any

    environment {
        IMAGE_NAME = "isnowman/stickly-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
        KUBECONFIG_PATH = "/var/jenkins_home/.kube/config"
        SCANNER = "SonarScanner"    // the name you configured in Jenkins
    }

    stages {

        stage('Checkout') {
            steps {
                echo "📥 Fetching latest code..."
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo "🔍 Running SonarQube Scan..."
                withSonarQubeEnv('SonarQube') {
                    sh """
                        ${tool SCANNER}/bin/sonar-scanner \
                        -Dsonar.projectKey=stickly \
                        -Dsonar.sources=. \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || true
                    """
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "🐳 Building Docker Image..."
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Docker Login') {
            steps {
                echo "🔐 Logging into Docker Hub..."
                sh """
                    echo "Hyper@4636" | docker login -u isnowman --password-stdin
                """
            }
        }

        stage('Docker Push') {
            steps {
                echo "⬆️ Pushing Image to Docker Hub..."
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Kubernetes Deploy') {
            steps {
                echo "🚀 Deploying to Kubernetes..."
                sh """
                    kubectl --kubeconfig=${KUBECONFIG_PATH} \
                        set image deployment/stickly-deployment \
                        stickly=${IMAGE_NAME}:${IMAGE_TAG} -n stickly

                    kubectl --kubeconfig=${KUBECONFIG_PATH} rollout status deployment/stickly-deployment -n stickly
                """
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
