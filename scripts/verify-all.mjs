import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backendDir = path.join(projectRoot, 'backend');
const frontendDir = path.join(projectRoot, 'frontend');
const agentDir = path.join(projectRoot, '.agent');
const surefireDir = path.join(backendDir, 'target', 'surefire-reports');

if (!fs.existsSync(agentDir)) {
  fs.mkdirSync(agentDir, { recursive: true });
}

function resolveMaven() {
  const isWindows = process.platform === 'win32';
  const mvnName = isWindows ? 'mvn.cmd' : 'mvn';

  const toolsDir = path.join(projectRoot, '.tools');
  if (fs.existsSync(toolsDir)) {
    const entries = fs.readdirSync(toolsDir);
    for (const entry of entries) {
      if (entry.startsWith('apache-maven')) {
        const candidate = path.join(toolsDir, entry, 'bin', mvnName);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  if (isWindows) {
    const intellijMvn = 'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2025.2.5\\plugins\\maven\\lib\\maven3\\bin\\mvn.cmd';
    if (fs.existsSync(intellijMvn)) return intellijMvn;
  }

  return mvnName;
}

function checkPortOpen(port, host = '127.0.0.1', timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function stopProcess(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-child.pid, 'SIGKILL');
    }
  } catch (e) {
    try {
      child.kill('SIGKILL');
    } catch (ignore) {}
  }
}

async function pollHealth(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function parseSurefireResults() {
  let totalRun = 0;
  let totalFailures = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  let classesCount = 0;

  if (fs.existsSync(surefireDir)) {
    const files = fs.readdirSync(surefireDir);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        classesCount++;
        const content = fs.readFileSync(path.join(surefireDir, file), 'utf8');
        const match = content.match(/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/);
        if (match) {
          totalRun += parseInt(match[1], 10);
          totalFailures += parseInt(match[2], 10);
          totalErrors += parseInt(match[3], 10);
          totalSkipped += parseInt(match[4], 10);
        }
      }
    }
  }
  return { totalRun, totalFailures, totalErrors, totalSkipped, classesCount };
}

