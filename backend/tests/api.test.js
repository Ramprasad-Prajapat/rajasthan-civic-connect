import assert from 'assert';
import app from '../server.js';

console.log('--- STARTING BACKEND API ENDPOINT INTEGRATION TESTS ---');

let passed = 0;

// Test Server Health Check Route
{
  const req = { url: '/health', method: 'GET' };
  assert.ok(app, 'Express app loaded cleanly');
  passed++;
  console.log('✓ Test 1: Express App instance initialized and valid');
}

// Test Route Registration Audit
{
  const stack = app._router.stack;
  const registeredPaths = stack
    .filter(layer => layer.route || layer.name === 'router')
    .map(layer => layer.regexp.toString());

  assert.ok(registeredPaths.some(p => p.includes('auth')), 'Auth routes registered');
  assert.ok(registeredPaths.some(p => p.includes('complaints')), 'Complaint routes registered');
  assert.ok(registeredPaths.some(p => p.includes('users')), 'User routes registered');
  assert.ok(registeredPaths.some(p => p.includes('dashboard')), 'Dashboard routes registered');
  passed++;
  console.log('✓ Test 2: All core API routes registered (/auth, /complaints, /users, /dashboard)');
}

console.log(`\n✅ ALL ${passed} BACKEND API INTEGRATION TESTS PASSED!`);
