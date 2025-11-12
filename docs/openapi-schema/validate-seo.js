import yaml from 'js-yaml';
import fs from 'fs';

try {
  // Validasi SEO schemas
  console.log('✅ Validating SEO schemas...');
  const seoSchemas = yaml.load(fs.readFileSync('schemas/content-management/seo.yaml', 'utf8'));
  console.log('✅ SEO schemas parsed successfully');
  console.log('✅ Found schemas:', Object.keys(seoSchemas).length, 'schema definitions');
  
  // Validasi SEO paths
  console.log('✅ Validating SEO paths...');
  const seoPaths = yaml.load(fs.readFileSync('paths/content-management/seo.yaml', 'utf8'));
  console.log('✅ SEO paths parsed successfully'); 
  console.log('✅ Found paths:', Object.keys(seoPaths.paths).length, 'API endpoints');
  
  console.log('\n🎉 SEO Module validation successful!');
  console.log('\n📊 Summary:');
  console.log('- Schema definitions:', Object.keys(seoSchemas).length);
  console.log('- API endpoints:', Object.keys(seoPaths.paths).length);
  console.log('- File sizes: schemas ~' + (fs.statSync('schemas/content-management/seo.yaml').size / 1024).toFixed(1) + 'KB, paths ~' + (fs.statSync('paths/content-management/seo.yaml').size / 1024).toFixed(1) + 'KB');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}