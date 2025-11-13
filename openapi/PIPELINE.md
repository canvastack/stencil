# OpenAPI CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for the Stencil CMS OpenAPI specifications. The pipeline includes validation, testing, security auditing, and automated documentation generation.

## Pipeline Stages

### 1. 🔍 Validation Stage
- **YAML Syntax Validation**: Validates all YAML files for proper syntax
- **OpenAPI Specification Validation**: Ensures compliance with OpenAPI 3.1+ standards
- **Schema Reference Validation**: Verifies all `$ref` references are valid
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
- **File**: `.github/workflows/openapi-ci-cd.yml`
- **Features**: 
  - Parallel job execution
  - Artifact publishing
  - GitHub Pages deployment
  - Quality gate enforcement

### GitLab CI
- **File**: `.gitlab-ci.yml`
- **Features**:
  - Multi-stage pipeline
  - Artifact caching
  - GitLab Pages integration
  - Conditional deployments

### Azure DevOps
- **File**: `azure-pipelines.yml`
- **Features**:
  - Multi-stage YAML pipeline
  - Test result publishing
  - Artifact management
  - Branch policies

### Jenkins
- **File**: `Jenkinsfile`
- **Features**:
  - Declarative pipeline
  - Parallel execution
  - HTML report publishing
  - Post-build notifications

### Docker
- **Files**: `Dockerfile.openapi`, `docker-compose.yml`
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
```bash
# Install dependencies
npm install

# Install pre-commit hooks
npm run install:hooks

# Run full pipeline locally
npm run pipeline:local
```

### Available Scripts
- `npm run validate` - Run YAML validation
- `npm run test:performance` - Run performance tests
- `npm run audit:security` - Run security audit
- `npm run generate:docs` - Generate documentation
- `npm run serve:docs` - Serve documentation locally
- `npm run clean` - Clean generated files

## Docker Deployment

### Build and Run
```bash
# Build Docker image
npm run docker:build

# Run with docker-compose
npm run docker:run

# View logs
npm run docker:logs
```

### Access Points
- API Documentation: http://localhost:8080
- Pipeline Logs: `docker logs stencil-openapi-pipeline`

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
   - Verify `$ref` references
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
```bash
# Validate specific file
node tools/validate-all.js

# Check security issues
node security-audit.cjs

# Test performance
node performance-test.cjs

# Generate verbose output
DEBUG=1 npm run pipeline:local
```

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
Last updated: 2025-11-13T16:37:52.233Z