async function main() {
  const overallStart = Date.now();
  console.log('================================================================');
  console.log('       RAJASTHAN CIVIC CONNECT — COMPLETE VERIFY ALL SUITE      ');
  console.log('================================================================\n');

  const mvnBin = resolveMaven();
  console.log(`[+] Maven resolved: ${mvnBin}`);

  // Require MySQL on port 3306
  const mysqlPort = 3306;
  if (!(await checkPortOpen(3306))) {
    console.error('[-] Fatal: MySQL is not accessible on required port 3306.');
    process.exit(1);
  }
  console.log(`[+] Target MySQL port verified: ${mysqlPort}`);

  const stages = [
    { id: 'T1/T2', name: 'Backend Unit & MySQL Integration Tests', status: 'PENDING', counts: '0', duration: '0s' },
    { id: 'PKG',   name: 'Backend JAR Packaging',                 status: 'PENDING', counts: '1 JAR', duration: '0s' },
    { id: 'T3-T5', name: 'Live Smoke Test, CORS & Contract Sweep',status: 'PENDING', counts: '0 checks', duration: '0s' },
    { id: 'REST',  name: 'Backend Restart Persistence',           status: 'PENDING', counts: '0 checks', duration: '0s' },
    { id: 'T6',    name: 'Frontend Production Build (Vite)',      status: 'PENDING', counts: '0 assets', duration: '0s' }
  ];

  // -------------------------------------------------------------
  // STAGE 1: Run All Tests (Unit + Integration)
  // -------------------------------------------------------------
  console.log('\n[*] Stage 1: Running All Backend Tests (Unit + Integration against civic_connect_test)...');
  const t1Start = Date.now();
  const testRun = spawnSync('cmd.exe', ['/c', mvnBin, 'test'], {
    cwd: backendDir,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  const t1Duration = ((Date.now() - t1Start) / 1000).toFixed(1) + 's';
  stages[0].duration = t1Duration;

  const surefire = parseSurefireResults();
  stages[0].counts = `${surefire.totalRun} tests across ${surefire.classesCount} classes`;

  if (testRun.status === 0 && surefire.totalRun > 0 && surefire.totalFailures === 0 && surefire.totalErrors === 0) {
    stages[0].status = 'PASS';
    console.log(`[+] Stage 1 PASS: ${stages[0].counts} in ${t1Duration}`);
  } else {
    stages[0].status = 'FAIL';
    console.error(`[-] Stage 1 FAIL: ${surefire.totalFailures} failures, ${surefire.totalErrors} errors`);
  }

  // -------------------------------------------------------------
  // STAGE 2: Package Fat JAR
  // -------------------------------------------------------------
  console.log('\n[*] Stage 2: Packaging Backend Executable JAR...');
  const t2Start = Date.now();
  const pkgRun = spawnSync('cmd.exe', ['/c', mvnBin, '-q', '-DskipTests', 'package'], {
    cwd: backendDir,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  const t2Duration = ((Date.now() - t2Start) / 1000).toFixed(1) + 's';
  stages[1].duration = t2Duration;

  const targetDir = path.join(backendDir, 'target');
  const jarFile = fs.readdirSync(targetDir).find((f) => f.endsWith('.jar') && !f.endsWith('-sources.jar'));

  if (pkgRun.status === 0 && jarFile) {
    stages[1].status = 'PASS';
    const jarSize = (fs.statSync(path.join(targetDir, jarFile)).size / (1024 * 1024)).toFixed(1);
    stages[1].counts = `${jarFile} (${jarSize} MB)`;
    console.log(`[+] Stage 2 PASS: JAR packaged in ${t2Duration}`);
  } else {
    stages[1].status = 'FAIL';
    console.error('[-] Stage 2 FAIL: Packaging failed');
  }

  // -------------------------------------------------------------
  // STAGE 3: Verification Server on 18080 + Smoke Test + CORS + Contract Sweep
  // -------------------------------------------------------------
  console.log('\n[*] Stage 3: Starting Verification Backend on port 18080 against civic_connect_test...');
  const t3Start = Date.now();
  const jarPath = path.join(targetDir, jarFile);
  const logFile = path.join(agentDir, 'verification-backend.log');
  const logStream = fs.openSync(logFile, 'w');

  const backendProc = spawn(
    'java',
    [
      '-jar',
      jarPath,
      '--server.port=18080',
      `--spring.datasource.url=jdbc:mysql://127.0.0.1:${mysqlPort}/civic_connect_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`,
      '--spring.datasource.username=civic_app',
      '--spring.datasource.password=CA254mxYNFjspWQpC25asj7Z',
      '--spring.jpa.hibernate.ddl-auto=update',
      '--app.seed-demo-users=true'
    ],
    {
      cwd: backendDir,
      stdio: ['ignore', logStream, logStream]
    }
  );

  console.log(`[*] Verification server spawned (PID: ${backendProc.pid}). Polling health endpoint...`);
  const isHealthy = await pollHealth('http://127.0.0.1:18080/api/health', 90000);

  if (isHealthy) {
    console.log('[+] Verification server is healthy. Executing scripts/smoke-test.mjs...');
    const smokeRun = spawnSync('node', [path.join(projectRoot, 'scripts', 'smoke-test.mjs'), 'http://127.0.0.1:18080/api'], {
      stdio: 'inherit'
    });
    await stopProcess(backendProc);
    const t3Duration = ((Date.now() - t3Start) / 1000).toFixed(1) + 's';
    stages[2].duration = t3Duration;

    if (smokeRun.status === 0) {
      stages[2].status = 'PASS';
      stages[2].counts = '14 steps (Smoke + T4 CORS + T5 Contract Sweep)';
      console.log(`[+] Stage 3 PASS in ${t3Duration}`);
    } else {
      stages[2].status = 'FAIL';
      console.error('[-] Stage 3 FAIL: Smoke test reported errors');
    }
  } else {
    await stopProcess(backendProc);
    stages[2].status = 'FAIL';
    stages[2].duration = ((Date.now() - t3Start) / 1000).toFixed(1) + 's';
    console.error('[-] Stage 3 FAIL: Verification server failed to respond on port 18080');
    if (fs.existsSync(logFile)) {
      const lines = fs.readFileSync(logFile, 'utf8').split('\n');
      console.error('Last 30 lines of verification-backend.log:\n' + lines.slice(-30).join('\n'));
    }
  }

  // -------------------------------------------------------------
  // STAGE 4: Backend Restart Persistence (Complaint w/ photo, Dept, Draft)
  // -------------------------------------------------------------
  console.log('\n[*] Stage 4: Testing Backend Restart Persistence (Complaint w/ photo, Dept, Draft)...');
  const tRestStart = Date.now();
  const restLogFile = path.join(agentDir, 'restart-persistence.log');
  const restLogStream = fs.openSync(restLogFile, 'w');

  let restSuccess = false;
  let restDetails = '';

  try {
    // 1. Start initial instance
    const procA = spawn(
      'java',
      [
        '-jar',
        jarPath,
        '--server.port=18080',
        '--spring.datasource.url=jdbc:mysql://127.0.0.1:3306/civic_connect_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC',
        '--spring.datasource.username=civic_app',
        '--spring.datasource.password=CA254mxYNFjspWQpC25asj7Z',
        '--spring.jpa.hibernate.ddl-auto=update',
        '--app.seed-demo-users=true'
      ],
      { cwd: backendDir, stdio: ['ignore', restLogStream, restLogStream] }
    );

    const upA = await pollHealth('http://127.0.0.1:18080/api/health', 60000);
    if (!upA) throw new Error('Verification backend failed to start before restart test');

    // Citizen login
    const citLoginRes = await fetch('http://127.0.0.1:18080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@civic.local', password: 'Citizen@123', portal: 'citizen' })
    });
    const citToken = (await citLoginRes.json()).token;

    // Admin login
    const admLoginRes = await fetch('http://127.0.0.1:18080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@civic.local', password: 'Admin@123', portal: 'admin' })
    });
    const admToken = (await admLoginRes.json()).token;

    // A. Create complaint with photo
    const photoData = 'data:image/jpeg;base64,' + Buffer.from('photo-proof-restart-test').toString('base64');
    const compCreateRes = await fetch('http://127.0.0.1:18080/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citToken}` },
      body: JSON.stringify({
        title: 'Restart Persistence Test Complaint',
        description: 'Testing photo and complaint persistence across restarts',
        category: 'Roads & Infrastructure',
        subCategory: 'Potholes',
        district: 'Jaipur',
        priority: 'HIGH',
        photo: photoData
      })
    });
    const compCreated = await compCreateRes.json();
    const targetCompId = compCreated.complaintId || compCreated.id;

    // B. Save draft
    const draftPayload = {
      title: 'Persistent Draft In Progress',
      description: 'Draft notes testing DB persistence',
      category: 'Sanitation'
    };
    await fetch('http://127.0.0.1:18080/api/complaints/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citToken}` },
      body: JSON.stringify(draftPayload)
    });

    // C. Create department
    const deptName = 'Restart Dept ' + Date.now();
    await fetch('http://127.0.0.1:18080/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${admToken}` },
      body: JSON.stringify({
        name: deptName,
        code: 'RST',
        description: 'Restart test department',
        contact: '0141-999999'
      })
    });

    // 2. Stop instance A
    await stopProcess(procA);
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Start instance B (restarted backend, without seeding so data must come from MySQL)
    const procB = spawn(
      'java',
      [
        '-jar',
        jarPath,
        '--server.port=18080',
        '--spring.datasource.url=jdbc:mysql://127.0.0.1:3306/civic_connect_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC',
        '--spring.datasource.username=civic_app',
        '--spring.datasource.password=CA254mxYNFjspWQpC25asj7Z',
        '--spring.jpa.hibernate.ddl-auto=update',
        '--app.seed-demo-users=false'
      ],
      { cwd: backendDir, stdio: ['ignore', restLogStream, restLogStream] }
    );

    const upB = await pollHealth('http://127.0.0.1:18080/api/health', 60000);
    if (!upB) throw new Error('Verification backend failed to restart');

    // Re-login after restart
    const citReLogin = await (await fetch('http://127.0.0.1:18080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@civic.local', password: 'Citizen@123', portal: 'citizen' })
    })).json();
    const admReLogin = await (await fetch('http://127.0.0.1:18080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@civic.local', password: 'Admin@123', portal: 'admin' })
    })).json();

    // Verify Readback
    // A. Read complaint + photo
    const compReadRes = await fetch(`http://127.0.0.1:18080/api/complaints/${targetCompId}`, {
      headers: { 'Authorization': `Bearer ${citReLogin.token}` }
    });
    const compRead = await compReadRes.json();
    if (!compRead || compRead.title !== 'Restart Persistence Test Complaint') {
      throw new Error(`Complaint readback failed: ${JSON.stringify(compRead)}`);
    }
    const hasPhoto = compRead.photo === photoData || (compRead.beforePhotos && compRead.beforePhotos.includes(photoData));
    if (!hasPhoto) {
      throw new Error('Complaint photo was not persisted or read back properly');
    }

    // B. Read draft
    const draftReadRes = await fetch('http://127.0.0.1:18080/api/complaints/draft', {
      headers: { 'Authorization': `Bearer ${citReLogin.token}` }
    });
    const draftRead = await draftReadRes.json();
    if (!draftRead || !draftRead.draft || draftRead.draft.title !== 'Persistent Draft In Progress') {
      throw new Error(`Draft readback failed: ${JSON.stringify(draftRead)}`);
    }

    // C. Read department
    const deptReadRes = await fetch('http://127.0.0.1:18080/api/departments', {
      headers: { 'Authorization': `Bearer ${admReLogin.token}` }
    });
    const deptList = await deptReadRes.json();
    const foundDept = Array.isArray(deptList) && deptList.find((d) => d.name === deptName);
    if (!foundDept) {
      throw new Error(`Department ${deptName} not found after restart`);
    }

    await stopProcess(procB);
    restSuccess = true;
    restDetails = 'Complaint with photo, Department & Draft persisted';
  } catch (err) {
    console.error('[-] Restart persistence check error:', err.message);
    restDetails = err.message;
  }

  const tRestDuration = ((Date.now() - tRestStart) / 1000).toFixed(1) + 's';
  stages[3].duration = tRestDuration;
  if (restSuccess) {
    stages[3].status = 'PASS';
    stages[3].counts = restDetails;
    console.log(`[+] Stage 4 PASS in ${tRestDuration}: ${restDetails}`);
  } else {
    stages[3].status = 'FAIL';
    stages[3].counts = restDetails;
    console.error(`[-] Stage 4 FAIL: ${restDetails}`);
  }

  // -------------------------------------------------------------
  // STAGE 5: Frontend Production Build
  // -------------------------------------------------------------
  console.log('\n[*] Stage 5: Building Frontend Production Bundle...');
  const t4Start = Date.now();
  const buildRun = spawnSync('npm', ['run', 'build'], {
    cwd: frontendDir,
    shell: true,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  const t4Duration = ((Date.now() - t4Start) / 1000).toFixed(1) + 's';
  stages[4].duration = t4Duration;

  const distDir = path.join(frontendDir, 'dist');
  if (buildRun.status === 0 && fs.existsSync(distDir)) {
    stages[4].status = 'PASS';
    const assetCount = fs.readdirSync(path.join(distDir, 'assets')).length;
    stages[4].counts = `${assetCount} built assets`;
    console.log(`[+] Stage 5 PASS in ${t4Duration}`);
  } else {
    stages[4].status = 'FAIL';
    console.error('[-] Stage 5 FAIL: Frontend build failed');
  }

  // -------------------------------------------------------------
  // FINAL TABLE & EXIT CODE AUDIT
  // -------------------------------------------------------------
  const totalDuration = ((Date.now() - overallStart) / 1000).toFixed(1) + 's';
  console.log('\n========================================================================================');
  console.log('                                 FINAL VERIFICATION TABLE                               ');
  console.log('========================================================================================');
  console.log(' Stage   | Status | Counts                                       | Duration');
  console.log('---------|--------|----------------------------------------------|---------');
  for (const s of stages) {
    const idPad = s.id.padEnd(8);
    const statusPad = s.status.padEnd(6);
    const countsPad = s.counts.padEnd(44);
    console.log(` ${idPad}| ${statusPad} | ${countsPad} | ${s.duration}`);
  }
  console.log('========================================================================================');
  console.log(` Total Execution Time: ${totalDuration}\n`);

  const allPassed = stages.every((s) => s.status === 'PASS');
  if (allPassed) {
    console.log('[+] ALL STAGES VERIFIED AND PASSED WITH EXIT CODE 0.\n');
    process.exit(0);
  } else {
    console.error('[-] VERIFICATION FAILED: One or more stages failed.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[-] Fatal error during verify-all:', err);
  process.exit(1);
});

