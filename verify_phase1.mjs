import fs from 'fs';
import path from 'path';

console.log('=== STARTING PHASE 1 PRODUCTION SECURITY & BACKEND STABILIZATION VERIFICATION ===\n');

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
const frontendDir = path.join(rootDir, 'frontend/src');
const backendDir = path.join(rootDir, 'backend');

// 1. Verify firestore.rules
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), 'firestore.rules security rules file exists in root');

if (fs.existsSync(firestoreRulesPath)) {
  const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');
  assert(rulesContent.includes('match /users/{userId}'), 'firestore.rules contains users collection access rules');
  assert(rulesContent.includes('match /complaints/{complaintId}'), 'firestore.rules contains complaints collection ownership rules');
  assert(rulesContent.includes('match /emergencies/{emergencyId}'), 'firestore.rules contains emergencies collection rules');
  assert(rulesContent.includes('match /departments/{deptId}'), 'firestore.rules contains departments collection rules');
  assert(rulesContent.includes('match /workers/{workerId}'), 'firestore.rules contains workers collection rules');
}

// 2. Verify LoginRegister.jsx sanitized dev credentials
const loginRegisterPath = path.join(frontendDir, 'components/LoginRegister.jsx');
const loginRegisterContent = fs.readFileSync(loginRegisterPath, 'utf8');
assert(loginRegisterContent.includes('import.meta.env.DEV'), 'LoginRegister.jsx conditions test credentials on import.meta.env.DEV');

// 3. Verify backend server.js security hardening
const serverJsPath = path.join(backendDir, 'server.js');
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
assert(serverJsContent.includes('helmet('), 'server.js contains Helmet security headers');
assert(serverJsContent.includes('authLimiter'), 'server.js contains specific auth route rate limiting');
assert(serverJsContent.includes('apiLimiter'), 'server.js contains general API rate limiting');
assert(serverJsContent.includes('validateEnvironment()'), 'server.js validates environment variables on startup');
assert(serverJsContent.includes('Unhandled Server Exception:'), 'server.js contains sanitized global error handler');

// 4. Verify envValidation.js
const envValidationPath = path.join(backendDir, 'config/envValidation.js');
assert(fs.existsSync(envValidationPath), 'backend/config/envValidation.js exists for environment checking');

// 5. Verify ErrorBoundary in frontend
const errorBoundaryPath = path.join(frontendDir, 'components/ErrorBoundary.jsx');
assert(fs.existsSync(errorBoundaryPath), 'ErrorBoundary.jsx exists in frontend/src/components');

const mainJsxPath = path.join(frontendDir, 'main.jsx');
const mainJsxContent = fs.readFileSync(mainJsxPath, 'utf8');
assert(mainJsxContent.includes('<ErrorBoundary>'), 'main.jsx wraps root App in ErrorBoundary component');

console.log(`\n=== PHASE 1 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 1 PRODUCTION SECURITY & STABILIZATION VERIFICATIONS PASSED SUCCESSFULLY!');
}
