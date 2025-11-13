const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

function validateYamlFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.parse(content);
        console.log(`✅ ${path.basename(filePath)} is valid YAML`);
        
        if (parsed && typeof parsed === 'object') {
            const keys = Object.keys(parsed);
            console.log(`📊 Found ${keys.length} top-level schemas: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} validation failed:`, error.message);
        return false;
    }
}

// Validate documentation schemas
const schemaPath = '../schemas/content-management/documentation.yaml';
const pathsPath = '../paths/content-management/documentation.yaml';

console.log('🔍 Validating Documentation OpenAPI Schema Files...\n');

let allValid = true;

if (fs.existsSync(schemaPath)) {
    allValid = validateYamlFile(schemaPath) && allValid;
} else {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    allValid = false;
}

if (fs.existsSync(pathsPath)) {
    allValid = validateYamlFile(pathsPath) && allValid;
} else {
    console.error(`❌ Paths file not found: ${pathsPath}`);
    allValid = false;
}

if (allValid) {
    console.log('\n🎉 All DOCUMENTATION module files are valid!');
    process.exit(0);
} else {
    console.log('\n💥 Some files have validation errors!');
    process.exit(1);
}