const fs = require('fs');
const yaml = require('js-yaml');

console.log('🔍 Checking OpenAPI file for reference errors...\n');

try {
  const openApiContent = fs.readFileSync('openapi.yaml', 'utf8');
  const doc = yaml.load(openApiContent);
  
  console.log('✅ OpenAPI YAML is syntactically valid');
  console.log('✅ File can be parsed without errors');
  
  // Check for SuccessResponse references specifically
  const content = openApiContent.toString();
  const badRefs = content.match(/\$ref:\s*['"][^'"]*components\/schemas\/SuccessResponse['"]/g);
  
  if (badRefs) {
    console.log('❌ Found problematic SuccessResponse references:');
    badRefs.forEach(ref => console.log('   ', ref));
  } else {
    console.log('✅ No problematic SuccessResponse path references found');
  }
  
  // Check if SuccessResponse is properly defined in components
  if (doc.components && doc.components.schemas && doc.components.schemas.SuccessResponse) {
    console.log('✅ SuccessResponse is properly defined in components.schemas');
  } else {
    console.log('❌ SuccessResponse not found in components.schemas');
  }
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}