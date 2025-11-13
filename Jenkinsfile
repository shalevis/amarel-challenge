pipeline {
  agent {
    kubernetes {
      label 'nodejs-kaniko'
      defaultContainer 'jnlp'
    }
  }

  environment {

    DOCKER_CREDS = credentials('dockerhub-credentials-id')
    SONAR_TOKEN = credentials('sonar-token')
    GITOPS_CREDS = credentials('github-token')
    REGISTRY = "docker.io/shalevi55344"
    IMAGE_NAME = "myapp"
    GITOPS_REPO = "https://github.com/shalevis/amarel-challenge.git"
    SONARQUBE_URL = "http://crimson-wolf-15259.zap.cloud/sonarqube"
    ARGOCD_SERVER = "https://argocd.devops.local"
    ARGOCD_APP = "myapp"
  }

  stages {
    stage('Build & Test') {
      steps {
        container('node') {
          sh '''
            echo "Installing dependencies..."
            cd src
            npm install
          '''
        }
      }
    }

    stage('SonarQube Scan') {
      steps {
        container('sonar-scanner') {
          withSonarQubeEnv('sonarqube') {
            sh '''
              echo "Running SonarQube analysis..."
              sonar-scanner \
                -Dsonar.projectKey=myapp \
                -Dsonar.sources=. \
                -Dsonar.host.url=${SONARQUBE_URL} \
                -Dsonar.login=${SONAR_TOKEN}
            '''
          }
        }
      }
    }

    stage(' Build & Push Image') {
      steps {
        container('kaniko') {
          sh '''
            echo "Building and pushing image with Kaniko..."
            /kaniko/executor \
              --context ${WORKSPACE} \
              --dockerfile ${WORKSPACE}/Dockerfile \
              --destination ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} \
              --destination ${REGISTRY}/${IMAGE_NAME}:latest \
              --cache=true
          '''
        }
      }
    }

    stage(' Trivy Vulnerability Scan') {
      steps {
        container('trivy') {
          sh '''
            echo "Running Trivy image scan..."
            trivy image --exit-code 1 --severity HIGH,CRITICAL ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} || {
              echo " High/Critical vulnerabilities found. Aborting pipeline."
              exit 1
            }
          '''
        }
      }
    }

    stage(' Update GitOps Repo') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'gitops-https-creds-id', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
          container('jnlp') {
            sh '''
              echo "Updating GitOps repo with new image tag..."
              git clone https://${GIT_USER}:${GIT_PASS}@github.com/youruser/myapp-gitops.git gitops
              cd gitops
              yq e -i '.image.tag = "${BUILD_NUMBER}"' helm/values.yaml
              git config user.email "jenkins@ci.local"
              git config user.name "Jenkins CI"
              git add .
              git commit -m "Update image tag to ${BUILD_NUMBER}"
              git push origin main
            '''
          }
        }
      }
    }

    stage(' ArgoCD Sync') {
      steps {
        container('argocd') {
          sh '''
            echo "Triggering ArgoCD sync for app ${ARGOCD_APP}..."
            argocd login ${ARGOCD_SERVER} --insecure --auth-token=${ARGOCD_TOKEN}
            argocd app sync ${ARGOCD_APP} --grpc-web
            argocd app wait ${ARGOCD_APP} --sync --health
            echo " ArgoCD sync completed successfully!"
          '''
        }
      }
    }
  }

  post {
    success {
      echo " Pipeline completed successfully!"
    }
    failure {
      echo " Pipeline failed — please check logs!"
    }
    always {
      echo "Pipeline finished at "
    }
  }
}