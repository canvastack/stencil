#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const args = process.argv.slice(2);

const showUsage = () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         Canvas Stencil - Development Server CLI        ║
╚════════════════════════════════════════════════════════╝

Usage:
  canvastencil start servers [options]

Options:
  --frontend               Run only frontend server
  --backend                Run only backend server
  --dev                    Enable development mode (strict checks, debug tools)
  (no flags)               Run both servers (default)

Examples:
  canvastencil start servers              # Run both
  canvastencil start servers --frontend   # Frontend only
  canvastencil start servers --backend    # Backend only
  canvastencil start servers --dev        # Both with dev mode enabled
  canvastencil start servers --frontend --dev   # Frontend with dev mode

Environment:
  Frontend: http://localhost:5173
  Backend:  http://localhost:8000
  Dev Mode: NODE_ENV=development + strict React checks
`);
};

const runServers = async (options = {}) => {
  const { frontend = true, backend = true, dev = false } = options;

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║              Starting Development Servers               ║');
  if (dev) console.log('║              (Development Mode Enabled)                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const processes = [];

  if (frontend) {
    console.log('  Starting Frontend (Vite)...');
    console.log('  URL: http://localhost:5173\n');
    const env = { ...process.env, NODE_ENV: dev ? 'development' : 'development' };
    if (dev) env.VITE_DEV_MODE = 'true';
    const frontendProcess = spawn('npm', ['run', 'dev:frontend'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env,
    });
    processes.push(frontendProcess);
  }

  if (backend) {
    console.log('  Starting Backend (Laravel)...');
    console.log('  URL: http://localhost:8000\n');
    const env = { ...process.env, NODE_ENV: dev ? 'development' : 'development' };
    if (dev) env.APP_DEBUG = 'true';
    const backendProcess = spawn('npm', ['run', 'dev:backend'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env,
    });
    processes.push(backendProcess);
  }

  if (!frontend && !backend) {
    console.error('❌ Error: Please specify at least one server (--frontend or --backend)');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Servers running. Press Ctrl+C to stop.\n');

  process.on('SIGINT', () => {
    console.log('\n\n  Shutting down servers...');
    processes.forEach((p) => p.kill());
    process.exit(0);
  });
};

const main = async () => {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
    return;
  }

  const command = args[0];
  const subcommand = args[1];

  if (command === 'start' && subcommand === 'servers') {
    const options = {
      frontend: !args.includes('--backend'),
      backend: !args.includes('--frontend'),
      dev: args.includes('--dev'),
    };

    if (!args.includes('--backend') && !args.includes('--frontend')) {
      options.frontend = true;
      options.backend = true;
    } else {
      options.frontend = args.includes('--frontend');
      options.backend = args.includes('--backend');
    }

    await runServers(options);
  } else if (command === 'start' && subcommand === 'servers' === false) {
    showUsage();
  } else {
    console.error(`❌ Unknown command: ${command} ${subcommand}\n`);
    showUsage();
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
