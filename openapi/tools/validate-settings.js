const yaml = require('js-yaml');
const fs = require('fs');

console.log('🔍 Validating SETTINGS module OpenAPI files...\n');

try {
  // Validate settings schema
  console.log('Validating settings.yaml schema...');
  const settingsSchema = yaml.load(fs.readFileSync('schemas/content-management/settings.yaml', 'utf8'));
  console.log('✅ Settings schema YAML is valid');
  console.log('   - Entities found: ' + Object.keys(settingsSchema).length);
  
  // Validate settings paths
  console.log('\nValidating settings.yaml paths...');
  const settingsPaths = yaml.load(fs.readFileSync('paths/content-management/settings.yaml', 'utf8'));
  console.log('✅ Settings paths YAML is valid');
  console.log('   - Endpoints found: ' + Object.keys(settingsPaths.paths).length);
  
  console.log('\n🎉 All SETTINGS module files are syntactically valid!\n');
  
  console.log('Settings Schema Entities:');
  Object.keys(settingsSchema).forEach(entity => {
    console.log('  - ' + entity);
  });
  
  console.log('\nSettings API Endpoints:');
  Object.keys(settingsPaths.paths).forEach(endpoint => {
    const methods = Object.keys(settingsPaths.paths[endpoint]);
    console.log('  - ' + endpoint + ' [' + methods.join(', ').toUpperCase() + ']');
  });
  
  console.log('\n📊 SETTINGS Module Summary:');
  console.log('   - Schema Entities: ' + Object.keys(settingsSchema).length);
  console.log('   - API Endpoints: ' + Object.keys(settingsPaths.paths).length);
  console.log('   - HTTP Operations: ' + Object.values(settingsPaths.paths).reduce((total, path) => total + Object.keys(path).length, 0));
  
  console.log('\n✅ VALIDATION COMPLETED SUCCESSFULLY!');
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  if (error.mark) {
    console.error('   Line:', error.mark.line + 1, 'Column:', error.mark.column + 1);
  }
  process.exit(1);
}