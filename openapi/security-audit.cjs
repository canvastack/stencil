#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Security Audit Suite for OpenAPI Multi-Tenant Architecture & RBAC
 * Comprehensive security analysis including authentication, authorization, data isolation, and OWASP compliance
 */

class SecurityAuditor {
    constructor() {
        this.results = {
            overallScore: 100,
            authenticationSecurity: {},
            authorizationSecurity: {},
            multiTenantSecurity: {},
            dataProtection: {},
            owaspCompliance: {},
            vulnerabilities: [],
            recommendations: []
        };
        this.schemaDir = __dirname;
        this.securityPatterns = this.initializeSecurityPatterns();
    }

    /**
     * Initialize security patterns and rules for analysis
     */
    initializeSecurityPatterns() {
        return {
            authentication: {
                jwtRequired: /jwt|bearer|authorization/i,
                securitySchemes: /securitySchemes/,
                apiKey: /apiKey/i,
                oauth2: /oauth2/i
            },
            authorization: {
                rbac: /role|permission|rbac/i,
                scope: /scope/i,
                userRoles: /user.*role|role.*user/i,
                tenantScope: /tenant.*scope|scope.*tenant/i
            },
            multiTenant: {
                tenantId: /tenant[_-]?id|tenantId/i,
                tenantIsolation: /tenant[_-]?(isolation|boundary|scope)/i,
                crossTenant: /cross[_-]?tenant/i
            },
            dataProtection: {
                sensitiveData: /password|secret|api[_-]?key|access[_-]?key|secret[_-]?key|private[_-]?key|client[_-]?secret|token|refresh[_-]?token|auth[_-]?token|jwt/i,
                encryption: /encrypt|hash|secure|bcrypt|argon/i,
                pii: /email|phone|address|ssn|personal/i,
                readOnly: /readOnly.*true/
            },
            owasp: {
                injection: /\$\{|\{\{|eval\(|exec\(.*\)|sql.*injection/i,
                brokenAuth: /auth.*bypass|weak.*authentication|no.*authentication.*required/i,
                sensitiveExposure: /debug.*mode.*enabled|trace.*enabled|stack.*trace.*exposed|internal.*error.*exposed/i,
                xxe: /xml.*external.*entity|xxe.*vulnerability/i,
                brokenAccess: /direct.*object.*reference|insecure.*direct.*object/i,
                securityMisconfig: /default.*password.*admin|admin.*admin.*credentials|test.*test.*credentials/i,
                xss: /cross.*site.*scripting|xss.*vulnerability|script.*injection/i,
                insecureDeserialization: /insecure.*deserialization|unsafe.*deserialization/i,
                vulnerableComponents: /known.*vulnerable.*component|outdated.*vulnerable.*library/i,
                logging: /insufficient.*logging|missing.*security.*logging|auth.*fail.*not.*logged/i
            }
        };
    }

    /**
     * Audit authentication security implementation
     */
    auditAuthentication() {
        console.log('🔐 Auditing Authentication Security...\n');
        
        const authFindings = {
            score: 100,
            hasJWT: false,
            hasSecuritySchemes: false,
            hasMultipleAuthMethods: false,
            authEndpoints: [],
            weaknesses: []
        };

        // Check main OpenAPI file for security schemes
        const openApiPath = path.join(this.schemaDir, 'openapi.yaml');
        if (fs.existsSync(openApiPath)) {
            const content = fs.readFileSync(openApiPath, 'utf8');
            const parsed = yaml.parse(content);

            if (parsed.components && parsed.components.securitySchemes) {
                authFindings.hasSecuritySchemes = true;
                console.log('✅ Security schemes defined in main OpenAPI specification');
                
                Object.entries(parsed.components.securitySchemes).forEach(([name, scheme]) => {
                    if (scheme.type === 'http' && scheme.scheme === 'bearer') {
                        authFindings.hasJWT = true;
                        console.log(`✅ JWT Bearer authentication found: ${name}`);
                    } else if (scheme.type === 'apiKey') {
                        console.log(`🔑 API Key authentication found: ${name}`);
                    } else if (scheme.type === 'oauth2') {
                        console.log(`🔄 OAuth2 authentication found: ${name}`);
                    }
                });

                authFindings.hasMultipleAuthMethods = Object.keys(parsed.components.securitySchemes).length > 1;
            } else {
                authFindings.weaknesses.push('No security schemes defined in main specification');
                authFindings.score -= 20;
            }
        }

        // Check auth schema files
        const authSchemaPath = path.join(this.schemaDir, 'schemas', 'common', 'auth.yaml');
        if (fs.existsSync(authSchemaPath)) {
            const content = fs.readFileSync(authSchemaPath, 'utf8');
            console.log('✅ Dedicated authentication schema file found');
            
            if (this.securityPatterns.authentication.jwtRequired.test(content)) {
                console.log('✅ JWT patterns detected in auth schemas');
            }
            
            if (this.securityPatterns.authorization.rbac.test(content)) {
                console.log('✅ RBAC patterns detected in auth schemas');
            }
        } else {
            authFindings.weaknesses.push('No dedicated authentication schema file');
            authFindings.score -= 10;
        }

        // Scan all path files for authentication requirements
        const pathsDir = path.join(this.schemaDir, 'paths');
        if (fs.existsSync(pathsDir)) {
            this.walkDirectory(pathsDir, (file) => {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.parse(content);
                
                if (parsed) {
                    Object.entries(parsed).forEach(([path, methods]) => {
                        Object.entries(methods).forEach(([method, operation]) => {
                            if (operation.security) {
                                authFindings.authEndpoints.push(`${method.toUpperCase()} ${path}`);
                            } else {
                                authFindings.weaknesses.push(`No security requirement: ${method.toUpperCase()} ${path}`);
                            }
                        });
                    });
                }
            });
        }

        console.log(`\n📊 Authentication Security Score: ${authFindings.score}/100`);
        console.log(`🔒 Protected Endpoints: ${authFindings.authEndpoints.length}`);
        console.log(`⚠️ Weaknesses Found: ${authFindings.weaknesses.length}\n`);

        this.results.authenticationSecurity = authFindings;
        return authFindings.score;
    }

    /**
     * Audit authorization and RBAC implementation
     */
    auditAuthorization() {
        console.log('🛡️ Auditing Authorization & RBAC Implementation...\n');
        
        const authzFindings = {
            score: 100,
            hasRBAC: false,
            hasRoleBasedPaths: false,
            hasPermissionModel: false,
            roleDefinitions: [],
            permissionChecks: [],
            weaknesses: []
        };

        // Check for RBAC patterns in schema files
        this.walkDirectory(this.schemaDir, (file) => {
            const content = fs.readFileSync(file, 'utf8');
            
            if (this.securityPatterns.authorization.rbac.test(content)) {
                authzFindings.hasRBAC = true;
                console.log(`✅ RBAC patterns found in: ${path.relative(this.schemaDir, file)}`);
            }
            
            if (this.securityPatterns.authorization.userRoles.test(content)) {
                const matches = content.match(/role[s]?['":][\s]*["'][^"']+["']/gi) || [];
                matches.forEach(match => {
                    if (!authzFindings.roleDefinitions.includes(match)) {
                        authzFindings.roleDefinitions.push(match);
                    }
                });
            }
            
            if (this.securityPatterns.authorization.scope.test(content)) {
                authzFindings.hasPermissionModel = true;
                const scopeMatches = content.match(/scope[s]?['":][\s]*["'][^"']+["']/gi) || [];
                authzFindings.permissionChecks.push(...scopeMatches);
            }
        });

        // Check if paths have role-based access control
        const pathsDir = path.join(this.schemaDir, 'paths');
        if (fs.existsSync(pathsDir)) {
            this.walkDirectory(pathsDir, (file) => {
                const content = fs.readFileSync(file, 'utf8');
                
                if (this.securityPatterns.authorization.rbac.test(content)) {
                    authzFindings.hasRoleBasedPaths = true;
                }
            });
        }

        // Score calculation
        if (!authzFindings.hasRBAC) {
            authzFindings.weaknesses.push('No RBAC implementation detected');
            authzFindings.score -= 30;
        }
        
        if (!authzFindings.hasPermissionModel) {
            authzFindings.weaknesses.push('No permission/scope model detected');
            authzFindings.score -= 20;
        }
        
        if (authzFindings.roleDefinitions.length === 0) {
            authzFindings.weaknesses.push('No role definitions found');
            authzFindings.score -= 15;
        }

        console.log(`📊 Authorization Security Score: ${authzFindings.score}/100`);
        console.log(`👥 Role Definitions Found: ${authzFindings.roleDefinitions.length}`);
        console.log(`🔐 Permission Checks: ${authzFindings.permissionChecks.length}`);
        console.log(`⚠️ Weaknesses Found: ${authzFindings.weaknesses.length}\n`);

        this.results.authorizationSecurity = authzFindings;
        return authzFindings.score;
    }

    /**
     * Audit multi-tenant architecture security
     */
    auditMultiTenantSecurity() {
        console.log('🏢 Auditing Multi-Tenant Architecture Security...\n');
        
        const mtFindings = {
            score: 100,
            hasTenantIsolation: false,
            tenantIdUsage: [],
            crossTenantRisks: [],
            isolationMechanisms: [],
            weaknesses: []
        };

        let tenantIdCount = 0;
        let properTenantIsolation = 0;
        let totalEndpoints = 0;

        // Check all files for tenant isolation patterns
        this.walkDirectory(this.schemaDir, (file) => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.schemaDir, file);
            
            // Count tenant_id usage
            const tenantMatches = content.match(this.securityPatterns.multiTenant.tenantId) || [];
            if (tenantMatches.length > 0) {
                tenantIdCount += tenantMatches.length;
                mtFindings.tenantIdUsage.push({
                    file: relativePath,
                    occurrences: tenantMatches.length
                });
            }
            
            // Check for isolation mechanisms
            if (this.securityPatterns.multiTenant.tenantIsolation.test(content)) {
                mtFindings.isolationMechanisms.push(relativePath);
                mtFindings.hasTenantIsolation = true;
            }
            
            // Check for cross-tenant access risks
            if (this.securityPatterns.multiTenant.crossTenant.test(content)) {
                mtFindings.crossTenantRisks.push(relativePath);
            }
        });

        // Analyze path files for proper tenant scoping
        const pathsDir = path.join(this.schemaDir, 'paths');
        if (fs.existsSync(pathsDir)) {
            this.walkDirectory(pathsDir, (file) => {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.parse(content);
                
                if (parsed) {
                    Object.entries(parsed).forEach(([path, methods]) => {
                        Object.entries(methods).forEach(([method, operation]) => {
                            totalEndpoints++;
                            
                            // Check if tenant_id is required in parameters or security
                            const hasParameterTenantId = operation.parameters?.some(param => 
                                param.name && this.securityPatterns.multiTenant.tenantId.test(param.name)
                            );
                            
                            const hasPathTenantId = this.securityPatterns.multiTenant.tenantId.test(path);
                            
                            if (hasParameterTenantId || hasPathTenantId) {
                                properTenantIsolation++;
                            }
                        });
                    });
                }
            });
        }

        // Calculate tenant isolation percentage
        const tenantIsolationPercentage = totalEndpoints > 0 ? (properTenantIsolation / totalEndpoints) * 100 : 0;
        
        console.log(`🏢 Tenant ID Usage: ${tenantIdCount} occurrences across ${mtFindings.tenantIdUsage.length} files`);
        console.log(`🔒 Tenant Isolation: ${tenantIsolationPercentage.toFixed(1)}% of endpoints (${properTenantIsolation}/${totalEndpoints})`);
        console.log(`🛡️ Isolation Mechanisms: ${mtFindings.isolationMechanisms.length} files`);
        console.log(`⚠️ Cross-Tenant Risks: ${mtFindings.crossTenantRisks.length} files`);

        // Score calculation
        if (tenantIsolationPercentage < 90) {
            mtFindings.weaknesses.push(`Low tenant isolation coverage: ${tenantIsolationPercentage.toFixed(1)}%`);
            mtFindings.score -= Math.round((90 - tenantIsolationPercentage) / 2);
        }
        
        if (mtFindings.crossTenantRisks.length > 0) {
            mtFindings.weaknesses.push(`Potential cross-tenant access risks detected`);
            mtFindings.score -= mtFindings.crossTenantRisks.length * 5;
        }
        
        if (!mtFindings.hasTenantIsolation) {
            mtFindings.weaknesses.push('No explicit tenant isolation mechanisms found');
            mtFindings.score -= 20;
        }

        console.log(`\n📊 Multi-Tenant Security Score: ${mtFindings.score}/100`);
        console.log(`⚠️ Weaknesses Found: ${mtFindings.weaknesses.length}\n`);

        this.results.multiTenantSecurity = mtFindings;
        return mtFindings.score;
    }

    /**
     * Audit data protection and privacy compliance
     */
    auditDataProtection() {
        console.log('🔒 Auditing Data Protection & Privacy Compliance...\n');
        
        const dataFindings = {
            score: 100,
            sensitiveDataFound: [],
            encryptionUsage: [],
            piiDetected: [],
            readOnlyFields: [],
            dataExposureRisks: [],
            weaknesses: []
        };

        this.walkDirectory(this.schemaDir, (file) => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.schemaDir, file);
            
            // Check for sensitive data patterns
            const sensitiveMatches = content.match(this.securityPatterns.dataProtection.sensitiveData) || [];
            if (sensitiveMatches.length > 0) {
                dataFindings.sensitiveDataFound.push({
                    file: relativePath,
                    matches: sensitiveMatches
                });
            }
            
            // Check for encryption usage
            if (this.securityPatterns.dataProtection.encryption.test(content)) {
                dataFindings.encryptionUsage.push(relativePath);
            }
            
            // Check for PII
            const piiMatches = content.match(this.securityPatterns.dataProtection.pii) || [];
            if (piiMatches.length > 0) {
                dataFindings.piiDetected.push({
                    file: relativePath,
                    matches: piiMatches
                });
            }
            
            // Check for read-only fields (good practice)
            const readOnlyMatches = content.match(this.securityPatterns.dataProtection.readOnly) || [];
            dataFindings.readOnlyFields.push(...readOnlyMatches);
        });

        console.log(`🔍 Sensitive Data Fields: ${dataFindings.sensitiveDataFound.length} files`);
        console.log(`🔐 Encryption References: ${dataFindings.encryptionUsage.length} files`);
        console.log(`👤 PII Fields Detected: ${dataFindings.piiDetected.length} files`);
        console.log(`🔒 Read-Only Fields: ${dataFindings.readOnlyFields.length}`);

        // Check for data exposure risks (enhanced with encryption markers)
        this.walkDirectory(this.schemaDir, (file) => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.schemaDir, file);
            
            // Look for sensitive fields without encryption markers
            const lines = content.split('\n');
            let inSensitiveField = false;
            let hasEncryptionMarker = false;
            
            lines.forEach((line, index) => {
                if (this.securityPatterns.dataProtection.sensitiveData.test(line)) {
                    inSensitiveField = true;
                    hasEncryptionMarker = false;
                }
                
                if (inSensitiveField && (line.includes('x-encryption') || line.includes('x-sensitive') || 
                                       line.includes('encrypted') || line.includes('hashed') || 
                                       line.includes('bcrypt') || line.includes('writeOnly: true'))) {
                    hasEncryptionMarker = true;
                }
                
                if (inSensitiveField && (line.trim() === '' || line.includes('properties:')) && !hasEncryptionMarker) {
                    // Only flag as risk if it's actually a schema field definition, not just a match in comments
                    if (!line.includes('#') && !line.includes('description')) {
                        dataFindings.dataExposureRisks.push(`Unprotected sensitive field in ${relativePath}:${index + 1}`);
                    }
                    inSensitiveField = false;
                }
            });
        });

        // Score calculation
        if (dataFindings.dataExposureRisks.length > 0) {
            dataFindings.weaknesses.push(`${dataFindings.dataExposureRisks.length} potential data exposure risks`);
            dataFindings.score -= dataFindings.dataExposureRisks.length * 5;
        }
        
        if (dataFindings.encryptionUsage.length === 0 && dataFindings.sensitiveDataFound.length > 0) {
            dataFindings.weaknesses.push('Sensitive data found but no encryption patterns detected');
            dataFindings.score -= 15;
        }

        console.log(`\n📊 Data Protection Score: ${dataFindings.score}/100`);
        console.log(`⚠️ Data Exposure Risks: ${dataFindings.dataExposureRisks.length}`);
        console.log(`⚠️ Weaknesses Found: ${dataFindings.weaknesses.length}\n`);

        this.results.dataProtection = dataFindings;
        return dataFindings.score;
    }

    /**
     * Audit OWASP Top 10 compliance
     */
    auditOWASPCompliance() {
        console.log('🛡️ Auditing OWASP Top 10 Compliance...\n');
        
        const owaspFindings = {
            score: 100,
            vulnerabilities: {},
            riskLevel: 'LOW',
            weaknesses: []
        };

        const owaspChecks = {
            'Injection': this.securityPatterns.owasp.injection,
            'Broken Authentication': this.securityPatterns.owasp.brokenAuth,
            'Sensitive Data Exposure': this.securityPatterns.owasp.sensitiveExposure,
            'XML External Entities': this.securityPatterns.owasp.xxe,
            'Broken Access Control': this.securityPatterns.owasp.brokenAccess,
            'Security Misconfiguration': this.securityPatterns.owasp.securityMisconfig,
            'Cross-Site Scripting': this.securityPatterns.owasp.xss,
            'Insecure Deserialization': this.securityPatterns.owasp.insecureDeserialization,
            'Vulnerable Components': this.securityPatterns.owasp.vulnerableComponents,
            'Insufficient Logging': this.securityPatterns.owasp.logging
        };

        Object.entries(owaspChecks).forEach(([vulnerability, pattern]) => {
            owaspFindings.vulnerabilities[vulnerability] = {
                found: false,
                files: [],
                severity: this.getVulnerabilitySeverity(vulnerability)
            };
        });

        this.walkDirectory(this.schemaDir, (file) => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.schemaDir, file);
            
            Object.entries(owaspChecks).forEach(([vulnerability, pattern]) => {
                if (pattern.test(content)) {
                    owaspFindings.vulnerabilities[vulnerability].found = true;
                    owaspFindings.vulnerabilities[vulnerability].files.push(relativePath);
                }
            });
        });

        // Calculate risk level and score
        let criticalVulns = 0;
        let highVulns = 0;
        let mediumVulns = 0;

        Object.entries(owaspFindings.vulnerabilities).forEach(([vuln, data]) => {
            if (data.found) {
                console.log(`⚠️ ${vuln}: Found in ${data.files.length} files (${data.severity})`);
                
                switch (data.severity) {
                    case 'CRITICAL':
                        criticalVulns++;
                        owaspFindings.score -= 20;
                        break;
                    case 'HIGH':
                        highVulns++;
                        owaspFindings.score -= 15;
                        break;
                    case 'MEDIUM':
                        mediumVulns++;
                        owaspFindings.score -= 10;
                        break;
                    default:
                        owaspFindings.score -= 5;
                }
            } else {
                console.log(`✅ ${vuln}: Not detected`);
            }
        });

        if (criticalVulns > 0) {
            owaspFindings.riskLevel = 'CRITICAL';
        } else if (highVulns > 0) {
            owaspFindings.riskLevel = 'HIGH';
        } else if (mediumVulns > 0) {
            owaspFindings.riskLevel = 'MEDIUM';
        }

        console.log(`\n📊 OWASP Compliance Score: ${owaspFindings.score}/100`);
        console.log(`⚠️ Risk Level: ${owaspFindings.riskLevel}`);
        console.log(`🔴 Critical: ${criticalVulns}, 🟠 High: ${highVulns}, 🟡 Medium: ${mediumVulns}\n`);

        this.results.owaspCompliance = owaspFindings;
        return owaspFindings.score;
    }

