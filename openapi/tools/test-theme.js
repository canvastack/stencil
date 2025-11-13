const yaml = require('yaml');
const fs = require('fs');

try {
    const content = fs.readFileSync('../paths/content-management/theme.yaml', 'utf8');
    const parsed = yaml.parse(content);
    console.log('✅ theme.yaml is valid YAML');
    console.log(`📊 Found ${Object.keys(parsed).length} top-level definitions`);
} catch (error) {
    console.error('❌ Error:', error.message);
    if (error.linePos) {
        console.error('Line position:', error.linePos);
    }
    console.error('Error details:', error);
}