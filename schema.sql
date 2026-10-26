-- Claim Passport: MySQL Relational Database Schema
-- Brand Governance That Proves Every Claim Before It Is Published
-- Inkloom AI Hackathon MVP Deliverable

CREATE DATABASE IF NOT EXISTS claim_passport_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE claim_passport_db;

-- 1. Users & Stakeholder Roles
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Content Creator', 'Brand Manager', 'Reviewer', 'Fact Owner') NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Living Fact Registry (Single Source of Truth)
CREATE TABLE IF NOT EXISTS living_facts (
    id VARCHAR(36) PRIMARY KEY, -- e.g. 'FACT-012'
    claim TEXT NOT NULL,
    source_reference VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    owner_name VARCHAR(120) NOT NULL,
    category ENUM('Metrics & Traction', 'Product Specs', 'Compliance & Safety', 'Sustainability', 'Pricing & Terms') NOT NULL,
    status ENUM('Approved', 'Expiring Soon', 'Expired', 'Deactivated') NOT NULL DEFAULT 'Approved',
    created_at DATE NOT NULL,
    expiry_date DATE NOT NULL,
    last_verified_date DATE NOT NULL,
    refresh_requested BOOLEAN DEFAULT FALSE,
    refresh_notes TEXT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_expiry (expiry_date),
    INDEX idx_status (status)
);

-- 3. Brand Guidelines & Regulatory Constraints
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id VARCHAR(36) PRIMARY KEY, -- e.g. 'GUIDE-001'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Voice & Tone', 'Preferred Product Names', 'Banned Terminology', 'Required Disclaimers', 'Writing Style', 'Claim Substantiation', 'Accessibility') NOT NULL,
    status ENUM('Approved', 'Under Review', 'Draft', 'Deprecated') NOT NULL DEFAULT 'Approved',
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    examples_good TEXT,
    examples_bad TEXT,
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
    intent TEXT NOT NULL, -- Mandatory Intent Lock
    content_type ENUM('Social Copy', 'Blog Article', 'Product Packaging', 'Email Campaign', 'Press Release', 'Ad Headline') NOT NULL,
    target_audience ENUM('General Consumers', 'Eco-conscious Shoppers', 'B2B Enterprise', 'Healthcare Providers') NOT NULL,
    status ENUM('Draft', 'Submitted', 'Under Review', 'Changes Requested', 'Approved') NOT NULL DEFAULT 'Draft',
    created_by_id VARCHAR(36) NOT NULL,
    assigned_reviewer_id VARCHAR(36),
    suggested_revision LONGTEXT,
    approval_hash VARCHAR(100),
    approval_timestamp TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Review Findings (Evidence Cross-References)
CREATE TABLE IF NOT EXISTS review_findings (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    category ENUM('Stale Fact', 'Needs Evidence', 'Banned Terminology', 'Voice & Tone', 'Missing Disclaimer', 'Naming Inconsistency') NOT NULL,
    flagged_text TEXT NOT NULL,
    severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
    confidence INT NOT NULL,
    explanation TEXT NOT NULL,
    evidence_fact_id VARCHAR(36),
    evidence_guideline_id VARCHAR(36),
    suggested_correction TEXT NOT NULL,
    action_status ENUM('Pending', 'Accepted', 'Edited', 'Dismissed', 'Review Requested') NOT NULL DEFAULT 'Pending',
    dismiss_reason TEXT,
    reviewed_by VARCHAR(120),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_fact_id) REFERENCES living_facts(id) ON DELETE SET NULL,
    FOREIGN KEY (evidence_guideline_id) REFERENCES brand_guidelines(id) ON DELETE SET NULL
);

-- 6. Review Comments Dialogue
CREATE TABLE IF NOT EXISTS review_comments (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Immutable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(60) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(60) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    summary TEXT NOT NULL,
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_time (timestamp),
    INDEX idx_audit_user (user_id)
);

-- SEED DATA FOR DEMO SCENARIO
INSERT INTO users (id, name, email, password_hash, role, department) VALUES
('USR-01', 'Alex Rivera', 'alex.rivera@inkloom.example', '$2b$12$e8Y5...hash', 'Content Creator', 'Creative Studio'),
('USR-02', 'Morgan Hayes', 'morgan.hayes@inkloom.example', '$2b$12$a4Z1...hash', 'Brand Manager', 'Brand Governance'),
('USR-03', 'Jordan Taylor', 'jordan.taylor@inkloom.example', '$2b$12$k9L2...hash', 'Reviewer', 'Legal Compliance'),
('USR-04', 'Sarah Jenkins', 'sarah.jenkins@inkloom.example', '$2b$12$m1Q3...hash', 'Fact Owner', 'Data Operations'),
('USR-05', 'Dr. David Vance', 'david.vance@inkloom.example', '$2b$12$p7R4...hash', 'Fact Owner', 'Product Safety');

-- Insert Living Facts: Fact #12 (Expired on 2026-09-30) & Fact #07 (BPA-free bottle, Active)
INSERT INTO living_facts (id, claim, source_reference, owner_id, owner_name, category, status, created_at, expiry_date, last_verified_date) VALUES
('FACT-012', '10,000+ active customers worldwide', 'Q3 2025 Global Customer Audit & CRM Export (Report #CR-882)', 'USR-04', 'Sarah Jenkins', 'Metrics & Traction', 'Expired', '2025-10-01', '2026-09-30', '2025-10-01'),
('FACT-007', 'BPA-free bottle, certified safe for everyday food contact', 'FDA 21 CFR 177.1520 & EFSA Compliance Certificate #LAB-2026-401', 'USR-05', 'Dr. David Vance', 'Product Specs', 'Approved', '2026-01-15', '2027-12-31', '2026-06-10');

INSERT INTO brand_guidelines (id, title, description, category, status, version, violation_count, override_count) VALUES
('GUIDE-001', 'Prohibition on Absolute Safety & Efficacy Guarantees', 'Do not use unconditional terms like 100% safe, zero risk, or completely non-toxic guarantee. Regulatory standards require calibrated safety phrasing.', 'Banned Terminology', 'Approved', 'v2.1', 14, 2);
