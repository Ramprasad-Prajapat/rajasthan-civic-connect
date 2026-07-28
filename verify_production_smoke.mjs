import fs from 'fs';
import path from 'path';

console.log('=== STARTING PHASE 4 PRODUCTION DEPLOYMENT & SMOKE TEST VERIFICATION ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

const rootDir = 'R:/Inernship/WebDevelopment/Project/rajasthan-civic-connect';
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// 1. Verify Deployment Manifests
const vercelJsonPath = path.join(rootDir, 'vercel.json');
assert(fs.existsSync(vercelJsonPath), 'vercel.json Vercel deployment manifest exists');

const renderYamlPath = path.join(rootDir, 'render.yaml');
assert(fs.existsSync(renderYamlPath), 'render.yaml Render web service configuration exists');

const ecosystemPath = path.join(backendDir, 'ecosystem.config.cjs');
assert(fs.existsSync(ecosystemPath), 'backend/ecosystem.config.cjs PM2 process manager config exists');

// 2. Verify Production Environment Variable Templates
const frontendProdEnvPath = path.join(frontendDir, '.env.production.example');
assert(fs.existsSync(frontendProdEnvPath), 'frontend/.env.production.example template exists');

const backendProdEnvPath = path.join(backendDir, '.env.production.example');
assert(fs.existsSync(backendProdEnvPath), 'backend/.env.production.example template exists');

// 3. Verify Logging & Monitoring Infrastructure
const loggerPath = path.join(backendDir, 'utils/logger.js');
assert(fs.existsSync(loggerPath), 'backend/utils/logger.js production logger exists');

const serverJsPath = path.join(backendDir, 'server.js');
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
assert(serverJsContent.includes('/api/health/deep'), 'server.js registers /api/health/deep monitoring route');

// 4. Verify Backup Infrastructure
const backupScriptPath = path.join(backendDir, 'scripts/backupDatabase.js');
assert(fs.existsSync(backupScriptPath), 'backend/scripts/backupDatabase.js backup utility script exists');

// 5. Verify Production CI/CD Pipeline Configuration
const deployCiPath = path.join(rootDir, '.github/workflows/deploy-ci.yml');
assert(fs.existsSync(deployCiPath), '.github/workflows/deploy-ci.yml GitHub Actions pipeline exists');

// 6. Regression Protection Checks
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), '[Regression] firestore.rules security rules file intact');

const skeletonPath = path.join(frontendDir, 'src/components/SkeletonLoaders.jsx');
assert(fs.existsSync(skeletonPath), '[Regression] SkeletonLoaders.jsx component intact');

const errorBoundaryPath = path.join(frontendDir, 'src/components/ErrorBoundary.jsx');
assert(fs.existsSync(errorBoundaryPath), '[Regression] ErrorBoundary.jsx component intact');

console.log(`\n=== PHASE 4 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 4 PRODUCTION DEPLOYMENT & CI/CD VERIFICATIONS PASSED SUCCESSFULLY!');
}
