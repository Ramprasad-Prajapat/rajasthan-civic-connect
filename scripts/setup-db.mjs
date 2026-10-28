import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const localPropsPath = path.join(projectRoot, 'backend', 'application-local.properties');
const tmpDir = path.join(projectRoot, '.agent', 'tmp');

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
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

function findMysqlBinary() {
  const candidates = [
    'mysql',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
    '/usr/local/mysql/bin/mysql',
    '/opt/homebrew/bin/mysql',
    '/usr/bin/mysql'
  ];
  for (const bin of candidates) {
    try {
      const res = spawnSync(bin, ['--version'], { encoding: 'utf8', stdio: 'pipe' });
      if (res.status === 0 || (res.stdout && res.stdout.includes('Distrib'))) {
        return bin;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

async function main() {
  const mysqlBin = findMysqlBinary();
  if (!mysqlBin) {
    console.error('[-] mysql client binary not found.');
    process.exit(1);
  }

  if (!fs.existsSync(localPropsPath)) {
    console.error('[-] backend/application-local.properties not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(localPropsPath, 'utf8');
  const hostMatch = content.match(/MYSQL_HOST=(.+)/);
  const portMatch = content.match(/MYSQL_PORT=(.+)/);
  const userMatch = content.match(/spring\.datasource\.username=(.+)/);
  const pwdMatch = content.match(/spring\.datasource\.password=(.+)/);

  const targetHost = hostMatch ? hostMatch[1].trim() : '127.0.0.1';
  const targetPort = portMatch ? parseInt(portMatch[1].trim(), 10) : 3306;
  const dbUser = userMatch ? userMatch[1].trim() : 'civic_app';
  const dbPassword = pwdMatch ? pwdMatch[1].trim() : '';

  if (targetPort !== 3306) {
    console.error(`[-] Configuration error: expected MYSQL_PORT=3306, found ${targetPort}`);
    process.exit(1);
  }

  console.log(`[*] Verifying MySQL database connectivity on ${targetHost}:${targetPort} as ${dbUser}...`);

  const isUp = await checkPort(targetPort, targetHost);
  if (!isUp) {
    console.error(`[-] MySQL is not listening on ${targetHost}:${targetPort}. Please ensure MySQL Server is running.`);
    process.exit(1);
  }

  fs.mkdirSync(tmpDir, { recursive: true });
  const optFile = path.join(tmpDir, `verify_db_${Date.now()}.cnf`);
  fs.writeFileSync(optFile, `[client]\nuser=${dbUser}\npassword=${dbPassword}\nhost=${targetHost}\nport=${targetPort}\n`, { mode: 0o600 });

  try {
    const testConn1 = spawnSync(mysqlBin, [`--defaults-extra-file=${optFile}`, '-D', 'civic_connect', '-e', 'SELECT 1;'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const testConn2 = spawnSync(mysqlBin, [`--defaults-extra-file=${optFile}`, '-D', 'civic_connect_test', '-e', 'SELECT 1;'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (testConn1.status === 0 && testConn2.status === 0) {
      console.log(`[+] Verified: ${dbUser} successfully connected to civic_connect and civic_connect_test on ${targetHost}:${targetPort}.`);
      process.exit(0);
    } else {
      console.error('[-] Database verification failed:');
      if (testConn1.status !== 0) console.error(`    civic_connect error: ${testConn1.stderr.trim()}`);
      if (testConn2.status !== 0) console.error(`    civic_connect_test error: ${testConn2.stderr.trim()}`);
      process.exit(1);
    }
  } finally {
    if (fs.existsSync(optFile)) {
      fs.unlinkSync(optFile);
    }
  }
}

main().catch(err => {
  console.error('[-] Fatal error during setup-db verification:', err.message);
  process.exit(1);
});
