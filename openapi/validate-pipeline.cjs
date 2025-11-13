const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { execSync } = require('child_process');

class OpenAPIValidationPipeline {
    constructor() {
        this.baseDir = __dirname;
        this.results = {
            timestamp: new Date().toISOString(),
            totalFiles: 0,
            validFiles: 0,
            invalidFiles: 0,
            errors: [],
            warnings: [],
            performance: {},
            security: {},
            coverage: {}
        };
    }

    async run() {
        console.log('🚀 Starting OpenAPI Validation Pipeline...\n');
        
        try {
            await this.validateSyntax();
            await this.runSecurityChecks();
            await this.checkPerformance();
            await this.generateReport();
            
            console.log('✅ Pipeline completed successfully!');
            return this.results;
        } catch (error) {
            console.error('❌ Pipeline failed:', error.message);
            return this.results;
        }
    }

    async validateSyntax() {
        console.log('📝 Step 1: Validating YAML Syntax...');
        
        const files = this.getAllYamlFiles();
        this.results.totalFiles = files.length;
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                yaml.parse(content);
                this.results.validFiles++;
                console.log(`  ✅ ${path.basename(file)}`);
            } catch (error) {
                this.results.invalidFiles++;
                this.results.errors.push({
                    file: path.basename(file),
                    type: 'YAML_SYNTAX',
                    message: error.message,
                    line: error.linePos ? error.linePos[0].line : null
                });
                console.log(`  ❌ ${path.basename(file)} - ${error.message.substring(0, 50)}...`);
            }
        }
        
        console.log(`✅ Syntax validation complete: ${this.results.validFiles}/${this.results.totalFiles} valid\n`);
    }

    async runSecurityChecks() {
        console.log('🔒 Step 2: Security Analysis...');
        
        const securityChecks = [
            this.checkMultiTenantCompliance(),
            this.checkAuthenticationSchemes(),
            this.checkSensitiveDataExposure(),
            this.checkRBACImplementation()
        ];
        
        const securityResults = await Promise.all(securityChecks);
        
        this.results.security = {
            multiTenantCompliance: securityResults[0],
            authenticationSchemes: securityResults[1],
            sensitiveDataExposure: securityResults[2],
            rbacImplementation: securityResults[3],
            overallScore: this.calculateSecurityScore(securityResults)
        };
        
        console.log(`✅ Security analysis complete: ${this.results.security.overallScore}/100 score\n`);
    }

    async checkPerformance() {
        console.log('⚡ Step 3: Performance Analysis...');
        
        const startTime = Date.now();
        
        // Check file sizes
        const fileSizes = this.getAllYamlFiles().map(file => ({
            name: path.basename(file),
            size: fs.statSync(file).size,
            sizeKB: Math.round(fs.statSync(file).size / 1024 * 100) / 100
        }));
        
        // Check schema complexity
        const complexityAnalysis = this.analyzeSchemaComplexity();
        
        const endTime = Date.now();
        
        this.results.performance = {
            analysisTime: endTime - startTime,
            avgFileSize: Math.round(fileSizes.reduce((sum, f) => sum + f.size, 0) / fileSizes.length / 1024 * 100) / 100,
            largestFile: fileSizes.reduce((max, f) => f.size > max.size ? f : max),
            complexityScore: complexityAnalysis.score,
            recommendations: this.generatePerformanceRecommendations(fileSizes, complexityAnalysis)
        };
        
        console.log(`✅ Performance analysis complete: ${this.results.performance.complexityScore}/100 score\n`);
    }

    async generateReport() {
        console.log('📊 Step 4: Generating Validation Report...');
        
        const report = this.createDetailedReport();
        const outputPath = path.join(this.baseDir, 'generated', 'validation-report.json');
        
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHtmlReport(report);
        fs.writeFileSync(path.join(this.baseDir, 'generated', 'validation-report.html'), htmlReport);
        
        console.log('✅ Validation reports generated:');
        console.log('  - generated/validation-report.json');
        console.log('  - generated/validation-report.html\n');
    }

    getAllYamlFiles() {
        const files = [];
        
        function walk(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
                    walk(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
                    files.push(fullPath);
                }
            }
        }
        
        walk(this.baseDir);
        return files;
    }

    checkMultiTenantCompliance() {
        console.log('  🔍 Checking multi-tenant compliance...');
        
        const schemaFiles = this.getAllYamlFiles().filter(f => f.includes('/schemas/'));
        let compliantSchemas = 0;
        let totalSchemas = 0;
        
        schemaFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.parse(content);
                
                Object.entries(parsed).forEach(([name, schema]) => {
                    if (schema.type === 'object' && schema.properties) {
                        totalSchemas++;
                        if (schema.properties.tenant_id) {
                            compliantSchemas++;
                        }
                    }
                });
            } catch (e) {
                // Skip invalid files
            }
        });
        
        const complianceRate = totalSchemas > 0 ? Math.round((compliantSchemas / totalSchemas) * 100) : 100;
        console.log(`    ✅ Multi-tenant compliance: ${complianceRate}% (${compliantSchemas}/${totalSchemas} schemas)`);
        
        return {
            compliant: compliantSchemas,
            total: totalSchemas,
            rate: complianceRate,
            passed: complianceRate >= 90
        };
    }

    checkAuthenticationSchemes() {
        console.log('  🔍 Checking authentication schemes...');
        
        try {
            const mainApiPath = path.join(this.baseDir, 'openapi.yaml');
            const content = fs.readFileSync(mainApiPath, 'utf8');
            const parsed = yaml.parse(content);
            
            const hasJWT = parsed.components?.securitySchemes?.bearerAuth;
            const hasApiKey = parsed.components?.securitySchemes?.ApiKeyAuth;
            
            console.log(`    ✅ JWT Authentication: ${hasJWT ? 'Configured' : 'Missing'}`);
            console.log(`    ✅ API Key Authentication: ${hasApiKey ? 'Configured' : 'Missing'}`);
            
            return {
                jwt: !!hasJWT,
                apiKey: !!hasApiKey,
                score: (hasJWT ? 70 : 0) + (hasApiKey ? 30 : 0)
            };
        } catch (e) {
            return { jwt: false, apiKey: false, score: 0 };
        }
    }

    checkSensitiveDataExposure() {
        console.log('  🔍 Checking for sensitive data exposure...');
        
        const sensitiveFields = ['password', 'secret', 'key', 'token', 'private'];
        let exposedFields = [];
        
        const schemaFiles = this.getAllYamlFiles().filter(f => f.includes('/schemas/'));
        
        schemaFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.parse(content);
                
                Object.entries(parsed).forEach(([schemaName, schema]) => {
                    if (schema.properties) {
                        Object.entries(schema.properties).forEach(([fieldName, field]) => {
                            if (sensitiveFields.some(s => fieldName.toLowerCase().includes(s))) {
                                if (!field.writeOnly && !field.format?.includes('password')) {
                                    exposedFields.push({
                                        file: path.basename(file),
                                        schema: schemaName,
                                        field: fieldName
                                    });
                                }
                            }
                        });
                    }
                });
            } catch (e) {
                // Skip invalid files
            }
        });
        
        console.log(`    ✅ Sensitive fields found: ${exposedFields.length}`);
        
        return {
            exposedFields,
            score: exposedFields.length === 0 ? 100 : Math.max(0, 100 - (exposedFields.length * 10))
        };
    }

    checkRBACImplementation() {
        console.log('  🔍 Checking RBAC implementation...');
        
        const pathFiles = this.getAllYamlFiles().filter(f => f.includes('/paths/'));
        let protectedEndpoints = 0;
        let totalEndpoints = 0;
        
        pathFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.parse(content);
                
                Object.entries(parsed).forEach(([path, methods]) => {
                    Object.entries(methods).forEach(([method, endpoint]) => {
                        totalEndpoints++;
                        if (endpoint.security || endpoint.parameters?.some(p => p.name === 'X-Tenant-ID')) {
                            protectedEndpoints++;
                        }
                    });
                });
            } catch (e) {
                // Skip invalid files
            }
        });
        
        const protectionRate = totalEndpoints > 0 ? Math.round((protectedEndpoints / totalEndpoints) * 100) : 100;
        console.log(`    ✅ Protected endpoints: ${protectionRate}% (${protectedEndpoints}/${totalEndpoints})`);
        
        return {
            protected: protectedEndpoints,
            total: totalEndpoints,
            rate: protectionRate,
            score: protectionRate
        };
    }

    calculateSecurityScore(results) {
        const weights = { multiTenant: 0.3, auth: 0.3, exposure: 0.2, rbac: 0.2 };
        return Math.round(
            (results[0].rate * weights.multiTenant) +
            (results[1].score * weights.auth) +
            (results[2].score * weights.exposure) +
            (results[3].score * weights.rbac)
        );
    }

    analyzeSchemaComplexity() {
        let totalSchemas = 0;
        let totalFields = 0;
        let nestedSchemas = 0;
        
        const schemaFiles = this.getAllYamlFiles().filter(f => f.includes('/schemas/'));
        
        schemaFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.parse(content);
                
                Object.entries(parsed).forEach(([name, schema]) => {
                    if (schema.type === 'object' && schema.properties) {
                        totalSchemas++;
                        totalFields += Object.keys(schema.properties).length;
                        
                        // Check for nested objects
                        Object.values(schema.properties).forEach(prop => {
                            if (prop.type === 'object' || prop.$ref || prop.allOf || prop.oneOf) {
                                nestedSchemas++;
                            }
                        });
                    }
                });
            } catch (e) {
                // Skip invalid files
            }
        });
        
        const avgFieldsPerSchema = totalSchemas > 0 ? Math.round(totalFields / totalSchemas) : 0;
        const complexityScore = Math.min(100, Math.max(0, 100 - (avgFieldsPerSchema - 10) * 2));
        
        return {
            totalSchemas,
            totalFields,
            avgFieldsPerSchema,
            nestedSchemas,
            score: complexityScore
        };
    }

    generatePerformanceRecommendations(fileSizes, complexity) {
        const recommendations = [];
        
        if (complexity.avgFieldsPerSchema > 20) {
            recommendations.push("Consider breaking down large schemas into smaller, reusable components");
        }
        
        if (fileSizes.some(f => f.sizeKB > 100)) {
            recommendations.push("Some schema files are quite large (>100KB). Consider splitting them into smaller files");
        }
        
        if (complexity.nestedSchemas / complexity.totalSchemas > 0.5) {
            recommendations.push("High ratio of nested schemas detected. Consider using $ref for better reusability");
        }
        
        return recommendations;
    }

    createDetailedReport() {
        return {
            summary: {
                timestamp: this.results.timestamp,
                totalFiles: this.results.totalFiles,
                validFiles: this.results.validFiles,
                invalidFiles: this.results.invalidFiles,
                successRate: Math.round((this.results.validFiles / this.results.totalFiles) * 100)
            },
            validation: {
                errors: this.results.errors,
                warnings: this.results.warnings
            },
            security: this.results.security,
            performance: this.results.performance,
            recommendations: this.generateOverallRecommendations()
        };
    }

    generateOverallRecommendations() {
        const recommendations = [];
        
        if (this.results.invalidFiles > 0) {
            recommendations.push(`Fix ${this.results.invalidFiles} YAML syntax error(s) to achieve 100% validation success`);
        }
        
        if (this.results.security.overallScore < 90) {
            recommendations.push("Improve security implementation to achieve 90%+ security score");
        }
        
        if (this.results.performance.complexityScore < 80) {
            recommendations.push("Optimize schema complexity for better performance");
        }
        
        recommendations.push(...(this.results.performance.recommendations || []));
        
        return recommendations;
    }

    generateHtmlReport(report) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenAPI Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #28a745; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .warning { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .success { color: #28a745; }
        .danger { color: #dc3545; }
        ul { padding-left: 20px; }
        .score { font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 OpenAPI Validation Report</h1>
        <p>Generated on ${new Date(report.summary.timestamp).toLocaleString()}</p>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value ${report.summary.successRate === 100 ? 'success' : 'danger'}">${report.summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.validFiles}</div>
                <div class="metric-label">Valid Files</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalFiles}</div>
                <div class="metric-label">Total Files</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🔒 Security Analysis</h2>
        <div class="score ${report.security.overallScore >= 90 ? 'success' : 'danger'}">
            Overall Security Score: ${report.security.overallScore}/100
        </div>
        <ul>
            <li><strong>Multi-tenant Compliance:</strong> ${report.security.multiTenantCompliance?.rate || 0}% (${report.security.multiTenantCompliance?.compliant || 0}/${report.security.multiTenantCompliance?.total || 0} schemas)</li>
            <li><strong>Authentication:</strong> JWT: ${report.security.authenticationSchemes?.jwt ? '✅' : '❌'}, API Key: ${report.security.authenticationSchemes?.apiKey ? '✅' : '❌'}</li>
            <li><strong>Protected Endpoints:</strong> ${report.security.rbacImplementation?.rate || 0}% (${report.security.rbacImplementation?.protected || 0}/${report.security.rbacImplementation?.total || 0})</li>
            <li><strong>Sensitive Data Exposure:</strong> ${report.security.sensitiveDataExposure?.exposedFields?.length || 0} potential issues</li>
        </ul>
    </div>

    <div class="section">
        <h2>⚡ Performance Analysis</h2>
        <div class="score ${report.performance.complexityScore >= 80 ? 'success' : 'danger'}">
            Complexity Score: ${report.performance.complexityScore}/100
        </div>
        <ul>
            <li><strong>Analysis Time:</strong> ${report.performance.analysisTime}ms</li>
            <li><strong>Average File Size:</strong> ${report.performance.avgFileSize}KB</li>
            <li><strong>Largest File:</strong> ${report.performance.largestFile?.name} (${report.performance.largestFile?.sizeKB}KB)</li>
        </ul>
    </div>

    ${report.validation.errors.length > 0 ? `
    <div class="section">
        <h2>❌ Validation Errors</h2>
        ${report.validation.errors.map(error => `
            <div class="error">
                <strong>${error.file}</strong>: ${error.message} ${error.line ? `(Line ${error.line})` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.recommendations.length > 0 ? `
    <div class="section">
        <h2>💡 Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
</body>
</html>`;
    }
}

// Run the pipeline
const pipeline = new OpenAPIValidationPipeline();
pipeline.run().then(results => {
    const successRate = Math.round((results.validFiles / results.totalFiles) * 100);
    console.log('='.repeat(60));
    console.log('📊 PIPELINE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success Rate: ${successRate}%`);
    console.log(`📁 Files Validated: ${results.validFiles}/${results.totalFiles}`);
    console.log(`🔒 Security Score: ${results.security?.overallScore || 0}/100`);
    console.log(`⚡ Performance Score: ${results.performance?.complexityScore || 0}/100`);
    console.log('='.repeat(60));
    
    process.exit(results.invalidFiles === 0 ? 0 : 1);
}).catch(error => {
    console.error('Pipeline failed:', error);
    process.exit(1);
});