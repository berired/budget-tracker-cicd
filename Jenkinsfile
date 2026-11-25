// CI pipeline for the Jenkins Multibranch job.
//   feature/*: checkout, install+test, coverage
//   develop  : + build
//   main     : + SonarQube analysis, quality gate, build, archive artifact
pipeline {
    agent any

    tools {
        // Configure a NodeJS 24 installation named "node24" in Manage Jenkins > Tools
        nodejs 'node24'
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '30'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.BRANCH_NAME}  Build: ${env.BUILD_NUMBER}"
            }
        }

        stage('Install and Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'   // a failing test fails the stage and stops the pipeline
            }
        }

        stage('Coverage') {
            steps {
                sh 'npm run coverage'   // writes coverage/lcov.info
            }
        }

        stage('SonarQube Analysis') {
            when { branch 'main' }
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'   // Manage Jenkins > Tools
                    withSonarQubeEnv('SonarQube') {          // Manage Jenkins > System
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            when { branch 'main' }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    // Fails the build if the gate fails, so Build/Archive never run
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build') {
            when {
                anyOf { branch 'develop'; branch 'main' }
            }
            steps {
                sh 'npm run build'
            }
        }

        stage('Archive Artifact') {
            when { branch 'main' }
            steps {
                sh '''
                    ARTIFACT="react-app-${BUILD_NUMBER}.tar.gz"
                    tar -czf "$ARTIFACT" dist Dockerfile
                '''
                archiveArtifacts artifacts: 'react-app-*.tar.gz', fingerprint: true
            }
        }
    }

    post {
        always {
            echo "Result: ${currentBuild.currentResult}"
        }
    }
}
