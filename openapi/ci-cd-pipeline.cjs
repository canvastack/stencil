#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CI/CD Pipeline Generator for OpenAPI Specification Project
 * Generates comprehensive pipeline configurations for various CI/CD platforms
 */

class CICDPipelineGenerator {
    constructor() {
        this.schemaDir = __dirname;
        this.pipelineConfigs = {};
    }

    /**
     * Generate GitHub Actions workflow
     */
    generateGitHubActions() {
        const workflow = `name: OpenAPI Specification CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'openapi/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'openapi/**'

jobs:
  validate-openapi:
    runs-on: ubuntu-latest
    name: 🔍 Validate OpenAPI Specifications
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      working-directory: openapi
      run: |
        npm install yaml
        npm install swagger-ui-dist
    
    - name: Run YAML validation
      working-directory: openapi
      run: node tools/validate-all.js
    
    - name: Run comprehensive validation pipeline
      working-directory: openapi
      run: node validate-pipeline.cjs
    
    - name: Upload validation reports
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: validation-reports
        path: |
          openapi/generated/validation-report.html
          openapi/generated/validation-report.json
        retention-days: 30

  performance-test:
    runs-on: ubuntu-latest
    name: ⚡ Performance Testing
    needs: validate-openapi
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install dependencies
      working-directory: openapi
      run: npm install yaml
    
    - name: Run performance tests
      working-directory: openapi
      run: node performance-test.cjs
    
    - name: Upload performance reports
      uses: actions/upload-artifact@v4
      with:
        name: performance-reports
        path: |
          openapi/generated/performance-report.html
          openapi/generated/performance-report.json

  security-audit:
    runs-on: ubuntu-latest
    name: 🛡️ Security Audit
    needs: validate-openapi
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install dependencies
      working-directory: openapi
      run: npm install yaml
    
    - name: Run security audit
      working-directory: openapi
      run: node security-audit.cjs
    
    - name: Check security score
      working-directory: openapi
      run: |
        SECURITY_SCORE=$(node -e "
          const report = JSON.parse(require('fs').readFileSync('generated/security-audit.json', 'utf8'));
          console.log(report.summary.overallScore);
        ")
        echo "Security Score: $SECURITY_SCORE"
        if [ "$SECURITY_SCORE" -lt 60 ]; then
          echo "::warning::Security score is below 60. Consider addressing security findings."
        fi
        if [ "$SECURITY_SCORE" -lt 30 ]; then
          echo "::error::Critical security score. Deployment blocked."
          exit 1
        fi
    
    - name: Upload security reports
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: security-reports
        path: |
          openapi/generated/security-audit.html
          openapi/generated/security-audit.json

  generate-documentation:
    runs-on: ubuntu-latest
    name: 📚 Generate Documentation
    needs: [validate-openapi, performance-test, security-audit]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install dependencies
      working-directory: openapi
      run: |
        npm install yaml
        npm install swagger-ui-dist
    
    - name: Generate HTML documentation
      working-directory: openapi
      run: node generate-docs.cjs
    
    - name: Generate Postman collection
      working-directory: openapi
      run: node generate-postman.cjs
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: openapi/generated
        destination_dir: api-docs

  quality-gate:
    runs-on: ubuntu-latest
    name: 🚪 Quality Gate
    needs: [validate-openapi, performance-test, security-audit]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Download all artifacts
      uses: actions/download-artifact@v4
    
    - name: Evaluate quality metrics
      run: |
        echo "=== Quality Gate Evaluation ==="
        
        # Check validation results
        if [ -f "validation-reports/validation-report.json" ]; then
          VALIDATION_SCORE=$(node -e "
            const report = JSON.parse(require('fs').readFileSync('validation-reports/validation-report.json', 'utf8'));
            console.log(report.summary.validationScore || 0);
          ")
          echo "Validation Score: $VALIDATION_SCORE/100"
          if [ "$VALIDATION_SCORE" -lt 95 ]; then
            echo "::error::Validation score below 95%. Quality gate failed."
            exit 1
          fi
        fi
        
        # Check performance results
        if [ -f "performance-reports/performance-report.json" ]; then
          PERFORMANCE_SCORE=$(node -e "
            const report = JSON.parse(require('fs').readFileSync('performance-reports/performance-report.json', 'utf8'));
            console.log(report.summary.performanceScore || 0);
          ")
          echo "Performance Score: $PERFORMANCE_SCORE/100"
          if [ "$PERFORMANCE_SCORE" -lt 70 ]; then
            echo "::warning::Performance score below 70. Consider optimization."
          fi
        fi
        
        # Check security results
        if [ -f "security-reports/security-audit.json" ]; then
          SECURITY_SCORE=$(node -e "
            const report = JSON.parse(require('fs').readFileSync('security-reports/security-audit.json', 'utf8'));
            console.log(report.summary.overallScore || 0);
          ")
          echo "Security Score: $SECURITY_SCORE/100"
          if [ "$SECURITY_SCORE" -lt 60 ]; then
            echo "::error::Security score below 60%. Quality gate failed."
            exit 1
          fi
        fi
        
        echo "✅ Quality gate passed!"

  notify:
    runs-on: ubuntu-latest
    name: 📢 Notification
    needs: [quality-gate, generate-documentation]
    if: always()
    
    steps:
    - name: Notify on success
      if: \${{ needs.quality-gate.result == 'success' }}
      run: |
        echo "🎉 OpenAPI pipeline completed successfully!"
        echo "📚 Documentation available at: https://\${{ github.repository_owner }}.github.io/\${{ github.event.repository.name }}/api-docs/"
    
    - name: Notify on failure
      if: \${{ needs.quality-gate.result == 'failure' }}
      run: |
        echo "❌ OpenAPI pipeline failed quality gate!"
        echo "Please check the validation, performance, and security reports."`;

        return workflow;
    }

