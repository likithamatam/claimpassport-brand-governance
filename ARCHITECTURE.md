# Claim Passport — Technical Architecture & System Design

This document details the engineering architecture, data model, SQLite database schema, retrieval pipeline, and security decisions for **Claim Passport — Brand Governance That Proves Every Claim Before It Is Published**.

---

## 1. System Architecture Overview

Claim Passport employs a modern full-stack TypeScript architecture designed for deterministic governance, high auditability, and document-grounded verification.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (React 19 SPA)                     │
│  - Content Reviewer & Editor        - Approvals & Decision Timeline    │
│  - Living Fact Registry             - Source Documents & Passage Viewer│
│  - Analytics Dashboard (CSV Export) - In-App Notifications Drawer      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON API (Bearer Session Auth)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express 4 Server Proxy                          │
│  - Scrypt Password Auth & Sessions - RBAC Enforcement Middleware       │
│  - Deterministic Rules Engine      - Document Chunker & PDF Extractor  │
│  - BM25 Retrieval Engine           - Versioned Decision Engine         │
│  - Append-Only Event Store Proxy   - Analytics Aggregator              │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼ Grounded Prompt                ▼ Embedded Storage
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       AI Grounding Layer             │  │   SQLite Persistent Storage  │
│  - Model: gemini-3.8-flash           │  │   (node:sqlite DatabaseSync) │
│  - BM25 retrieved passages only      │  │  - users & sessions          │
│  - Quote & Passage ID validation     │  │  - living_facts              │
│  - Fallback: "AI unavailable:        │  │  - submissions & decisions   │
│    rules-only mode"                  │  │  - events (append-only)      │
└──────────────────────────────────────┘  │  - documents & passages      │
                                          │  - notifications             │
                                          │  - clarity_proposals         │
                                          └──────────────────────────────┘
```

---

## 2. Data Model & SQLite Schema

Data is stored persistently in `./data/claim_passport.db` using Node.js 22's built-in `node:sqlite` (`DatabaseSync`), requiring zero external database drivers or compilation.

### Database Tables & Schema

```sql
-- 1. Users & Passwords (Scrypt Hashed with Salt)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL
);

-- 2. Sessions (Survives server restart & browser reload)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Living Fact Registry (Dynamic Facts with Expiry & Owners)
CREATE TABLE IF NOT EXISTS living_facts (
  id TEXT PRIMARY KEY,
  claim TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  last_verified_date TEXT NOT NULL,
  category TEXT NOT NULL,
  refresh_requested INTEGER DEFAULT 0,
  refresh_notes TEXT
);

-- 4. Brand Guidelines (Governance Rules & Examples)
CREATE TABLE IF NOT EXISTS brand_guidelines (
  id TEXT PRIMARY KEY,
  rule_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  examples_good_json TEXT NOT NULL,
  examples_bad_json TEXT NOT NULL,
  version TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  violations_count INTEGER DEFAULT 0
);

-- 5. Submissions (Content Copy, Findings & Intent Lock)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  intent TEXT NOT NULL,
  content_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  status TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  created_by_department TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  assigned_reviewer TEXT NOT NULL,
  findings_json TEXT NOT NULL,
  suggested_revision TEXT,
  user_applied_revision TEXT,
  intent_preserved INTEGER DEFAULT 1,
  intent_lock_notes TEXT,
  approval_stamp_json TEXT,
  comments_json TEXT,
  content_version INTEGER DEFAULT 1,
  source_coverage_pct INTEGER DEFAULT 0
);

-- 6. Append-Only Events Store (Strictly Immutable Audit Log)
-- No UPDATE or DELETE route is provided in the API!
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  role TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  submission_id TEXT,
  rule_id TEXT,
  details_json TEXT NOT NULL,
  is_demo INTEGER DEFAULT 0
);

-- 7. Decisions Timeline (Immutable Decision Versions: v1, v2...)
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  content_version INTEGER NOT NULL,
  certificate_hash TEXT,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- 8. Source Documents (PDF, Markdown, Text)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

-- 9. Document Passages (Chunked 300-500 characters)
CREATE TABLE IF NOT EXISTS passages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  position_index INTEGER NOT NULL,
  passage_text TEXT NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 10. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 11. AI Rule Clarity Proposals
CREATE TABLE IF NOT EXISTS clarity_proposals (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  status TEXT NOT NULL,
  suggested_wording TEXT NOT NULL,
  good_example TEXT NOT NULL,
  bad_example TEXT NOT NULL,
  override_reason_summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

---

## 3. Document Chunking & BM25 Retrieval Pipeline

To prevent hallucinated citations and ground Gemini strictly in approved materials:

1. **Ingestion & Text Extraction**:
   - Files uploaded to `POST /api/documents/upload` (`.txt`, `.md`, `.pdf`).
   - Text extracted directly from plaintext or parsed from PDF streams via `pdf-parse` with a binary text-stream fallback.
   - Max file size: 5 MB.
2. **Chunking**:
   - Text is split into 300–500 character passages on natural sentence and newline boundaries.
   - Each passage records its `charStart`, `charEnd`, and `positionIndex`.
3. **BM25 Ranking Algorithm**:
   - Query text from the submission is tokenized (filtering standard stop words).
   - Term frequency (TF) and inverse document frequency (IDF) are computed across all passages and Living Fact summaries:
     $$\text{IDF}(q_i) = \ln\left(\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1\right)$$
   - Passages are ranked using standard Okapi BM25 parameters ($k_1 = 1.5, b = 0.75$).
   - The top 5 highest-scoring passages are passed to Gemini as Grounded Context.
4. **Citation Validation**:
   - Gemini is instructed to return `passageId` and verbatim `quote`.
   - The server validates whether the returned `passageId` was in the retrieved set. If not, the finding is marked `(Citation Unverified: Needs Human Review)`.

---

## 4. Architectural Design Decisions

| Decision | Rationale |
|---|---|
| **Persistent SQLite via `node:sqlite`** | Provides robust, relational multi-table storage that survives server restarts without external C++ compilation dependencies or cloud provisioning requirements. |
| **Backend RBAC Enforcement** | Rather than hiding UI buttons alone, all mutating API endpoints verify session tokens and roles. A Content Creator calling `/api/submissions/:id/decision` receives an HTTP 403 Forbidden and triggers an audit event. |
| **Append-Only Event Store** | Compliance and brand governance require that historical checks and actions cannot be erased or modified. By intentionally omitting `UPDATE` and `DELETE` endpoints, audit trails remain tamper-evident. |
| **Immutable Decision Timeline** | Approvals and change requests are versioned (v1, v2, v3...) in the `decisions` table rather than updating a single column in place. This guarantees a complete audit trail of who reviewed what, when, and why. |
| **Single Environment Variable for AI Model** | Centralizing the model name in `GEMINI_MODEL="gemini-3.8-flash"` prevents drift and makes model switching or auditing straightforward. |
| **Deterministic Rule Pre-Screening** | Time-critical and regulatory checks (e.g., date-based fact expiry and explicit banned phrases like "100% safe") run deterministically before and alongside LLM verification, ensuring zero false passes even during API degradation. |
