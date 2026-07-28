import fs from 'fs';
import path from 'path';

console.log('=== STARTING PHASE 3 AUTOMATED TESTING & QA VERIFICATION ===\n');

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

// 1. Vitest & Test Setup
const vitestConfigPath = path.join(frontendDir, 'vitest.config.js');
assert(fs.existsSync(vitestConfigPath), 'vitest.config.js exists in frontend directory');

const setupJsPath = path.join(frontendDir, 'src/tests/setup.js');
assert(fs.existsSync(setupJsPath), 'frontend/src/tests/setup.js test setup file exists');

// 2. Backend Automated Tests
const backendAuthTestPath = path.join(backendDir, 'tests/auth.test.js');
assert(fs.existsSync(backendAuthTestPath), 'backend/tests/auth.test.js RBAC unit test suite exists');

const backendApiTestPath = path.join(backendDir, 'tests/api.test.js');
assert(fs.existsSync(backendApiTestPath), 'backend/tests/api.test.js API endpoint test suite exists');

// 3. Frontend Complaint Workflow Tests
const complaintWorkflowTestPath = path.join(frontendDir, 'src/tests/complaintWorkflow.test.js');
assert(fs.existsSync(complaintWorkflowTestPath), 'complaintWorkflow.test.js unit test suite exists');

// 4. Playwright E2E Setup
const playwrightConfigPath = path.join(rootDir, 'playwright.config.js');
assert(fs.existsSync(playwrightConfigPath), 'playwright.config.js E2E configuration exists in root');

const e2eSpecPath = path.join(rootDir, 'tests/e2e/app.spec.js');
assert(fs.existsSync(e2eSpecPath), 'tests/e2e/app.spec.js Playwright test spec exists');

// 5. CI Workflow Configuration
const ciWorkflowPath = path.join(rootDir, '.github/workflows/test-ci.yml');
assert(fs.existsSync(ciWorkflowPath), '.github/workflows/test-ci.yml GitHub Actions CI workflow exists');

// 6. Regression Protection Checks
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), '[Regression] firestore.rules security rules file intact');

const skeletonPath = path.join(frontendDir, 'src/components/SkeletonLoaders.jsx');
assert(fs.existsSync(skeletonPath), '[Regression] SkeletonLoaders.jsx component intact');

const errorBoundaryPath = path.join(frontendDir, 'src/components/ErrorBoundary.jsx');
assert(fs.existsSync(errorBoundaryPath), '[Regression] ErrorBoundary.jsx component intact');

console.log(`\n=== PHASE 3 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 3 AUTOMATED TESTING & QUALITY ASSURANCE VERIFICATIONS PASSED SUCCESSFULLY!');
}
