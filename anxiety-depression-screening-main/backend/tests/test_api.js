/**
 * Automated End-to-End API Integration Test Suite
 * Tests full authentication, scoring, history, security, admin flows, and SPA delivery.
 */

// Set NODE_ENV to 'test' so server.js does not auto-bind to port 5000 during testing
process.env.NODE_ENV = 'test';

const assert = require('assert');
const http = require('http');
const app = require('../server');

// Global safety timeout: abort after 15 seconds if anything hangs
const timeoutTimer = setTimeout(() => {
  console.error('\n❌ Test execution overall timed out after 15 seconds.');
  process.exit(1);
}, 15000);
timeoutTimer.unref();

let server;
let baseUrl;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: options.headers || {},
      timeout: 4000 // 4s timeout per request
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
      req.destroy(new Error('HTTP request timed out after 4000ms'));
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   STARTING AUTOMATED API TEST SUITE (WITH TIMEOUTS)');
  console.log('======================================================\n');

  // Start test server on random free port
  await new Promise((resolve, reject) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Server] Started temporarily on ${baseUrl}\n`);
      resolve();
    });
    server.on('error', reject);
  });

  try {
    // 1. Health check
    console.log('Test 1: Health check endpoint');
    const healthRes = await request({ path: '/api/health' });
    assert.strictEqual(healthRes.statusCode, 200);
    assert.strictEqual(healthRes.data.status, 'online');
    console.log('  ✓ Health check passed (status: online)');

    // 2. SPA Delivery check
    console.log('Test 2: Single-Page Application (SPA) HTML delivery');
    const spaRes = await request({ path: '/' });
    assert.strictEqual(spaRes.statusCode, 200);
    assert.ok(typeof spaRes.data === 'string' && spaRes.data.includes('id="root"'));
    console.log('  ✓ SPA frontend HTML correctly served with root mounting container');

    // 3. Demo User Login
    console.log('Test 3: Demo User Login');
    const demoLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST'
    }, {
      email: 'demo@student.edu',
      password: 'DemoUser@123'
    });
    assert.strictEqual(demoLoginRes.statusCode, 200);
    assert.ok(demoLoginRes.data.token);
    assert.strictEqual(demoLoginRes.data.user.role, 'user');
    const demoToken = demoLoginRes.data.token;
    console.log('  ✓ Demo user login passed');

    // 4. Invalid Login Rejection
    console.log('Test 4: Invalid Login rejection');
    const badLogin = await request({
      path: '/api/auth/login',
      method: 'POST'
    }, {
      email: 'demo@student.edu',
      password: 'WrongPassword999'
    });
    assert.strictEqual(badLogin.statusCode, 401);
    console.log('  ✓ Invalid login properly rejected with 401');

    // 5. User Registration
    console.log('Test 5: Register a new user');
    const testEmail = `testuser_${Date.now()}@college.edu`;
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST'
    }, {
      name: 'Test Student',
      email: testEmail,
      password: 'TestPassword@123',
      confirmPassword: 'TestPassword@123'
    });
    assert.strictEqual(regRes.statusCode, 201);
    assert.ok(regRes.data.token);
    assert.strictEqual(regRes.data.user.email, testEmail);
    const userToken = regRes.data.token;
    console.log('  ✓ User registration successful with token');

    // 6. Duplicate Email Rejection
    console.log('Test 6: Duplicate registration prevention');
    const dupRes = await request({
      path: '/api/auth/register',
      method: 'POST'
    }, {
      name: 'Duplicate Student',
      email: testEmail,
      password: 'TestPassword@123',
      confirmPassword: 'TestPassword@123'
    });
    assert.strictEqual(dupRes.statusCode, 409);
    console.log('  ✓ Duplicate email rejected with 409 Conflict');

    // 7. Protected Route Without Token
    console.log('Test 7: Protected route without authorization token');
    const unauthRes = await request({ path: '/api/dashboard' });
    assert.strictEqual(unauthRes.statusCode, 401);
    console.log('  ✓ Unauthorized access blocked with 401');

    // 8. Get Questions
    console.log('Test 8: Fetch standardized screening questions');
    const qRes = await request({ path: '/api/screenings/questions' });
    assert.strictEqual(qRes.statusCode, 200);
    assert.strictEqual(qRes.data.instruments.gad7.questions.length, 7);
    assert.strictEqual(qRes.data.instruments.phq9.questions.length, 9);
    console.log('  ✓ All 7 GAD-7 and 9 PHQ-9 questions retrieved successfully');

    // 9. Submit Normal Screening Assessment
    console.log('Test 9: Submit screening assessment & verify backend scoring');
    const questions = [
      ...qRes.data.instruments.gad7.questions,
      ...qRes.data.instruments.phq9.questions
    ];

    // Submit minimal responses (score 1 for first 3 GAD-7 = 3 [Minimal Anxiety], 1 for first 2 PHQ-9 = 2 [Minimal Depression], Q9 = 0)
    const answers = questions.map(q => {
      let val = 0;
      if (q.questionnaire_type === 'GAD-7' && q.question_order <= 3) val = 1;
      if (q.questionnaire_type === 'PHQ-9' && q.question_order <= 2) val = 1;
      return { questionId: q.id, answerValue: val };
    });

    const submitRes = await request({
      path: '/api/screenings',
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    }, { answers, notes: 'Automated test screening session' });

    assert.strictEqual(submitRes.statusCode, 201);
    assert.strictEqual(submitRes.data.anxiety.score, 3);
    assert.strictEqual(submitRes.data.anxiety.category, 'Minimal Anxiety');
    assert.strictEqual(submitRes.data.depression.score, 2);
    assert.strictEqual(submitRes.data.depression.category, 'Minimal Depression');
    assert.strictEqual(submitRes.data.requiresSafetyAlert, false);
    const createdScreeningId = submitRes.data.screeningId;
    console.log('  ✓ Screening scored on backend: Anxiety 3 (Minimal), Depression 2 (Minimal)');

    // 10. Submit Screening with Question 9 Triggering Safety Alert
    console.log('Test 10: Submit screening with PHQ-9 Item 9 > 0 to verify crisis safety alert');
    const crisisAnswers = questions.map(q => {
      let val = 0;
      if (q.code === 'PHQ9_9') val = 2; // Non-zero triggers safety alert
      if (q.questionnaire_type === 'GAD-7') val = 2;
      return { questionId: q.id, answerValue: val };
    });

    const crisisSubmitRes = await request({
      path: '/api/screenings',
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    }, { answers: crisisAnswers });

    assert.strictEqual(crisisSubmitRes.statusCode, 201);
    assert.strictEqual(crisisSubmitRes.data.requiresSafetyAlert, true);
    assert.ok(crisisSubmitRes.data.crisisResources.tollFree);
    console.log('  ✓ Safety alert properly triggered and crisis resources attached');

    // 11. Get Screening By ID
    console.log('Test 11: Fetch single screening record with all response details');
    const detailRes = await request({
      path: `/api/screenings/${createdScreeningId}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.data.responses.length, 16);
    assert.strictEqual(detailRes.data.screening.id, createdScreeningId);
    console.log('  ✓ Screening details with all 16 question responses retrieved');

    // 12. Cross-User Authorization Check
    console.log('Test 12: Security check - User A cannot access User B screening');
    const crossAccessRes = await request({
      path: `/api/screenings/${createdScreeningId}`,
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    assert.strictEqual(crossAccessRes.statusCode, 403);
    console.log('  ✓ Cross-user access prohibited with 403 Forbidden');

    // 13. User Dashboard Data
    console.log('Test 13: Fetch dashboard summary & longitudinal trend points');
    const dashRes = await request({
      path: '/api/dashboard',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(dashRes.statusCode, 200);
    assert.strictEqual(dashRes.data.stats.totalScreenings, 2);
    assert.ok(dashRes.data.trends.anxietyScores.length === 2);
    console.log('  ✓ Dashboard summary and trend metrics verified');

    // 14. Profile Management
    console.log('Test 14: View and update user profile');
    const updateProfRes = await request({
      path: '/api/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` }
    }, { name: 'Updated Student Name' });
    assert.strictEqual(updateProfRes.statusCode, 200);
    assert.strictEqual(updateProfRes.data.user.name, 'Updated Student Name');
    console.log('  ✓ Profile updated successfully');

    // 15. Admin Authorization - Non-admin attempt rejected
    console.log('Test 15: Non-admin user blocked from admin endpoints');
    const adminBlockedRes = await request({
      path: '/api/admin/statistics',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(adminBlockedRes.statusCode, 403);
    console.log('  ✓ Regular user blocked with 403 from admin endpoints');

    // 16. Admin Login & Statistics Access
    console.log('Test 16: Admin login and fetch administrative statistics');
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
    assert.ok(adminStatsRes.data.summary.totalUsers >= 2);
    assert.ok(adminStatsRes.data.summary.totalScreenings >= 4);
    assert.ok(adminStatsRes.data.distributions.anxiety.length > 0);
    assert.ok(adminStatsRes.data.distributions.depression.length > 0);
    console.log('  ✓ Admin statistics and severity distributions verified');

    // 17. Admin User Management
    console.log('Test 17: Admin fetch users list');
    const adminUsersRes = await request({
      path: '/api/admin/users',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminUsersRes.statusCode, 200);
    assert.ok(adminUsersRes.data.users.length >= 2);
    console.log('  ✓ Admin user management list verified');

    console.log('\n======================================================');
    console.log('   ALL 17 AUTOMATED TESTS PASSED SUCCESSFULLY! ✓');
    console.log('======================================================\n');
  } finally {
    clearTimeout(timeoutTimer);
    if (server) {
      server.close(() => {
        console.log('[Test Server] Temporary server shut down cleanly.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Uncaught Error:', err);
  process.exit(1);
});
