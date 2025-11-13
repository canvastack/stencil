const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

function countValidFiles() {
    const schemaDir = path.join(__dirname, '..');
    const allFiles = [];
    
    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
                allFiles.push(fullPath);
            }
        }
    }
    
    walk(schemaDir);
    
    let validFiles = 0;
    let invalidFiles = 0;
    let totalFields = 0;
    let totalEndpoints = 0;
    
    console.log('🔍 Validating OpenAPI Schema Files...\n');
    
    for (const file of allFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const parsed = yaml.parse(content);
            
            const fileName = path.basename(file);
            console.log(`✅ ${fileName}`);
            validFiles++;
            
            if (file.includes('/schemas/')) {
                Object.values(parsed).forEach(schema => {
                    if (schema && schema.properties) {
                        totalFields += Object.keys(schema.properties).length;
                    }
                });
            }
            
            if (file.includes('/paths/')) {
                Object.values(parsed).forEach(pathMethods => {
                    if (pathMethods && typeof pathMethods === 'object') {
                        totalEndpoints += Object.keys(pathMethods).length;
                    }
                });
            }
            
        } catch (error) {
            const fileName = path.basename(file);
            console.log(`❌ ${fileName} - ${error.message.substring(0, 80)}...`);
            invalidFiles++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Valid files: ${validFiles}`);
    console.log(`❌ Invalid files: ${invalidFiles}`);
    console.log(`📁 Total files: ${allFiles.length}`);
    console.log(`📋 Total fields: ${totalFields}`);
    console.log(`🎯 Total endpoints: ${totalEndpoints}`);
    console.log(`📈 Success rate: ${Math.round((validFiles / allFiles.length) * 100)}%`);
    
    return { validFiles, invalidFiles, totalFiles: allFiles.length, totalFields, totalEndpoints };
}

countValidFiles();