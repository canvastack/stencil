#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🚀 Starting production build optimization...'));

// Build the application
console.log(chalk.yellow('📦 Building application...'));
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log(chalk.green('✅ Build completed successfully'));
} catch (error) {
  console.error(chalk.red('❌ Build failed:'), error.message);
  process.exit(1);
}

// Analyze bundle size
console.log(chalk.yellow('📊 Analyzing bundle sizes...'));
const distDir = path.resolve(__dirname, '../dist');
const assetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error(chalk.red('❌ Assets directory not found'));
  process.exit(1);
}

// Get file sizes
const files = fs.readdirSync(assetsDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile())
  .map(dirent => {
    const filePath = path.join(assetsDir, dirent.name);
    const stats = fs.statSync(filePath);
    return {
      name: dirent.name,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100
    };
  })
  .sort((a, b) => b.size - a.size);

// Categorize files
const jsFiles = files.filter(f => f.name.endsWith('.js'));
const cssFiles = files.filter(f => f.name.endsWith('.css'));
const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|svg|ico)$/.test(f.name));
const fontFiles = files.filter(f => /\.(woff|woff2|eot|ttf|otf)$/.test(f.name));

// Calculate totals
const totalSize = files.reduce((sum, file) => sum + file.size, 0);
const jsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
const cssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
const imageSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
const fontSize = fontFiles.reduce((sum, file) => sum + file.size, 0);

// Display results
console.log('\n' + chalk.cyan('📈 Bundle Analysis:'));
console.log(chalk.green(`Total size: ${Math.round(totalSize / 1024)} KB (${Math.round(totalSize / (1024 * 1024) * 100) / 100} MB)`));
console.log(chalk.blue(`JavaScript: ${Math.round(jsSize / 1024)} KB (${Math.round(jsSize / totalSize * 100)}%)`));
console.log(chalk.magenta(`CSS: ${Math.round(cssSize / 1024)} KB (${Math.round(cssSize / totalSize * 100)}%)`));
console.log(chalk.yellow(`Images: ${Math.round(imageSize / 1024)} KB (${Math.round(imageSize / totalSize * 100)}%)`));
console.log(chalk.cyan(`Fonts: ${Math.round(fontSize / 1024)} KB (${Math.round(fontSize / totalSize * 100)}%)`));

// Show largest files
console.log('\n' + chalk.cyan('📋 Largest files:'));
files.slice(0, 10).forEach(file => {
  const sizeStr = file.sizeMB > 1 ? `${file.sizeMB} MB` : `${file.sizeKB} KB`;
  console.log(`  ${file.name}: ${sizeStr}`);
});

// Check for optimization warnings
const warnings = [];

// Check for large JS chunks
const largeJsFiles = jsFiles.filter(f => f.size > 500 * 1024); // 500KB
if (largeJsFiles.length > 0) {
  warnings.push(`Large JS files detected: ${largeJsFiles.map(f => f.name).join(', ')}`);
}

// Check for unoptimized images
const largeImageFiles = imageFiles.filter(f => f.size > 200 * 1024); // 200KB
if (largeImageFiles.length > 0) {
  warnings.push(`Large image files detected: ${largeImageFiles.map(f => f.name).join(', ')}`);
}

// Check total bundle size
if (totalSize > 5 * 1024 * 1024) { // 5MB
  warnings.push(`Total bundle size is large: ${Math.round(totalSize / (1024 * 1024) * 100) / 100} MB`);
}

if (warnings.length > 0) {
  console.log('\n' + chalk.yellow('⚠️  Optimization warnings:'));
  warnings.forEach(warning => console.log(`  • ${warning}`));
} else {
  console.log('\n' + chalk.green('✅ No optimization warnings detected'));
}

// Generate build report
const buildReport = {
  timestamp: new Date().toISOString(),
  totalSize: Math.round(totalSize / 1024),
  breakdown: {
    javascript: Math.round(jsSize / 1024),
    css: Math.round(cssSize / 1024),
    images: Math.round(imageSize / 1024),
    fonts: Math.round(fontSize / 1024)
  },
  files: files.slice(0, 20).map(f => ({
    name: f.name,
    sizeKB: f.sizeKB
  })),
  warnings: warnings
};

fs.writeFileSync(
  path.join(distDir, 'build-report.json'),
  JSON.stringify(buildReport, null, 2)
);

console.log(chalk.green('\n✅ Build optimization completed!'));
console.log(chalk.blue(`📄 Build report saved to: ${path.join(distDir, 'build-report.json')}`));