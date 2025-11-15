const yaml = require('js-yaml');
const fs = require('fs');

try {
  console.log('🔍 Testing OpenAPI file parsing...');
  
  const content = fs.readFileSync('openapi.yaml', 'utf8');
  const parsed = yaml.load(content);
  
  console.log('✅ OpenAPI file parsed successfully');
  console.log('📊 Found', Object.keys(parsed.paths || {}).length, 'paths');
  console.log('📋 Found', Object.keys(parsed.components.schemas || {}).length, 'schemas');
  
  // Test specific schema resolution
  if (parsed.components.schemas.SuccessResponse) {
    console.log('✅ SuccessResponse schema found in components');
  } else {
    console.log('❌ SuccessResponse schema NOT found in components');
  }
  
} catch(e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}