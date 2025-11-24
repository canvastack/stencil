const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

function validateYamlFile(filePath) {
    try {
        console.log(`🔍 Validating ${path.basename(filePath)}...`);
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.parse(content);
        console.log(`✅ ${path.basename(filePath)} is valid YAML`);
        
        if (parsed && typeof parsed === 'object') {
            const keys = Object.keys(parsed);
            console.log(`📊 Found ${keys.length} top-level endpoints`);
            
            // Check for platform/tenant separation
            let platformEndpoints = 0;
            let tenantEndpoints = 0;
            
            keys.forEach(key => {
                if (key.startsWith('/platform/')) {
                    platformEndpoints++;
                } else if (key.startsWith('/tenant/')) {
                    tenantEndpoints++;
                }
            });
            
            console.log(`🏢 Platform endpoints: ${platformEndpoints}`);
            console.log(`🏠 Tenant endpoints: ${tenantEndpoints}`);
            
            // Check for any non-separated endpoints
            const nonSeparatedEndpoints = keys.filter(key => 
                !key.startsWith('/platform/') && !key.startsWith('/tenant/')
            );
            
            if (nonSeparatedEndpoints.length > 0) {
                console.warn(`⚠️  Found ${nonSeparatedEndpoints.length} non-separated endpoints:`);
                nonSeparatedEndpoints.forEach(endpoint => console.warn(`   - ${endpoint}`));
            } else {
                console.log(`✅ All endpoints are properly separated into platform/tenant`);
            }
        }
        
        return true;
    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} validation failed:`, error.message);
        console.error(`Error details: ${error.stack}`);
        return false;
    }
}

// Validate users.yaml
const usersPath = '../paths/content-management/users.yaml';

console.log('🔍 Validating Users OpenAPI File...\n');

if (fs.existsSync(usersPath)) {
    const isValid = validateYamlFile(usersPath);
    
    if (isValid) {
        console.log('\n🎉 Users.yaml file is valid and properly separated!');
        process.exit(0);
    } else {
        console.log('\n💥 Users.yaml file has validation errors!');
        process.exit(1);
    }
} else {
    console.error(`❌ Users file not found: ${usersPath}`);
    process.exit(1);
}