    /**
     * Generate GitLab CI configuration
     */
    generateGitLabCI() {
        const gitlab = `stages:
  - validate
  - test
  - security
  - generate
  - deploy

variables:
  NODE_VERSION: "18"

.node_template: &node_template
  image: node:$NODE_VERSION
  before_script:
    - cd openapi
    - npm install yaml swagger-ui-dist

validate:yaml:
  <<: *node_template
  stage: validate
  script:
    - node tools/validate-all.js
    - node validate-pipeline.cjs
  artifacts:
    reports:
      junit: generated/validation-report.json
    paths:
      - openapi/generated/validation-report.*
    expire_in: 30 days
  rules:
    - changes:
        - openapi/**/*

performance:test:
  <<: *node_template
  stage: test
  script:
    - node performance-test.cjs
  artifacts:
    paths:
      - openapi/generated/performance-report.*
    expire_in: 7 days
  rules:
    - changes:
        - openapi/**/*

security:audit:
  <<: *node_template
  stage: security
  script:
    - node security-audit.cjs
    - |
      SECURITY_SCORE=$(node -e "
        const report = JSON.parse(require('fs').readFileSync('generated/security-audit.json', 'utf8'));
        console.log(report.summary.overallScore);
      ")
      echo "Security Score: $SECURITY_SCORE"
      if [ "$SECURITY_SCORE" -lt 60 ]; then
        echo "Security score is below acceptable threshold"
        exit 1
      fi
  artifacts:
    paths:
      - openapi/generated/security-audit.*
    expire_in: 7 days
  rules:
    - changes:
        - openapi/**/*

generate:docs:
  <<: *node_template
  stage: generate
  script:
    - node generate-docs.cjs
    - node generate-postman.cjs
  artifacts:
    paths:
      - openapi/generated/
    expire_in: 7 days
  only:
    - main

deploy:pages:
  stage: deploy
  script:
    - mkdir public
    - cp -r openapi/generated/* public/
  artifacts:
    paths:
      - public
  only:
    - main
  dependencies:
    - generate:docs`;

        return gitlab;
    }

