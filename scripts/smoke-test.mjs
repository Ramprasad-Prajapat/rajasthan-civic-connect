/**
 * Live Smoke Test, CORS Check, and Contract Sweep for Rajasthan Civic Connect API.
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
  let citizenEmail = `smoke_citizen_${Date.now()}@test.local`;
  let officer1Token = null;
  let officer2Token = null;
  let adminToken = null;
  let createdComplaintId = null;
  let createdComplaintDbId = null;
  let createdDeptId = null;
  let createdOfficerId = null;

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

  // 2. CORS Preflight
  try {
    const res = await fetch(`${baseUrl}/complaints`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    assert(res.ok || res.status === 204 || res.status === 200, `Expected 200/204, got ${res.status}`);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(allowOrigin === '*' || allowOrigin === 'http://localhost:5173', `Invalid allow-origin: ${allowOrigin}`);
    logPass('2. CORS preflight check passed');
  } catch (e) {
    logFail('2. CORS preflight check', e.message);
  }

  // 3. Unauthenticated access check (401)
  try {
    const res = await fetch(`${baseUrl}/complaints`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    logPass('3. Unauthenticated access correctly rejected with 401');
  } catch (e) {
    logFail('3. Unauthenticated access check', e.message);
  }

  // 4. Citizen registration
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Citizen',
        email: citizenEmail,
        password: 'Password@123',
        phone: '9876543210'
      })
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.user && data.user.email === citizenEmail, 'User profile returned');
    assert(data.user.role === 'Citizen', 'Role is Citizen');
    assert(data.token, 'Token returned');
    citizenToken = data.token;
    logPass('4. Citizen registration returned 201 with JWT token and Citizen role');
  } catch (e) {
    logFail('4. Citizen registration', e.message);
  }

  // 5. Citizen login
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
    assert(data.user && data.user.role === 'Citizen', 'Role is Citizen');
    citizenToken = data.token;
    logPass('5. Citizen login returned 200 with token and user profile');
  } catch (e) {
    logFail('5. Citizen login', e.message);
  }

  // 6. Citizen profile (GET /auth/me & PUT /auth/me)
  try {
    const getRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(getRes.ok, `GET /auth/me failed with ${getRes.status}`);
    const profile = await getRes.json();
    assert(profile.email === citizenEmail, 'Email matches');

    const putRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ name: 'Smoke Citizen Updated', phone: '9876543299' })
    });
    assert(putRes.ok, `PUT /auth/me failed with ${putRes.status}`);
    const updated = await putRes.json();
    assert(updated.name === 'Smoke Citizen Updated', 'Name updated');
    logPass('6. Profile GET and PUT /auth/me passed');
  } catch (e) {
    logFail('6. Profile preview & update', e.message);
  }

  // 7. Citizen complaint draft
  try {
    const saveRes = await fetch(`${baseUrl}/complaints/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ title: 'Draft Complaint Title', description: 'Draft description' })
    });
    assert(saveRes.ok, `POST /complaints/draft failed with ${saveRes.status}`);

    const getRes = await fetch(`${baseUrl}/complaints/draft`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(getRes.ok, `GET /complaints/draft failed with ${getRes.status}`);
    const draftData = await getRes.json();
    assert(draftData && draftData.draft && draftData.draft.title === 'Draft Complaint Title', 'Draft retrieved');

    const delRes = await fetch(`${baseUrl}/complaints/draft`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(delRes.ok, `DELETE /complaints/draft failed with ${delRes.status}`);
    logPass('7. Citizen complaint draft lifecycle (save, fetch, delete) passed');
  } catch (e) {
    logFail('7. Complaint draft lifecycle', e.message);
  }

  // 8. Citizen creates complaint
  try {
    const res = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Smoke Test Water Pipe Leakage',
        description: 'Main pipeline leak causing flooding',
        category: 'water',
        district: 'Jaipur',
        ulbName: 'Nagar Nigam Jaipur',
        priority: 'High'
      })
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.id && data.complaintId, 'id and complaintId present');
    assert(data.departmentName === 'Water Department', `Department mapped to Water Department: ${data.departmentName}`);
    assert(data.timeline && data.timeline.length >= 1, 'Initial timeline event logged');
    createdComplaintId = data.complaintId;
    createdComplaintDbId = data.id;
    logPass(`8. Create complaint lodged ticket ${createdComplaintId} mapped to ${data.departmentName}`);
  } catch (e) {
    logFail('8. Create complaint', e.message);
  }

  // 9. Citizen list own complaints
  try {
    const resAll = await fetch(`${baseUrl}/complaints`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(resAll.ok, `GET /complaints returned ${resAll.status}`);
    const allList = await resAll.json();
    assert(Array.isArray(allList) && allList.some(c => c.complaintId === createdComplaintId), 'Created complaint listed in /complaints');

    const resMy = await fetch(`${baseUrl}/complaints/my`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(resMy.ok, `GET /complaints/my returned ${resMy.status}`);
    const myList = await resMy.json();
    assert(Array.isArray(myList) && myList.some(c => c.complaintId === createdComplaintId), 'Created complaint listed in /complaints/my');

    const resDetail = await fetch(`${baseUrl}/complaints/${createdComplaintId}`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(resDetail.ok, `GET /complaints/${createdComplaintId} returned ${resDetail.status}`);
    logPass('9. Citizen complaint retrieval (/complaints, /complaints/my, /complaints/{idOrCode}) passed');
  } catch (e) {
    logFail('9. Citizen complaint retrieval', e.message);
  }

  // 10. Officer 1 (Water Department) Login & Department Scoping
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
    assert(res.ok, `Officer 1 login returned ${res.status}`);
    const data = await res.json();
    assert(data.token, 'Officer token present');
    officer1Token = data.token;

    // View complaints in own department
    const listRes = await fetch(`${baseUrl}/complaints`, {
      headers: { 'Authorization': `Bearer ${officer1Token}` }
    });
    assert(listRes.ok, `Officer GET /complaints returned ${listRes.status}`);
    const list = await listRes.json();
    assert(Array.isArray(list) && list.some(c => c.complaintId === createdComplaintId), 'Water officer sees water complaint');

    // Department Stats
    const statsRes = await fetch(`${baseUrl}/departments/my/stats`, {
      headers: { 'Authorization': `Bearer ${officer1Token}` }
    });
    assert(statsRes.ok, `GET /departments/my/stats returned ${statsRes.status}`);
    const stats = await statsRes.json();
    assert(typeof stats.totalComplaints === 'number' || typeof stats.total === 'number', 'Officer stats structure valid');

    // Update complaint status
    const updateRes = await fetch(`${baseUrl}/complaints/${createdComplaintDbId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officer1Token}`
      },
      body: JSON.stringify({
        status: 'InProgress',
        remark: 'Inspection team dispatched by Water Department'
      })
    });
    assert(updateRes.ok, `Officer PUT /complaints/{id}/status returned ${updateRes.status}`);
    const updated = await updateRes.json();
    assert(updated.status === 'InProgress', 'Status updated to InProgress');

    logPass('10. Officer 1 (Water Dept) login, stats, and status update passed');
  } catch (e) {
    logFail('10. Officer 1 operations', e.message);
  }

  // 11. Officer 2 (Sanitation Department) Login & Cross-department protection (403)
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sanitation.officer@civic.local',
        password: 'Officer@123',
        portal: 'department'
      })
    });
    assert(res.ok, `Officer 2 login returned ${res.status}`);
    const data = await res.json();
    assert(data.token, 'Officer 2 token present');
    officer2Token = data.token;

    // View complaints: officer 2 must NOT see Water Department complaint
    const listRes = await fetch(`${baseUrl}/complaints`, {
      headers: { 'Authorization': `Bearer ${officer2Token}` }
    });
    assert(listRes.ok, `Officer 2 GET /complaints returned ${listRes.status}`);
    const list = await listRes.json();
    const hasWaterComplaint = Array.isArray(list) && list.some(c => c.complaintId === createdComplaintId);
    assert(!hasWaterComplaint, 'Sanitation officer cannot view Water complaint');

    // Cross-department update must return 403 Forbidden
    const crossUpdateRes = await fetch(`${baseUrl}/complaints/${createdComplaintDbId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officer2Token}`
      },
      body: JSON.stringify({
        status: 'Resolved',
        remark: 'Attempting illegal cross-department update'
      })
    });
    assert(crossUpdateRes.status === 403, `Expected 403 Forbidden on cross-department update, got ${crossUpdateRes.status}`);

    logPass('11. Officer 2 cross-department scoping and 403 forbidden protection verified');
  } catch (e) {
    logFail('11. Officer 2 cross-department check', e.message);
  }

  // 12. Admin Operations (CRUD Departments, CRUD Officers, Users list, Stats, Reassign)
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@civic.local',
        password: 'Admin@123',
        portal: 'admin'
      })
    });
    assert(res.ok, `Admin login returned ${res.status}`);
    const data = await res.json();
    assert(data.token, 'Admin token present');
    adminToken = data.token;

    // Admin Stats
    const statsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(statsRes.ok, `GET /admin/stats returned ${statsRes.status}`);
    const stats = await statsRes.json();
    assert(typeof stats.totalComplaints === 'number', 'totalComplaints present in admin stats');
    assert(typeof stats.totalOfficers === 'number', 'totalOfficers present in admin stats');

    // Admin creates department
    const deptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: `Parks Dept ${Date.now()}`,
        code: 'PARK',
        description: 'Public parks and horticulture management',
        contact: '0141-888888'
      })
    });
    assert(deptRes.status === 201, `POST /departments returned ${deptRes.status}`);
    const dept = await deptRes.json();
    createdDeptId = dept.id;

    // Admin lists departments
    const deptListRes = await fetch(`${baseUrl}/departments`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deptListRes.ok, `GET /departments returned ${deptListRes.status}`);
    const depts = await deptListRes.json();
    assert(depts.some(d => d.id === createdDeptId), 'New department is in departments list');

    // Admin updates department
    const updateDeptRes = await fetch(`${baseUrl}/departments/${createdDeptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: dept.name,
        code: 'PARK-UPD',
        description: 'Updated parks description',
        contact: '0141-777777'
      })
    });
    assert(updateDeptRes.ok, `PUT /departments/{id} returned ${updateDeptRes.status}`);

    // Admin creates officer in new department
    const offEmail = `test_officer_${Date.now()}@civic.local`;
    const offRes = await fetch(`${baseUrl}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'New Park Officer',
        email: offEmail,
        phone: '9876543212',
        password: 'InitialPass@123',
        departmentId: createdDeptId
      })
    });
    assert(offRes.status === 201, `POST /admin/officers returned ${offRes.status}`);
    const officerData = await offRes.json();
    createdOfficerId = officerData.id;

    // Admin lists officers
    const offListRes = await fetch(`${baseUrl}/admin/officers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(offListRes.ok, `GET /admin/officers returned ${offListRes.status}`);
    const officers = await offListRes.json();
    assert(officers.some(o => o.id === createdOfficerId), 'New officer in officers list');

    // Admin lists users (read-only)
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(usersRes.ok, `GET /admin/users returned ${usersRes.status}`);
    const users = await usersRes.json();
    assert(Array.isArray(users) && users.length >= 3, 'Users list returned');

    // Admin reassigns complaint department
    const reassignRes = await fetch(`${baseUrl}/complaints/${createdComplaintDbId}/department`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ departmentId: createdDeptId })
    });
    assert(reassignRes.ok, `PUT /complaints/{id}/department returned ${reassignRes.status}`);
    const reassignedComp = await reassignRes.json();
    assert(reassignedComp.departmentId === createdDeptId, 'Complaint department reassigned');

    // Admin updates complaint status
    const adminCompStatus = await fetch(`${baseUrl}/complaints/${createdComplaintDbId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Resolved', remark: 'Resolved by Admin' })
    });
    assert(adminCompStatus.ok, `Admin PUT /complaints/{id}/status returned ${adminCompStatus.status}`);

    // Department delete returns 409 Conflict when officer or complaint is assigned
    const delDeptRes = await fetch(`${baseUrl}/departments/${createdDeptId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(delDeptRes.status === 409, `Expected 409 Conflict deleting department with assigned officer/complaint, got ${delDeptRes.status}`);

    // Admin toggles officer active (deactivates officer)
    const toggleOffRes = await fetch(`${baseUrl}/admin/officers/${createdOfficerId}/toggle-active`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(toggleOffRes.ok, `PUT /admin/officers/{id}/toggle-active returned ${toggleOffRes.status}`);

    // Attempting login with deactivated officer must return 403 Forbidden
    const disabledLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: offEmail,
        password: 'InitialPass@123',
        portal: 'department'
      })
    });
    assert(disabledLoginRes.status === 403, `Expected 403 Forbidden for disabled officer login, got ${disabledLoginRes.status}`);

    logPass('12. Admin CRUD departments & officers, stats, reassignment, 409 conflict, and 403 disabled user passed');
  } catch (e) {
    logFail('12. Admin operations', e.message);
  }

  // 13. Password change
  try {
    const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        currentPassword: 'Password@123',
        newPassword: 'NewPassword@123'
      })
    });
    assert(changeRes.ok, `PUT /auth/change-password returned ${changeRes.status}`);

    // Login with new password
    const reLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: citizenEmail,
        password: 'NewPassword@123',
        portal: 'citizen'
      })
    });
    assert(reLoginRes.ok, `Login with new password returned ${reLoginRes.status}`);
    logPass('13. Password change and subsequent login passed');
  } catch (e) {
    logFail('13. Password change', e.message);
  }

  // 14. Contract Sweep across the exact final API endpoints
  console.log('\n--- CONTRACT SWEEP ---');
  const sweepChecks = [
    { name: 'Public Health', method: 'GET', path: '/health', token: null, expected: 200 },
    { name: 'Public Departments', method: 'GET', path: '/departments', token: null, expected: 200 },
    { name: 'Auth Profile', method: 'GET', path: '/auth/me', token: citizenToken, expected: 200 },
    { name: 'Citizen Complaints', method: 'GET', path: '/complaints', token: citizenToken, expected: 200 },
    { name: 'Citizen Complaints My', method: 'GET', path: '/complaints/my', token: citizenToken, expected: 200 },
    { name: 'Officer Stats', method: 'GET', path: '/departments/my/stats', token: officer1Token, expected: 200 },
    { name: 'Admin Stats', method: 'GET', path: '/admin/stats', token: adminToken, expected: 200 },
    { name: 'Admin Officers List', method: 'GET', path: '/admin/officers', token: adminToken, expected: 200 },
    { name: 'Admin Users List', method: 'GET', path: '/admin/users', token: adminToken, expected: 200 },
    { name: 'Admin Departments List', method: 'GET', path: '/departments', token: adminToken, expected: 200 },
    { name: 'Unauthenticated Complaints', method: 'GET', path: '/complaints', token: null, expected: 401 }
  ];

  let sweepPassed = 0;
  for (const check of sweepChecks) {
    const headers = { 'Content-Type': 'application/json' };
    if (check.token) {
      headers['Authorization'] = `Bearer ${check.token}`;
    }
    try {
      const res = await fetch(`${baseUrl}${check.path}`, { method: check.method, headers });
      assert(res.status === check.expected, `Expected ${check.expected}, got ${res.status}`);
      sweepPassed++;
      console.log(`  [OK] ${check.method} ${check.path} -> ${res.status} (${check.name})`);
    } catch (err) {
      console.error(`  [FAIL] ${check.method} ${check.path} -> ${err.message} (${check.name})`);
      failedCount++;
    }
  }

  if (sweepPassed === sweepChecks.length) {
    logPass(`14. Contract Sweep passed: all ${sweepPassed}/${sweepChecks.length} endpoints match specifications`);
  } else {
    logFail('14. Contract Sweep', `Only ${sweepPassed}/${sweepChecks.length} endpoints passed`);
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
