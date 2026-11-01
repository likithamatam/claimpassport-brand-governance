# Claim Passport — Test Execution Report & Verification Matrix

This document provides the full empirical test matrix for **Claim Passport — Brand Governance That Proves Every Claim Before It Is Published**, including automated suite execution and manual verification scenarios.

---

## 1. Automated Test Suite Execution

All automated tests are implemented in `tests/run-tests.js` and can be executed via:
```bash
npm test
# or
node tests/run-tests.js
```

### Automated Suite Results (Run on 2026-10-31)

| # | Test Case | Target Subsystem | Result |
|---|---|---|---|
| 1 | Server Health & Facts Retrieval | Express API + SQLite | **PASSED** |
| 2 | Creator Login (`alex.rivera@inkloom.example`) | Scrypt Auth + Sessions | **PASSED** |
| 3 | Reviewer Login (`jordan.taylor@inkloom.example`) | Scrypt Auth + Sessions | **PASSED** |
| 4 | Absolute Claims & Banned Terms (`100% safe`) | Rules Engine (`GUIDE-001`) | **PASSED** |
| 5 | Expired Fact Detection (Expired 2026-09-30 vs 2026-10-26) | Rules Engine (`FACT-012`) | **PASSED** |
| 6 | RBAC Security: Creator Blocked from Approving (403 Forbidden) | Express RBAC Middleware | **PASSED** |
| 7 | Audit Log: `unauthorised_attempt` Recorded in Append-Only Events | Event Store | **PASSED** |
| 8 | Document Upload & Chunking (300–500 char passages) | Document Engine + SQLite | **PASSED** |
| 9 | Passage Retrieval for Uploaded Document | Passage Index | **PASSED** |
| 10 | Governance Workflow: Changes Requested -> Approved (v1 -> v2) | Decision Versioning Engine | **PASSED** |
| 11 | Append-Only Integrity: Rejects `DELETE` & `PUT` on Events | Security Boundary | **PASSED** |
| 12 | Dynamic Analytics Aggregation & CSV Export | Analytics Engine | **PASSED** |
| 13 | Input Boundary Validation (Empty copy & >5,000 char copy) | Input Validation Layer | **PASSED** |

**Summary: 13 Passed, 0 Failed (100% pass rate).**

---

## 2. Core Functional Verification Matrix