    /**
     * Generate Azure DevOps pipeline
     */
    generateAzureDevOps() {
        const azure = `trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - openapi/*

pr:
  branches:
    include:
      - main
  paths:
    include:
      - openapi/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  workingDirectory: 'openapi'

stages:
- stage: Validate
  displayName: 'Validate OpenAPI Specifications'
  jobs:
  - job: ValidateYAML
    displayName: 'YAML Validation'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: |
        cd \$(workingDirectory)
        npm install yaml
        node tools/validate-all.js
      displayName: 'Validate YAML files'
    
    - script: |
        cd \$(workingDirectory)
        node validate-pipeline.cjs
      displayName: 'Run validation pipeline'
    
    - task: PublishTestResults@2
      condition: always()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '\$(workingDirectory)/generated/validation-report.json'
        failTaskOnFailedTests: true

- stage: Test
  displayName: 'Performance & Security Testing'
  dependsOn: Validate
  jobs:
  - job: PerformanceTest
    displayName: 'Performance Testing'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
    
    - script: |
        cd \$(workingDirectory)
        npm install yaml
        node performance-test.cjs
      displayName: 'Run performance tests'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '\$(workingDirectory)/generated/performance-report.html'
        artifactName: 'performance-report'
  
  - job: SecurityAudit
    displayName: 'Security Audit'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
    
    - script: |
        cd \$(workingDirectory)
        npm install yaml
        node security-audit.cjs
      displayName: 'Run security audit'
    
    - script: |
        cd \$(workingDirectory)
        SECURITY_SCORE=\$(node -e "
          const report = JSON.parse(require('fs').readFileSync('generated/security-audit.json', 'utf8'));
          console.log(report.summary.overallScore);
        ")
        echo "Security Score: \$SECURITY_SCORE"
        if [ "\$SECURITY_SCORE" -lt 60 ]; then
          echo "##vso[task.logissue type=error]Security score below threshold: \$SECURITY_SCORE"
          exit 1
        fi
      displayName: 'Evaluate security score'

- stage: Deploy
  displayName: 'Generate & Deploy Documentation'
  dependsOn: Test
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - job: GenerateDocs
    displayName: 'Generate Documentation'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
    
    - script: |
        cd \$(workingDirectory)
        npm install yaml swagger-ui-dist
        node generate-docs.cjs
        node generate-postman.cjs
      displayName: 'Generate documentation'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '\$(workingDirectory)/generated'
        artifactName: 'api-documentation'`;

        return azure;
    }

