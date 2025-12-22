const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// This script makes a local copy of `dist` into `dist_local` and
// replaces occurrences of the '/stencil/' base with '/' so you can
// serve the built site from the root locally without affecting the
// real `dist` folder used for production.

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const target = path.join(root, 'dist_local');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// remove existing target
if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
}

copyRecursive(dist, target);

// Replace /stencil/ occurrences in HTML/CSS/JS in the copied folder (basic approach)
function replaceBase(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      replaceBase(full);
    } else if (/\.(html|css|js)$/.test(f)) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('/stencil/')) {
        content = content.split('/stencil/').join('/');
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}

replaceBase(target);

// Start a static server using `serve` if available, otherwise tell the user how to serve
const serveCmd = process.platform === 'win32' ? 'serve.cmd' : 'serve';

try {
  const ps = spawn(serveCmd, ['-s', 'dist_local', '-l', '3000'], { stdio: 'inherit' });
  ps.on('close', (code) => process.exit(code));
} catch (err) {
  console.error('Failed to start `serve`. If you don\'t have it installed, run: npm install -g serve');
  process.exit(1);
}
