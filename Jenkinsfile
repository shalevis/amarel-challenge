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
    GITOPS_CREDS = credentials('gitops-https-creds')
    REGISTRY = "docker.io/shalevi55344"
    IMAGE_NAME = "amarel-challenge"
    GITOPS_REPO = "https://github.com/shalevis/amarel-challenge.git"
    ARGOCD_SERVER = "https://crimson-wolf-15259.zap.cloud/argocd"
    ARGOCD_TOKEN = credentials('ARGOCD_TOKEN')
    ARGOCD_APP = "amarel-challenge"
  }

  stages {
    stage('Build & Test') {
      steps {
        container('node') {
          sh '''
            echo "Installing dependencies..."
            cd src
            npm install
            npm ls cross-spawn
            npm ls cross-spawn --all
          '''
        }
      }
    }

    stage('Build & Push Image') {
     steps {
      container('kaniko') {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-credentials-id',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {

        sh '''
          echo "Creating Docker config.json for Kaniko..."

          mkdir -p /kaniko/.docker

          cat > /kaniko/.docker/config.json <<EOF
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "$(echo -n "$DOCKER_USER:$DOCKER_PASS" | base64)"
    }
  }
}
EOF

          echo "Config created:"
          cat /kaniko/.docker/config.json

          echo "Running Kaniko..."
          /kaniko/executor \
            --context $WORKSPACE \
            --dockerfile $WORKSPACE/Dockerfile \
            --destination docker.io/$DOCKER_USER/amarel-challenge:$BUILD_NUMBER \
            --destination docker.io/$DOCKER_USER/amarel-challenge:latest \
            --cache=true
        '''
      }
    }
  }
}

    stage(' Trivy Vulnerability Scan') {
      steps {
        container('trivy') {
          sh '''
            echo "Running Trivy image scan..."
            trivy image --exit-code 1 --severity CRITICAL ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} || {
              echo " High/Critical vulnerabilities found. Aborting pipeline."
              exit 1
            }
          '''
        }
      }
    }

  stage('Update GitOps Repo') {
  steps {
    container('jnlp') {
      withCredentials([
        usernamePassword(
          credentialsId: 'gitops-https-creds',
          usernameVariable: 'GIT_USER',
          passwordVariable: 'GIT_PASS'
        )
      ]) {
        sh '''
          echo "Cloning GitOps repo..."
          git clone https://${GIT_USER}:${GIT_PASS}@github.com/shalevis/amarel-challenge-gitops.git gitops

          cd gitops/helm/amarel-challenge

          echo "Updating image tag using sed..."
          sed -i 's/^  tag:.*/  tag: "'${BUILD_NUMBER}'"/' values.yaml

          git config user.email "jenkins@ci.local"
          git config user.name "Jenkins CI"

          git add .
          git commit -m "Update image tag to ${BUILD_NUMBER}"

          echo "Pushing changes..."
          git push https://${GIT_USER}:${GIT_PASS}@github.com/shalevis/amarel-challenge-gitops.git main
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
            argocd app get $ARGOCD_APP -o json | grep -q '"status":"Healthy"' && \
            argocd app get $ARGOCD_APP -o json | grep -q '"status":"Synced"' || exit 1
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