| Test Case ID | Test Scenario | Execution Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | **Active Fact Match** | Submit copy citing: *"Clinically proven 99.4% skin tolerance."* | Verification matches active fact `FACT-003` (valid until 2027-01-15). Confidence >= 95%, Green verified status indicator, citation displayed. | Correctly verified against `FACT-003` with 99.4% clinical match and source reference. | **PASS** |
| **TC-02** | **Expired Fact Detection** | Submit copy citing: *"Trusted by 10,000+ customers."* | Detected as stale fact against `FACT-012` (expired 2026-09-30 vs simulated system date 2026-10-26). Severity: High. Action: Flagged for refresh by Fact Owner. | Flagged as `Stale Fact` (`FND-DET-1`), Fact Owner David Vance identified, refresh notification generated. | **PASS** |
| **TC-03** | **Unsupported Claim** | Submit copy stating: *"Our proprietary bottle eliminates 99.9% of all airborne microbes."* | AI & document search finds no matching source passage or living fact. Severity: High. Flagged for human review; does not silently approve. | Flagged as `Needs Evidence` with explanation: *"No approved evidence found in source documents or Living Fact Registry."* | **PASS** |
| **TC-04** | **Banned Term / Absolute Claim** | Submit copy containing: *"Our new bottle is 100% safe!"* | Deterministic rules engine flags violation of `GUIDE-001` (absolute safety claims prohibition). Severity: Critical. Suggests certified alternative: *"Meet our BPA-free bottle, designed for everyday use."* | Critical violation flagged immediately; suggested correction provided preserving core intent. | **PASS** |
| **TC-05** | **No Issues (Clean Content)** | Submit copy: *"Our BPA-free bottle is designed for everyday hydration."* | All checks pass; Source Coverage = 100%; 0 high-severity findings; Ready for Reviewer Sign-Off. | Clean check passed with 0 blocking issues. Ready for governance stamp. | **PASS** |
| **TC-06** | **Unauthorised Approval Attempt** | Log in as Creator (`alex.rivera@inkloom.example`). Call `POST /api/submissions/:id/decision` with `Approved`. | Server responds with HTTP 403 Forbidden. Append-only events collection records `unauthorised_attempt` with actor ID and role. | Rejected with HTTP 403 `UNAUTHORIZED_ROLE`. Event logged in `events` table. UI shows red access denied notification. | **PASS** |
| **TC-07** | **Reviewer Override with Reason** | On finding `GUIDE-001`, click "Dismiss Finding" without entering reason, then retry with *"Approved by Legal Counsel under CFR 177.1520 exception."* | Empty dismissal is rejected with validation warning. Populated reason successfully dismisses finding and logs `finding_dismissed` event with mandatory justification. | Dismissal without reason was blocked; with reason succeeded and updated Analytics override table. | **PASS** |
| **TC-08** | **AI Failure / Offline Fallback** | Simulate Gemini network timeout / invalid key / offline state. | System gracefully displays banner: *"AI unavailable: rules-only mode"*. Deterministic rules run normally. Unsupported claims sent to human review. Never approves silently. | Displays `"AI unavailable: rules-only mode"` banner; deterministic rules execute flawlessly. | **PASS** |
| **TC-09** | **Duplicate Click / Idempotency** | Double click or replay `POST /api/submissions/:id/decision` with identical decision and feedback. | Backend returns `{ idempotent: true }` without creating duplicate decision versions or duplicate events. UI button disables during submission (`Submitting...`). | Second call returns existing decision record; no redundant row inserted; UI button disables while busy. | **PASS** |
| **TC-10** | **Bad File Upload & Size Boundary** | 1. Upload `.exe` file.<br>2. Upload 6 MB PDF.<br>3. Upload valid 250 KB `.txt` or `.md`. | 1. Rejected: *"Unsupported file type"*. Only `.txt`, `.md`, `.pdf` permitted.<br>2. Rejected: *"File size exceeds 5 MB limit"*. <br>3. Accepted, chunked into 300–500 char passages with positions. | Proper validation errors returned for invalid extensions and oversized payloads; valid files chunked cleanly. | **PASS** |
| **TC-11** | **Submission >5,000 Char Limit** | Submit marketing content containing 5,001 characters. | Rejected on client and backend with clear error message: *"Content length (5,001 characters) exceeds the 5,000-character maximum limit."* | Blocked with 400 Bad Request and character count indicator in UI. | **PASS** |
| **TC-12** | **Versioned Decision Timeline** | 1. Reviewer requests changes on SUB-4053.<br>2. Creator edits copy.<br>3. Reviewer approves revised copy. | Decision history records v1 (`Changes Requested`) and v2 (`Approved`) in immutable chronological timeline. Neither decision is overwritten. | Both versions visible in `Decision History Timeline` with reviewer identity, timestamp, and certificate hash. | **PASS** |

---

## 3. Security & Immutability Verification

1. **Password Storage**: Passwords are never stored in plain text. Salt is generated via `crypto.randomBytes(16)` and hashed using `crypto.scryptSync(password, salt, 64)`.
2. **Session Persistence**: Sessions are tracked in SQLite `sessions` table and survive browser refreshes and server restarts.
3. **No Update/Delete Routes for Events**: `DELETE /api/events/:id` and `PUT /api/events/:id` return `404 Not Found`. SQLite triggers or application constraints ensure audit logs cannot be edited or erased.
4. **Backend Role Enforcement**: Every mutating route checks bearer session authentication and user roles (`requireRoles('Reviewer', 'Brand Manager')` or inline role validation).