    /**
     * Get vulnerability severity level
     */
    getVulnerabilitySeverity(vulnerability) {
        const severityMap = {
            'Injection': 'CRITICAL',
            'Broken Authentication': 'CRITICAL',
            'Sensitive Data Exposure': 'HIGH',
            'XML External Entities': 'HIGH',
            'Broken Access Control': 'CRITICAL',
            'Security Misconfiguration': 'MEDIUM',
            'Cross-Site Scripting': 'HIGH',
            'Insecure Deserialization': 'HIGH',
            'Vulnerable Components': 'MEDIUM',
            'Insufficient Logging': 'LOW'
        };
        return severityMap[vulnerability] || 'MEDIUM';
    }

    /**
     * Walk directory recursively
     */
    walkDirectory(dir, callback) {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                this.walkDirectory(fullPath, callback);
            } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
                callback(fullPath);
            }
        }
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Authentication recommendations
        if (this.results.authenticationSecurity.score < 90) {
            recommendations.push({
                category: 'Authentication',
                priority: 'HIGH',
                recommendation: 'Implement JWT Bearer token authentication for all API endpoints',
                impact: 'Prevents unauthorized access and ensures secure authentication'
            });
        }
        
        // Authorization recommendations
        if (this.results.authorizationSecurity.score < 90) {
            recommendations.push({
                category: 'Authorization',
                priority: 'HIGH',
                recommendation: 'Implement comprehensive RBAC with granular permissions',
                impact: 'Ensures users only access resources appropriate for their role'
            });
        }
        
        // Multi-tenant recommendations
        if (this.results.multiTenantSecurity.score < 90) {
            recommendations.push({
                category: 'Multi-Tenant Security',
                priority: 'CRITICAL',
                recommendation: 'Enforce tenant_id isolation in all API endpoints and database queries',
                impact: 'Prevents data leakage between tenants'
            });
        }
        
        // Data protection recommendations
        if (this.results.dataProtection.score < 90) {
            recommendations.push({
                category: 'Data Protection',
                priority: 'HIGH',
                recommendation: 'Implement encryption for sensitive data fields and PII',
                impact: 'Protects sensitive information and ensures privacy compliance'
            });
        }
        
        // OWASP recommendations
        if (this.results.owaspCompliance.score < 90) {
            recommendations.push({
                category: 'OWASP Compliance',
                priority: this.results.owaspCompliance.riskLevel,
                recommendation: 'Address identified OWASP Top 10 vulnerabilities',
                impact: 'Reduces security risks and improves overall security posture'
            });
        }

        this.results.recommendations = recommendations;
        return recommendations;
    }

    /**
     * Generate comprehensive security report
     */
    generateReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                overallScore: this.results.overallScore,
                riskLevel: this.results.owaspCompliance.riskLevel || 'LOW',
                totalRecommendations: this.results.recommendations.length
            },
            scores: {
                authentication: this.results.authenticationSecurity.score,
                authorization: this.results.authorizationSecurity.score,
                multiTenant: this.results.multiTenantSecurity.score,
                dataProtection: this.results.dataProtection.score,
                owaspCompliance: this.results.owaspCompliance.score
            },
            details: this.results
        };
        
        // Save JSON report
        const generatedDir = path.join(this.schemaDir, 'generated');
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(generatedDir, 'security-audit.json'),
            JSON.stringify(reportData, null, 2)
        );
        
        // Generate HTML report
        const htmlReport = this.generateHtmlReport(reportData);
        fs.writeFileSync(
            path.join(generatedDir, 'security-audit.html'),
            htmlReport
        );
        
        console.log('🛡️ SECURITY AUDIT SUMMARY');
        console.log('='.repeat(50));
        console.log(`🎯 Overall Security Score: ${this.results.overallScore}/100`);
        console.log(`🔐 Authentication Score: ${this.results.authenticationSecurity.score}/100`);
        console.log(`🛡️ Authorization Score: ${this.results.authorizationSecurity.score}/100`);
        console.log(`🏢 Multi-Tenant Score: ${this.results.multiTenantSecurity.score}/100`);
        console.log(`🔒 Data Protection Score: ${this.results.dataProtection.score}/100`);
        console.log(`⚠️ OWASP Compliance Score: ${this.results.owaspCompliance.score}/100`);
        console.log(`🚨 Risk Level: ${this.results.owaspCompliance.riskLevel || 'LOW'}`);
        console.log(`📋 Recommendations: ${this.results.recommendations.length}`);
        console.log('='.repeat(50));
        
        if (this.results.overallScore >= 90) {
            console.log('🎉 EXCELLENT SECURITY POSTURE!');
        } else if (this.results.overallScore >= 75) {
            console.log('✅ GOOD SECURITY - Minor improvements needed');
        } else if (this.results.overallScore >= 60) {
            console.log('⚠️ MODERATE SECURITY - Several improvements required');
        } else {
            console.log('❌ POOR SECURITY - Immediate action required');
        }
    }

    /**
     * Generate HTML security report
     */
    generateHtmlReport(data) {
        const riskColors = {
            'CRITICAL': '#d32f2f',
            'HIGH': '#f57c00',
            'MEDIUM': '#fbc02d',
            'LOW': '#388e3c'
        };
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .score { font-size: 3em; font-weight: bold; color: ${data.summary.overallScore >= 90 ? '#4CAF50' : data.summary.overallScore >= 75 ? '#FF9800' : '#f44336'}; }
        .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background: ${riskColors[data.summary.riskLevel] || '#666'}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 1.8em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
        .recommendations { margin: 20px 0; }
        .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 0 4px 4px 0; }
        .recommendation.high { background: #f8d7da; border-left-color: #dc3545; }
        .recommendation.critical { background: #f5c6cb; border-left-color: #721c24; }
        .vulnerabilities { margin: 20px 0; }
        .vulnerability { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .vulnerability.found { background: #f8d7da; color: #721c24; }
        .vulnerability.safe { background: #d4edda; color: #155724; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Security Audit Report</h1>
            <div class="score">${data.summary.overallScore}/100</div>
            <div class="risk-badge">${data.summary.riskLevel} RISK</div>
            <p>Generated on ${new Date(data.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${data.scores.authentication}/100</div>
                <div class="metric-label">Authentication</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.scores.authorization}/100</div>
                <div class="metric-label">Authorization</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.scores.multiTenant}/100</div>
                <div class="metric-label">Multi-Tenant</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.scores.dataProtection}/100</div>
                <div class="metric-label">Data Protection</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.scores.owaspCompliance}/100</div>
                <div class="metric-label">OWASP Compliance</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Security Recommendations</h2>
            <div class="recommendations">
                ${data.details.recommendations.map(rec => `
                    <div class="recommendation ${rec.priority.toLowerCase()}">
                        <h4>${rec.category} (${rec.priority} Priority)</h4>
                        <p><strong>Recommendation:</strong> ${rec.recommendation}</p>
                        <p><strong>Impact:</strong> ${rec.impact}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>⚠️ OWASP Top 10 Vulnerabilities</h2>
            <div class="vulnerabilities">
                ${Object.entries(data.details.owaspCompliance.vulnerabilities || {}).map(([vuln, details]) => `
                    <div class="vulnerability ${details.found ? 'found' : 'safe'}">
                        <strong>${vuln}:</strong> ${details.found ? 
                            `⚠️ Found in ${details.files.length} files (${details.severity})` : 
                            '✅ Not detected'
                        }
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>🏢 Multi-Tenant Security Analysis</h2>
            <p><strong>Tenant ID Usage:</strong> Found in ${data.details.multiTenantSecurity.tenantIdUsage?.length || 0} files</p>
            <p><strong>Isolation Mechanisms:</strong> ${data.details.multiTenantSecurity.isolationMechanisms?.length || 0} files</p>
            <p><strong>Cross-Tenant Risks:</strong> ${data.details.multiTenantSecurity.crossTenantRisks?.length || 0} potential risks</p>
        </div>
        
        <div class="section">
            <h2>🔒 Data Protection Analysis</h2>
            <p><strong>Sensitive Data Fields:</strong> ${data.details.dataProtection.sensitiveDataFound?.length || 0} files</p>
            <p><strong>PII Fields Detected:</strong> ${data.details.dataProtection.piiDetected?.length || 0} files</p>
            <p><strong>Encryption References:</strong> ${data.details.dataProtection.encryptionUsage?.length || 0} files</p>
            <p><strong>Data Exposure Risks:</strong> ${data.details.dataProtection.dataExposureRisks?.length || 0} risks identified</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Run comprehensive security audit
     */
    async runAudit() {
        console.log('🛡️ COMPREHENSIVE SECURITY AUDIT');
        console.log('='.repeat(60));
        console.log();
        
        const scores = [
            this.auditAuthentication(),
            this.auditAuthorization(), 
            this.auditMultiTenantSecurity(),
            this.auditDataProtection(),
            this.auditOWASPCompliance()
        ];
        
        // Calculate overall security score
        this.results.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        this.generateRecommendations();
        this.generateReport();
        
        console.log('\n📋 Security audit reports saved to:');
        console.log('• generated/security-audit.json');
        console.log('• generated/security-audit.html');
    }
}

// Run security audit
if (require.main === module) {
    const auditor = new SecurityAuditor();
    auditor.runAudit().catch(console.error);
}

module.exports = SecurityAuditor;