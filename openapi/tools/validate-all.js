const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

function validateYamlFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.parse(content);
        console.log(`✅ ${path.relative(__dirname, filePath)} is valid YAML`);
        
        if (parsed && typeof parsed === 'object') {
            const keys = Object.keys(parsed);
            console.log(`   📊 Found ${keys.length} top-level definitions`);
            
            // Count total fields in schema files
            if (filePath.includes('schemas/')) {
                let totalFields = 0;
                Object.values(parsed).forEach(schema => {
                    if (schema && schema.properties) {
                        totalFields += Object.keys(schema.properties).length;
                    }
                });
                if (totalFields > 0) {
                    console.log(`   📋 Total fields: ${totalFields}`);
                }
            }
            
            // Count endpoints in path files
            if (filePath.includes('paths/')) {
                let totalEndpoints = 0;
                Object.values(parsed).forEach(pathMethods => {
                    if (pathMethods && typeof pathMethods === 'object') {
                        totalEndpoints += Object.keys(pathMethods).length;
                    }
                });
                if (totalEndpoints > 0) {
                    console.log(`   🎯 Total endpoints: ${totalEndpoints}`);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error(`❌ ${path.relative(__dirname, filePath)} validation failed:`, error.message);
        return false;
    }
}

function scanDirectory(dir, pattern = '*.yaml') {
    const files = [];
    
    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
                files.push(fullPath);
            }
        }
    }
    
    walk(dir);
    return files;
}

// Main validation process
console.log('🔍 Comprehensive OpenAPI Schema Validation\n');
console.log('='.repeat(60));

const schemaDir = path.join(__dirname, '..');
const allFiles = scanDirectory(schemaDir);

console.log(`\n📁 Found ${allFiles.length} YAML files to validate:\n`);

let allValid = true;
let totalSchemas = 0;
let totalPaths = 0;
let totalFields = 0;
let totalEndpoints = 0;

const moduleStats = {};

for (const file of allFiles) {
    const relativePath = path.relative(__dirname, file);
    const isSchema = file.includes('/schemas/');
    const isPaths = file.includes('/paths/');
    
    if (isSchema) totalSchemas++;
    if (isPaths) totalPaths++;
    
    // Extract module name
    const moduleName = path.basename(file, '.yaml');
    if (!moduleStats[moduleName]) {
        moduleStats[moduleName] = { schemas: 0, paths: 0, fields: 0, endpoints: 0 };
    }
    
    const valid = validateYamlFile(file);
    allValid = allValid && valid;
    
    // Count detailed stats
    try {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = yaml.parse(content);
        
        if (isSchema && parsed) {
            Object.values(parsed).forEach(schema => {
                if (schema && schema.properties) {
                    const fieldCount = Object.keys(schema.properties).length;
                    totalFields += fieldCount;
                    moduleStats[moduleName].fields += fieldCount;
                }
            });
            moduleStats[moduleName].schemas++;
        }
        
        if (isPaths && parsed) {
            Object.values(parsed).forEach(pathMethods => {
                if (pathMethods && typeof pathMethods === 'object') {
                    const endpointCount = Object.keys(pathMethods).length;
                    totalEndpoints += endpointCount;
                    moduleStats[moduleName].endpoints += endpointCount;
                }
            });
            moduleStats[moduleName].paths++;
        }
    } catch (e) {
        // Skip counting if parsing fails
    }
    
    console.log(); // Add spacing between files
}

// Summary Report
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY REPORT');
console.log('='.repeat(60));

if (allValid) {
    console.log('✅ ALL FILES PASSED VALIDATION!');
} else {
    console.log('❌ SOME FILES FAILED VALIDATION!');
}

console.log(`\n📈 OVERALL STATISTICS:`);
console.log(`• Total YAML files: ${allFiles.length}`);
console.log(`• Schema files: ${totalSchemas}`);
console.log(`• Path files: ${totalPaths}`);
console.log(`• Total fields: ${totalFields}`);
console.log(`• Total endpoints: ${totalEndpoints}`);

console.log(`\n🏗️ MODULE BREAKDOWN:`);
Object.entries(moduleStats).forEach(([module, stats]) => {
    if (stats.schemas > 0 || stats.paths > 0) {
        console.log(`• ${module.padEnd(15)}: ${stats.fields.toString().padStart(3)} fields, ${stats.endpoints.toString().padStart(3)} endpoints`);
    }
});

console.log('\n' + '='.repeat(60));

if (allValid) {
    console.log('🎉 COMPREHENSIVE VALIDATION COMPLETED SUCCESSFULLY!');
    process.exit(0);
} else {
    console.log('💥 VALIDATION FAILED - CHECK ERRORS ABOVE!');
    process.exit(1);
}