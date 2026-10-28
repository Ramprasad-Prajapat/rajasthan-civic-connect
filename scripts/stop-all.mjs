#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RUNNING_FILE = path.join(ROOT, '.agent', 'running.json');

function killPid(pid, name) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
    console.log(`[STOP] Stopped ${name} (PID: ${pid})`);
  } catch {
    console.log(`[STOP] Process ${name} (PID: ${pid}) was already stopped or not found`);
  }
}

if (!fs.existsSync(RUNNING_FILE)) {
  console.log('[STOP] No .agent/running.json found. No recorded processes to stop.');
  process.exit(0);
}

try {
  const content = fs.readFileSync(RUNNING_FILE, 'utf8');
  const data = JSON.parse(content);

  if (data.backend?.pid) {
    killPid(data.backend.pid, 'Backend');
  }
  if (data.frontend?.pid) {
    killPid(data.frontend.pid, 'Frontend');
  }

  fs.unlinkSync(RUNNING_FILE);
  console.log('[STOP] Successfully stopped recorded processes.');
} catch (err) {
  console.error('[STOP] Error stopping processes:', err.message);
  process.exit(1);
}
