import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const viteCommand = process.platform === 'win32' ? 'vite.cmd' : 'vite';

const server = spawn(process.execPath, ['--watch', join('backend', 'src', 'server.js')], {
  cwd: projectDirectory,
  stdio: 'inherit',
});
const vite = spawn(viteCommand, [], {
  cwd: projectDirectory,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const close = () => {
  server.kill();
  vite.kill();
  process.exit();
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
server.on('exit', (code) => { if (code && code !== 0) close(); });
vite.on('exit', (code) => { if (code && code !== 0) close(); });
