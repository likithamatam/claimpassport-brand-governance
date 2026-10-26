# Claim Passport — Brand Governance That Proves Every Claim Before It Is Published
**Inkloom AI Hackathon MVP**

Claim Passport is an AI-powered brand governance and content verification platform that checks marketing content against approved brand guidelines, verified living facts, terminology rules, and legal evidence before publication.

---

## 1. Core Architecture & Capabilities

1. **Living Fact Registry**: Facts are dynamic entities with registered owners, audit sources, and automated expiry dates. A fact that has expired (such as Fact #12 expiring on September 30, 2026) is deterministically blocked from being treated as verified.
2. **Intent Lock**: Creators define their marketing purpose before evaluation. When rewrites are generated, the system preserves the intended message and safety goals using *only* verified facts without hallucinating unverified claims.
3. **Evidence-First Verification**: Every finding shows the exact supporting source and ID, confidence score, and fact owner. When evidence is missing (e.g., for "100% safe"), it explicitly states "No evidence found" and routes to human review rather than falsely declaring it true or false.
4. **Role-Based Access Control**:
   - **Content Creator**: Submits copy, specifies Intent Lock, accepts/edits rewrites.
   - **Reviewer**: Evaluates claims, examines evidence, requests changes, and signs off.
   - **Brand Manager**: Manages and approves guidelines, monitors friction metrics, issues governance certificates.
   - **Fact Owner**: Manages Living Facts and responds to staleness refresh alerts.
5. **Guideline Health Insights**: Detects rules causing high reviewer override friction and recommends clarifications.
6. **Immutable Governance Audit Ledger**: Records all submissions, verifications, override justifications, and approval timestamps.

---

## 2. Required Demonstration Scenario Walkthrough

- **Brand**: EcoShield Hydration (Fictional Brand Demonstration)
- **Submitted Content**:
  > *"Trusted by 10,000+ customers. Our new bottle is 100% safe!"*
- **Approved Sample Evidence in Registry**:
  - **Fact #12**: *"10,000+ active customers worldwide"*, expired on **30 September 2026** (Owner: Sarah Jenkins).
  - **Fact #07 (Product Spec)**: *"BPA-free bottle, certified safe for everyday food contact"* (Owner: Dr. David Vance).
  - **GUIDE-001**: Prohibition on absolute safety claims (*"100% safe"*).

### Expected Findings:
1. **Finding 1 — Stale Fact**: Customer count matches Fact #12, which expired on September 30, 2026. Flagged with High severity; requires Fact Owner refresh before reuse.
2. **Finding 2 — Needs Evidence**: The phrase *"100% safe"* has no matching evidence in the Living Fact Registry. Flagged with Critical severity for human review rather than claiming it is false. Also triggers GUIDE-001.
3. **Suggested Intent-Locked Revision**:
  > *"Meet our BPA-free bottle, designed for everyday use."*
4. **Human Approval Controls**: The creator must explicitly approve the revision before replacing draft copy, and an authorized Reviewer or Brand Manager must sign off.

---

## 3. Technology Stack & Running Instructions

### Platform Runtime (Live Web App)
- **Frontend & Full-stack**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Express API with `@google/genai` (Gemini 3.8 Flash) proxy.
- **Run command**:
  ```bash
  npm run dev
  ```
  Access live on `http://localhost:3000`.

### Python & Streamlit / FastAPI / MySQL Stack
For local Python deployment per deliverables:
- **Prerequisites**: Python 3.10+, MySQL 8.0+
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set up database:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Start FastAPI backend:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. Start Streamlit frontend:
   ```bash
   streamlit run streamlit_app.py --server.port 8501
   ```

---

## 4. API Endpoints

- `POST /api/verify`: Runs claim extraction, living fact cross-referencing, deterministic expiry checks, and intent-locked revision generation.
- `GET /api/export/csv`: Exports complete brand governance and guideline health audit report.
- `GET /api/health`: Verifies server status and Gemini API key connectivity.
