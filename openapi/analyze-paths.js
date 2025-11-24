const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const pathsDir = path.join(__dirname, 'paths', 'content-management');
const files = fs.readdirSync(pathsDir).filter(f => f.endsWith('.yaml'));

console.log('=== ACTUAL PATHS IN YAML FILES ===\n');

const allPathsMap = {};

files.forEach(file => {
    try {
        const filePath = path.join(pathsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        if (data && typeof data === 'object') {
            const paths = Object.keys(data).filter(k => k.startsWith('/'));
            console.log(`${file}: ${paths.length} paths`);
            paths.forEach(p => {
                allPathsMap[file] = allPathsMap[file] || [];
                allPathsMap[file].push(p);
            });
        }
    } catch (e) {
        console.error(`Error reading ${file}: ${e.message}`);
    }
});

console.log('\n=== PATHS BY FILE ===\n');
Object.entries(allPathsMap).forEach(([file, paths]) => {
    console.log(`\n${file}:`);
    paths.slice(0, 20).forEach(p => console.log(`  ${p}`));
    if (paths.length > 20) console.log(`  ... (${paths.length} total)`);
});
