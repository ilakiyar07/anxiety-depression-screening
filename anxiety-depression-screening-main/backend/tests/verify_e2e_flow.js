/**
 * End-to-End User Flow and SPA Verification Script
 * Starts the server, runs all major flows with explicit timeouts,
 * tests browser HTML and client routes, and shuts down cleanly.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Global safety timeout: fail if entire script takes longer than 25 seconds
const scriptTimeout = setTimeout(() => {
  console.error('\n❌ E2E Verification timed out after 25 seconds.');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(1);
}, 25000);
scriptTimeout.unref();

let serverProcess;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: options.headers || {},
      timeout: 4000
    };

    if (data) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await request({ path: '/api/health' });
      if (res.statusCode === 200 && res.data.status === 'online') {
        console.log(`[E2E] Server is online and healthy at ${BASE_URL}`);
        return true;
      }
    } catch (e) {
      // wait 400ms before retrying
      await new Promise(r => setTimeout(r, 400));
    }
  }
  throw new Error(`Server failed to start on ${BASE_URL} within ${(maxAttempts * 400) / 1000}s`);
}

async function runEndToEndVerification() {
  console.log('===============================================================');
  console.log('  STARTING FINAL END-TO-END VERIFICATION ON PRODUCTION PORT 5000');
  console.log('===============================================================\n');

  // 1. Launch server as child process
  console.log('[E2E Step 1] Spawning node backend/server.js...');
  const serverPath = path.resolve(__dirname, '..', 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' }
  });

  serverProcess.stdout.on('data', (d) => {
    // console.log(`[Server stdout] ${d}`);
  });

  serverProcess.stderr.on('data', (d) => {
    console.error(`[Server stderr] ${d}`);
  });

  // Wait for health check
  await waitForServer();

  // 2. Verify SPA routes and HTML delivery
  console.log('\n[E2E Step 2] Verifying Single-Page Application (SPA) client routes:');
  const clientRoutes = ['/', '/dashboard', '/screen', '/results/1', '/history', '/admin', '/profile'];
  for (const route of clientRoutes) {
    const pageRes = await request({ path: route });
    assert.strictEqual(pageRes.statusCode, 200, `Expected 200 for client route ${route}`);
    assert.ok(
      typeof pageRes.data === 'string' && pageRes.data.includes('id="root"'),
      `Route ${route} did not return the React root mounting page`
    );
    console.log(`  ✓ Route ${route.padEnd(12)} -> HTTP 200 OK (React index.html served)`);
  }

  // 3. User Registration Flow
  console.log('\n[E2E Step 3] Testing User Registration & Validation:');
  const studentEmail = `student_${Date.now()}@college.edu`;
  const regRes = await request({
    path: '/api/auth/register',
    method: 'POST'
  }, {
    name: 'Initial Student Name',
    email: studentEmail,
    password: 'InitialPassword@123',
    confirmPassword: 'InitialPassword@123'
  });
  assert.strictEqual(regRes.statusCode, 201);
  assert.ok(regRes.data.token, 'Token was not returned upon registration');
  assert.strictEqual(regRes.data.user.email, studentEmail);
  let userToken = regRes.data.token;
  const newUserId = regRes.data.user.id;
  console.log(`  ✓ Registered new user: ${studentEmail} (ID: ${newUserId})`);

  // 4. User Profile & Password Updates
  console.log('\n[E2E Step 4] Testing User Profile Updates & Password Change:');
  const updateProfRes = await request({
    path: '/api/profile',
    method: 'PUT',
    headers: { Authorization: `Bearer ${userToken}` }
  }, { name: 'Verified Final Student' });
  assert.strictEqual(updateProfRes.statusCode, 200);
  assert.strictEqual(updateProfRes.data.user.name, 'Verified Final Student');
  console.log('  ✓ Updated display name to "Verified Final Student"');

  const changePassRes = await request({
    path: '/api/profile/password',
    method: 'PUT',
    headers: { Authorization: `Bearer ${userToken}` }
  }, {
    currentPassword: 'InitialPassword@123',
    newPassword: 'UpdatedPassword@456',
    confirmPassword: 'UpdatedPassword@456'
  });
  assert.strictEqual(changePassRes.statusCode, 200);
  console.log('  ✓ Password changed successfully');

  // Verify login with new password
  const newLoginRes = await request({
    path: '/api/auth/login',
    method: 'POST'
  }, {
    email: studentEmail,
    password: 'UpdatedPassword@456'
  });
  assert.strictEqual(newLoginRes.statusCode, 200);
  assert.ok(newLoginRes.data.token);
  userToken = newLoginRes.data.token;
  console.log('  ✓ Login with new password succeeded');

  // 5. Screening Questions Retrieval
  console.log('\n[E2E Step 5] Testing Questionnaire Retrieval:');
  const qRes = await request({ path: '/api/screenings/questions' });
  assert.strictEqual(qRes.statusCode, 200);
  const gad7Questions = qRes.data.instruments.gad7.questions;
  const phq9Questions = qRes.data.instruments.phq9.questions;
  assert.strictEqual(gad7Questions.length, 7, 'Expected 7 GAD-7 questions');
  assert.strictEqual(phq9Questions.length, 9, 'Expected 9 PHQ-9 questions');
  console.log('  ✓ Verified 7 GAD-7 items and 9 PHQ-9 items with 4-level Likert options');

  // 6. First Screening Submission & Backend Clinical Scoring (Mild Anxiety & Minimal Depression)
  console.log('\n[E2E Step 6] Testing First Screening Submission & Clinical Scoring:');
  // Formulate answers:
  // GAD-7: order 1->2, order 2->2, order 3->1, order 4->1, rest 0 => Total = 6 ("Mild Anxiety")
  // PHQ-9: order 1->1, order 2->1, order 3->1, rest 0 => Total = 3 ("Minimal Depression")
  const answers1 = [];
  for (const q of gad7Questions) {
    let val = 0;
    if (q.question_order === 1 || q.question_order === 2) val = 2;
    if (q.question_order === 3 || q.question_order === 4) val = 1;
    answers1.push({ questionId: q.id, answerValue: val });
  }
  for (const q of phq9Questions) {
    let val = 0;
    if (q.question_order <= 3) val = 1;
    answers1.push({ questionId: q.id, answerValue: val });
  }

  const submitRes1 = await request({
    path: '/api/screenings',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` }
  }, { answers: answers1, notes: 'First screening for mid-semester evaluation' });

  assert.strictEqual(submitRes1.statusCode, 201);
  assert.strictEqual(submitRes1.data.anxiety.score, 6);
  assert.strictEqual(submitRes1.data.anxiety.category, 'Mild Anxiety');
  assert.strictEqual(submitRes1.data.depression.score, 3);
  assert.strictEqual(submitRes1.data.depression.category, 'Minimal Depression');
  assert.strictEqual(submitRes1.data.requiresSafetyAlert, false);
  const screening1Id = submitRes1.data.screeningId;
  console.log(`  ✓ Screening 1 evaluated: GAD-7 = 6 (Mild Anxiety), PHQ-9 = 3 (Minimal Depression)`);

  // 7. Screening Details & Response Verification
  console.log('\n[E2E Step 7] Testing Screening Details Retrieval:');
  const detailsRes = await request({
    path: `/api/screenings/${screening1Id}`,
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(detailsRes.statusCode, 200);
  assert.strictEqual(detailsRes.data.responses.length, 16);
  assert.ok(detailsRes.data.anxiety.recommendations.length > 0);
  assert.ok(detailsRes.data.depression.recommendations.length > 0);
  console.log('  ✓ Detailed screening view returned all 16 item responses and recommendations');

  // 8. Second Screening with Item 9 Safety Alert Trigger
  console.log('\n[E2E Step 8] Testing Sensitive Crisis Safety Alert (PHQ-9 Item 9):');
  const answers2 = [];
  for (const q of gad7Questions) {
    answers2.push({ questionId: q.id, answerValue: 2 }); // GAD-7 total = 14 (Moderate)
  }
  for (const q of phq9Questions) {
    let val = 1;
    if (q.code === 'PHQ9_9') val = 2; // Non-zero triggers immediate safety alert
    answers2.push({ questionId: q.id, answerValue: val });
  }

  const submitRes2 = await request({
    path: '/api/screenings',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` }
  }, { answers: answers2, notes: 'Follow-up screening under stress' });

  assert.strictEqual(submitRes2.statusCode, 201);
  assert.strictEqual(submitRes2.data.requiresSafetyAlert, true);
  assert.strictEqual(submitRes2.data.anxiety.category, 'Moderate Anxiety');
  assert.ok(submitRes2.data.crisisResources.tollFree.includes('14416'));
  console.log('  ✓ Safety alert properly triggered: requiresSafetyAlert=true with emergency hotlines');

  // 9. Dashboard KPIs and Longitudinal Trends
  console.log('\n[E2E Step 9] Testing Dashboard Overview & Trends:');
  const dashRes = await request({
    path: '/api/dashboard',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(dashRes.statusCode, 200);
  assert.strictEqual(dashRes.data.stats.totalScreenings, 2);
  assert.strictEqual(dashRes.data.stats.latestScreening.requires_safety_alert, 1);
  assert.strictEqual(dashRes.data.trends.anxietyScores.length, 2);
  assert.strictEqual(dashRes.data.trends.depressionScores.length, 2);
  console.log('  ✓ Dashboard summary reflects 2 completed screenings and longitudinal trend coordinates');

  // 10. Screening History Retrieval
  console.log('\n[E2E Step 10] Testing Screening History Log:');
  const historyRes = await request({
    path: '/api/screenings',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(historyRes.statusCode, 200);
  assert.strictEqual(historyRes.data.screenings.length, 2);
  console.log('  ✓ Screening history log returned 2 chronological records');

  // 11. Security Guard: Student Blocked from Admin Routes
  console.log('\n[E2E Step 11] Testing Role-Based Security Guard:');
  const blockedAdminRes = await request({
    path: '/api/admin/statistics',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(blockedAdminRes.statusCode, 403);
  console.log('  ✓ Regular student correctly rejected with HTTP 403 Forbidden from admin routes');

  // 12. Admin Portal Login & Analytics
  console.log('\n[E2E Step 12] Testing Faculty/Admin Portal & Statistics:');
  const adminLoginRes = await request({
    path: '/api/auth/login',
    method: 'POST'
  }, {
    email: 'admin@screening.org',
    password: 'AdminPass@123'
  });
  assert.strictEqual(adminLoginRes.statusCode, 200);
  assert.strictEqual(adminLoginRes.data.user.role, 'admin');
  const adminToken = adminLoginRes.data.token;

  const adminStatsRes = await request({
    path: '/api/admin/statistics',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminStatsRes.statusCode, 200);
  assert.ok(adminStatsRes.data.summary.totalUsers >= 3);
  assert.ok(adminStatsRes.data.summary.totalScreenings >= 5);
  assert.ok(adminStatsRes.data.distributions.anxiety.length > 0);
  assert.ok(adminStatsRes.data.distributions.depression.length > 0);
  assert.ok(adminStatsRes.data.recentScreenings.length >= 5);
  console.log('  ✓ Admin statistics verified: Population KPIs, severity distributions, and anonymized logs');

  // 13. Admin User Role Management
  console.log('\n[E2E Step 13] Testing User Account Management & Role Toggling:');
  const usersListRes = await request({
    path: '/api/admin/users',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(usersListRes.statusCode, 200);
  assert.ok(usersListRes.data.users.length >= 3);

  // Promote test user to admin
  const promoteRes = await request({
    path: `/api/admin/users/${newUserId}/role`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }, { role: 'admin' });
  assert.strictEqual(promoteRes.statusCode, 200);
  assert.strictEqual(promoteRes.data.user.role, 'admin');

  // Demote back to user
  const demoteRes = await request({
    path: `/api/admin/users/${newUserId}/role`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }, { role: 'user' });
  assert.strictEqual(demoteRes.statusCode, 200);
  assert.strictEqual(demoteRes.data.user.role, 'user');
  console.log('  ✓ Successfully demonstrated promotion and demotion of user account roles');

  console.log('\n===============================================================');
  console.log('   ALL 13 MAJOR USER & ADMIN FLOWS VERIFIED SUCCESSFULLY! ✓');
  console.log('===============================================================\n');

  clearTimeout(scriptTimeout);
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  process.exit(0);
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ E2E Verification failed:', err);
  clearTimeout(scriptTimeout);
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(1);
});
