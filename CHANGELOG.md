# Claim Passport — Changelog & Engineering Evolution

All notable technical changes, architectural upgrades, and feature additions implemented for the **Claim Passport — Brand Governance Platform**.

---

## [v3.0.0] - Hackathon Production Milestone

### 1. Data Layer & Persistence Architecture
- **Persistent SQLite Migration**: Replaced in-memory demo data with persistent relational SQLite storage (`./data/claim_passport.db`) leveraging Node 22 native `node:sqlite` (`DatabaseSync`).
- **Data Survival**: All living facts, submissions, decisions, user accounts, sessions, uploaded documents, passages, notifications, and audit events now survive full application reboots, dev server restarts, and browser reloads.
- **Append-Only Events Store**: Implemented immutable `events` table recording 11 discrete event types (`submission_created`, `check_run`, `finding_created`, `finding_accepted`, `finding_edited`, `finding_dismissed`, `review_requested`, `decision_approved`, `decision_rejected`, `fact_refreshed`, `unauthorised_attempt`). Strictly zero `UPDATE` or `DELETE` API routes provided.
- **Decision Versioning Timeline**: Transformed approval workflow from destructive in-place status updates to immutable versioned decisions (`v1`, `v2`, `v3`...). Each decision records timestamp, reviewer identity, reason, content version, and certificate hash.

### 2. Security & Backend RBAC Enforcement
- **Backend Role Enforcement**: Replaced client-only button visibility with server-side middleware (`requireRoles`). Any unauthorized attempt (e.g., Content Creator calling `/api/submissions/:id/decision` to approve) is immediately rejected with `403 Forbidden` (`UNAUTHORIZED_ROLE`) and appended to `events` as an `unauthorised_attempt` audit record.
- **Real User Authentication**: Implemented salted password hashing via Node.js native `crypto.scryptSync(password, salt, 64)`.
- **Session Tokens**: Bearer session tokens stored in SQLite `sessions` table, persisting across reloads and multi-tab workflows.
- **4 Pre-Configured Personas**: Quick 1-click persona switching for judges: Content Creator (Alex Rivera), Lead Reviewer (Jordan Taylor), Brand Manager (Elena Ramos), and Fact Owner (Dr. David Vance).

### 3. AI Layer & Model Grounding
- **Centralized Model Configuration**: Standardized model identifier to single environment variable `GEMINI_MODEL="gemini-3.8-flash"` with documented default in `.env.example`.
- **AI Failure Fallback ("AI unavailable: rules-only mode")**: Implemented graceful failure handling when Gemini is offline or rate-limited. System flags banner `"AI unavailable: rules-only mode"`, executes deterministic rules, and routes unsupported claims to human review rather than silently approving.
- **Document Grounding & BM25 Pipeline**: Added document upload endpoint (`.txt`, `.md`, `.pdf` up to 5 MB) with automatic chunking into 300–500 character passages. Implemented pure-Node Okapi BM25 retrieval to rank passages and feed top candidate evidence into Gemini prompts.
- **Citation Verification**: Validates that LLM-cited passage IDs and quotes match retrieved ground truth passages. Unverified citations are flagged with `(Citation Unverified: Needs Human Review)`.

### 4. Governance Analytics & Continuous Improvement
- **Dynamic Analytics Engine**: Replaced static metrics with dynamic aggregation strictly computed from `events` and `decisions` tables:
  - Top repeat violations by rule code and repeat offenders.
  - Reviewer override friction rates with recorded justification notes.
  - Reviewer disagreement cases (decisions that reversed previous decisions).
  - Reviewer turnaround times (average and median SLA hours).
  - AI Rule Clarity Suggestions with good and bad examples, with 1-click Admin approval to update guidelines to `v2.2-clarified`.
- **One-Click CSV Export**: Downloads audit metrics directly from `/api/analytics/export-csv`.

### 5. UI/UX Polish & Judge Experience
- **First-Run Guide Modal**: Interactive 5-step walkthrough outlining persona workflows, Intent Lock, and verification rules.
- **AI & Data Disclosure Modal**: Transparent disclosure detailing model version (`gemini-3.8-flash`), privacy boundaries, zero retention for model training, and human-in-the-loop sign-off policy.
- **In-App Notification Center**: Notification bell in navigation bar showing unread badges for Fact Owners (expired facts, expiring <=14 days, cited facts) and Creators (review updates).
- **Assigned to Me Filter**: Reviewers can filter approval queues by their assigned submissions.
- **Source Coverage Gauge**: Displays percentage of claims backed by verified unexpired source passages or Living Facts.
- **Input Validation**: Enforces 5,000-character maximum copy limit with live character counter and empty state guards.
- **Idempotent Decision Protection**: Prevents duplicate decision logs on rapid double-clicking.

### 6. Automated Testing Suite
- Implemented `tests/run-tests.js` executing 13 comprehensive end-to-end integration tests covering server health, authentication, banned terms, expired facts, RBAC 403 enforcement, audit logging, document chunking, BM25 retrieval, decision immutability, analytics aggregation, and input validation.
- Configured `"test": "node tests/run-tests.js"` in `package.json`.
