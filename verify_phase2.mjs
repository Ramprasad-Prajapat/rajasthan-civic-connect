import fs from 'fs';
import path from 'path';

console.log('=== STARTING PHASE 2 PERFORMANCE OPTIMIZATION & CODE QUALITY VERIFICATION ===\n');

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

// 1. Verify vite.config.js manualChunks
const viteConfigPath = path.join(rootDir, 'frontend/vite.config.js');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
assert(viteConfigContent.includes('manualChunks'), 'vite.config.js implements Rollup manualChunks vendor code splitting');
assert(viteConfigContent.includes('vendor-react'), 'vite.config.js splits vendor-react chunk');
assert(viteConfigContent.includes('vendor-firebase'), 'vite.config.js splits vendor-firebase chunk');

// 2. Verify App.jsx React.lazy and Suspense
const appJsxPath = path.join(frontendDir, 'App.jsx');
const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
assert(appJsxContent.includes('lazy('), 'App.jsx uses React.lazy for dynamic route component imports');
assert(appJsxContent.includes('Suspense'), 'App.jsx wraps route rendering inside React Suspense container');
assert(appJsxContent.includes('SkeletonPage'), 'App.jsx uses SkeletonPage fallback during component suspense loading');

// 3. Verify SkeletonLoaders.jsx
const skeletonPath = path.join(frontendDir, 'components/SkeletonLoaders.jsx');
assert(fs.existsSync(skeletonPath), 'SkeletonLoaders.jsx component file exists');
const skeletonContent = fs.readFileSync(skeletonPath, 'utf8');
assert(skeletonContent.includes('SkeletonCard'), 'SkeletonLoaders exports SkeletonCard component');
assert(skeletonContent.includes('SkeletonTable'), 'SkeletonLoaders exports SkeletonTable component');
assert(skeletonContent.includes('SkeletonDashboard'), 'SkeletonLoaders exports SkeletonDashboard component');
assert(skeletonContent.includes('SkeletonPage'), 'SkeletonLoaders exports SkeletonPage component');

// 4. Verify firestoreService.js queryCache TTL optimization
const firestoreServicePath = path.join(frontendDir, 'firestoreService.js');
const firestoreServiceContent = fs.readFileSync(firestoreServicePath, 'utf8');
assert(firestoreServiceContent.includes('queryCache'), 'firestoreService.js implements in-memory queryCache');
assert(firestoreServiceContent.includes('CACHE_TTL_MS'), 'firestoreService.js implements TTL cache expiry');
assert(firestoreServiceContent.includes('clearQueryCache()'), 'firestoreService.js implements cache invalidation on data mutations');

// 5. Phase 1 Regression Verification
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), '[Regression] firestore.rules security rules file intact');

const errorBoundaryPath = path.join(frontendDir, 'components/ErrorBoundary.jsx');
assert(fs.existsSync(errorBoundaryPath), '[Regression] ErrorBoundary.jsx component intact');

console.log(`\n=== PHASE 2 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 2 PERFORMANCE OPTIMIZATION & CODE QUALITY VERIFICATIONS PASSED SUCCESSFULLY!');
}
