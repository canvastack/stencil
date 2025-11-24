const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openAPIPath = path.join(__dirname, 'openapi.yaml');
const componentsPath = path.join(__dirname, 'components');

console.log('Validating OpenAPI specification...\n');

try {
  const content = fs.readFileSync(openAPIPath, 'utf8');
  const spec = yaml.load(content);
  
  if (!spec) {
    console.error('ERROR: Failed to parse openapi.yaml');
    process.exit(1);
  }
  
  const refPattern = /\$ref:\s*['"]([^'"]+)['"]/g;
  const refs = new Set();
  let match;
  
  while ((match = refPattern.exec(content)) !== null) {
    refs.add(match[1]);
  }
  
  console.log(`Found ${refs.size} unique $ref references:\n`);
  
  let brokenCount = 0;
  const validRefs = [];
  
  refs.forEach(ref => {
    if (ref.startsWith('#')) {
      validRefs.push(ref);
    } else if (ref.startsWith('./')) {
      const refPath = ref.split('#')[0];
      const fullPath = path.join(__dirname, refPath);
      
      if (fs.existsSync(fullPath)) {
        validRefs.push(ref);
      } else {
        console.log(`❌ BROKEN: ${ref}`);
        brokenCount++;
      }
    }
  });
  
  console.log(`\n✅ Valid references: ${validRefs.length}`);
  console.log(`❌ Broken references: ${brokenCount}\n`);
  
  if (brokenCount === 0) {
    console.log('✨ All references are valid!');
  } else {
    process.exit(1);
  }
} catch (error) {
  console.error('ERROR:', error.message);
  process.exit(1);
}
