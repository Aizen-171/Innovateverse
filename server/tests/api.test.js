/**
 * InnovateVerse Master Automated Test Runner
 * Validates REST API, Auth, RBAC, Profiles, Smart Matching, Mentorship,
 * Funding Approvals, Expense Verifications, and Financial Balances.
 */
const http = require('node:http');
const app = require('../server');
const { getDb } = require('../config/database');

let server;
let baseUrl;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      res => {
        let rawData = '';
        res.on('data', chunk => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (err) {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting InnovateVerse Master Feature Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Ensure test idempotency by clearing any previous test artifacts for prj_solarpulse
  try {
    const db = getDb();
    db.prepare(`DELETE FROM mentorship_requests WHERE project_id = 'prj_solarpulse'`).run();
    db.prepare(`DELETE FROM funding_requests WHERE project_id = 'prj_solarpulse'`).run();
    db.prepare(`DELETE FROM expenses WHERE project_id = 'prj_solarpulse'`).run();
  } catch (err) {
    console.warn('DB cleanup warning:', err.message);
  }

  // Boot server on ephemeral test port
  await new Promise(resolve => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // 1. Health check
    const resHealth = await makeRequest('GET', '/api/health');
    assert(resHealth.status === 200 && resHealth.data.status === 'healthy', 'Health check returns 200 healthy');

    // 2. Demo logins
    const resMaya = await makeRequest('POST', '/api/auth/demo-login', { userId: 'usr_maya_lin' });
    const mayaToken = resMaya.data.token;
    assert(resMaya.status === 200 && !!mayaToken, 'Maya Lin (Student) login produces valid JWT token');

    const resAlex = await makeRequest('POST', '/api/auth/demo-login', { userId: 'usr_alex_rivera' });
    const alexToken = resAlex.data.token;
    assert(resAlex.status === 200 && !!alexToken, 'Alex Rivera (Contributor) login produces valid token');

    const resRao = await makeRequest('POST', '/api/auth/demo-login', { userId: 'usr_sarah_rao' });
    const raoToken = resRao.data.token;
    assert(resRao.status === 200 && !!raoToken, 'Dr. Sarah Rao (Mentor) login produces valid token');

    const resAdmin = await makeRequest('POST', '/api/auth/demo-login', { userId: 'usr_marcus_vance' });
    const adminToken = resAdmin.data.token;
    assert(resAdmin.status === 200 && !!adminToken, 'Marcus Vance (Admin) login produces valid token');

    // 3. FEATURE A: Student Skill Profiles
    const resProfile = await makeRequest('GET', '/api/profiles/usr_maya_lin');
    assert(resProfile.status === 200 && resProfile.data.profile.skills.length >= 4, 'Fetches Maya Lin profile with skills and areas of interest');

    const resUpdateProfile = await makeRequest('PUT', '/api/profiles/usr_maya_lin', {
      bio: 'Updated bio: Focused on IoT edge data and student mobility.',
      availability: '20 hrs/week'
    }, mayaToken);
    assert(resUpdateProfile.status === 200 && resUpdateProfile.data.profile.availability === '20 hrs/week', 'Student can update their own profile and availability');

    // Security: Student cannot update another user's profile
    const resForbiddenProfile = await makeRequest('PUT', '/api/profiles/usr_alex_rivera', {
      bio: 'Hacked bio'
    }, mayaToken);
    assert(resForbiddenProfile.status === 403, 'User blocked from editing another user profile (403 Forbidden)');

    // 4. FEATURE B: AI-Powered Idea Evaluation
    const resCopilot = await makeRequest('POST', '/api/copilot/evaluate', {
      title: 'AeroDorm Weather Node',
      problem_statement: 'High humidity and poor ventilation inside older campus dorm towers during autumn.',
      proposed_solution: 'Rooftop IoT barometer and VOC gas telemetry node with live student dashboard.',
      category: 'Smart Campus',
      tech_stack: ['ESP32', 'React', 'MQTT']
    });
    assert(resCopilot.status === 200 && resCopilot.data.diagnostic.readinessScore > 50, 'AI Copilot computes structured 0-100 scores and lean MVP scope');

    // 5. FEATURE C: Smart Collaborator Matching
    const resMatching = await makeRequest('GET', '/api/projects/prj_ecotransit_ai/recommendations');
    assert(resMatching.status === 200 && Array.isArray(resMatching.data.recommendations), 'Returns smart collaborator recommendations');
    const topCandidate = resMatching.data.recommendations[0];
    assert(topCandidate.compatibilityScore >= 60 && topCandidate.matchReasons.length > 0, 'Candidate scored with transparent match reasons');

    // 6. FEATURE D: Project Review and Selection Workflow (Human Decision)
    const resReviewQueue = await makeRequest('GET', '/api/reviews/queue', null, raoToken);
    assert(resReviewQueue.status === 200 && resReviewQueue.data.projects.length >= 4, 'Authorized reviewer accesses pending project review queue');

    const resApproveProject = await makeRequest('PATCH', '/api/projects/prj_solarpulse/review-status', {
      review_status: 'Approved',
      reviewer_decision_notes: 'Approved by faculty committee. Excellent solar sub-metering concept.'
    }, raoToken);
    assert(resApproveProject.status === 200 && resApproveProject.data.project.review_status === 'Approved', 'Faculty mentor records official selection approval');

    // Security check: Student cannot make selection decisions
    const resStudentDecisionAttempt = await makeRequest('PATCH', '/api/projects/prj_biobite/review-status', {
      review_status: 'Approved',
      reviewer_decision_notes: 'Self approval'
    }, mayaToken);
    assert(resStudentDecisionAttempt.status === 403, 'Student blocked from recording project review decision (403 Forbidden)');

    // 7. FEATURE E: Mentorship Management
    const resMentors = await makeRequest('GET', '/api/mentors');
    assert(resMentors.status === 200 && resMentors.data.mentors.length >= 1, 'Lists available faculty mentors');

    const resRequestMentorship = await makeRequest('POST', '/api/mentorship/request', {
      project_id: 'prj_solarpulse',
      mentor_id: 'usr_sarah_rao',
      assistance_needed: 'Need feedback on current transformer CT clamp calibration and fire safety standards.'
    }, alexToken);
    assert(resRequestMentorship.status === 201 && !!resRequestMentorship.data.request.id, 'Alex Rivera requests mentorship from Dr. Sarah Rao');
    const mentorshipId = resRequestMentorship.data.request.id;

    const resMentorRespond = await makeRequest('PATCH', `/api/mentorship/${mentorshipId}`, {
      status: 'Accepted',
      mentor_notes: 'Reviewed project brief. Will review CT sensor calibration in robotics lab.'
    }, raoToken);
    assert(resMentorRespond.status === 200 && resMentorRespond.data.request.status === 'Accepted', 'Dr. Sarah Rao accepts mentorship request with guidance notes');

    // 8. FEATURE F: Funding Requests and Administrative Approvals
    const resFundingSubmit = await makeRequest('POST', '/api/funding', {
      project_id: 'prj_solarpulse',
      requested_amount: 950.00,
      currency: 'USD',
      purpose: 'Current Transformer Sensors & Safety Acrylic Covers',
      expected_benefit: 'Monitors electricity draw across 4 floor sub-panels safely.',
      itemized_budget: [
        { item: '8x Non-invasive Current Sensor Clamps (100A)', cost: 160 },
        { item: '4x Flame-retardant Sub-panel Enclosures', cost: 240 },
        { item: 'ESP32 Wi-Fi Gateways with Optocouplers', cost: 150 },
        { item: 'UL Safety Certification & Lab Audit Fee', cost: 400 }
      ]
    }, alexToken);
    assert(resFundingSubmit.status === 201 && resFundingSubmit.data.fundingRequest.requested_amount === 950, 'Student submits funding request with itemized budget');
    const fundingId = resFundingSubmit.data.fundingRequest.id;

    const resApproveFunding = await makeRequest('PATCH', `/api/funding/${fundingId}`, {
      status: 'Approved',
      approved_amount: 950.00,
      disbursed_amount: 950.00,
      reviewer_notes: 'Approved by Innovation Incubation Director.'
    }, adminToken);
    assert(resApproveFunding.status === 200 && resApproveFunding.data.fundingRequest.status === 'Approved', 'University admin approves funding request and records decision');

    // 9. FEATURE G: Bill Submission and Expense Verification
    const resSubmitBill = await makeRequest('POST', '/api/expenses', {
      project_id: 'prj_solarpulse',
      title: 'SparkFun Electronics - 8x Current Sensors',
      amount: 160.00,
      category: 'Hardware & Components',
      expense_date: '2026-10-14',
      vendor: 'SparkFun Electronics',
      description: 'Purchased 8 SCT-013-000 non-invasive current sensors.',
      receipt_filename: 'sparkfun_invoice_7719.pdf'
    }, alexToken);
    assert(resSubmitBill.status === 201 && resSubmitBill.data.expense.status === 'Submitted', 'Student submits expense bill with receipt reference');
    const expenseId = resSubmitBill.data.expense.id;

    const resVerifyBill = await makeRequest('PATCH', `/api/expenses/${expenseId}/verify`, {
      status: 'Verified',
      reviewer_comments: 'Receipt verified against line item 1 of approved budget.'
    }, adminToken);
    assert(resVerifyBill.status === 200 && resVerifyBill.data.expense.status === 'Verified', 'Administrator verifies expense bill');

    // 10. FEATURE I: Fund Utilization and Expenditure Dashboard
    const resFinancials = await makeRequest('GET', '/api/projects/prj_solarpulse/financials');
    assert(resFinancials.status === 200 && resFinancials.data.financials.totalApproved === 950, 'Financial overview returns approved funding total ($950)');
    assert(resFinancials.data.financials.totalVerifiedExpenses === 160, 'Financial overview returns verified expenses ($160)');
    assert(resFinancials.data.financials.remainingBalance === 790, 'Accurately calculates remaining available balance ($950 - $160 = $790)');

    // 11. Platform Real Statistics Endpoint
    const resStats = await makeRequest('GET', '/api/stats');
    assert(resStats.status === 200 && resStats.data.stats.totalFundingApproved >= 2750, 'Platform stats reflects live total funding approved');
    assert(resStats.data.stats.totalVerifiedExpenses >= 550, 'Platform stats reflects live total verified expenses');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`MASTER TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
