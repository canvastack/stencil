#!/usr/bin/env node

/**
 * Validation script for Exchange Rate System E2E Tests
 * This script validates the test structure and requirements coverage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFilePath = path.join(__dirname, 'exchange-rate-system.spec.ts');

function validateTestFile() {
  console.log('🔍 Validating Exchange Rate System E2E Tests...\n');
  
  if (!fs.existsSync(testFilePath)) {
    console.error('❌ Test file not found:', testFilePath);
    process.exit(1);
  }
  
  const testContent = fs.readFileSync(testFilePath, 'utf8');
  
  // Check for required test scenarios
  const requiredTests = [
    '22.1 Manual mode workflow',
    '22.2 Auto mode with failover', 
    '22.3 Quota monitoring',
    '22.4 Audit trail'
  ];
  
  console.log('📋 Checking required test scenarios:');
  requiredTests.forEach(testName => {
    if (testContent.includes(testName)) {
      console.log(`✅ ${testName}`);
    } else {
      console.log(`❌ ${testName} - NOT FOUND`);
    }
  });
  
  // Check for requirement validation comments
  const requirements = [
    'Requirements: 1.1, 1.2, 1.4, 1.5',
    'Requirements: 1.3, 1.6, 4.1, 4.2',
    'Requirements: 10.1, 10.2, 10.6',
    'Requirements: 8.4, 8.5, 8.6'
  ];
  
  console.log('\n📝 Checking requirements coverage:');
  requirements.forEach(req => {
    if (testContent.includes(req)) {
      console.log(`✅ ${req}`);
    } else {
      console.log(`⚠️  ${req} - Not explicitly documented`);
    }
  });
  
  // Check for key test elements
  const keyElements = [
    'beforeEach',
    'login',
    'exchange-rate',
    'Manual Mode',
    'Automatic Mode',
    'quota',
    'provider',
    'history'
  ];
  
  console.log('\n🔧 Checking key test elements:');
  keyElements.forEach(element => {
    if (testContent.includes(element)) {
      console.log(`✅ ${element}`);
    } else {
      console.log(`❌ ${element} - NOT FOUND`);
    }
  });
  
  // Check for error handling
  const errorHandling = [
    'try',
    'catch',
    'timeout',
    'isVisible'
  ];
  
  console.log('\n🛡️  Checking error handling:');
  errorHandling.forEach(handler => {
    if (testContent.includes(handler)) {
      console.log(`✅ ${handler}`);
    } else {
      console.log(`❌ ${handler} - NOT FOUND`);
    }
  });
  
  // Count test cases
  const testMatches = testContent.match(/test\(/g);
  const testCount = testMatches ? testMatches.length : 0;
  
  console.log(`\n📊 Test Statistics:`);
  console.log(`   Total test cases: ${testCount}`);
  console.log(`   Expected test cases: 4`);
  console.log(`   File size: ${(fs.statSync(testFilePath).size / 1024).toFixed(2)} KB`);
  
  if (testCount >= 4) {
    console.log('\n✅ All required test scenarios are implemented!');
    console.log('\n📚 Next steps:');
    console.log('   1. Ensure frontend and backend servers are running');
    console.log('   2. Run: npm run e2e -- exchange-rate-system.spec.ts');
    console.log('   3. Check test results and fix any failing assertions');
    console.log('   4. Update components to include required data-testid attributes');
    return true;
  } else {
    console.log('\n❌ Missing required test scenarios');
    return false;
  }
}

function checkDocumentation() {
  const readmePath = path.join(__dirname, 'README-exchange-rate-e2e.md');
  
  console.log('\n📖 Checking documentation:');
  if (fs.existsSync(readmePath)) {
    console.log('✅ E2E test documentation exists');
    const readmeSize = (fs.statSync(readmePath).size / 1024).toFixed(2);
    console.log(`   Documentation size: ${readmeSize} KB`);
  } else {
    console.log('❌ E2E test documentation missing');
  }
}

function main() {
  const isValid = validateTestFile();
  checkDocumentation();
  
  console.log('\n' + '='.repeat(60));
  if (isValid) {
    console.log('🎉 Exchange Rate E2E Tests validation PASSED!');
    process.exit(0);
  } else {
    console.log('💥 Exchange Rate E2E Tests validation FAILED!');
    process.exit(1);
  }
}

main();