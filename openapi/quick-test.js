const fs = require('fs');

try {
  // Read the main OpenAPI file
  const content = fs.readFileSync('openapi.yaml', 'utf8');
  
  console.log('Checking for SuccessResponse references...\n');
  
  // Find all $ref lines
  const lines = content.split('\n');
  const refLines = lines.filter((line, index) => {
    return line.includes('$ref') && line.includes('SuccessResponse');
  });
  
  console.log('Found SuccessResponse references:');
  refLines.forEach((line, index) => {
    console.log(`${index + 1}. ${line.trim()}`);
  });
  
  // Check for problematic patterns
  const badPatterns = [
    '../../components/schemas/SuccessResponse',
    '../components/schemas/SuccessResponse'
  ];
  
  let hasErrors = false;
  badPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      console.log(`❌ Found bad reference pattern: ${pattern}`);
      hasErrors = true;
    }
  });
  
  if (!hasErrors) {
    console.log('\n✅ No bad reference patterns found!');
    console.log('✅ SuccessResponse references appear to be correct.');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}