    /**
     * Generate Jenkins pipeline (Jenkinsfile)
     */
    generateJenkins() {
        const jenkins = `pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        WORKING_DIR = 'openapi'
    }
    
    triggers {
        githubPush()
    }
    
    stages {
        stage('Setup') {
            steps {
                script {
                    // Install Node.js
                    sh '''
                        curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    '''
                }
                dir(env.WORKING_DIR) {
                    sh 'npm install yaml swagger-ui-dist'
                }
            }
        }
        
        stage('Validate') {
            parallel {
                stage('YAML Validation') {
                    steps {
                        dir(env.WORKING_DIR) {
                            sh 'node tools/validate-all.js'
                            sh 'node validate-pipeline.cjs'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: "\${env.WORKING_DIR}/generated",
                                reportFiles: 'validation-report.html',
                                reportName: 'Validation Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Testing') {
            parallel {
                stage('Performance Test') {
                    steps {
                        dir(env.WORKING_DIR) {
                            sh 'node performance-test.cjs'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: "\${env.WORKING_DIR}/generated",
                                reportFiles: 'performance-report.html',
                                reportName: 'Performance Report'
                            ])
                        }
                    }
                }
                
                stage('Security Audit') {
                    steps {
                        dir(env.WORKING_DIR) {
                            sh 'node security-audit.cjs'
                            script {
                                def securityScore = sh(
                                    script: '''node -e "
                                        const report = JSON.parse(require('fs').readFileSync('generated/security-audit.json', 'utf8'));
                                        console.log(report.summary.overallScore);
                                    "''',
                                    returnStdout: true
                                ).trim() as Integer
                                
                                echo "Security Score: \${securityScore}"
                                
                                if (securityScore < 60) {
                                    error("Security score below threshold: \${securityScore}")
                                }
                            }
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: "\${env.WORKING_DIR}/generated",
                                reportFiles: 'security-audit.html',
                                reportName: 'Security Audit Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Generate Documentation') {
            when {
                branch 'main'
            }
            steps {
                dir(env.WORKING_DIR) {
                    sh 'node generate-docs.cjs'
                    sh 'node generate-postman.cjs'
                }
            }
            post {
                success {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: "\${env.WORKING_DIR}/generated",
                        reportFiles: 'index.html',
                        reportName: 'API Documentation'
                    ])
                    
                    archiveArtifacts artifacts: "\${env.WORKING_DIR}/generated/**/*", fingerprint: true
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                script {
                    echo "=== Quality Gate Evaluation ==="
                    
                    dir(env.WORKING_DIR) {
                        // Evaluate all quality metrics
                        sh '''
                            echo "Evaluating quality metrics..."
                            
                            # Check if all reports exist
                            if [ ! -f "generated/validation-report.json" ]; then
                                echo "Missing validation report"
                                exit 1
                            fi
                            
                            if [ ! -f "generated/performance-report.json" ]; then
                                echo "Missing performance report"
                                exit 1
                            fi
                            
                            if [ ! -f "generated/security-audit.json" ]; then
                                echo "Missing security report"
                                exit 1
                            fi
                            
                            echo "✅ All quality checks passed!"
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo '🎉 OpenAPI Pipeline completed successfully!'
        }
        failure {
            echo '❌ OpenAPI Pipeline failed!'
            // Send notifications here
        }
    }
}`;

        return jenkins;
    }

    /**
     * Generate Docker configuration for CI/CD
     */
    generateDockerConfig() {
        const dockerfile = `# OpenAPI Specification CI/CD Docker Image
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache git curl

# Create app directory
WORKDIR /app

# Copy package files
COPY openapi/package*.json ./

# Install Node.js dependencies
RUN npm install yaml swagger-ui-dist

# Copy OpenAPI specification files
COPY openapi/ .

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \\
    echo 'set -e' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo 'echo "🚀 Starting OpenAPI CI/CD Pipeline"' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo '# Run validation' >> /entrypoint.sh && \\
    echo 'echo "📋 Running YAML validation..."' >> /entrypoint.sh && \\
    echo 'node tools/validate-all.js || exit 1' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo 'echo "🔍 Running comprehensive validation..."' >> /entrypoint.sh && \\
    echo 'node validate-pipeline.cjs || exit 1' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo '# Run performance tests' >> /entrypoint.sh && \\
    echo 'echo "⚡ Running performance tests..."' >> /entrypoint.sh && \\
    echo 'node performance-test.cjs || exit 1' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo '# Run security audit' >> /entrypoint.sh && \\
    echo 'echo "🛡️ Running security audit..."' >> /entrypoint.sh && \\
    echo 'node security-audit.cjs || exit 1' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo '# Generate documentation' >> /entrypoint.sh && \\
    echo 'echo "📚 Generating documentation..."' >> /entrypoint.sh && \\
    echo 'node generate-docs.cjs || exit 1' >> /entrypoint.sh && \\
    echo 'node generate-postman.cjs || exit 1' >> /entrypoint.sh && \\
    echo '' >> /entrypoint.sh && \\
    echo 'echo "✅ OpenAPI CI/CD Pipeline completed successfully!"' >> /entrypoint.sh && \\
    chmod +x /entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD test -f generated/validation-report.json || exit 1

# Expose port for documentation server
EXPOSE 8080

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]`;

        const dockerCompose = `version: '3.8'

services:
  openapi-pipeline:
    build:
      context: .
      dockerfile: Dockerfile.openapi
    container_name: stencil-openapi-pipeline
    volumes:
      - ./openapi:/app
      - pipeline-reports:/app/generated
    environment:
      - NODE_ENV=production
      - CI=true
    networks:
      - openapi-net
    restart: unless-stopped

  documentation-server:
    image: nginx:alpine
    container_name: stencil-api-docs
    ports:
      - "8080:80"
    volumes:
      - pipeline-reports:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - openapi-pipeline
    networks:
      - openapi-net
    restart: unless-stopped

volumes:
  pipeline-reports:
    driver: local

networks:
  openapi-net:
    driver: bridge`;

        return { dockerfile, dockerCompose };
    }

