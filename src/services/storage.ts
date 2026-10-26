/**
 * Claim Passport Storage Service
 * Manages persistent state in localStorage with full CRUD operations and audit logging
 */

import {
  User,
  LivingFact,
  BrandGuideline,
  ContentSubmission,
  AuditLogEntry,
  FindingActionStatus,
  UserRole,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_FACTS,
  INITIAL_GUIDELINES,
  INITIAL_SUBMISSIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'claim_passport_users_v1',
  CURRENT_USER: 'claim_passport_current_user_v1',
  FACTS: 'claim_passport_facts_v1',
  GUIDELINES: 'claim_passport_guidelines_v1',
  SUBMISSIONS: 'claim_passport_submissions_v1',
  AUDIT_LOGS: 'claim_passport_audit_logs_v1',
};

// Safe JSON parser
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Users
export function getUsers(): User[] {
  return safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function getCurrentUser(): User {
  return safeGet<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
}

export function setCurrentUser(user: User): void {
  safeSet(STORAGE_KEYS.CURRENT_USER, user);
}

// Facts
export function getFacts(): LivingFact[] {
  return safeGet<LivingFact[]>(STORAGE_KEYS.FACTS, INITIAL_FACTS);
}

export function saveFact(fact: LivingFact, currentUser: User): void {
  const facts = getFacts();
  const existingIdx = facts.findIndex((f) => f.id === fact.id);
  let updatedFacts: LivingFact[];

  if (existingIdx >= 0) {
    updatedFacts = [...facts];
    updatedFacts[existingIdx] = fact;
    addAuditLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'FACT_UPDATED',
      targetType: 'Fact',
      targetId: fact.id,
      summary: `Updated Fact ${fact.id} ("${fact.claim.slice(0, 40)}...") by ${currentUser.name}.`,
    });
  } else {
    updatedFacts = [fact, ...facts];
    addAuditLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'FACT_UPDATED',
      targetType: 'Fact',
      targetId: fact.id,
      summary: `Created new Fact ${fact.id} ("${fact.claim.slice(0, 40)}...") by ${currentUser.name}.`,
    });
  }

  safeSet(STORAGE_KEYS.FACTS, updatedFacts);

  // Sync with backend API in background
  try {
    fetch('/api/facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fact),
    }).catch(() => {});
  } catch {}
}

export function deleteFact(factId: string, currentUser: User): void {
  const facts = getFacts().filter((f) => f.id !== factId);
  safeSet(STORAGE_KEYS.FACTS, facts);
  addAuditLog({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'FACT_UPDATED',
    targetType: 'Fact',
    targetId: factId,
    summary: `Deactivated/Deleted Fact ${factId}.`,
  });
}

export function requestFactRefresh(factId: string, notes: string, currentUser: User): void {
  const facts = getFacts().map((f) => {
    if (f.id === factId) {
      return {
        ...f,
        refreshRequested: true,
        refreshNotes: notes || 'Refresh requested by reviewer/creator due to expiration.',
      };
    }
    return f;
  });
  safeSet(STORAGE_KEYS.FACTS, facts);
  addAuditLog({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'REFRESH_REQUESTED',
    targetType: 'Fact',
    targetId: factId,
    summary: `Triggered urgent fact refresh for ${factId} to assigned Fact Owner.`,
    reason: notes,
  });
}

// Guidelines
export function getGuidelines(): BrandGuideline[] {
  return safeGet<BrandGuideline[]>(STORAGE_KEYS.GUIDELINES, INITIAL_GUIDELINES);
}

export function saveGuideline(guideline: BrandGuideline, currentUser: User): void {
  const list = getGuidelines();
  const existingIdx = list.findIndex((g) => g.id === guideline.id);
  let updatedList: BrandGuideline[];

  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = guideline;
  } else {
    updatedList = [guideline, ...list];
  }

  safeSet(STORAGE_KEYS.GUIDELINES, updatedList);
  addAuditLog({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'GUIDELINE_UPDATED',
    targetType: 'Guideline',
    targetId: guideline.id,
    summary: `Saved guideline ${guideline.id} (${guideline.title}) with status "${guideline.status}".`,
  });
}

export function recordGuidelineOverride(guidelineId: string): void {
  const list = getGuidelines().map((g) => {
    if (g.id === guidelineId) {
      const overrides = (g.overrideCount || 0) + 1;
      const violations = g.violationCount || 1;
      const friction = Math.min(100, Math.round((overrides / violations) * 100));
      return {
        ...g,
        overrideCount: overrides,
        clarityFrictionScore: friction,
      };
    }
    return g;
  });
  safeSet(STORAGE_KEYS.GUIDELINES, list);
}

export function getSubmissions(): ContentSubmission[] {
  const list = safeGet<ContentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  if (!list.some((s) => s.id === 'SUB-4053')) {
    const default4053 = INITIAL_SUBMISSIONS.find((s) => s.id === 'SUB-4053');
    if (default4053) {
      list.unshift(default4053);
      safeSet(STORAGE_KEYS.SUBMISSIONS, list);
    }
  }
  return list;
}

