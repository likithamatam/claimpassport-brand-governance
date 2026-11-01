// tests/run-tests.js
// Automated verification suite for Claim Passport
// Run with: node tests/run-tests.js

import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🔍 RUNNING CLAIM PASSPORT AUTOMATED TEST SUITE`);
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log(`✅ PASSED`);
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      if (err.stack) {
        console.error(err.stack.split('\n').slice(1, 3).join('\n'));
      }
      failed++;
    }
  }

  // 1. Health & Server Check
  await test('Server Health & Facts Retrieval', async () => {
    const res = await fetch(`${BASE_URL}/api/facts`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data), 'Facts should be an array');
    assert.ok(body.data.length >= 3, 'Should have at least 3 initial facts');
  });

  // 2. Authentication: Creator Login
  let creatorToken = '';
  await test('Creator Login (alex.rivera@inkloom.example)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.rivera@inkloom.example',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(res.status, 200, `Login failed: ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.role, 'Content Creator');
    assert.ok(body.token, 'Should return session token');
    creatorToken = body.token;
  });

  // 3. Authentication: Reviewer Login
  let reviewerToken = '';
  await test('Reviewer Login (jordan.taylor@inkloom.example)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jordan.taylor@inkloom.example',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(res.status, 200, `Login failed: ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.role, 'Reviewer');
    assert.ok(body.token, 'Should return session token');
    reviewerToken = body.token;
  });

  // 4. Deterministic Rules Engine: Banned Terms Check
  await test('Rules Engine: Absolute Claims & Banned Terms ("100% safe")', async () => {
    const res = await fetch(`${BASE_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Safety Campaign',
        content: 'Our revolutionary formula is 100% safe and risk-free!',
        intent: 'Promote safety standards',
        targetAudience: 'General Consumers',
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    
    // Must find banned term or absolute safety rule GUIDE-001
    const findings = body.data?.findings || [];
    const absoluteViolation = findings.find(
      (f) => f.evidenceId === 'GUIDE-001' || f.flaggedText.toLowerCase().includes('100% safe')
    );
    assert.ok(absoluteViolation, 'Must flag "100% safe" as a rule violation');
    assert.ok(
      absoluteViolation.severity === 'Critical' || absoluteViolation.severity === 'High',
      `Severity should be high or critical, got ${absoluteViolation.severity}`
    );
  });

  // 5. Deterministic Rules Engine: Expired Fact Detection
  await test('Rules Engine: Expired Fact Detection (Customer count expired 2026-09-30)', async () => {
    const res = await fetch(`${BASE_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Customer Count Promo',
        content: 'Trusted by 10,000+ customers across the globe for reliable packaging.',
        intent: 'Highlight verified scale and customer trust',
        targetAudience: 'Enterprise clients',
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const findings = body.data?.findings || [];
    const expiredFinding = findings.find(
      (f) => f.category === 'Stale Fact' || f.explanation.toLowerCase().includes('expired') || f.evidenceId === 'FACT-012'
    );
    assert.ok(expiredFinding, 'Must flag expired customer metric as Stale Fact requiring refresh');
  });

  // 6. Security & RBAC: Content Creator cannot approve submissions (403 Forbidden)
  await test('RBAC Security: Content Creator cannot call /decision to approve (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/submissions/SUB-4053/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        decision: 'Approved',
        reason: 'Creator trying to bypass approval',
        appliedRevision: 'Some copy',
        findings: [],
        contentVersion: 1,
      }),
    });

    assert.strictEqual(res.status, 403, `Expected HTTP 403 Forbidden, got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'UNAUTHORIZED_ROLE');
  });

  // 7. Audit Log: unauthorised_attempt recorded in append-only events
  await test('Append-Only Events: Logs unauthorised_attempt on rejected action', async () => {
    const res = await fetch(`${BASE_URL}/api/events?type=unauthorised_attempt`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0, 'Should have at least one unauthorised_attempt event recorded');
    const lastAttempt = body.data[0];
    assert.strictEqual(lastAttempt.type, 'unauthorised_attempt');
    assert.strictEqual(lastAttempt.role, 'Content Creator');
  });

  // 8. Document Management & Passage Chunking
  let uploadedDocId = '';
  await test('Document Grounding: Text File Upload & Chunking (300-500 char passages)', async () => {
    const textContent = `Inkloom Brand Voice and Safety Guidelines 2026.
Every claim published by Inkloom must adhere to rigorous factual verification. We do not make absolute statements such as 100% safe or completely zero risk. Our clinical trials conducted in January 2026 confirmed that 99.4% of participants reported excellent tolerance. Any marketing material quoting customer statistics must cite our verified customer base of 10,000+ active enterprise clients as validated by our Q3 audit report.`;

    const res = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({
        filename: 'brand_safety_addendum_2026.txt',
        contentText: textContent,
        department: 'Brand Governance',
      }),
    });

    assert.strictEqual(res.status, 200, `Upload failed: ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id, 'Should return document ID');
    assert.ok(body.passageCount >= 1, 'Should generate passages');
    uploadedDocId = body.data.id;
  });

  // 9. Passage Retrieval & Grounding Verification
  await test('Passage Retrieval: Returns chunked passages for uploaded document', async () => {
    const passagesRes = await fetch(`${BASE_URL}/api/documents/${uploadedDocId}/passages`);
    assert.strictEqual(passagesRes.status, 200);
    const passagesBody = await passagesRes.json();
    assert.strictEqual(passagesBody.success, true);
    assert.ok(passagesBody.data.length > 0, 'Passages must exist for uploaded doc');
    assert.ok(passagesBody.data[0].passageText.length >= 50, 'Passage should have content');
  });

  // 10. Legitimate Approval & Versioned Decisions Timeline
  await test('Governance Workflow: Reviewer requests changes then approves (Versioned Decisions)', async () => {
    // First create a clean submission for this test
    const testSubId = `SUB-TEST-${Date.now().toString().slice(-4)}`;
    const subRes = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        id: testSubId,
        title: 'Sustainable Packaging Post',
        content: 'Trusted by 10,000+ customers. Our new bottle is 100% safe!',
        intent: 'Announce new packaging',
        contentType: 'Social Copy',
        targetAudience: 'General Consumers',
      }),
    });
    assert.strictEqual(subRes.status, 200);

    // Step 1: Reviewer requests changes (Version 1)
    const res1 = await fetch(`${BASE_URL}/api/submissions/${testSubId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({
        decision: 'Changes Requested',
        reason: 'Please remove the absolute 100% safe claim and update bottle certification citation.',
        appliedRevision: 'Trusted by 10,000+ customers. Our new bottle is certified eco-responsible.',
        findings: [],
        contentVersion: 1,
      }),
    });
    assert.strictEqual(res1.status, 200, `Decision 1 failed: ${res1.status}`);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, true);
    assert.strictEqual(body1.decision.versionNumber, 1);
    assert.strictEqual(body1.decision.decision, 'Changes Requested');

    // Step 2: Reviewer subsequently approves revised copy (Version 2)
    const res2 = await fetch(`${BASE_URL}/api/submissions/${testSubId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({
        decision: 'Approved',
        reason: 'Verified against Living Facts and approved document passages.',
        appliedRevision: 'Trusted by 10,000+ customers. Our new bottle is certified eco-responsible.',
        findings: [],
        contentVersion: 2,
      }),
    });
    assert.strictEqual(res2.status, 200, `Decision 2 failed: ${res2.status}`);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, true);
    assert.strictEqual(body2.decision.versionNumber, 2);
    assert.strictEqual(body2.decision.decision, 'Approved');
    assert.ok(body2.decision.certificateHash, 'Approved decisions must include certificate hash');

    // Check decisions timeline has both versions immutably
    const decisionsRes = await fetch(`${BASE_URL}/api/submissions/${testSubId}/decisions`);
    const decisionsBody = await decisionsRes.json();
    assert.strictEqual(decisionsBody.success, true);
    assert.strictEqual(decisionsBody.count, 2, 'Timeline must record both decisions immutably');
    assert.strictEqual(decisionsBody.data[0].versionNumber, 1);
    assert.strictEqual(decisionsBody.data[1].versionNumber, 2);
  });

  // 11. Append-Only Events Integrity (No DELETE / PUT)
  await test('Append-Only Integrity: No UPDATE or DELETE route for events', async () => {
    const delRes = await fetch(`${BASE_URL}/api/events/EVT-001`, { method: 'DELETE' });
    assert.ok(delRes.status === 404 || delRes.status === 405, `Delete must not be allowed: ${delRes.status}`);

    const putRes = await fetch(`${BASE_URL}/api/events/EVT-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tampered' }),
    });
    assert.ok(putRes.status === 404 || putRes.status === 405, `Update must not be allowed: ${putRes.status}`);
  });

  // 12. Real Analytics from Stored Events
  await test('Analytics: Computed dynamically from events and decisions', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics?includeDemo=true`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(typeof body.data.sampleSize === 'number', 'sampleSize should be a number');
    assert.ok(body.data.sampleSize > 0, 'Should have recorded events');
    assert.ok(Array.isArray(body.data.repeatViolations), 'repeatViolations should be an array');
    assert.ok(Array.isArray(body.data.overrideTable), 'overrideTable should be an array');
    assert.ok(Array.isArray(body.data.unclearRules), 'unclearRules should be an array');

    // CSV export route check
    const csvRes = await fetch(`${BASE_URL}/api/analytics/export-csv?includeDemo=true`);
    assert.strictEqual(csvRes.status, 200);
    const csvText = await csvRes.text();
    assert.ok(csvText.includes('SECTION') && csvText.includes('Repeat Violations'), 'CSV should contain valid sections and header');
  });

  // 13. Input Boundary Validation
  await test('Validation: Empty submission and 5,000+ char limit rejected', async () => {
    // Empty submission
    const resEmpty = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: '' }),
    });
    assert.strictEqual(resEmpty.status, 400);

    // Oversized submission > 5000 chars
    const resOver = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'SUB-OVER',
        title: 'Huge Content',
        content: 'A'.repeat(5001),
      }),
    });
    assert.strictEqual(resOver.status, 400);
    const overBody = await resOver.json();
    assert.ok(overBody.error.includes('5,000-character maximum limit'));
  });

  console.log(`\n======================================================`);
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
