# Claim Passport — Brand Governance That Proves Every Claim Before It Is Published

**Inkloom AI Hackathon Platform MVP**

Claim Passport is an enterprise AI brand governance and content verification platform. It acts as an authoritative firewall between creative copy generation and public distribution, checking every marketing claim against verified living facts, approved brand guidelines, uploaded source documents, terminology rules, and regulatory evidence before publication.

---

## 1. Key Features & Pillars

1. **Living Fact Registry**: Facts are dynamic entities with designated Fact Owners, audit citations, and automated expiry dates. Expired facts (such as Fact #12 expiring on September 30, 2026 vs current date October 26, 2026) are deterministically flagged as stale facts requiring owner re-verification.
2. **Document-Grounded Verification (BM25 + Gemini 3.8 Flash)**: Upload corporate source documents (`.txt`, `.md`, `.pdf` up to 5 MB). Documents are automatically parsed (with pure Node binary PDF stream extraction) and chunked into 300–500 character passages. BM25 algorithm retrieves candidate passages, and Gemini verifies claims against only the retrieved passages, validating passage IDs and citation quotes.
3. **Intent Lock Mechanism**: Creators specify their intended commercial goal and safety parameters before evaluation. When AI suggests revisions, the system preserves the strategic intent while stripping banned phrasing, replacing stale metrics with verified alternatives.
4. **Role-Based Access Control (RBAC Enforced on Backend)**:
   - **Content Creator** (`alex.rivera@inkloom.example`): Submits content, specifies Intent Lock, accepts/edits findings. **Strictly blocked with HTTP 403 Forbidden from approving content.**
   - **Reviewer** (`jordan.taylor@inkloom.example`): Evaluates evidence, assigns reviews, requests revisions, and issues governance sign-offs.
   - **Brand Manager** (`elena.ramos@inkloom.example`): Manages brand guidelines, reviews AI rule clarity proposals, issues cryptographic governance certificates.
   - **Fact Owner** (`david.vance@inkloom.example`): Manages Living Facts, receives automated expiry alerts, and validates scientific citations.
5. **Append-Only Events Store**: Immutable event log tracking every action (`submission_created`, `check_run`, `finding_created`, `finding_accepted`, `finding_edited`, `finding_dismissed`, `review_requested`, `decision_approved`, `decision_rejected`, `fact_refreshed`, `unauthorised_attempt`). Contains strictly **no UPDATE or DELETE routes**.
6. **Immutable Decision History Timeline**: When reviewers request changes or approve content, decisions are saved as versioned records (v1, v2, etc.). Decisions are never overwritten, and approved records include cryptographic governance verification hashes.
7. **Dynamic Analytics (Zero Hardcoded Stats)**: All metrics (repeat violations, override friction rates with recorded reasons, reviewer turnaround times, and rule clarity proposals) are computed dynamically from stored events and decisions, with one-click CSV export.
8. **In-App Notifications**: Real-time notifications for Fact Owners (expired facts, expiring <=14 days, citation mentions) and Creators (review assigned, changes requested).

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion animations.
- **Backend**: Node.js 22, Express 4, native `node:sqlite` (`DatabaseSync` for zero-native-compilation persistent database).
- **AI Core**: `@google/genai` TypeScript SDK using `gemini-3.8-flash` via server-side proxy (`/api/verify`).
- **Retrieval Engine**: BM25 ranking algorithm in pure Node.js with stop-word tokenization and term-frequency scoring over 300–500 character passages.
- **Document Ingestion**: Multi-format parser supporting `.txt`, `.md`, and `.pdf` (via `pdf-parse` with binary text extraction fallback).
- **Authentication**: Salted password hashing (`crypto.scryptSync`, 64 bytes) with persistent session tokens.

---

## 3. Demo Accounts & Personas

Claim Passport includes 4 pre-configured demo personas ready for evaluation:

| Persona | Name | Email | Password | Role | Responsibilities |
|---|---|---|---|---|---|
| **Content Creator** | Alex Rivera | `alex.rivera@inkloom.example` | `Password123!` | Content Creator | Writes social copy, sets Intent Lock, requests review |
| **Lead Reviewer** | Jordan Taylor | `jordan.taylor@inkloom.example` | `Password123!` | Reviewer | Governance review, change requests, final sign-off |
| **Brand Manager** | Elena Ramos | `elena.ramos@inkloom.example` | `Password123!` | Brand Manager | Guideline health, AI clarity approvals, certification |
| **Fact Owner** | Dr. David Vance | `david.vance@inkloom.example` | `Password123!` | Fact Owner | Living Fact maintenance, expiration renewals |

*Tip: Click the "Switch Persona" / "Quick Switch" buttons in the navigation bar or Auth Modal for instant one-click switching.*

---

## 4. Environment Variables & Configuration

Configuration is managed via `.env` (refer to `.env.example`):

```bash
# GEMINI_API_KEY: Required for Gemini AI API calls.
# Automatically injected in Google AI Studio environment.
GEMINI_API_KEY="your-gemini-api-key"

# GEMINI_MODEL: The exact Gemini model used for claim verification.
# Default is gemini-3.8-flash.
GEMINI_MODEL="gemini-3.8-flash"

# APP_URL: Host URL for self-referential links and callbacks.
APP_URL="http://localhost:3000"
```

### Exact Model String
The application uses **`gemini-3.8-flash`** as its single, centrally configured model identifier. It is read via `process.env.GEMINI_MODEL || 'gemini-3.8-flash'`.

### AI Failure / Offline Fallback Mode
If Gemini encounters a network timeout, quota limit, or missing key, Claim Passport gracefully transitions into:
> **"AI unavailable: rules-only mode"**
In this mode:
- Deterministic rules (expired facts, banned terms, absolute guarantees) continue to run uninterrupted.
- Any unsupported claims are automatically routed to **Human Review** (`status: "Needs Evidence"`).
- **The system never approves content silently.**

---

## 5. Quickstart & Running Instructions

### Running the Full-Stack Application
```bash
# 1. Install dependencies
npm install

# 2. Start development server (Express backend + Vite HMR)
npm run dev

# 3. Access web application
open http://localhost:3000
```

### Running Automated Test Suite
```bash
npm test
# or
node tests/run-tests.js
```
The test suite executes 13 automated tests against the running server, verifying RBAC 403 enforcement, audit logging, expired fact detection, document chunking, BM25 retrieval, and decision timeline immutability.

---

## 6. Required Demonstration Scenario Walkthrough (SUB-4053)

The pre-loaded demonstration submission **SUB-4053** tests the exact hackathon scenario:

- **Campaign**: EcoShield Hydration Launch
- **Submitted Content**:
  > *"Trusted by 10,000+ customers. Our new bottle is 100% safe!"*
- **Intent Lock**: Announce new eco bottle with high consumer trust.

### Step-by-Step Walkthrough:
1. **Log in as Alex Rivera** (`Content Creator`).
2. Navigate to **Content Review & Verification**.
3. Notice the highlighted findings:
   - **Stale Fact**: Matches Fact #12 (*10,000+ active customers*), which expired on **30 September 2026**. Flagged for Fact Owner refresh.
   - **Needs Evidence & Banned Term**: *"100% safe"* has zero approved evidence and violates rule `GUIDE-001` prohibiting absolute safety guarantees.
4. Observe the AI suggested revision:
   > *"Meet our BPA-free bottle, designed for everyday use."*
5. Click **"Apply Revision"** to update copy while preserving the Intent Lock.
6. Click **"Request Review"** and assign to **Jordan Taylor**.
7. Switch user to **Jordan Taylor** (`Reviewer`).
8. Go to **Approvals & Governance Sign-Off** and filter by *"Assigned to me"*.
9. Open SUB-4053:
   - Click **"Request Changes"** with note: *"Please re-verify customer metric."* (Saves Decision v1).
   - Enter revised feedback and click **"Approve & Sign Off"** (Saves Decision v2 with Certificate Hash `CP-CERT-...`).
10. Review the **Decision History Timeline** showing both immutable decisions.

---

## 7. Known Limitations & Future Roadmap

- **PDF Ingestion**: Currently supports text-based PDFs. Scanned image-only PDFs without an OCR layer require client-side OCR pre-processing.
- **Enterprise SSO / SAML**: Currently uses local scrypt-salted password authentication. Future roadmap includes Okta and Google Workspace SAML integration.
- **Real-Time Collaboration**: Current updates are persisted in SQLite and refreshed on actions; future roadmap includes WebSocket subscriptions for live multi-reviewer editing.
