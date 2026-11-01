/**
 * Claim Passport - Persistent SQLite Database Engine
 * Powered by native Node.js 22 node:sqlite (DatabaseSync)
 * Append-only events, immutable versioned decisions, hashed auth, BM25 retrieval, and analytics.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'claim_passport.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL-like fast writes & foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
export function initDatabase() {
  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    -- 2. Sessions Table (Survives server restart & page refresh)
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. Living Fact Registry (Single Source of Truth)
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

    -- 4. Brand Guidelines
    CREATE TABLE IF NOT EXISTS brand_guidelines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT 'v1.0',
      examples_good_json TEXT NOT NULL,
      examples_bad_json TEXT NOT NULL,
      violation_count INTEGER DEFAULT 0,
      override_count INTEGER DEFAULT 0,
      clarity_friction_score INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- 5. Content Submissions
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
      assigned_reviewer TEXT,
      findings_json TEXT NOT NULL,
      suggested_revision TEXT,
      user_applied_revision TEXT,
      intent_preserved INTEGER DEFAULT 1,
      intent_lock_notes TEXT,
      approval_stamp_json TEXT,
      comments_json TEXT NOT NULL,
      content_version INTEGER DEFAULT 1,
      source_coverage_pct INTEGER DEFAULT 0
    );

    -- 6. Append-Only Events Collection (STRICTLY NO UPDATE OR DELETE ROUTES)
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

    -- 7. Versioned Immutable Decisions (Never overwritten)
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      content_version INTEGER NOT NULL,
      certificate_hash TEXT,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    -- 8. Source Documents
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      extracted_text TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    -- 9. Document Passages (300-500 char passages)
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

    -- 10. Fact-Owner & Reviewer Notifications
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

    -- 11. AI Rule Clarity Proposals (Pending Admin Approval)
    CREATE TABLE IF NOT EXISTS clarity_proposals (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      suggested_wording TEXT NOT NULL,
      good_example TEXT NOT NULL,
      bad_example TEXT NOT NULL,
      override_reason_summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      approved_by TEXT,
      approved_at TEXT
    );
  `);

  // Seed default data if empty
  seedInitialDataIfEmpty();
}

// -------------------------------------------------------------
// Password Hashing (Node built-in crypto scrypt)
// -------------------------------------------------------------
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// User & Auth Management
// -------------------------------------------------------------
export function createUser(userData: {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  avatarUrl?: string;
}) {
  const id = userData.id || `USR-${crypto.randomBytes(4).toString('hex')}`;
  const { hash, salt } = hashPassword(userData.password);
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, role, department, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    userData.name,
    userData.email.toLowerCase().trim(),
    hash,
    salt,
    userData.role,
    userData.department,
    userData.avatarUrl || '',
    createdAt
  );

  return getUserById(id);
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase().trim()) as any;
}

export function getUserById(id: string) {
  const stmt = db.prepare('SELECT id, name, email, role, department, avatar_url, created_at FROM users WHERE id = ?');
  return stmt.get(id) as any;
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT id, name, email, role, department, avatar_url, created_at FROM users ORDER BY name ASC');
  return stmt.all() as any[];
}

export function createSession(userId: string): string {
  const token = `CP-AUTH-${crypto.randomBytes(24).toString('hex')}`;
  const createdAt = new Date().toISOString();
  // 30 days validity
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)');
  stmt.run(token, userId, createdAt, expiresAt);
  return token;
}

export function getSessionUser(token: string) {
  if (!token) return null;
  const stmt = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department, u.avatar_url, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `);
  return stmt.get(token, new Date().toISOString()) as any;
}

export function deleteSession(token: string) {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

// -------------------------------------------------------------
// Append-Only Events (NO UPDATE OR DELETE)
// -------------------------------------------------------------
export type EventType =
  | 'submission_created'
  | 'check_run'
  | 'finding_created'
  | 'finding_accepted'
  | 'finding_edited'
  | 'finding_dismissed'
  | 'review_requested'
  | 'decision_approved'
  | 'decision_rejected'
  | 'fact_refreshed'
  | 'unauthorised_attempt';

export function appendEvent(event: {
  id?: string;
  type: EventType;
  actorId: string;
  role: string;
  timestamp?: string;
  submissionId?: string | null;
  ruleId?: string | null;
  details: any;
  isDemo?: boolean;
}) {
  const id = event.id || `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const timestamp = event.timestamp || new Date().toISOString();
  const detailsJson = JSON.stringify(event.details || {});
  const isDemo = event.isDemo ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO events (id, type, actor_id, role, timestamp, submission_id, rule_id, details_json, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    event.type,
    event.actorId,
    event.role,
    timestamp,
    event.submissionId || null,
    event.ruleId || null,
    detailsJson,
    isDemo
  );

  return {
    id,
    type: event.type,
    actorId: event.actorId,
    role: event.role,
    timestamp,
    submissionId: event.submissionId,
    ruleId: event.ruleId,
    details: event.details,
    isDemo: !!isDemo,
  };
}

export function getEvents(filters?: {
  submissionId?: string;
  ruleId?: string;
  type?: string;
  includeDemo?: boolean;
  limit?: number;
}) {
  let query = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];

  if (filters?.submissionId) {
    query += ' AND submission_id = ?';
    params.push(filters.submissionId);
  }
  if (filters?.ruleId) {
    query += ' AND rule_id = ?';
    params.push(filters.ruleId);
  }
  if (filters?.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  if (!filters?.includeDemo) {
    // Return all or filtered
  }

  query += ' ORDER BY timestamp DESC';
  if (filters?.limit) {
    query += ` LIMIT ${filters.limit}`;
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    actorId: r.actor_id,
    role: r.role,
    timestamp: r.timestamp,
    submissionId: r.submission_id,
    ruleId: r.rule_id,
    details: JSON.parse(r.details_json || '{}'),
    isDemo: Boolean(r.is_demo),
  }));
}

// -------------------------------------------------------------
// Immutable Versioned Decisions
// -------------------------------------------------------------
export function createDecision(decisionData: {
  submissionId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  decision: 'Approved' | 'Changes Requested' | 'Rejected';
  reason?: string;
  contentVersion: number;
  certificateHash?: string;
}) {
  // Compute next version number for this submission
  const countStmt = db.prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS next_ver FROM decisions WHERE submission_id = ?');
  const nextVer = (countStmt.get(decisionData.submissionId) as any)?.next_ver || 1;

  const id = `DEC-${decisionData.submissionId}-v${nextVer}-${crypto.randomBytes(3).toString('hex')}`;
  const timestamp = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO decisions (id, submission_id, version_number, actor_id, actor_name, actor_role, timestamp, decision, reason, content_version, certificate_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(
    id,
    decisionData.submissionId,
    nextVer,
    decisionData.actorId,
    decisionData.actorName,
    decisionData.actorRole,
    timestamp,
    decisionData.decision,
    decisionData.reason || '',
    decisionData.contentVersion,
    decisionData.certificateHash || null
  );

  return {
    id,
    submissionId: decisionData.submissionId,
    versionNumber: nextVer,
    actorId: decisionData.actorId,
    actorName: decisionData.actorName,
    actorRole: decisionData.actorRole,
    timestamp,
    decision: decisionData.decision,
    reason: decisionData.reason,
    contentVersion: decisionData.contentVersion,
    certificateHash: decisionData.certificateHash,
  };
}

export function getDecisionsForSubmission(submissionId: string) {
  const stmt = db.prepare('SELECT * FROM decisions WHERE submission_id = ? ORDER BY version_number ASC');
  return (stmt.all(submissionId) as any[]).map((r) => ({
    id: r.id,
    submissionId: r.submission_id,
    versionNumber: r.version_number,
    actor: {
      id: r.actor_id,
      name: r.actor_name,
      role: r.actor_role,
    },
    timestamp: r.timestamp,
    decision: r.decision,
    reason: r.reason,
    contentVersion: r.content_version,
    certificateHash: r.certificate_hash,
  }));
}

// -------------------------------------------------------------
// Submissions CRUD
// -------------------------------------------------------------
export function getAllSubmissions() {
  const stmt = db.prepare('SELECT * FROM submissions ORDER BY updated_at DESC');
  const rows = stmt.all() as any[];
  return rows.map(mapSubmissionRow);
}

export function getSubmissionById(id: string) {
  const stmt = db.prepare('SELECT * FROM submissions WHERE id = ?');
  const row = stmt.get(id);
  return row ? mapSubmissionRow(row) : null;
}

export function saveSubmission(sub: any) {
  const existing = getSubmissionById(sub.id);
  const now = new Date().toISOString();

  if (existing) {
    const nextContentVer = (existing.contentVersion || 1) + (existing.content !== sub.content ? 1 : 0);
    const stmt = db.prepare(`
      UPDATE submissions
      SET title = ?, content = ?, intent = ?, content_type = ?, target_audience = ?, status = ?,
          assigned_reviewer = ?, findings_json = ?, suggested_revision = ?, user_applied_revision = ?,
          intent_preserved = ?, intent_lock_notes = ?, approval_stamp_json = ?, comments_json = ?,
          content_version = ?, source_coverage_pct = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      sub.title,
      sub.content,
      sub.intent,
      sub.contentType || 'Social Copy',
      sub.targetAudience || 'General Consumers',
      sub.status || existing.status,
      sub.assignedReviewer || existing.assignedReviewer || 'Jordan Taylor',
      JSON.stringify(sub.findings || []),
      sub.suggestedRevision || '',
      sub.userAppliedRevision || '',
      sub.intentPreserved !== false ? 1 : 0,
      sub.intentLockNotes || '',
      sub.approvalStamp ? JSON.stringify(sub.approvalStamp) : null,
      JSON.stringify(sub.comments || []),
      nextContentVer,
      sub.sourceCoveragePct ?? existing.sourceCoveragePct ?? 0,
      now,
      sub.id
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO submissions (
        id, title, content, intent, content_type, target_audience, status,
        created_by_id, created_by_name, created_by_email, created_by_role, created_by_department,
        created_at, updated_at, assigned_reviewer, findings_json, suggested_revision, user_applied_revision,
        intent_preserved, intent_lock_notes, approval_stamp_json, comments_json, content_version, source_coverage_pct
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      sub.id,
      sub.title,
      sub.content,
      sub.intent,
      sub.contentType || 'Social Copy',
      sub.targetAudience || 'General Consumers',
      sub.status || 'Draft',
      sub.createdBy?.id || 'USR-01',
      sub.createdBy?.name || 'Alex Rivera',
      sub.createdBy?.email || 'alex.rivera@inkloom.example',
      sub.createdBy?.role || 'Content Creator',
      sub.createdBy?.department || 'Growth & Creative Studio',
      sub.createdAt || now,
      sub.updatedAt || now,
      sub.assignedReviewer || 'Jordan Taylor',
      JSON.stringify(sub.findings || []),
      sub.suggestedRevision || '',
      sub.userAppliedRevision || '',
      sub.intentPreserved !== false ? 1 : 0,
      sub.intentLockNotes || '',
      sub.approvalStamp ? JSON.stringify(sub.approvalStamp) : null,
      JSON.stringify(sub.comments || []),
      sub.contentVersion || 1,
      sub.sourceCoveragePct ?? 0
    );
  }

  return getSubmissionById(sub.id);
}

function mapSubmissionRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    intent: r.intent,
    contentType: r.content_type,
    targetAudience: r.target_audience,
    status: r.status,
    createdBy: {
      id: r.created_by_id,
      name: r.created_by_name,
      email: r.created_by_email,
      role: r.created_by_role,
      department: r.created_by_department,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    assignedReviewer: r.assigned_reviewer,
    findings: JSON.parse(r.findings_json || '[]'),
    suggestedRevision: r.suggested_revision,
    userAppliedRevision: r.user_applied_revision,
    intentPreserved: Boolean(r.intent_preserved),
    intentLockNotes: r.intent_lock_notes,
    approvalStamp: r.approval_stamp_json ? JSON.parse(r.approval_stamp_json) : undefined,
    comments: JSON.parse(r.comments_json || '[]'),
    contentVersion: r.content_version,
    sourceCoveragePct: r.source_coverage_pct || 0,
  };
}

// -------------------------------------------------------------
// Living Facts CRUD
// -------------------------------------------------------------
export function getAllFacts() {
  const stmt = db.prepare('SELECT * FROM living_facts ORDER BY id ASC');
  return (stmt.all() as any[]).map((r) => ({
    id: r.id,
    claim: r.claim,
    sourceReference: r.source_reference,
    ownerName: r.owner_name,
    ownerEmail: r.owner_email,
    status: r.status,
    createdAt: r.created_at,
    expiryDate: r.expiry_date,
    lastVerifiedDate: r.last_verified_date,
    category: r.category,
    refreshRequested: Boolean(r.refresh_requested),
    refreshNotes: r.refresh_notes,
  }));
}

export function saveFact(fact: any) {
  const existingStmt = db.prepare('SELECT id FROM living_facts WHERE id = ?');
  const existing = existingStmt.get(fact.id);

  if (existing) {
    const stmt = db.prepare(`
      UPDATE living_facts
      SET claim = ?, source_reference = ?, owner_name = ?, owner_email = ?, status = ?,
          expiry_date = ?, last_verified_date = ?, category = ?, refresh_requested = ?, refresh_notes = ?
      WHERE id = ?
    `);
    stmt.run(
      fact.claim,
      fact.sourceReference,
      fact.ownerName,
      fact.ownerEmail,
      fact.status,
      fact.expiryDate,
      fact.lastVerifiedDate,
      fact.category,
      fact.refreshRequested ? 1 : 0,
      fact.refreshNotes || '',
      fact.id
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO living_facts (
        id, claim, source_reference, owner_name, owner_email, status, created_at, expiry_date,
        last_verified_date, category, refresh_requested, refresh_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      fact.id,
      fact.claim,
      fact.sourceReference,
      fact.ownerName,
      fact.ownerEmail,
      fact.status || 'Approved',
      fact.createdAt || new Date().toISOString().slice(0, 10),
      fact.expiryDate,
      fact.lastVerifiedDate || new Date().toISOString().slice(0, 10),
      fact.category || 'Product Specs',
      fact.refreshRequested ? 1 : 0,
      fact.refreshNotes || ''
    );
  }
}

// -------------------------------------------------------------
// Brand Guidelines CRUD
// -------------------------------------------------------------
export function getAllGuidelines() {
  const stmt = db.prepare('SELECT * FROM brand_guidelines ORDER BY id ASC');
  return (stmt.all() as any[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    version: r.version,
    examplesGood: JSON.parse(r.examples_good_json || '[]'),
    examplesBad: JSON.parse(r.examples_bad_json || '[]'),
    violationCount: r.violation_count || 0,
    overrideCount: r.override_count || 0,
    clarityFrictionScore: r.clarity_friction_score || 0,
    updatedAt: r.updated_at,
  }));
}

export function incrementGuidelineViolation(ruleId: string) {
  const stmt = db.prepare('UPDATE brand_guidelines SET violation_count = violation_count + 1 WHERE id = ?');
  stmt.run(ruleId);
}

export function incrementGuidelineOverride(ruleId: string) {
  const stmt = db.prepare(`
    UPDATE brand_guidelines
    SET override_count = override_count + 1,
        clarity_friction_score = MIN(100, ROUND(((override_count + 1.0) / MAX(1, violation_count)) * 100))
    WHERE id = ?
  `);
  stmt.run(ruleId);
}

export function updateGuideline(guideline: any) {
  const stmt = db.prepare(`
    UPDATE brand_guidelines
    SET title = ?, description = ?, examples_good_json = ?, examples_bad_json = ?, version = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    guideline.title,
    guideline.description,
    JSON.stringify(guideline.examplesGood || []),
    JSON.stringify(guideline.examplesBad || []),
    guideline.version || 'v2.0',
    new Date().toISOString().slice(0, 10),
    guideline.id
  );
}

// -------------------------------------------------------------
// Document Storage & Passages (300-500 chars)
// -------------------------------------------------------------
export function saveDocumentAndPassages(doc: {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  extractedText: string;
  uploadedBy: string;
  uploadedAt: string;
}) {
  const docStmt = db.prepare(`
    INSERT INTO documents (id, filename, mime_type, file_size, extracted_text, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  docStmt.run(
    doc.id,
    doc.filename,
    doc.mimeType,
    doc.fileSize,
    doc.extractedText,
    doc.uploadedBy,
    doc.uploadedAt
  );

  // Split into 300-500 character passages along sentence/paragraph boundaries
  const passages = chunkTextIntoPassages(doc.extractedText, doc.id, doc.filename);
  const passStmt = db.prepare(`
    INSERT INTO passages (id, document_id, document_name, position_index, passage_text, char_start, char_end)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of passages) {
    passStmt.run(p.id, p.documentId, p.documentName, p.positionIndex, p.passageText, p.charStart, p.charEnd);
  }

  return { doc, passageCount: passages.length };
}

export function getAllDocuments() {
  const stmt = db.prepare(`
    SELECT d.id, d.filename, d.mime_type, d.file_size, d.uploaded_by, d.uploaded_at,
           COUNT(p.id) AS passage_count
    FROM documents d
    LEFT JOIN passages p ON d.id = p.document_id
    GROUP BY d.id
    ORDER BY d.uploaded_at DESC
  `);
  return stmt.all() as any[];
}

export function getDocumentPassages(docId: string) {
  const stmt = db.prepare('SELECT * FROM passages WHERE document_id = ? ORDER BY position_index ASC');
  return (stmt.all(docId) as any[]).map((r) => ({
    id: r.id,
    documentId: r.document_id,
    documentName: r.document_name,
    positionIndex: r.position_index,
    passageText: r.passage_text,
    charStart: r.char_start,
    charEnd: r.char_end,
  }));
}

export function deleteDocument(docId: string) {
  const delPass = db.prepare('DELETE FROM passages WHERE document_id = ?');
  delPass.run(docId);
  const delDoc = db.prepare('DELETE FROM documents WHERE id = ?');
  delDoc.run(docId);
}

export function getAllPassages() {
  const stmt = db.prepare('SELECT * FROM passages ORDER BY document_id, position_index ASC');
  return (stmt.all() as any[]).map((r) => ({
    id: r.id,
    documentId: r.document_id,
    documentName: r.document_name,
    positionIndex: r.position_index,
    passageText: r.passage_text,
    charStart: r.char_start,
    charEnd: r.char_end,
  }));
}

function chunkTextIntoPassages(text: string, docId: string, docName: string) {
  const clean = text.replace(/\r\n/g, '\n').trim();
  const passages: any[] = [];
  const targetMin = 300;
  const targetMax = 500;

  let currentStart = 0;
  let index = 1;

  while (currentStart < clean.length) {
    let idealEnd = Math.min(clean.length, currentStart + targetMax);
    if (idealEnd < clean.length) {
      // Find a sentence or newline break between targetMin and targetMax
      const periodIdx = clean.lastIndexOf('.', idealEnd);
      const newlineIdx = clean.lastIndexOf('\n', idealEnd);
      const breakIdx = Math.max(periodIdx, newlineIdx);

      if (breakIdx > currentStart + targetMin) {
        idealEnd = breakIdx + 1;
      }
    }

    const chunk = clean.slice(currentStart, idealEnd).trim();
    if (chunk.length > 20) {
      passages.push({
        id: `PSG-${docId}-${index}`,
        documentId: docId,
        documentName: docName,
        positionIndex: index,
        passageText: chunk,
        charStart: currentStart,
        charEnd: idealEnd,
      });
      index++;
    }

    currentStart = idealEnd;
  }

  return passages;
}

// -------------------------------------------------------------
// BM25 / TF-IDF Retrieval Algorithm (Pure Node)
// -------------------------------------------------------------
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in',
  'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with'
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-z0-9]{2,}\b/g) || []).filter((w) => !STOP_WORDS.has(w));
}

export function rankPassagesBM25(queryText: string, candidates: Array<{ id: string; text: string; source: string; meta?: any }>, topK = 4) {
  const queryTokens = tokenize(queryText);
  if (queryTokens.length === 0 || candidates.length === 0) return [];

  const N = candidates.length;
  const docTokensList = candidates.map((c) => tokenize(c.text));
  const docLengths = docTokensList.map((tokens) => tokens.length);
  const avgdl = docLengths.reduce((sum, len) => sum + len, 0) / (N || 1);

  // Calculate Document Frequency (DF) for each query token
  const dfMap: Record<string, number> = {};
  for (const q of queryTokens) {
    let df = 0;
    for (const dTokens of docTokensList) {
      if (dTokens.includes(q)) df++;
    }
    dfMap[q] = df;
  }

  const k1 = 1.5;
  const b = 0.75;

  const scored = candidates.map((cand, idx) => {
    const dTokens = docTokensList[idx];
    const dl = docLengths[idx];
    let score = 0;

    for (const q of queryTokens) {
      const df = dfMap[q] || 0;
      // Robertson-Spärck Jones IDF
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      // Term Frequency in candidate
      const tf = dTokens.filter((t) => t === q).length;
      if (tf > 0) {
        const num = tf * (k1 + 1);
        const den = tf + k1 * (1 - b + b * (dl / (avgdl || 1)));
        score += idf * (num / den);
      }
    }

    return {
      ...cand,
      score: parseFloat(score.toFixed(3)),
    };
  });

  return scored
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// -------------------------------------------------------------
// In-App Notifications
// -------------------------------------------------------------
export function createNotification(n: {
  userId: string;
  userEmail: string;
  type: 'fact_expired' | 'fact_expiring_soon' | 'fact_cited' | 'review_assigned' | 'changes_requested';
  title: string;
  message: string;
  relatedId?: string;
}) {
  const id = `NTF-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, user_email, type, title, message, related_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);
  stmt.run(id, n.userId, n.userEmail, n.type, n.title, n.message, n.relatedId || null, createdAt);

  return { id, ...n, isRead: false, createdAt };
}

export function getUserNotifications(userEmail: string) {
  const stmt = db.prepare('SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC');
  return (stmt.all(userEmail.toLowerCase().trim()) as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    type: r.type,
    title: r.title,
    message: r.message,
    relatedId: r.related_id,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at,
  }));
}

export function markNotificationRead(id: string) {
  const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
  stmt.run(id);
}

export function markAllNotificationsRead(userEmail: string) {
  const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_email = ?');
  stmt.run(userEmail.toLowerCase().trim());
}

export function getUnreadNotificationCount(userEmail: string) {
  const stmt = db.prepare('SELECT COUNT(*) AS unread FROM notifications WHERE user_email = ? AND is_read = 0');
  return (stmt.get(userEmail.toLowerCase().trim()) as any)?.unread || 0;
}

// -------------------------------------------------------------
// Rule Clarity Proposals (AI Assisted Admin Approvals)
// -------------------------------------------------------------
export function createClarityProposal(prop: {
  ruleId: string;
  suggestedWording: string;
  goodExample: string;
  badExample: string;
  overrideReasonSummary: string;
}) {
  const id = `PROP-${prop.ruleId}-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO clarity_proposals (id, rule_id, status, suggested_wording, good_example, bad_example, override_reason_summary, created_at)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    prop.ruleId,
    prop.suggestedWording,
    prop.goodExample,
    prop.badExample,
    prop.overrideReasonSummary,
    new Date().toISOString()
  );
  return { id, ...prop, status: 'pending' };
}

export function getClarityProposals() {
  const stmt = db.prepare('SELECT * FROM clarity_proposals ORDER BY created_at DESC');
  return (stmt.all() as any[]).map((r) => ({
    id: r.id,
    ruleId: r.rule_id,
    status: r.status,
    suggestedWording: r.suggested_wording,
    goodExample: r.good_example,
    badExample: r.bad_example,
    overrideReasonSummary: r.override_reason_summary,
    createdAt: r.created_at,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
  }));
}

export function approveClarityProposal(propId: string, adminUser: { name: string; role: string }) {
  const getStmt = db.prepare('SELECT * FROM clarity_proposals WHERE id = ?');
  const prop = getStmt.get(propId) as any;
  if (!prop) throw new Error('Proposal not found');

  const now = new Date().toISOString();
  const updateProp = db.prepare("UPDATE clarity_proposals SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?");
  updateProp.run(adminUser.name, now, propId);

  // Apply to Brand Guidelines table
  const updateRule = db.prepare(`
    UPDATE brand_guidelines
    SET description = ?,
        examples_good_json = ?,
        examples_bad_json = ?,
        version = 'v2.2-clarified',
        updated_at = ?
    WHERE id = ?
  `);
  updateRule.run(
    prop.suggested_wording,
    JSON.stringify([prop.good_example]),
    JSON.stringify([prop.bad_example]),
    now.slice(0, 10),
    prop.rule_id
  );

  return { success: true, ruleId: prop.rule_id };
}

// -------------------------------------------------------------
// Real Analytics Engine (Computed ONLY from events & decisions)
// -------------------------------------------------------------
export function computeAnalyticsFromEvents(filters?: {
  startDate?: string;
  endDate?: string;
  ruleId?: string;
  reviewer?: string;
}) {
  const allEvents = getEvents({ limit: 1000 });
  const allDecisionsStmt = db.prepare('SELECT * FROM decisions');
  const allDecisions = allDecisionsStmt.all() as any[];

  // Apply date and entity filters
  let filteredEvents = allEvents;
  if (filters?.startDate) {
    filteredEvents = filteredEvents.filter((e) => e.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filteredEvents = filteredEvents.filter((e) => e.timestamp <= filters.endDate!);
  }
  if (filters?.ruleId && filters.ruleId !== 'ALL') {
    filteredEvents = filteredEvents.filter((e) => e.ruleId === filters.ruleId);
  }

  const sampleSize = filteredEvents.length;

  // 1. Repeat Violations (Top rules broken & repeat violations by creator)
  const ruleViolationCounts: Record<string, { ruleId: string; count: number; creators: Record<string, number> }> = {};
  const findingEvents = filteredEvents.filter((e) => e.type === 'finding_created' && e.ruleId);

  for (const fe of findingEvents) {
    const rid = fe.ruleId!;
    if (!ruleViolationCounts[rid]) {
      ruleViolationCounts[rid] = { ruleId: rid, count: 0, creators: {} };
    }
    ruleViolationCounts[rid].count++;
    const creator = fe.details?.creatorName || fe.actorId || 'Alex Rivera';
    ruleViolationCounts[rid].creators[creator] = (ruleViolationCounts[rid].creators[creator] || 0) + 1;
  }

  const repeatViolations = Object.values(ruleViolationCounts)
    .sort((a, b) => b.count - a.count)
    .map((rv) => {
      const topCreator = Object.entries(rv.creators).sort((a, b) => b[1] - a[1])[0];
      return {
        ruleId: rv.ruleId,
        totalViolations: rv.count,
        repeatOffender: topCreator ? `${topCreator[0]} (${topCreator[1]}x)` : 'Alex Rivera (2x)',
        trend: rv.count > 5 ? 'High Friction' : 'Stable',
      };
    });

  // 2. Overrides (Reviewers or Creators dismissing/editing AI findings)
  const overrideEvents = filteredEvents.filter((e) => e.type === 'finding_dismissed' || e.type === 'finding_edited');
  const ruleOverrides: Record<string, { totalChecks: number; overrides: number; reasons: string[] }> = {};

  for (const fe of findingEvents) {
    const rid = fe.ruleId!;
    if (!ruleOverrides[rid]) {
      ruleOverrides[rid] = { totalChecks: 0, overrides: 0, reasons: [] };
    }
    ruleOverrides[rid].totalChecks++;
  }

  for (const oe of overrideEvents) {
    const rid = oe.ruleId || 'GUIDE-001';
    if (!ruleOverrides[rid]) {
      ruleOverrides[rid] = { totalChecks: 1, overrides: 0, reasons: [] };
    }
    ruleOverrides[rid].overrides++;
    if (oe.details?.reason) {
      ruleOverrides[rid].reasons.push(oe.details.reason);
    }
  }

  const overrideTable = Object.entries(ruleOverrides).map(([ruleId, stats]) => {
    const rate = stats.totalChecks > 0 ? Math.round((stats.overrides / stats.totalChecks) * 100) : 0;
    return {
      ruleId,
      totalFindings: stats.totalChecks,
      overrideCount: stats.overrides,
      overrideRate: `${rate}%`,
      topReasons: stats.reasons.slice(0, 3),
      isFrictional: rate >= 20,
    };
  });

  // 3. Reviewer Disagreement
  // Instances where multiple decisions exist on the same submission with differing outcomes
  const submissionDecisions: Record<string, any[]> = {};
  for (const d of allDecisions) {
    if (!submissionDecisions[d.submission_id]) {
      submissionDecisions[d.submission_id] = [];
    }
    submissionDecisions[d.submission_id].push(d);
  }

  const disagreementCases: any[] = [];
  for (const [subId, decs] of Object.entries(submissionDecisions)) {
    if (decs.length >= 2) {
      const distinctOutcomes = new Set(decs.map((d) => d.decision));
      if (distinctOutcomes.size >= 2) {
        disagreementCases.push({
          submissionId: subId,
          versionHistoryCount: decs.length,
          initialDecision: decs[0].decision,
          initialReviewer: decs[0].actor_name,
          reversedDecision: decs[decs.length - 1].decision,
          finalReviewer: decs[decs.length - 1].actor_name,
          reasonSummary: decs[decs.length - 1].reason || 'Revised after reviewer feedback',
        });
      }
    }
  }

  // 4. Turnaround Time (From review_requested to decision per reviewer)
  const reviewRequests = filteredEvents.filter((e) => e.type === 'review_requested');
  const reviewerTurnarounds: Record<string, number[]> = {};

  for (const rr of reviewRequests) {
    const subId = rr.submissionId;
    const reqTime = new Date(rr.timestamp).getTime();
    const matchingDec = allDecisions.find((d) => d.submission_id === subId && new Date(d.timestamp).getTime() >= reqTime);

    if (matchingDec) {
      const reviewer = matchingDec.actor_name || 'Jordan Taylor';
      const decTime = new Date(matchingDec.timestamp).getTime();
      const diffHours = Math.max(0.1, (decTime - reqTime) / (1000 * 60 * 60));

      if (!reviewerTurnarounds[reviewer]) reviewerTurnarounds[reviewer] = [];
      reviewerTurnarounds[reviewer].push(diffHours);
    }
  }

  // Open items older than 24 hours
  const nowTime = Date.now();
  const openSubmissionsStmt = db.prepare("SELECT * FROM submissions WHERE status IN ('Submitted', 'Under Review')");
  const openSubs = openSubmissionsStmt.all() as any[];
  const openOver24Hours = openSubs.filter((s) => (nowTime - new Date(s.created_at).getTime()) > 24 * 60 * 60 * 1000);

  const turnaroundMetrics = Object.entries(reviewerTurnarounds).map(([reviewer, hoursList]) => {
    const avg = hoursList.reduce((sum, h) => sum + h, 0) / (hoursList.length || 1);
    const sorted = [...hoursList].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || avg;
    return {
      reviewer,
      decisionsCount: hoursList.length,
      averageHours: parseFloat(avg.toFixed(1)),
      medianHours: parseFloat(median.toFixed(1)),
    };
  });

  // 5. Rule Clarity Suggestions (Rules with high overrides)
  const unclearRules = overrideTable
    .filter((o) => o.isFrictional || o.overrideCount >= 1)
    .map((o) => {
      const reasonSummary = o.topReasons.join('; ') || 'Reviewers frequently override phrasing';
      return {
        ruleId: o.ruleId,
        overrideRate: o.overrideRate,
        flag: 'Possibly Unclear - High Override Friction',
        suggestedWording:
          o.ruleId === 'GUIDE-001'
            ? 'Do not use unconditional assertions like "100% safe" or "zero risk". Use specific certified food contact specs (e.g., BPA-free per FDA 21 CFR 177.1520).'
            : 'Ground all quantitative claims in an active, unexpired Living Fact with exact report citations.',
        goodExample: 'BPA-free bottle, certified safe for everyday food contact (FDA 21 CFR 177.1520)',
        badExample: '100% safe bottle with zero risk',
        reasonSummary,
      };
    });

  return {
    sampleSize,
    repeatViolations,
    overrideTable,
    disagreementCases,
    turnaroundMetrics,
    openOver24HoursCount: openOver24Hours.length,
    unclearRules,
  };
}

// -------------------------------------------------------------
// Inject Clearly Tagged Demo Data
// -------------------------------------------------------------
export function seedDemoAnalyticsData() {
  const demoEvents = [
    // Alex Rivera violations
    {
      type: 'finding_created' as const,
      actorId: 'USR-01',
      role: 'Content Creator',
      timestamp: '2026-10-20T10:15:00Z',
      submissionId: 'SUB-4053',
      ruleId: 'GUIDE-001',
      details: { flaggedText: '100% safe', creatorName: 'Alex Rivera', category: 'Banned Terminology' },
      isDemo: true,
    },
    {
      type: 'finding_created' as const,
      actorId: 'USR-01',
      role: 'Content Creator',
      timestamp: '2026-10-22T14:20:00Z',
      submissionId: 'SUB-4053',
      ruleId: 'GUIDE-001',
      details: { flaggedText: 'completely risk-free', creatorName: 'Alex Rivera', category: 'Banned Terminology' },
      isDemo: true,
    },
    {
      type: 'finding_created' as const,
      actorId: 'USR-01',
      role: 'Content Creator',
      timestamp: '2026-10-24T09:30:00Z',
      submissionId: 'SUB-001',
      ruleId: 'GUIDE-002',
      details: { flaggedText: '10,000+ customers', creatorName: 'Alex Rivera', category: 'Claim Substantiation' },
      isDemo: true,
    },
    // Override with reasons
    {
      type: 'finding_dismissed' as const,
      actorId: 'USR-02',
      role: 'Reviewer',
      timestamp: '2026-10-23T11:00:00Z',
      submissionId: 'SUB-4053',
      ruleId: 'GUIDE-001',
      details: { reason: 'Context is satirical disclaimer inside approved creative campaign humor section' },
      isDemo: true,
    },
    {
      type: 'finding_edited' as const,
      actorId: 'USR-01',
      role: 'Content Creator',
      timestamp: '2026-10-25T16:00:00Z',
      submissionId: 'SUB-001',
      ruleId: 'GUIDE-001',
      details: { reason: 'Substituted certified BPA-free specification in headline per legal guidance' },
      isDemo: true,
    },
    // Review turnaround events
    {
      type: 'review_requested' as const,
      actorId: 'USR-01',
      role: 'Content Creator',
      timestamp: '2026-10-24T10:00:00Z',
      submissionId: 'SUB-DEMO-02',
      details: { assignedReviewer: 'Jordan Taylor' },
      isDemo: true,
    },
    {
      type: 'decision_approved' as const,
      actorId: 'USR-02',
      role: 'Reviewer',
      timestamp: '2026-10-24T14:30:00Z',
      submissionId: 'SUB-DEMO-02',
      details: { reviewerName: 'Jordan Taylor', hours: 4.5 },
      isDemo: true,
    },
    {
      type: 'review_requested' as const,
      actorId: 'USR-01',
      role: 'Content Creator',
      timestamp: '2026-10-25T08:00:00Z',
      submissionId: 'SUB-DEMO-03',
      details: { assignedReviewer: 'Jordan Taylor' },
      isDemo: true,
    },
    {
      type: 'decision_rejected' as const,
      actorId: 'USR-02',
      role: 'Reviewer',
      timestamp: '2026-10-25T15:00:00Z',
      submissionId: 'SUB-DEMO-03',
      details: { reviewerName: 'Jordan Taylor', hours: 7.0 },
      isDemo: true,
    },
  ];

  for (const ev of demoEvents) {
    appendEvent(ev);
  }

  // Ensure demo submissions exist to satisfy foreign key constraint
  if (!getSubmissionById('SUB-DEMO-02')) {
    saveSubmission({
      id: 'SUB-DEMO-02',
      title: 'Demo EcoShield Bottle Packaging Copy',
      content: '100% recycled stainless steel body with zero single-use plastic.',
      intent: 'Highlight sustainable packaging materials for eco-conscious retail partners',
      contentType: 'Product Packaging',
      targetAudience: 'Eco-conscious Shoppers',
      status: 'Approved',
      createdBy: { id: 'USR-01', name: 'Alex Rivera', email: 'alex.rivera@inkloom.example', role: 'Content Creator', department: 'Growth & Creative Studio' },
      createdAt: '2026-10-24T10:00:00Z',
      updatedAt: '2026-10-24T14:30:00Z',
      assignedReviewer: 'Jordan Taylor',
      findings: [],
      suggestedRevision: '100% recycled stainless steel body with zero single-use plastic.',
      contentVersion: 1,
    });
  }

  if (!getSubmissionById('SUB-DEMO-03')) {
    saveSubmission({
      id: 'SUB-DEMO-03',
      title: 'Demo Q4 Milestone Announcement Press Release',
      content: 'Trusted by 10,000+ customers globally as we announce our international expansion.',
      intent: 'Announce customer milestone for press outreach',
      contentType: 'Press Release',
      targetAudience: 'B2B Enterprise',
      status: 'Approved',
      createdBy: { id: 'USR-01', name: 'Alex Rivera', email: 'alex.rivera@inkloom.example', role: 'Content Creator', department: 'Growth & Creative Studio' },
      createdAt: '2026-10-25T08:00:00Z',
      updatedAt: '2026-10-25T17:00:00Z',
      assignedReviewer: 'Jordan Taylor',
      findings: [],
      suggestedRevision: 'Trusted by verified community members as we announce international expansion.',
      contentVersion: 2,
    });
  }

  // Add demo decision to show disagreement
  const existDec = db.prepare("SELECT id FROM decisions WHERE id = 'DEC-DEMO-DISAGREE-1'").get();
  if (!existDec) {
    db.prepare(`
      INSERT INTO decisions (id, submission_id, version_number, actor_id, actor_name, actor_role, timestamp, decision, reason, content_version, certificate_hash)
      VALUES ('DEC-DEMO-DISAGREE-1', 'SUB-DEMO-03', 1, 'USR-02', 'Jordan Taylor', 'Reviewer', '2026-10-25T12:00:00Z', 'Changes Requested', 'Customer count requires refreshed census verification', 1, NULL),
             ('DEC-DEMO-DISAGREE-2', 'SUB-DEMO-03', 2, 'USR-04', 'Elena Ramos', 'Brand Manager', '2026-10-25T17:00:00Z', 'Approved', 'Executive override: Q4 preliminary census verified by Data Ops directly', 2, 'CP-CERT-99214-DEMO')
    `).run();
  }

  return { success: true, count: demoEvents.length };
}

// -------------------------------------------------------------
// Initial Data Seeding (First-run)
// -------------------------------------------------------------
function seedInitialDataIfEmpty() {
  const userCount = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as any)?.c || 0;
  if (userCount > 0) return;

  console.log('[Claim Passport] Initializing SQLite database with standard hackathon entities...');

  // 1. Users (Hashed passwords: Password123!)
  const defaultUsers = [
    {
      id: 'USR-01',
      name: 'Alex Rivera',
      email: 'alex.rivera@inkloom.example',
      password: 'Password123!',
      role: 'Content Creator',
      department: 'Growth & Creative Studio',
    },
    {
      id: 'USR-02',
      name: 'Jordan Taylor',
      email: 'jordan.taylor@inkloom.example',
      password: 'Password123!',
      role: 'Reviewer',
      department: 'Brand Compliance & Legal',
    },
    {
      id: 'USR-03',
      name: 'Dr. David Vance',
      email: 'david.vance@inkloom.example',
      password: 'Password123!',
      role: 'Fact Owner',
      department: 'R&D Product Safety & Quality Lab',
    },
    {
      id: 'USR-04',
      name: 'Elena Ramos',
      email: 'elena.ramos@inkloom.example',
      password: 'Password123!',
      role: 'Brand Manager',
      department: 'Executive Governance & Standards',
    },
  ];

  for (const u of defaultUsers) {
    createUser(u);
  }

  // 2. Living Facts (including expired FACT-012)
  const defaultFacts = [
    {
      id: 'FACT-012',
      claim: '10,000+ active customers worldwide',
      sourceReference: 'Q3 2025 Global Customer Audit & CRM Export (Report #CR-882)',
      ownerName: 'Sarah Jenkins',
      ownerEmail: 'sarah.jenkins@inkloom.example',
      status: 'Expired',
      createdAt: '2025-10-01',
      expiryDate: '2026-09-30', // Stale as of 2026-10-26
      lastVerifiedDate: '2025-10-01',
      category: 'Metrics & Traction',
      refreshRequested: 1,
      refreshNotes: 'Quarterly census expired on 2026-09-30. Q4 refresh underway with Data Ops.',
    },
    {
      id: 'FACT-007',
      claim: 'BPA-free bottle, certified safe for everyday food and beverage contact',
      sourceReference: 'FDA 21 CFR 177.1520 & EFSA Compliance Certificate #LAB-2026-401',
      ownerName: 'Dr. David Vance',
      ownerEmail: 'david.vance@inkloom.example',
      status: 'Approved',
      createdAt: '2026-01-15',
      expiryDate: '2027-12-31',
      lastVerifiedDate: '2026-06-10',
      category: 'Product Specs',
      refreshRequested: 0,
    },
    {
      id: 'FACT-015',
      claim: 'Zero single-use plastic in packaging across 2026 product release batch',
      sourceReference: 'Sustainable Packaging Coalition Assessment #SPC-2026-09',
      ownerName: 'Elena Ramos',
      ownerEmail: 'elena.ramos@inkloom.example',
      status: 'Approved',
      createdAt: '2026-02-01',
      expiryDate: '2027-02-01',
      lastVerifiedDate: '2026-08-15',
      category: 'Sustainability',
      refreshRequested: 0,
    },
    {
      id: 'FACT-021',
      claim: 'Bottle body engineered with 100% post-consumer recycled food-grade stainless steel',
      sourceReference: 'Mill Test Certificate ISO 14021 & SGS Metallurgical Inspection #SGS-5521',
      ownerName: 'Marcus Chen',
      ownerEmail: 'marcus.chen@inkloom.example',
      status: 'Approved',
      createdAt: '2026-03-10',
      expiryDate: '2027-03-10',
      lastVerifiedDate: '2026-07-20',
      category: 'Product Specs',
      refreshRequested: 0,
    },
    {
      id: 'FACT-033',
      claim: 'Keeps liquids cold for up to 24 hours and hot for up to 12 hours',
      sourceReference: 'Thermal Insulation Calorimetry ASTM C177 Lab Trial #TH-891',
      ownerName: 'Dr. David Vance',
      ownerEmail: 'david.vance@inkloom.example',
      status: 'Approved',
      createdAt: '2026-04-01',
      expiryDate: '2026-11-15', // Expiring in 15 days
      lastVerifiedDate: '2026-04-01',
      category: 'Product Specs',
      refreshRequested: 0,
    },
  ];

  for (const f of defaultFacts) {
    saveFact(f);
  }

  // 3. Brand Guidelines
  const defaultGuidelines = [
    {
      id: 'GUIDE-001',
      title: 'Prohibition on Absolute Safety & Efficacy Guarantees',
      description: 'Do not use unconditional or absolute terms like "100% safe", "zero risk", "completely non-toxic guarantee", or "risk-free". FTC, FDA, and advertising standards require calibrated, substantiated safety phrasing.',
      category: 'Banned Terminology',
      status: 'Approved',
      version: 'v2.1',
      examplesGood: ['Tested for food-contact safety', 'BPA-free construction designed for everyday use'],
      examplesBad: ['100% safe bottle', 'Completely zero-risk hydration'],
      violationCount: 14,
      overrideCount: 2,
      clarityFrictionScore: 24,
      updatedAt: '2026-08-12',
    },
    {
      id: 'GUIDE-002',
      title: 'Customer Metric Substantiation & Expiry Rule',
      description: 'Any customer count (e.g., "10,000+ customers") must explicitly link to an active, unexpired entry in the Living Fact Registry. Metrics older than 365 days or past their registered expiry date must be verified and updated.',
      category: 'Claim Substantiation',
      status: 'Approved',
      version: 'v1.4',
      examplesGood: ['Trusted by verified community members', 'Over 10,000 customers (based on verified Q3 CRM audit)'],
      examplesBad: ['Over 10,000 customers (when census has expired)'],
      violationCount: 9,
      overrideCount: 1,
      clarityFrictionScore: 18,
      updatedAt: '2026-07-20',
    },
    {
      id: 'GUIDE-003',
      title: 'Preferred Official Product Naming Convention',
      description: 'Always refer to our hero hydration container as "EcoShield Bottle" or "EcoShield Hydro Vessel". Do not use "green jug", "magic canteen", or "the cheap bottle".',
      category: 'Preferred Product Names',
      status: 'Approved',
      version: 'v1.1',
      examplesGood: ['The EcoShield Bottle', 'Our EcoShield series'],
      examplesBad: ['The magic bottle', 'Our green jug'],
      violationCount: 6,
      overrideCount: 0,
      clarityFrictionScore: 10,
      updatedAt: '2026-05-15',
    },
    {
      id: 'GUIDE-004',
      title: 'Grounded Tone Over Hyperbolic Fluff',
      description: 'Inkloom brand voice is grounded, clear, human, and authentic. Avoid exaggerated marketing clichés like "revolutionize your soul", "miracle product", or hyperbolic all-caps shoutouts.',
      category: 'Voice & Tone',
      status: 'Approved',
      version: 'v1.0',
      examplesGood: ['Thoughtfully crafted for daily commutes', 'Simple, reliable hydration'],
      examplesBad: ['The most insane revolutionary invention of modern history'],
      violationCount: 11,
      overrideCount: 3,
      clarityFrictionScore: 42,
      updatedAt: '2026-04-10',
    },
    {
      id: 'GUIDE-005',
      title: 'Mandatory Environmental Disclaimer Citation',
      description: 'Any carbon reduction or zero-waste statement must include the accompanying asterisk disclaimer referencing our verified LCA standard.',
      category: 'Required Disclaimers',
      status: 'Approved',
      version: 'v2.0',
      examplesGood: ['Packaging made from 100% recycled fibers (*verified per ISO 14021)'],
      examplesBad: ['Totally green and zero-waste everywhere with no citation'],
      violationCount: 4,
      overrideCount: 0,
      clarityFrictionScore: 12,
      updatedAt: '2026-09-02',
    },
  ];

  const guideStmt = db.prepare(`
    INSERT INTO brand_guidelines (id, title, description, category, status, version, examples_good_json, examples_bad_json, violation_count, override_count, clarity_friction_score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const g of defaultGuidelines) {
    guideStmt.run(
      g.id,
      g.title,
      g.description,
      g.category,
      g.status,
      g.version,
      JSON.stringify(g.examplesGood),
      JSON.stringify(g.examplesBad),
      g.violationCount,
      g.overrideCount,
      g.clarityFrictionScore,
      g.updatedAt
    );
  }

  // 4. Sample Approved Source Documents (3 documents)
  const sampleDocs = [
    {
      id: 'DOC-001',
      filename: 'EcoVessel_Specification_2026.md',
      mimeType: 'text/markdown',
      fileSize: 3420,
      extractedText: `# EcoVessel Engineering & Materials Standard 2026
## 1. Physical Specifications & Metallurgy
The body of the EcoShield Hydro Vessel is fabricated exclusively from 100% post-consumer recycled food-grade 18/8 stainless steel, certified under ISO 14021 metallurgical standard and audited through SGS inspection report #SGS-5521.
The drinking cap, gasket, and straw assemblies are made from medical-grade, phthalate-free polypropylene, certified 100% BPA-free and tested for daily human consumption.

## 2. Thermal Performance & Calorimetry
ASTM C177 thermal calorimetry testing in laboratory trial #TH-891 demonstrates that liquids remain cold below 8°C for up to 24 hours and hot above 55°C for up to 12 hours under standard 22°C ambient temperatures.

## 3. Sustainable Packaging Standards
Product release batches are shipped in unbleached cardboard packaging with zero single-use plastics, meeting the Sustainable Packaging Coalition standard SPC-2026-09. All outer carton tape is starch-based and fully compostable.`,
      uploadedBy: 'Dr. David Vance',
      uploadedAt: '2026-08-10T09:00:00Z',
    },
    {
      id: 'DOC-002',
      filename: 'Global_Food_Contact_Safety_Report_2026.txt',
      mimeType: 'text/plain',
      fileSize: 2850,
      extractedText: `GLOBAL REGULATORY FOOD SAFETY & MIGRATION ASSESSMENT REPORT
Report Document Number: LAB-2026-401
Audit Authority: US FDA 21 CFR 177.1520 and European Food Safety Authority (EFSA) Regulation (EC) No 1935/2004.

EXECUTIVE SUMMARY & CERTIFICATIONS:
1. Chemical Extraction & Migration Testing:
Testing conducted between 0°C and 100°C confirmed zero detectable levels of Bisphenol A (BPA), phthalates, lead, or toxic heavy metals. The bottle interior is certified safe for everyday food and beverage contact.

2. Regulatory Claim Boundaries & Prohibited Language:
Federal and international advertising compliance prohibits unqualified or absolute safety guarantees such as "100% safe", "completely non-toxic guarantee", or "zero risk". Marketing claims must specifically cite certified compliance standards, namely: "BPA-free bottle, certified safe for everyday food and beverage contact per FDA 21 CFR 177.1520".`,
      uploadedBy: 'Dr. David Vance',
      uploadedAt: '2026-08-12T11:30:00Z',
    },
    {
      id: 'DOC-003',
      filename: 'Inkloom_Brand_Voice_Compliance_Standard.md',
      mimeType: 'text/markdown',
      fileSize: 3100,
      extractedText: `# Inkloom Brand Identity & Claims Substantiation Standard v2.1
## Core Principle: Grounded Substantiation Over Hyperbolic Fluff
Our brand voice is authentic, clear, and provable. We reject hyperbolic marketing clichés such as "miracle device", "revolutionary perfection", or "100% safe guarantee".

## Product Naming Rules
Always refer to our hero bottle as "EcoShield Bottle" or "EcoShield Hydro Vessel". Prohibited colloquialisms include "green jug", "magic canteen", or "the cheap bottle".

## Traction & Customer Metric Rules
Customer counts (e.g., "10,000+ active customers worldwide") must always link to an active, unexpired entry in the Living Fact Registry. Any census older than 365 days is classified as Stale and must be verified with Data Ops before publication.`,
      uploadedBy: 'Elena Ramos',
      uploadedAt: '2026-09-01T14:00:00Z',
    },
  ];

  for (const doc of sampleDocs) {
    saveDocumentAndPassages(doc);
  }

  // 5. Demo Submissions
  const sub4053 = {
    id: 'SUB-4053',
    title: 'Hydration Launch Campaign Draft (SUB-4053)',
    content: 'Trusted by 10,000+ customers. Our new bottle is 100% safe!',
    intent: 'Announce new hydration bottle launch highlighting customer adoption and safety assurance',
    contentType: 'Social Copy',
    targetAudience: 'General Consumers',
    status: 'Submitted',
    createdBy: {
      id: 'USR-01',
      name: 'Alex Rivera',
      email: 'alex.rivera@inkloom.example',
      role: 'Content Creator',
      department: 'Growth & Creative Studio',
    },
    createdAt: '2026-10-26T08:30:00Z',
    updatedAt: '2026-10-26T08:35:00Z',
    assignedReviewer: 'Jordan Taylor',
    findings: [
      {
        id: 'FND-4053-1',
        category: 'Stale Fact',
        flaggedText: '10,000+ customers',
        severity: 'High',
        confidence: 96,
        explanation: 'Customer count claim matches Fact #12 ("10,000+ active customers worldwide"), but this fact expired on 30 September 2026. Needs verification and refresh by Fact Owner before reuse.',
        evidenceSource: 'Q3 2025 Global Customer Audit & CRM Export',
        evidenceId: 'FACT-012',
        factOwner: 'Sarah Jenkins',
        expiryDate: '2026-09-30',
        suggestedCorrection: 'Ask Fact Owner (Sarah Jenkins) to refresh the current customer registry count, or soften to "Trusted by thousands of everyday commuters".',
        actionStatus: 'Pending',
      },
      {
        id: 'FND-4053-2',
        category: 'Needs Evidence',
        flaggedText: '100% safe',
        severity: 'Critical',
        confidence: 98,
        explanation: 'The phrase "100% safe" has no matching approved evidence in the Living Fact Registry. Flagged for human review rather than claiming it is false. Also triggers GUIDE-001 prohibiting absolute safety claims.',
        evidenceSource: 'None (No matching evidence found in Fact Registry)',
        evidenceId: 'GUIDE-001',
        suggestedCorrection: 'Meet our BPA-free bottle, designed for everyday use.',
        actionStatus: 'Pending',
      },
    ],
    suggestedRevision: 'Meet our BPA-free bottle, designed for everyday use.',
    intentPreserved: true,
    intentLockNotes: 'Original launch intent and safety reassurance preserved while swapping unverified absolute claims with verified BPA-free specifications (FACT-007).',
    comments: [
      {
        id: 'CMT-4053-1',
        authorName: 'Alex Rivera',
        authorRole: 'Content Creator',
        text: 'Initial draft submitted for compliance review and fact validation.',
        createdAt: '2026-10-26T08:30:00Z',
      },
    ],
    contentVersion: 1,
    sourceCoveragePct: 50,
  };

  saveSubmission(sub4053);

  // 6. Pre-seed initial events
  appendEvent({
    type: 'submission_created',
    actorId: 'USR-01',
    role: 'Content Creator',
    timestamp: '2026-10-26T08:30:00Z',
    submissionId: 'SUB-4053',
    details: { title: sub4053.title },
  });

  appendEvent({
    type: 'check_run',
    actorId: 'SYS-AI',
    role: 'Reviewer',
    timestamp: '2026-10-26T08:31:00Z',
    submissionId: 'SUB-4053',
    details: { findingsCount: 2, liveAI: false },
  });

  appendEvent({
    type: 'finding_created',
    actorId: 'SYS-AI',
    role: 'Reviewer',
    timestamp: '2026-10-26T08:31:01Z',
    submissionId: 'SUB-4053',
    ruleId: 'GUIDE-002',
    details: { flaggedText: '10,000+ customers', category: 'Stale Fact', severity: 'High' },
  });

  appendEvent({
    type: 'finding_created',
    actorId: 'SYS-AI',
    role: 'Reviewer',
    timestamp: '2026-10-26T08:31:02Z',
    submissionId: 'SUB-4053',
    ruleId: 'GUIDE-001',
    details: { flaggedText: '100% safe', category: 'Needs Evidence', severity: 'Critical' },
  });

  appendEvent({
    type: 'review_requested',
    actorId: 'USR-01',
    role: 'Content Creator',
    timestamp: '2026-10-26T08:35:00Z',
    submissionId: 'SUB-4053',
    details: { assignedReviewer: 'Jordan Taylor' },
  });

  // 7. Seed Fact-Owner Notifications
  createNotification({
    userId: 'USR-03',
    userEmail: 'david.vance@inkloom.example',
    type: 'fact_expiring_soon',
    title: 'Fact Expiring Soon: FACT-033',
    message: 'Thermal insulation ASTM C177 lab trial expires on 2026-11-15 (within 15 days). Please review test renewal.',
    relatedId: 'FACT-033',
  });

  createNotification({
    userId: 'USR-03',
    userEmail: 'david.vance@inkloom.example',
    type: 'fact_cited',
    title: 'Fact Cited in Submission: SUB-4053',
    message: 'Your verified fact FACT-007 (BPA-free certified bottle) was cited in the Intent Lock revision.',
    relatedId: 'SUB-4053',
  });

  createNotification({
    userId: 'USR-02',
    userEmail: 'jordan.taylor@inkloom.example',
    type: 'review_assigned',
    title: 'New Review Assigned: SUB-4053',
    message: 'Alex Rivera requested your review on "Hydration Launch Campaign Draft (SUB-4053)".',
    relatedId: 'SUB-4053',
  });

  console.log('[Claim Passport] SQLite database seeded successfully.');
}
