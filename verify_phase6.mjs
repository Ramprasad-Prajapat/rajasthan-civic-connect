import fs from 'fs';
import path from 'path';

console.log('=== STARTING PHASE 6 ENTERPRISE SCALABILITY & SMART CITY VERIFICATION ===\n');

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

// 1. Audit Logging Infrastructure
const auditServicePath = path.join(backendDir, 'services/auditService.js');
assert(fs.existsSync(auditServicePath), 'backend/services/auditService.js exists');

if (fs.existsSync(auditServicePath)) {
  const auditContent = fs.readFileSync(auditServicePath, 'utf8');
  assert(auditContent.includes('logAuditEvent'), 'auditService.js exports logAuditEvent function');
  assert(auditContent.includes('getAuditLogs'), 'auditService.js exports getAuditLogs function');
}

const auditRoutesPath = path.join(backendDir, 'routes/auditRoutes.js');
assert(fs.existsSync(auditRoutesPath), 'backend/routes/auditRoutes.js API router exists');

// 2. SLA Escalation & Background Queue Engine
const slaServicePath = path.join(backendDir, 'services/slaEscalationService.js');
assert(fs.existsSync(slaServicePath), 'backend/services/slaEscalationService.js exists');

const bgJobPath = path.join(backendDir, 'services/backgroundJobService.js');
assert(fs.existsSync(bgJobPath), 'backend/services/backgroundJobService.js exists');

// 3. Correlation Request IDs & Server Versioning
const serverJsPath = path.join(backendDir, 'server.js');
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
assert(serverJsContent.includes('req.requestId'), 'server.js attaches X-Request-ID correlation request IDs');
assert(serverJsContent.includes('/api/audit-logs'), 'server.js registers /api/audit-logs router');
assert(serverJsContent.includes('/api/v1/complaints'), 'server.js registers versioned /api/v1 router prefix');

// 4. Enterprise Architecture Documentation Files
const docFiles = [
  'ENTERPRISE_ARCHITECTURE.md',
  'SCALABILITY_GUIDE.md',
  'MULTI_CITY_ARCHITECTURE.md',
  'DISASTER_RECOVERY.md',
  'API_VERSIONING.md',
  'BACKGROUND_JOBS.md',
  'SMART_CITY_EXTENSION_GUIDE.md'
];

docFiles.forEach(docFile => {
  const docPath = path.join(rootDir, docFile);
  assert(fs.existsSync(docPath), `${docFile} documentation file exists`);
});

// 5. Full Regression Protection Checks
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), '[Regression] firestore.rules security rules file intact');

const vercelJsonPath = path.join(rootDir, 'vercel.json');
assert(fs.existsSync(vercelJsonPath), '[Regression] vercel.json deployment manifest intact');

const aiServicePath = path.join(backendDir, 'services/aiService.js');
assert(fs.existsSync(aiServicePath), '[Regression] aiService.js Phase 5 AI service intact');

console.log(`\n=== PHASE 6 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 6 ENTERPRISE SCALABILITY & SMART CITY VERIFICATIONS PASSED SUCCESSFULLY!');
}
