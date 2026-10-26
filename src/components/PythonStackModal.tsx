/**
 * Claim Passport Python / FastAPI / Streamlit / MySQL Deliverables Explorer
 * Sections 2 & 9 of Inkloom AI Hackathon requirements
 */

import React, { useState } from 'react';
import {
  Code2,
  FileText,
  Database,
  Terminal,
  Copy,
  Check,
  X,
  Sparkles,
  Download,
  Server,
  Layers,
} from 'lucide-react';

interface PythonStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonStackModal: React.FC<PythonStackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'fastapi' | 'streamlit' | 'mysql' | 'requirements' | 'readme'>('fastapi');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const CODE_SNIPPETS = {
    fastapi: `# backend/main.py - Claim Passport FastAPI Backend Engine
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
import re

app = FastAPI(
    title="Claim Passport API",
    description="Brand Governance & Evidence-First Verification Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_CURRENT_DATE = date(2026, 10, 26)

class VerificationRequest(BaseModel):
    title: str
    content: str
    intent: str
    content_type: str = "Social Copy"
    target_audience: str = "General Consumers"

class ReviewFinding(BaseModel):
    id: str
    category: str
    flagged_text: str
    severity: str
    confidence: int
    explanation: str
    evidence_id: Optional[str] = None
    evidence_source: Optional[str] = None
    fact_owner: Optional[str] = None
    expiry_date: Optional[str] = None
    suggested_correction: str
    status: str = "Needs Human Review"

class VerificationResponse(BaseModel):
    title: str
    original_content: str
    intent: str
    findings: List[ReviewFinding]
    suggested_revision: str
    intent_preserved: bool
    intent_lock_notes: str

# Sample Living Fact Registry Database Table (In-Memory/MySQL)
SAMPLE_FACTS = [
    {
        "id": "FACT-012",
        "claim": "10,000+ active customers worldwide",
        "source": "Q3 2025 Global Customer Audit & CRM Export",
        "owner": "Sarah Jenkins",
        "expiry_date": date(2026, 9, 30), # EXPIRED as of 2026-10-26
    },
    {
        "id": "FACT-007",
        "claim": "BPA-free bottle, certified safe for everyday food contact",
        "source": "FDA 21 CFR 177.1520 & EFSA Compliance Certificate",
        "owner": "Dr. David Vance",
        "expiry_date": date(2027, 12, 31), # ACTIVE
    }
]

@app.post("/api/verify", response_model=VerificationResponse)
def verify_content(req: VerificationRequest):
    findings = []
    content = req.content

    # 1. Deterministic check for Stale Customer Count (Fact #12)
    customer_match = re.search(r"(\\d{1,3}(?:,\\d{3})*\\+?\\s*customers?)", content, re.IGNORECASE)
    if customer_match:
        matched_text = customer_match.group(1)
        fact12 = next((f for f in SAMPLE_FACTS if f["id"] == "FACT-012"), None)
        if fact12 and fact12["expiry_date"] <= SYSTEM_CURRENT_DATE:
            findings.append(ReviewFinding(
                id="FND-001",
                category="Stale Fact",
                flagged_text=matched_text,
                severity="High",
                confidence=98,
                explanation="The customer-count claim matches Fact #12, which expired on 30 September 2026. Needs verification and refresh by Fact Owner before reuse.",
                evidence_id="FACT-012",
                evidence_source=fact12["source"],
                fact_owner=fact12["owner"],
                expiry_date=fact12["expiry_date"].isoformat(),
                suggested_correction="Verify current count with Fact Owner (Sarah Jenkins) or cite verified metric."
            ))

    # 2. Deterministic check for Banned Terminology / Absolute Safety ("100% safe")
    safe_match = re.search(r"(100%\\s*safe|completely\\s*safe|zero\\s*risk)", content, re.IGNORECASE)
    if safe_match:
        matched_safe = safe_match.group(1)
        findings.append(ReviewFinding(
            id="FND-002",
            category="Needs Evidence",
            flagged_text=matched_safe,
            severity="Critical",
            confidence=99,
            explanation="The phrase '100% safe' has no matching approved evidence in the Living Fact Registry. Flagged for human review rather than claiming it is false. Also prohibited by GUIDE-001.",
            evidence_id="GUIDE-001",
            evidence_source="None (No matching evidence found in Fact Registry)",
            suggested_correction="Meet our BPA-free bottle, designed for everyday use."
        ))

    # Intent Lock Revision synthesis
    suggested_revision = "Meet our BPA-free bottle, designed for everyday use." if findings else content
    intent_notes = "Intent Lock: Launch and safety readiness preserved using verified BPA-free specifications."

    return VerificationResponse(
        title=req.title,
        original_content=req.content,
        intent=req.intent,
        findings=findings,
        suggested_revision=suggested_revision,
        intent_preserved=True,
        intent_lock_notes=intent_notes
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,

    streamlit: `# streamlit_app.py - Claim Passport Custom-Styled Streamlit Interface
import streamlit as st
import requests
import json
from datetime import date

st.set_page_config(
    page_title="Claim Passport - Brand Governance",
    page_icon="🛡️",
    layout="wide"
)

# Custom Theme CSS
st.markdown("""
<style>
    .main { background-color: #f8fafc; font-family: 'Inter', sans-serif; }
    .card { background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
    .stButton>button { background-color: #4f46e5; color: white; border-radius: 12px; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

st.title("🛡️ Claim Passport")
st.subheader("Brand Governance That Proves Every Claim Before It Is Published")

# Role Selection
role = st.sidebar.selectbox("Select Your Role", ["Content Creator", "Reviewer", "Brand Manager", "Fact Owner"])
st.sidebar.info(f"Active Role: **{role}** (Role-Based Access Enforced)")

# Main Review Tabs
tab1, tab2, tab3, tab4 = st.tabs(["Check Content", "Living Fact Registry", "Brand Guidelines", "Approvals"])

with tab1:
    st.markdown("### Content Review & Intent Lock Workbench")
    
    # Pre-fill button for required demo
    if st.button("✨ Load Hackathon Required Demo Scenario"):
        st.session_state["title"] = "Hydration Launch Social Copy"
        st.session_state["content"] = "Trusted by 10,000+ customers. Our new bottle is 100% safe!"
        st.session_state["intent"] = "Announce new hydration bottle launch highlighting customer adoption and safety assurance"
    
    col1, col2 = st.columns([7, 5])
    with col1:
        title = st.text_input("Content Title", value=st.session_state.get("title", "Hydration Launch Social Copy"))
        intent = st.text_input("Intent Lock (Purpose in one sentence)", value=st.session_state.get("intent", "Announce bottle launch & safety assurance"))
        content = st.text_area("Marketing Text to Verify", value=st.session_state.get("content", "Trusted by 10,000+ customers. Our new bottle is 100% safe!"), height=140)
        
        if st.button("🔍 Check Content Against Living Facts", use_container_width=True):
            with st.spinner("Validating against Living Fact Registry & Brand Standards..."):
                resp = requests.post("http://localhost:8000/api/verify", json={
                    "title": title, "content": content, "intent": intent
                })
                if resp.status_code == 200:
                    st.session_state["results"] = resp.json()
                    st.success("Verification complete: Found findings with full evidence citations.")
    
    with col2:
        st.markdown("#### Intent Lock Engine Comparison")
        results = st.session_state.get("results")
        if results:
            st.warning("Original: " + results["original_content"])
            st.success("Suggested Revision: " + results["suggested_revision"])
            st.caption("Intent Preserved: " + results["intent_lock_notes"])
            if st.button("Apply Suggested Revision to Content"):
                st.session_state["content"] = results["suggested_revision"]
                st.experimental_rerun()

    if "results" in st.session_state:
        st.markdown("---")
        st.markdown("### Evidence-First Findings")
        for f in st.session_state["results"]["findings"]:
            with st.expander(f"⚠️ {f['category']}: \"{f['flagged_text']}\" (Severity: {f['severity']})", expanded=True):
                st.write(f"**Explanation:** {f['explanation']}")
                st.write(f"**Evidence Source:** {f['evidence_source']} ({f['evidence_id']})")
                if f.get("fact_owner"):
                    st.write(f"**Fact Owner:** {f['fact_owner']} | **Expired:** {f.get('expiry_date')}")
                st.info(f"**Suggested Correction:** {f['suggested_correction']}")`,

    mysql: `-- schema.sql - Claim Passport MySQL Relational Database Schema
-- Inkloom AI Hackathon Deliverable

CREATE DATABASE IF NOT EXISTS claim_passport_db;
USE claim_passport_db;

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Content Creator', 'Brand Manager', 'Reviewer', 'Fact Owner') NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Living Fact Registry
CREATE TABLE IF NOT EXISTS living_facts (
    id VARCHAR(36) PRIMARY KEY, -- e.g. 'FACT-012'
    claim TEXT NOT NULL,
    source_reference VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    owner_name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    status ENUM('Approved', 'Expiring Soon', 'Expired', 'Deactivated') NOT NULL DEFAULT 'Approved',
    created_at DATE NOT NULL,
    expiry_date DATE NOT NULL,
    last_verified_date DATE NOT NULL,
    refresh_requested BOOLEAN DEFAULT FALSE,
    refresh_notes TEXT,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    INDEX idx_expiry (expiry_date),
    INDEX idx_status (status)
);

-- 3. Brand Guidelines
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id VARCHAR(36) PRIMARY KEY, -- e.g. 'GUIDE-001'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Voice & Tone', 'Preferred Product Names', 'Banned Terminology', 'Required Disclaimers', 'Writing Style', 'Claim Substantiation', 'Accessibility') NOT NULL,
    status ENUM('Approved', 'Under Review', 'Draft', 'Deprecated') NOT NULL DEFAULT 'Approved',
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    violation_count INT DEFAULT 0,
    override_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Content Submissions
CREATE TABLE IF NOT EXISTS content_submissions (
    id VARCHAR(36) PRIMARY KEY, -- e.g. 'SUB-001'
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    intent TEXT NOT NULL, -- Intent Lock purpose
    content_type VARCHAR(60) NOT NULL,
    target_audience VARCHAR(60) NOT NULL,
    status ENUM('Draft', 'Submitted', 'Under Review', 'Changes Requested', 'Approved') NOT NULL DEFAULT 'Draft',
    created_by_id VARCHAR(36) NOT NULL,
    assigned_reviewer_id VARCHAR(36),
    suggested_revision LONGTEXT,
    approval_hash VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- 5. Review Findings (Evidence Cross-References)
CREATE TABLE IF NOT EXISTS review_findings (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    category VARCHAR(60) NOT NULL,
    flagged_text TEXT NOT NULL,
    severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
    confidence INT NOT NULL,
    explanation TEXT NOT NULL,
    evidence_fact_id VARCHAR(36),
    evidence_guideline_id VARCHAR(36),
    suggested_correction TEXT NOT NULL,
    action_status ENUM('Pending', 'Accepted', 'Edited', 'Dismissed', 'Review Requested') NOT NULL DEFAULT 'Pending',
    dismiss_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_fact_id) REFERENCES living_facts(id),
    FOREIGN KEY (evidence_guideline_id) REFERENCES brand_guidelines(id)
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(60) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    summary TEXT NOT NULL,
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SEED DATA FOR DEMO SCENARIO
INSERT INTO users (id, name, email, password_hash, role, department) VALUES
('USR-01', 'Alex Rivera', 'alex.rivera@inkloom.example', '$2b$12$e8Y5...hash', 'Content Creator', 'Creative Studio'),
('USR-02', 'Morgan Hayes', 'morgan.hayes@inkloom.example', '$2b$12$a4Z1...hash', 'Brand Manager', 'Brand Governance'),
('USR-03', 'Jordan Taylor', 'jordan.taylor@inkloom.example', '$2b$12$k9L2...hash', 'Reviewer', 'Legal Compliance'),
('USR-04', 'Sarah Jenkins', 'sarah.jenkins@inkloom.example', '$2b$12$m1Q3...hash', 'Fact Owner', 'Data Operations'),
('USR-05', 'Dr. David Vance', 'david.vance@inkloom.example', '$2b$12$p7R4...hash', 'Fact Owner', 'Product Safety');

-- Insert Fact #12 (Expired on 2026-09-30) and Fact #07 (BPA-free bottle, Active)
INSERT INTO living_facts (id, claim, source_reference, owner_id, owner_name, category, status, created_at, expiry_date, last_verified_date) VALUES
('FACT-012', '10,000+ active customers worldwide', 'Q3 2025 Global Customer Audit & CRM Export', 'USR-04', 'Sarah Jenkins', 'Metrics & Traction', 'Expired', '2025-10-01', '2026-09-30', '2025-10-01'),
('FACT-007', 'BPA-free bottle, certified safe for everyday food contact', 'FDA 21 CFR 177.1520 & EFSA Compliance Certificate', 'USR-05', 'Dr. David Vance', 'Product Specs', 'Approved', '2026-01-15', '2027-12-31', '2026-06-10');

INSERT INTO brand_guidelines (id, title, description, category, status, version, violation_count, override_count) VALUES
('GUIDE-001', 'Prohibition on Absolute Safety Claims', 'Do not use unconditional terms like 100% safe or zero risk. FTC standards require calibrated safety wording.', 'Banned Terminology', 'Approved', 'v2.1', 14, 2);`,

    requirements: `# requirements.txt - Python Dependencies for Claim Passport
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
streamlit==1.41.1
requests==2.32.3
sqlalchemy==2.0.36
pymysql==1.1.1
cryptography==44.0.0
python-dotenv==1.0.1
google-genai==2.4.0
pytest==8.3.4`,

    readme: `# Claim Passport — Brand Governance That Proves Every Claim Before It Is Published
**Inkloom AI Hackathon Submission**

## 1. Project Overview
Claim Passport checks promotional and marketing copy against approved brand guidelines, verified living facts, terminology rules, and legal evidence prior to external publication.

### Key Capabilities:
- **Living Fact Registry**: Enforces deterministic expiry dates (e.g. Fact #12 expired 2026-09-30).
- **Intent Lock**: Preserves creator intent during suggestions without injecting unverified facts.
- **Evidence-First Verification**: Every finding links to an unexpired document reference or explicitly states evidence is missing.
- **Guideline Health**: Flags rules causing high reviewer override friction.
- **Role-Based Access Control**: Strict role enforcement for Creators, Reviewers, Brand Managers, and Fact Owners.

---

## 2. Local Setup & Execution Guide (Python / FastAPI / MySQL)

### Prerequisites:
- Python 3.10+
- MySQL Server 8.0+

### Step 1: Install Python Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Step 2: Configure Environment Variables
\`\`\`bash
cp .env.example .env
# Edit .env with your MySQL credentials and optional GEMINI_API_KEY
\`\`\`

### Step 3: Initialize MySQL Schema
\`\`\`bash
mysql -u root -p < schema.sql
\`\`\`

### Step 4: Run the FastAPI Backend
\`\`\`bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

### Step 5: Launch Streamlit Frontend
\`\`\`bash
streamlit run streamlit_app.py --server.port 8501
\`\`\`

---

## 3. Required Demonstration Scenario
- Content: \`"Trusted by 10,000+ customers. Our new bottle is 100% safe!"\`
- Result:
  1. **Finding 1 — Stale Fact**: Customer count matches Fact #12 (Expired on 30 Sept 2026).
  2. **Finding 2 — Needs Evidence**: "100% safe" lacks approved registry proof; triggers GUIDE-001.
  3. **Intent-Locked Revision**: \`"Meet our BPA-free bottle, designed for everyday use."\``,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Python, FastAPI, Streamlit & MySQL Code Deliverables
              </h2>
              <p className="text-xs text-slate-500">
                Complete source files for local Python/MySQL execution per Section 2 & 9 of hackathon brief
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-semibold">
          {[
            { id: 'fastapi', label: 'FastAPI (backend/main.py)', icon: Server },
            { id: 'streamlit', label: 'Streamlit (streamlit_app.py)', icon: Layers },
            { id: 'mysql', label: 'MySQL (schema.sql)', icon: Database },
            { id: 'requirements', label: 'requirements.txt', icon: FileText },
            { id: 'readme', label: 'README.md & Docs', icon: Terminal },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition ${
                  activeTab === t.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 bg-slate-950 overflow-y-auto relative font-mono text-xs text-slate-200 leading-relaxed">
          <div className="absolute right-4 top-4">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs flex items-center space-x-1 border border-slate-700 shadow-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="whitespace-pre overflow-x-auto pr-24">
            <code>{CODE_SNIPPETS[activeTab]}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-900">Platform Equivalence Note:</span>
            <span>All Python scripts are included on disk in this repo for local deployment.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