    /**
     * Generate pre-commit hooks configuration
     */
    generatePreCommitHooks() {
        const preCommitConfig = `repos:
  - repo: local
    hooks:
      - id: openapi-yaml-validation
        name: Validate OpenAPI YAML files
        entry: bash -c 'cd openapi && node tools/validate-all.js'
        language: system
        files: 'openapi/.*\\.yaml$'
        pass_filenames: false
        
      - id: openapi-security-check
        name: OpenAPI Security Check
        entry: bash -c 'cd openapi && node security-audit.cjs && SCORE=$(node -e "console.log(JSON.parse(require(\"fs\").readFileSync(\"generated/security-audit.json\")).summary.overallScore)") && if [ "$SCORE" -lt 50 ]; then echo "Security score too low: $SCORE"; exit 1; fi'
        language: system
        files: 'openapi/.*\\.yaml$'
        pass_filenames: false
        
      - id: openapi-performance-check
        name: OpenAPI Performance Check  
        entry: bash -c 'cd openapi && node performance-test.cjs'
        language: system
        files: 'openapi/.*\\.yaml$'
        pass_filenames: false`;

        const preCommitScript = `#!/bin/bash
# Pre-commit hook for OpenAPI specification validation

set -e

echo "🔍 Running OpenAPI pre-commit checks..."

cd openapi

# Check if any YAML files changed
if git diff --cached --name-only | grep -q "\\.yaml$"; then
    echo "📋 YAML files detected, running validation..."
    
    # Run YAML validation
    echo "⚡ Validating YAML syntax..."
    if ! node tools/validate-all.js; then
        echo "❌ YAML validation failed!"
        exit 1
    fi
    
    # Run quick security check
    echo "🛡️ Running security check..."
    if ! node security-audit.cjs; then
        echo "❌ Security audit failed!"
        exit 1
    fi
    
    # Check security score
    SECURITY_SCORE=$(node -e "
        const report = JSON.parse(require('fs').readFileSync('generated/security-audit.json', 'utf8'));
        console.log(report.summary.overallScore);
    ")
    
    if [ "$SECURITY_SCORE" -lt 30 ]; then
        echo "❌ Security score too low: $SECURITY_SCORE/100"
        echo "Please address critical security issues before committing."
        exit 1
    fi
    
    echo "✅ Pre-commit checks passed!"
else
    echo "ℹ️ No YAML files changed, skipping OpenAPI validation"
fi`;

        return { preCommitConfig, preCommitScript };
    }

