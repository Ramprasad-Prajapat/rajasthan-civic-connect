/**
 * Live Smoke Test, CORS Check (T4), and Contract Sweep (T5) for Rajasthan Civic Connect API.
 * Uses native fetch (Node 18+), zero external dependencies.
 */

const baseUrl = process.argv[2] || 'http://localhost:8080/api';
let passedCount = 0;
let failedCount = 0;

function logPass(msg) {
  passedCount++;
  console.log(`[PASS] ${msg}`);
}

function logFail(msg, detail = '') {
  failedCount++;
  console.error(`[FAIL] ${msg} ${detail}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  console.log(`\n=== RAJASTHAN CIVIC CONNECT LIVE SMOKE TEST & CONTRACT SWEEP ===`);
  console.log(`Target: ${baseUrl}\n`);

  let citizenToken = null;
  let citizenId = null;
  let citizenEmail = `smoke_citizen_${Date.now()}@test.local`;
  let officerToken = null;
  let createdComplaintId = null;

  // 1. Health check
  try {
    const res = await fetch(`${baseUrl}/health`);
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.status === 'healthy', 'Expected status: healthy');
    logPass('1. Health check answered 200 with status: healthy');
  } catch (e) {
    logFail('1. Health check', e.message);
  }

  // 2. Register citizen
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Citizen',
        email: citizenEmail,
        password: 'Password@123',
        mobile: '9876543210',
        role: 'Citizen',
        portal: 'citizen'
      })
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.user && data.user.email === citizenEmail, 'User profile returned');
    assert(data.user.role === 'Citizen', 'Role is Citizen');
    assert(data.token, 'Token returned');
    citizenToken = data.token;
    citizenId = data.user.id || data.user.uid;
    logPass('2. Citizen registration returned 201 with JWT token and Citizen role');
  } catch (e) {
    logFail('2. Citizen registration', e.message);
  }

  // 3. Citizen login
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: citizenEmail,
        password: 'Password@123',
        portal: 'citizen'
      })
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.token, 'Token present');
    assert(data.user && (data.user.id || data.user.uid), 'User id present');
    citizenToken = data.token;
    logPass('3. Citizen login returned 200 with token and user object');
  } catch (e) {
    logFail('3. Citizen login', e.message);
  }

  // 4. Create complaint
  try {
    const res = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Smoke Test Pothole',
        description: 'Large pothole on road',
        category: 'road',
        district: 'Jaipur',
        ulbName: 'Nagar Nigam Jaipur',
        priority: 'Normal'
      })
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.id && data.complaintId, 'id and complaintId present');
    assert(data.complaintId.startsWith('RJCIVIC-JAI-NNG-'), `Format matches: ${data.complaintId}`);
    assert(data.departmentName === 'Public Works Department', `Department mapped: ${data.departmentName}`);
    assert(data.slaHours === 48, `SLA calculated: ${data.slaHours}h`);
    assert(data.timeline && data.timeline.length === 1, 'Initial timeline event logged');
    createdComplaintId = data.complaintId;
    logPass(`4. Create complaint lodged ticket ${createdComplaintId} with SLA and timeline`);
  } catch (e) {
    logFail('4. Create complaint', e.message);
  }

  // 5. List complaints (citizen view)
  try {
    const res = await fetch(`${baseUrl}/complaints`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data), 'Returns an array');
    assert(data.some(c => c.complaintId === createdComplaintId), 'Created complaint listed');
    logPass('5. List complaints returned citizen own tickets');
  } catch (e) {
    logFail('5. List complaints', e.message);
  }

  // 6. Complaint detail
  try {
    const res = await fetch(`${baseUrl}/complaints/${createdComplaintId}`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.complaintId === createdComplaintId, 'Detail matching ticket code');
    assert(Array.isArray(data.timeline), 'Timeline present');
    logPass('6. Complaint detail returned full ticket with timeline');
  } catch (e) {
    logFail('6. Complaint detail', e.message);
  }

  // 7. Login as seeded officer
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer@civic.local',
        password: 'Officer@123',
        portal: 'department'
      })
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.token, 'Token present');
    officerToken = data.token;
    logPass('7. Logged in as demo officer (officer@civic.local)');
  } catch (e) {
    logFail('7. Seeded officer login', e.message);
  }

  // 8. Officer status update
  try {
    const res = await fetch(`${baseUrl}/complaints/${createdComplaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        status: 'InProgress',
        remarks: 'Field executive dispatched to site'
      })
    });
    assert(res.ok, `HTTP ${res.status}`);
    logPass('8. Officer updated complaint status to InProgress');
  } catch (e) {
    logFail('8. Status update by officer', e.message);
  }

  // 9. Verify detail reflects new timeline row
  try {
    const res = await fetch(`${baseUrl}/complaints/${createdComplaintId}`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.status === 'InProgress', 'Status is InProgress');
    assert(data.timeline && data.timeline.length >= 2, `Timeline rows: ${data.timeline?.length}`);
    logPass('9. Complaint detail verified second timeline audit row');
  } catch (e) {
    logFail('9. Detail timeline verification', e.message);
  }

  // 10. Spot check: Citizen status update -> 403
  try {
    const res = await fetch(`${baseUrl}/complaints/${createdComplaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        status: 'Resolved',
        remarks: 'Citizen self resolving'
      })
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
    logPass('10. Spot-check: Citizen forbidden from updating status (403)');
  } catch (e) {
    logFail('10. Spot-check citizen status 403', e.message);
  }

  // 11. Spot check: No token -> 401
  try {
    const res = await fetch(`${baseUrl}/complaints`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    logPass('11. Spot-check: Protected route without token rejected (401)');
  } catch (e) {
    logFail('11. Spot-check no token 401', e.message);
  }

  // 12. Spot check: Tampered token -> 401
  try {
    const res = await fetch(`${baseUrl}/complaints`, {
      headers: { 'Authorization': 'Bearer tampered.signature.token' }
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    logPass('12. Spot-check: Tampered token rejected (401)');
  } catch (e) {
    logFail('12. Spot-check tampered token 401', e.message);
  }

  // ==========================================
  // T4: CORS CHECKS (Preflight + Real Request)
  // ==========================================
  try {
    // A. OPTIONS Preflight
    const optRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    const allowOriginPre = optRes.headers.get('Access-Control-Allow-Origin');
    assert(allowOriginPre === 'http://localhost:5173', `Preflight allow-origin expected http://localhost:5173, got ${allowOriginPre}`);

    // B. Real POST Request with Origin
    const postRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'officer@civic.local',
        password: 'Officer@123',
        portal: 'department'
      })
    });
    const allowOriginPost = postRes.headers.get('Access-Control-Allow-Origin');
    assert(allowOriginPost === 'http://localhost:5173', `Real request allow-origin expected http://localhost:5173, got ${allowOriginPost}`);
    logPass('13. [T4] CORS Check: OPTIONS preflight and real POST return Access-Control-Allow-Origin: http://localhost:5173');
  } catch (e) {
    logFail('13. [T4] CORS Check', e.message);
  }

  // ==========================================
  // T5: CONTRACT SWEEP (Every single contract route)
  // ==========================================
  console.log('\n--- STARTING T5 CONTRACT SWEEP ---');
  const sweepChecks = [
    { method: 'GET', path: '/health', token: null, expected: 200, type: 'CORE' },
    { method: 'GET', path: '/auth/me', token: citizenToken, expected: 200, type: 'CORE' },
    { method: 'GET', path: `/users/${citizenId || 1}`, token: citizenToken, expected: 200, type: 'CORE' },
    { method: 'GET', path: '/complaints/my', token: citizenToken, expected: 200, type: 'CORE' },
    { method: 'POST', path: '/auth/sync-user', token: citizenToken, body: {}, expected: 501, type: 'AUTH-UNSUPPORTED' },
    { method: 'POST', path: '/auth/forgot-password-verify', token: null, body: {}, expected: 501, type: 'AUTH-UNSUPPORTED' },
    { method: 'POST', path: '/auth/reset-password', token: null, body: {}, expected: 501, type: 'AUTH-UNSUPPORTED' },
    { method: 'GET', path: '/departments', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/departments', token: citizenToken, body: {}, expected: 201, type: 'STUB' },
    { method: 'PUT', path: '/departments/sanitation', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'DELETE', path: '/departments/sanitation', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/dashboard/citizen', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/dashboard/worker', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/dashboard/officer', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/dashboard/admin', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/emergencies', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/emergencies', token: citizenToken, body: {}, expected: 201, type: 'STUB' },
    { method: 'PUT', path: '/emergencies/1/status', token: officerToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/feedback', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/feedback/1', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/notifications', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'PUT', path: '/notifications/1/read', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/notifications', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/reports/summary', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/reports/complaints', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/reports/export/pdf', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/reports/export/excel', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/users', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'PUT', path: '/users/1', token: officerToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'DELETE', path: '/users/1', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/workers', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/workers', token: officerToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/workers/1/tasks', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'PUT', path: '/workers/1/status', token: officerToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'PUT', path: '/workers/complaints/1/upload-proof', token: officerToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/complaints/draft', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/complaints/draft', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'DELETE', path: '/complaints/draft', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'PUT', path: '/complaints/1/assign-worker', token: officerToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'PUT', path: '/complaints/1/reopen', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'DELETE', path: '/complaints/1', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/ai/classify', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/ai/analyze-image', token: citizenToken, body: {}, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/ai/analytics', token: citizenToken, expected: 200, type: 'STUB' },
    { method: 'GET', path: '/audit-logs', token: officerToken, expected: 200, type: 'STUB' },
    { method: 'POST', path: '/audit-logs', token: officerToken, body: {}, expected: 201, type: 'STUB' }
  ];

  let sweepPassed = 0;
  for (const check of sweepChecks) {
    const headers = { 'Content-Type': 'application/json' };
    if (check.token) {
      headers['Authorization'] = `Bearer ${check.token}`;
    }
    const init = { method: check.method, headers };
    if (check.body) init.body = JSON.stringify(check.body);

    try {
      const res = await fetch(`${baseUrl}${check.path}`, init);
      assert(res.status === check.expected, `Expected ${check.expected}, got ${res.status}`);
      sweepPassed++;
      console.log(`  [OK] ${check.method} ${check.path} -> ${res.status} (${check.type})`);
    } catch (err) {
      console.error(`  [FAIL] ${check.method} ${check.path} -> ${err.message}`);
      failedCount++;
    }
  }

  if (sweepPassed === sweepChecks.length) {
    logPass(`14. [T5] Contract Sweep passed: all ${sweepPassed}/${sweepChecks.length} endpoints match specifications`);
  } else {
    logFail('14. [T5] Contract Sweep', `Only ${sweepPassed}/${sweepChecks.length} endpoints passed`);
  }

  console.log(`\n==========================================`);
  console.log(`Final Results: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log(`==========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
