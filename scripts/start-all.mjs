#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RUNNING_FILE = path.join(ROOT, '.agent', 'running.json');
const LOGS_DIR = path.join(ROOT, '.agent', 'logs');

fs.mkdirSync(LOGS_DIR, { recursive: true });

function testTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port, timeout: timeoutMs }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => {
      sock.destroy();
      resolve(false);
    });
    sock.on('timeout', () => {
      sock.destroy();
      resolve(false);
    });
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(startPort, maxAttempts = 20) {
  let port = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortFree(port)) {
      return port;
    }
    port++;
  }
  throw new Error(`Could not find an available port starting from ${startPort}`);
}

function killPid(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {}
}

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function pollUrl(url, predicate, timeoutMs = 120000, intervalMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await httpFetch(url);
      if (predicate(res)) {
        return res;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for ${url} after ${timeoutMs / 1000}s`);
}

async function main() {
  console.log('========================================================');
  console.log(' Starting Rajasthan Civic Connect (Spring Boot + MySQL) ');
  console.log('========================================================\n');

  // 1. MySQL requirement check (strictly 3306)
  let mysqlHost = '127.0.0.1';
  let mysqlPort = 3306;

  const appPropsPath = path.join(ROOT, 'backend', 'application-local.properties');
  if (fs.existsSync(appPropsPath)) {
    const lines = fs.readFileSync(appPropsPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('MYSQL_HOST=')) mysqlHost = trimmed.split('=')[1].trim();
      if (trimmed.startsWith('MYSQL_PORT=')) mysqlPort = parseInt(trimmed.split('=')[1].trim(), 10);
    }
  }

  if (mysqlPort !== 3306) {
    throw new Error(`Configuration requires MySQL on port 3306, found MYSQL_PORT=${mysqlPort}`);
  }

  const mysqlAvailable = await testTcp(mysqlHost, mysqlPort);
  if (!mysqlAvailable) {
    throw new Error(`MySQL is not reachable on ${mysqlHost}:${mysqlPort}. Please ensure the MySQL Server service is running on port 3306.`);
  }

  console.log(`[MYSQL] Verified reachable on ${mysqlHost}:${mysqlPort}.`);

  // 2. Clean previous running processes if recorded
  if (fs.existsSync(RUNNING_FILE)) {
    try {
      const running = JSON.parse(fs.readFileSync(RUNNING_FILE, 'utf8'));
      if (running.backend?.pid) {
        killPid(running.backend.pid);
      }
      if (running.frontend?.pid) {
        killPid(running.frontend.pid);
      }
      await new Promise((r) => setTimeout(r, 1000));
    } catch {}
  }

  // 3. Select ports
  const backendPort = await findAvailablePort(8080);
  const frontendPort = await findAvailablePort(5173);

  console.log(`[PORTS] Backend will use port ${backendPort}, Frontend will use port ${frontendPort}`);

  // 4. Verify JAR existence
  const jarPath = path.join(ROOT, 'backend', 'target', 'backend-springboot-0.0.1-SNAPSHOT.jar');
  if (!fs.existsSync(jarPath)) {
    throw new Error(`Backend JAR not found at ${jarPath}. Please run verify-all.mjs first.`);
  }

  // 5. Start Backend
  console.log(`[BACKEND] Starting backend on port ${backendPort}...`);
  const backendLogFd = fs.openSync(path.join(LOGS_DIR, 'backend.log'), 'a');
  const backendArgs = ['-jar', jarPath, `--server.port=${backendPort}`, '--spring.profiles.active=local'];
  if (frontendPort !== 5173) {
    backendArgs.push(`--app.cors.allowed-origins=http://localhost:${frontendPort}`);
  }

  const backendProc = spawn('java', backendArgs, {
    cwd: path.join(ROOT, 'backend'),
    detached: true,
    stdio: ['ignore', backendLogFd, backendLogFd],
    windowsHide: true,
  });
  backendProc.unref();
  console.log(`[BACKEND] Launched backend PID: ${backendProc.pid}`);

  // 6. Start Frontend
  console.log(`[FRONTEND] Starting frontend dev server on port ${frontendPort}...`);
  const frontendLogFd = fs.openSync(path.join(LOGS_DIR, 'frontend.log'), 'a');
  const viteBin = path.join(ROOT, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');
  const frontendProc = spawn(process.execPath, [viteBin, '--port', String(frontendPort), '--strictPort'], {
    cwd: path.join(ROOT, 'frontend'),
    detached: true,
    stdio: ['ignore', frontendLogFd, frontendLogFd],
    windowsHide: true,
  });
  frontendProc.unref();
  console.log(`[FRONTEND] Launched frontend PID: ${frontendProc.pid}`);

  const cleanupOnError = (err) => {
    console.error('[FATAL]', err.message);
    killPid(backendProc.pid);
    killPid(frontendProc.pid);
    process.exit(1);
  };

  try {
    // 7. Poll Backend health
    console.log(`[POLL] Waiting for backend at http://localhost:${backendPort}/api/health...`);
    await pollUrl(`http://localhost:${backendPort}/api/health`, (res) => res.status === 200, 120000, 1000);
    console.log(`[BACKEND] Health endpoint responded 200 OK.`);

    // 8. Poll Frontend
    console.log(`[POLL] Waiting for frontend at http://localhost:${frontendPort}...`);
    await pollUrl(
      `http://localhost:${frontendPort}`,
      (res) => res.status === 200 && (res.body.includes('html') || res.body.includes('root') || res.body.includes('script')),
      120000,
      1000
    );
    console.log(`[FRONTEND] Frontend dev server responded 200 OK.`);

    // 9. Quick live check from origin http://localhost:${frontendPort}
    console.log('[VERIFY] Running quick live check (CORS preflight + officer login)...');
    const preflight = await httpFetch(`http://localhost:${backendPort}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: `http://localhost:${frontendPort}`,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    const allowOrigin = preflight.headers['access-control-allow-origin'];
    if (preflight.status !== 200 && preflight.status !== 204) {
      throw new Error(`Preflight check failed with status ${preflight.status}`);
    }
    if (allowOrigin !== `http://localhost:${frontendPort}` && allowOrigin !== '*') {
      throw new Error(`CORS check failed: Access-Control-Allow-Origin was '${allowOrigin}'`);
    }

    const loginRes = await httpFetch(`http://localhost:${backendPort}/api/auth/login`, {
      method: 'POST',
      headers: {
        Origin: `http://localhost:${frontendPort}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'officer@civic.local', password: 'Officer@123' }),
    });

    if (loginRes.status !== 200) {
      throw new Error(`Live officer login failed with status ${loginRes.status}: ${loginRes.body}`);
    }
    const loginJson = JSON.parse(loginRes.body);
    if (!loginJson.token) {
      throw new Error('Live officer login did not return a token.');
    }
    console.log('[VERIFY] Quick live check passed! CORS and officer login verified.');

    // 10. Record running info
    const runningData = {
      startTime: new Date().toISOString(),
      mysql: {
        host: mysqlHost,
        port: mysqlPort,
      },
      backend: {
        port: backendPort,
        pid: backendProc.pid,
        url: `http://localhost:${backendPort}`,
      },
      frontend: {
        port: frontendPort,
        pid: frontendProc.pid,
        url: `http://localhost:${frontendPort}`,
      },
    };
    fs.writeFileSync(RUNNING_FILE, JSON.stringify(runningData, null, 2), 'utf8');

    // 11. Print URL table
    console.log('\n======================================================================');
    console.log(' Rajasthan Civic Connect (Spring Boot + MySQL) is running');
    console.log('======================================================================');
    console.log(` Website (frontend) : http://localhost:${frontendPort}`);
    console.log(` Backend health     : http://localhost:${backendPort}/api/health`);
    console.log(` Backend API base   : http://localhost:${backendPort}/api`);
    console.log(` MySQL              : ${mysqlHost}:${mysqlPort}, database civic_connect (user civic_app)`);
    console.log('');
    console.log(' Start again later: run-project.bat    Stop: stop-project.bat');
    console.log(' Logs: .agent/logs/backend.log, .agent/logs/frontend.log');
    console.log('======================================================================\n');

    if (process.argv.includes('--foreground') || process.env.CIVIC_KEEP_ALIVE === 'true') {
      console.log('[DAEMON] Dev server session active. Press Ctrl+C or run stop-project.bat to stop.');
      setInterval(() => {}, 60000);
      await new Promise(() => {});
    }
  } catch (err) {
    cleanupOnError(err);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});