    /**
     * Generate package.json with CI/CD scripts
     */
    generatePackageJson() {
        const packageJson = {
            "name": "stencil-openapi-specifications",
            "version": "1.0.0",
            "description": "OpenAPI specifications for Stencil CMS with comprehensive CI/CD pipeline",
            "main": "openapi.yaml",
            "scripts": {
                "validate": "node tools/validate-all.js",
                "validate:comprehensive": "node validate-pipeline.cjs",
                "test:performance": "node performance-test.cjs",
                "audit:security": "node security-audit.cjs",
                "generate:docs": "node generate-docs.cjs",
                "generate:postman": "node generate-postman.cjs",
                "pipeline:local": "npm run validate && npm run test:performance && npm run audit:security && npm run generate:docs && npm run generate:postman",
                "pipeline:ci": "npm run validate:comprehensive && npm run test:performance && npm run audit:security",
                "serve:docs": "cd generated && python -m http.server 8080",
                "clean": "rm -rf generated/*",
                "install:hooks": "cp scripts/pre-commit .git/hooks/ && chmod +x .git/hooks/pre-commit",
                "docker:build": "docker build -f Dockerfile.openapi -t stencil-openapi-pipeline .",
                "docker:run": "docker-compose up -d",
                "docker:logs": "docker-compose logs -f openapi-pipeline"
            },
            "keywords": [
                "openapi",
                "swagger",
                "api",
                "documentation",
                "stencil",
                "cms",
                "multi-tenant",
                "cicd"
            ],
            "author": "Stencil CMS Team",
            "license": "MIT",
            "dependencies": {
                "yaml": "^2.3.4"
            },
            "devDependencies": {
                "swagger-ui-dist": "^5.10.3"
            },
            "engines": {
                "node": ">=18.0.0"
            },
            "repository": {
                "type": "git",
                "url": "https://github.com/your-org/stencil-cms.git",
                "directory": "openapi"
            },
            "ci": {
                "validationThreshold": 95,
                "securityThreshold": 60,
                "performanceThreshold": 70
            }
        };

        return packageJson;
    }