export function getSubmissionById(id: string): ContentSubmission | undefined {
  return getSubmissions().find((s) => s.id === id);
}

export function saveSubmission(submission: ContentSubmission, currentUser: User): void {
  const submissions = getSubmissions();
  const existingIdx = submissions.findIndex((s) => s.id === submission.id);
  let updatedSubmissions: ContentSubmission[];

  if (existingIdx >= 0) {
    updatedSubmissions = [...submissions];
    updatedSubmissions[existingIdx] = submission;
  } else {
    updatedSubmissions = [submission, ...submissions];
    addAuditLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SUBMITTED',
      targetType: 'Submission',
      targetId: submission.id,
      summary: `Created submission "${submission.title}" with Intent Lock enabled.`,
    });
  }

  safeSet(STORAGE_KEYS.SUBMISSIONS, updatedSubmissions);

  // Sync with backend API in background
  try {
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    }).catch(() => {});
  } catch {}
}

export function updateFindingAction(
  submissionId: string,
  findingId: string,
  actionStatus: FindingActionStatus,
  currentUser: User,
  editedCorrection?: string,
  dismissReason?: string
): void {
  const submissions = getSubmissions().map((sub) => {
    if (sub.id === submissionId) {
      const updatedFindings = sub.findings.map((f) => {
        if (f.id === findingId) {
          return {
            ...f,
            actionStatus,
            userEditedCorrection: editedCorrection !== undefined ? editedCorrection : f.userEditedCorrection,
            dismissReason: dismissReason !== undefined ? dismissReason : f.dismissReason,
            reviewedBy: currentUser.name,
            reviewedAt: new Date().toISOString(),
          };
        }
        return f;
      });

      return {
        ...sub,
        findings: updatedFindings,
        updatedAt: new Date().toISOString(),
      };
    }
    return sub;
  });

  safeSet(STORAGE_KEYS.SUBMISSIONS, submissions);

  // If dismissed or overridden, record in audit logs
  let actionType: 'ACCEPTED_SUGGESTION' | 'OVERRODE_FINDING' | 'DISMISSED_FINDING' = 'ACCEPTED_SUGGESTION';
  if (actionStatus === 'Dismissed') actionType = 'DISMISSED_FINDING';
  if (actionStatus === 'Edited') actionType = 'OVERRODE_FINDING';

  addAuditLog({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: actionType,
    targetType: 'Finding',
    targetId: findingId,
    summary: `${currentUser.name} (${currentUser.role}) set finding ${findingId} to ${actionStatus}.`,
    reason: dismissReason || (editedCorrection ? `Edited to: "${editedCorrection}"` : undefined),
  });
}

export function updateSubmissionStatus(
  submissionId: string,
  newStatus: ContentSubmission['status'],
  currentUser: User,
  stamp?: ContentSubmission['approvalStamp'],
  commentText?: string
): ContentSubmission | null {
  let updatedSubmission: ContentSubmission | null = null;
  const submissions = getSubmissions().map((sub) => {
    if (sub.id === submissionId) {
      const comments = sub.comments ? [...sub.comments] : [];
      if (commentText) {
        comments.push({
          id: `CMT-${Date.now()}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          text: commentText,
          createdAt: new Date().toISOString(),
        });
      }

      updatedSubmission = {
        ...sub,
        status: newStatus,
        approvalStamp: stamp !== undefined ? stamp : sub.approvalStamp,
        comments,
        updatedAt: new Date().toISOString(),
      };
      return updatedSubmission;
    }
    return sub;
  });

  safeSet(STORAGE_KEYS.SUBMISSIONS, submissions);

  // Sync to backend API in background
  if (updatedSubmission) {
    try {
      fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSubmission),
      }).catch(() => {});
    } catch {}
  }

  addAuditLog({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: newStatus === 'Approved' ? 'APPROVED' : 'REQUESTED_CHANGES',
    targetType: 'Submission',
    targetId: submissionId,
    summary: `Submission ${submissionId} moved to status "${newStatus}" by ${currentUser.name} (${currentUser.role}).`,
    reason: commentText,
  });

  return updatedSubmission;
}

// Audit Logs
export function getAuditLogs(): AuditLogEntry[] {
  return safeGet<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
}

export function addAuditLog(entry: AuditLogEntry): void {
  const logs = getAuditLogs();
  safeSet(STORAGE_KEYS.AUDIT_LOGS, [entry, ...logs].slice(0, 300));
}

// Reset Demo Data
export function resetToDemoData(): void {
  safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
  safeSet(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  safeSet(STORAGE_KEYS.FACTS, INITIAL_FACTS);
  safeSet(STORAGE_KEYS.GUIDELINES, INITIAL_GUIDELINES);
  safeSet(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  safeSet(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
}
