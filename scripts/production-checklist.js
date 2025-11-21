#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🚀 Production Deployment Checklist'));
console.log(chalk.gray('=====================================\n'));

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      const requiredEnvVars = [
        'VITE_API_BASE_URL',
        'VITE_SENTRY_DSN',
        'VITE_GA_ID'
      ];
      
      const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      return {
        passed: missing.length === 0,
        message: missing.length === 0 
          ? 'All required environment variables are set'
          : `Missing environment variables: ${missing.join(', ')}`,
        critical: true
      };
    }
  },
  
  {
    name: 'Build Files',
    check: () => {
      const distDir = path.resolve(__dirname, '../dist');
      const indexExists = fs.existsSync(path.join(distDir, 'index.html'));
      const assetsExists = fs.existsSync(path.join(distDir, 'assets'));
      
      return {
        passed: indexExists && assetsExists,
        message: indexExists && assetsExists 
          ? 'Build files are present'
          : 'Build files are missing - run npm run build',
        critical: true
      };
    }
  },
  
  {
    name: 'Bundle Size Analysis',
    check: () => {
      const reportPath = path.resolve(__dirname, '../dist/build-report.json');
      
      if (!fs.existsSync(reportPath)) {
        return {
          passed: false,
          message: 'Build report not found - run npm run build:analyze',
          critical: false
        };
      }
      
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const totalSizeMB = report.totalSize / 1024;
      const jsSize = report.breakdown.javascript;
      
      const sizeOk = totalSizeMB < 5; // 5MB limit
      const jsOk = jsSize < 2048; // 2MB JS limit
      
      return {
        passed: sizeOk && jsOk,
        message: `Total: ${totalSizeMB.toFixed(2)}MB, JS: ${jsSize}KB ${sizeOk && jsOk ? '✓' : '⚠️'}`,
        critical: false
      };
    }
  },
  
  {
    name: 'Security Configuration',
    check: () => {
      const viteConfig = path.resolve(__dirname, '../vite.config.ts');
      const dockerFile = path.resolve(__dirname, '../Dockerfile');
      const nginxSecurity = path.resolve(__dirname, '../nginx-security.conf');
      
      const configExists = fs.existsSync(viteConfig);
      const dockerExists = fs.existsSync(dockerFile);
      const securityExists = fs.existsSync(nginxSecurity);
      
      return {
        passed: configExists && dockerExists && securityExists,
        message: configExists && dockerExists && securityExists
          ? 'Security configuration files are present'
          : 'Missing security configuration files',
        critical: true
      };
    }
  },
  
  {
    name: 'PWA Configuration',
    check: () => {
      const manifestExists = fs.existsSync(path.resolve(__dirname, '../public/manifest.json'));
      const swExists = fs.existsSync(path.resolve(__dirname, '../dist/sw.js'));
      
      return {
        passed: manifestExists || swExists, // At least one should exist
        message: manifestExists && swExists 
          ? 'PWA configuration is complete'
          : 'PWA configuration may be incomplete',
        critical: false
      };
    }
  },
  
  {
    name: 'Test Coverage',
    check: () => {
      const testResults = [
        '../src/__tests__/integration',
        '../src/__tests__/e2e'
      ];
      
      const testsExist = testResults.some(testDir => 
        fs.existsSync(path.resolve(__dirname, testDir))
      );
      
      return {
        passed: testsExist,
        message: testsExist 
          ? 'Test suites are configured'
          : 'Test suites may be missing',
        critical: false
      };
    }
  },
  
  {
    name: 'Docker Configuration',
    check: () => {
      const dockerfile = path.resolve(__dirname, '../Dockerfile');
      const nginxConf = path.resolve(__dirname, '../nginx.conf');
      const dockerIgnore = path.resolve(__dirname, '../.dockerignore');
      
      const dockerfileExists = fs.existsSync(dockerfile);
      const nginxExists = fs.existsSync(nginxConf);
      
      return {
        passed: dockerfileExists && nginxExists,
        message: dockerfileExists && nginxExists
          ? 'Docker configuration is complete'
          : 'Docker configuration files are missing',
        critical: true
      };
    }
  },
  
  {
    name: 'CI/CD Configuration',
    check: () => {
      const githubWorkflow = path.resolve(__dirname, '../.github/workflows/deploy.yml');
      const workflowExists = fs.existsSync(githubWorkflow);
      
      return {
        passed: workflowExists,
        message: workflowExists
          ? 'CI/CD workflow is configured'
          : 'CI/CD workflow is missing',
        critical: false
      };
    }
  },
  
  {
    name: 'Performance Budget',
    check: () => {
      const lighthouseConfig = path.resolve(__dirname, '../.lighthouserc.json');
      const configExists = fs.existsSync(lighthouseConfig);
      
      return {
        passed: configExists,
        message: configExists
          ? 'Performance budget is configured'
          : 'Lighthouse configuration is missing',
        critical: false
      };
    }
  },
  
  {
    name: 'Error Tracking',
    check: () => {
      const hasSentryDsn = !!process.env.VITE_SENTRY_DSN;
      const monitoringConfig = path.resolve(__dirname, '../src/config/monitoring.ts');
      const configExists = fs.existsSync(monitoringConfig);
      
      return {
        passed: hasSentryDsn && configExists,
        message: hasSentryDsn && configExists
          ? 'Error tracking is configured'
          : 'Error tracking configuration is incomplete',
        critical: true
      };
    }
  }
];

// Run all checks
let passedChecks = 0;
let criticalFailures = 0;

console.log(chalk.cyan('Running production readiness checks...\n'));

checks.forEach((checkItem, index) => {
  const result = checkItem.check();
  const status = result.passed ? chalk.green('✓') : chalk.red('✗');
  const critical = result.critical ? chalk.red('[CRITICAL]') : '';
  
  console.log(`${status} ${checkItem.name} ${critical}`);
  console.log(`   ${result.message}\n`);
  
  if (result.passed) {
    passedChecks++;
  } else if (result.critical) {
    criticalFailures++;
  }
});

// Summary
console.log(chalk.cyan('Summary:'));
console.log(`${chalk.green(passedChecks)}/${checks.length} checks passed`);

if (criticalFailures > 0) {
  console.log(chalk.red(`\n❌ ${criticalFailures} critical failures detected!`));
  console.log(chalk.yellow('Please fix critical issues before deploying to production.'));
  process.exit(1);
} else if (passedChecks === checks.length) {
  console.log(chalk.green('\n🎉 All checks passed! Ready for production deployment.'));
  process.exit(0);
} else {
  console.log(chalk.yellow('\n⚠️  Some non-critical checks failed.'));
  console.log(chalk.gray('Consider addressing these issues for optimal production setup.'));
  process.exit(0);
}

// Additional recommendations
console.log('\n' + chalk.cyan('Production Deployment Recommendations:'));
console.log(chalk.gray('- Ensure all environment variables are set in your deployment platform'));
console.log(chalk.gray('- Monitor application performance and error rates after deployment'));
console.log(chalk.gray('- Set up automated backups for critical data'));
console.log(chalk.gray('- Configure monitoring alerts for downtime and errors'));
console.log(chalk.gray('- Test the deployment in a staging environment first'));
console.log(chalk.gray('- Have a rollback plan ready in case of issues'));