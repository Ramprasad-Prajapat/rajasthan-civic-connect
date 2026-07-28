import assert from 'assert';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

console.log('--- STARTING BACKEND AUTHENTICATION & RBAC TESTS ---');

let passed = 0;

// Test 1: Role Middleware Access Granted
{
  const middleware = roleMiddleware(['Citizen', 'Admin']);
  let nextCalled = false;
  const req = { user: { role: 'Citizen' } };
  const res = {};
  const next = () => { nextCalled = true; };

  middleware(req, res, next);
  assert.strictEqual(nextCalled, true, 'Role middleware allows authorized Citizen role');
  passed++;
  console.log('✓ Test 1: Authorized role access allowed');
}

// Test 2: Role Middleware Access Denied (403 Forbidden)
{
  const middleware = roleMiddleware(['Admin']);
  let statusSent = null;
  let jsonSent = null;
  const req = { user: { role: 'Citizen' } };
  const res = {
    status: (code) => {
      statusSent = code;
      return {
        json: (data) => { jsonSent = data; }
      };
    }
  };
  const next = () => {};

  middleware(req, res, next);
  assert.strictEqual(statusSent, 403, 'Role middleware returns 403 for unauthorized role');
  assert.ok(jsonSent.error.includes('Forbidden'), 'Response contains Forbidden message');
  passed++;
  console.log('✓ Test 2: Unauthorized role correctly blocked with 403 Forbidden');
}

// Test 3: Missing User Session (401 Unauthorized)
{
  const middleware = roleMiddleware(['Citizen']);
  let statusSent = null;
  const req = {};
  const res = {
    status: (code) => {
      statusSent = code;
      return { json: () => {} };
    }
  };
  middleware(req, res, () => {});
  assert.strictEqual(statusSent, 401, 'Unauthenticated request returns 401');
  passed++;
  console.log('✓ Test 3: Unauthenticated user session returns 401 Unauthorized');
}

console.log(`\n✅ ALL ${passed} BACKEND AUTHENTICATION & RBAC TESTS PASSED!`);