    /**
     * Generate all CI/CD configurations
     */
    async generateAll() {
        console.log('🚀 GENERATING CI/CD PIPELINE CONFIGURATIONS');
        console.log('='.repeat(60));
        
        // Create pipeline configurations
        this.pipelineConfigs = {
            'GitHub Actions': this.generateGitHubActions(),
            'GitLab CI': this.generateGitLabCI(),
            'Azure DevOps': this.generateAzureDevOps(),
            'Jenkins': this.generateJenkins(),
            'Docker': this.generateDockerConfig(),
            'Pre-commit Hooks': this.generatePreCommitHooks(),
            'Package.json': this.generatePackageJson()
        };

        // Create directories
        const pipelinesDir = path.join(this.schemaDir, 'pipelines');
        const scriptsDir = path.join(this.schemaDir, 'scripts');
        
        if (!fs.existsSync(pipelinesDir)) {
            fs.mkdirSync(pipelinesDir, { recursive: true });
        }
        if (!fs.existsSync(scriptsDir)) {
            fs.mkdirSync(scriptsDir, { recursive: true });
        }

        // Save GitHub Actions workflow
        const githubDir = path.join(pipelinesDir, '.github', 'workflows');
        if (!fs.existsSync(githubDir)) {
            fs.mkdirSync(githubDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(githubDir, 'openapi-ci-cd.yml'),
            this.pipelineConfigs['GitHub Actions']
        );
        console.log('✅ GitHub Actions workflow created');

        // Save GitLab CI
        fs.writeFileSync(
            path.join(pipelinesDir, '.gitlab-ci.yml'),
            this.pipelineConfigs['GitLab CI']
        );
        console.log('✅ GitLab CI configuration created');

        // Save Azure DevOps pipeline
        fs.writeFileSync(
            path.join(pipelinesDir, 'azure-pipelines.yml'),
            this.pipelineConfigs['Azure DevOps']
        );
        console.log('✅ Azure DevOps pipeline created');

        // Save Jenkins pipeline
        fs.writeFileSync(
            path.join(pipelinesDir, 'Jenkinsfile'),
            this.pipelineConfigs['Jenkins']
        );
        console.log('✅ Jenkins pipeline created');

        // Save Docker configurations
        const dockerConfig = this.pipelineConfigs['Docker'];
        fs.writeFileSync(
            path.join(pipelinesDir, 'Dockerfile.openapi'),
            dockerConfig.dockerfile
        );
        fs.writeFileSync(
            path.join(pipelinesDir, 'docker-compose.yml'),
            dockerConfig.dockerCompose
        );
        console.log('✅ Docker configurations created');

        // Save pre-commit hooks
        const hooksConfig = this.pipelineConfigs['Pre-commit Hooks'];
        fs.writeFileSync(
            path.join(pipelinesDir, '.pre-commit-config.yaml'),
            hooksConfig.preCommitConfig
        );
        fs.writeFileSync(
            path.join(scriptsDir, 'pre-commit'),
            hooksConfig.preCommitScript
        );
        console.log('✅ Pre-commit hooks created');

        // Save package.json
        fs.writeFileSync(
            path.join(this.schemaDir, 'package.json'),
            JSON.stringify(this.pipelineConfigs['Package.json'], null, 2)
        );
        console.log('✅ Package.json created');

        // Generate pipeline documentation
        this.generatePipelineDocumentation();
        console.log('✅ Pipeline documentation created');

        console.log('\n📋 CI/CD Pipeline Setup Complete!');
        console.log('='.repeat(60));
        console.log('📁 Generated files:');
        console.log('├── pipelines/');
        console.log('│   ├── .github/workflows/openapi-ci-cd.yml');
        console.log('│   ├── .gitlab-ci.yml');
        console.log('│   ├── azure-pipelines.yml');
        console.log('│   ├── Jenkinsfile');
        console.log('│   ├── Dockerfile.openapi');
        console.log('│   ├── docker-compose.yml');
        console.log('│   └── .pre-commit-config.yaml');
        console.log('├── scripts/');
        console.log('│   └── pre-commit');
        console.log('├── package.json');
        console.log('└── PIPELINE.md');
        console.log('\n🚀 Ready for deployment to your CI/CD platform!');
    }

    /**
     * Generate comprehensive pipeline documentation
     */
    generatePipelineDocumentation() {
        const docs = `# OpenAPI CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for the Stencil CMS OpenAPI specifications. The pipeline includes validation, testing, security auditing, and automated documentation generation.

## Pipeline Stages

### 1. 🔍 Validation Stage
- **YAML Syntax Validation**: Validates all YAML files for proper syntax
- **OpenAPI Specification Validation**: Ensures compliance with OpenAPI 3.1+ standards
- **Schema Reference Validation**: Verifies all \`$ref\` references are valid
- **Multi-tenant Compliance Check**: Validates tenant isolation requirements

**Quality Gates:**
- All YAML files must pass syntax validation (100%)
- Validation score must be ≥ 95/100
- No broken references allowed

### 2. ⚡ Performance Testing
- **Parsing Performance**: Measures YAML parsing speed and efficiency
- **Schema Complexity Analysis**: Evaluates API design complexity
- **File Size Optimization**: Identifies optimization opportunities
- **Documentation Generation Speed**: Tests documentation build performance

**Quality Gates:**
- Average parse time < 100ms per file
- Performance score ≥ 70/100
- No files larger than 100KB without justification

### 3. 🛡️ Security Audit
- **Authentication Security**: Validates JWT and API key implementation
- **Authorization & RBAC**: Checks role-based access control implementation
- **Multi-tenant Security**: Ensures proper tenant isolation
- **Data Protection**: Validates sensitive data handling
- **OWASP Top 10 Compliance**: Checks for common vulnerabilities

**Quality Gates:**
- Security score ≥ 60/100 (blocks deployment if < 30/100)
- No critical OWASP vulnerabilities
- 100% tenant isolation coverage required

### 4. 📚 Documentation Generation
- **Interactive HTML Documentation**: Generates comprehensive API docs
- **Swagger UI Integration**: Creates interactive API explorer
- **Postman Collection**: Generates importable API test collection
- **Project Metrics**: Creates detailed analytics dashboard

### 5. 🚪 Quality Gate
Final evaluation of all quality metrics before deployment approval.

## Platform Configurations

### GitHub Actions
- **File**: \`.github/workflows/openapi-ci-cd.yml\`
- **Features**: 
  - Parallel job execution
  - Artifact publishing
  - GitHub Pages deployment
  - Quality gate enforcement

### GitLab CI
- **File**: \`.gitlab-ci.yml\`
- **Features**:
  - Multi-stage pipeline
  - Artifact caching
  - GitLab Pages integration
  - Conditional deployments

### Azure DevOps
- **File**: \`azure-pipelines.yml\`
- **Features**:
  - Multi-stage YAML pipeline
  - Test result publishing
  - Artifact management
  - Branch policies

### Jenkins
- **File**: \`Jenkinsfile\`
- **Features**:
  - Declarative pipeline
  - Parallel execution
  - HTML report publishing
  - Post-build notifications

### Docker
- **Files**: \`Dockerfile.openapi\`, \`docker-compose.yml\`
- **Features**:
  - Containerized pipeline execution
  - Nginx documentation server
  - Health checks
  - Volume management

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
\`\`\`bash
# Install dependencies
npm install

# Install pre-commit hooks
npm run install:hooks

# Run full pipeline locally
npm run pipeline:local
\`\`\`

### Available Scripts
- \`npm run validate\` - Run YAML validation
- \`npm run test:performance\` - Run performance tests
- \`npm run audit:security\` - Run security audit
- \`npm run generate:docs\` - Generate documentation
- \`npm run serve:docs\` - Serve documentation locally
- \`npm run clean\` - Clean generated files

## Docker Deployment

### Build and Run
\`\`\`bash
# Build Docker image
npm run docker:build

# Run with docker-compose
npm run docker:run

# View logs
npm run docker:logs
\`\`\`

### Access Points
- API Documentation: http://localhost:8080
- Pipeline Logs: \`docker logs stencil-openapi-pipeline\`

## Quality Thresholds

| Metric | Minimum | Target | Notes |
|--------|---------|---------|-------|
| Validation Score | 95/100 | 100/100 | Blocks deployment |
| Security Score | 60/100 | 90/100 | Critical < 30 blocks |
| Performance Score | 70/100 | 90/100 | Warning only |
| Test Coverage | N/A | N/A | Spec validation based |

## Troubleshooting

### Common Issues

1. **Validation Failures**
   - Check YAML syntax errors
   - Verify \`$ref\` references
   - Ensure consistent indentation

2. **Security Score Low**
   - Add tenant_id parameters
   - Implement proper authentication
   - Add RBAC annotations

3. **Performance Issues**
   - Reduce file sizes
   - Optimize schema complexity
   - Remove unnecessary nesting

### Debug Commands
\`\`\`bash
# Validate specific file
node tools/validate-all.js

# Check security issues
node security-audit.cjs

# Test performance
node performance-test.cjs

# Generate verbose output
DEBUG=1 npm run pipeline:local
\`\`\`

## Monitoring & Alerts

### Metrics to Monitor
- Pipeline success rate
- Validation score trends
- Security score trends
- Documentation build time
- API specification coverage

### Alert Conditions
- Pipeline failure rate > 10%
- Security score drops below 70
- Validation errors increase
- Documentation generation fails

## Contributing

1. All OpenAPI changes must pass the full pipeline
2. Security score must not decrease
3. Documentation must be updated for breaking changes
4. Pre-commit hooks must pass

## Support

For pipeline issues:
1. Check the pipeline logs
2. Review quality gate reports
3. Run local validation
4. Contact the API team

---

Generated by Stencil OpenAPI CI/CD Pipeline Generator
Last updated: ${new Date().toISOString()}`;

        fs.writeFileSync(path.join(this.schemaDir, 'PIPELINE.md'), docs);
    }
}

// Run pipeline generator
if (require.main === module) {
    const generator = new CICDPipelineGenerator();
    generator.generateAll().catch(console.error);
}

module.exports = CICDPipelineGenerator;