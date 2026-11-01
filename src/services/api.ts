/**
 * Claim Passport API Client
 * Communicates with the Express + SQLite backend.
 * Handles bearer tokens, auth sessions, and persistent REST calls.
 */

import {
  User,
  LivingFact,
  BrandGuideline,
  ContentSubmission,
  AuditLogEntry,
  FindingActionStatus,
} from '../types';

const AUTH_TOKEN_KEY = 'claim_passport_token_v2';
const AUTH_USER_KEY = 'claim_passport_user_v2';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string, user: User): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.error || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }

  return data;
}

// -------------------------------------------------------------
// Auth API
// -------------------------------------------------------------
export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(res.token, res.user);
  return { token: res.token, user: res.user };
}

export async function signupApi(userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
}): Promise<{ token: string; user: User }> {
  const res = await request<{ success: boolean; token: string; user: User }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  setStoredToken(res.token, res.user);
  return { token: res.token, user: res.user };
}

export async function logoutApi(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    clearStoredAuth();
  }
}

export async function getMeApi(): Promise<User | null> {
  try {
    const res = await request<{ success: boolean; user: User }>('/api/auth/me');
    return res.user;
  } catch {
    return null;
  }
}

export async function getDemoUsersApi(): Promise<Array<User & { defaultPassword: string }>> {
  const res = await request<{ success: boolean; users: Array<User & { defaultPassword: string }> }>('/api/auth/demo-users');
  return res.users;
}

// -------------------------------------------------------------
// Facts API
// -------------------------------------------------------------
export async function fetchFactsApi(): Promise<LivingFact[]> {
  const res = await request<{ success: boolean; data: LivingFact[] }>('/api/facts');
  return res.data;
}

export async function saveFactApi(fact: LivingFact): Promise<LivingFact> {
  const res = await request<{ success: boolean; data: LivingFact }>('/api/facts', {
    method: 'POST',
    body: JSON.stringify(fact),
  });
  return res.data;
}

export async function requestFactRefreshApi(factId: string, notes: string): Promise<LivingFact> {
  const res = await request<{ success: boolean; data: LivingFact }>(`/api/facts/${factId}/refresh`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return res.data;
}

// -------------------------------------------------------------
// Guidelines API
// -------------------------------------------------------------
export async function fetchGuidelinesApi(): Promise<BrandGuideline[]> {
  const res = await request<{ success: boolean; data: BrandGuideline[] }>('/api/guidelines');
  return res.data;
}

export async function updateGuidelineApi(guideline: BrandGuideline): Promise<BrandGuideline> {
  const res = await request<{ success: boolean; data: BrandGuideline }>(`/api/guidelines/${guideline.id}`, {
    method: 'PUT',
    body: JSON.stringify(guideline),
  });
  return res.data;
}

// -------------------------------------------------------------
// Submissions API
// -------------------------------------------------------------
export async function fetchSubmissionsApi(): Promise<ContentSubmission[]> {
  const res = await request<{ success: boolean; data: ContentSubmission[] }>('/api/submissions');
  return res.data;
}

export async function fetchSubmissionByIdApi(id: string): Promise<ContentSubmission & { decisions?: any[] }> {
  const res = await request<{ success: boolean; data: ContentSubmission & { decisions?: any[] } }>(`/api/submissions/${id}`);
  return res.data;
}

export async function saveSubmissionApi(sub: Partial<ContentSubmission>): Promise<ContentSubmission> {
  const res = await request<{ success: boolean; data: ContentSubmission }>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(sub),
  });
  return res.data;
}

export async function requestReviewApi(subId: string, assignedReviewer: string): Promise<ContentSubmission> {
  const res = await request<{ success: boolean; data: ContentSubmission }>(`/api/submissions/${subId}/request-review`, {
    method: 'POST',
    body: JSON.stringify({ assignedReviewer }),
  });
  return res.data;
}

export async function recordDecisionApi(
  subId: string,
  decision: 'Approved' | 'Changes Requested' | 'Rejected',
  reason?: string,
  commentText?: string
): Promise<{ submission: ContentSubmission; decision: any }> {
  const res = await request<{ success: boolean; data: ContentSubmission; decision: any }>(`/api/submissions/${subId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason, commentText }),
  });
  return { submission: res.data, decision: res.decision };
}

export async function updateFindingActionApi(
  subId: string,
  findingId: string,
  action: FindingActionStatus,
  reason?: string,
  editedCorrection?: string
): Promise<ContentSubmission> {
  const res = await request<{ success: boolean; data: ContentSubmission }>(
    `/api/submissions/${subId}/findings/${findingId}/action`,
    {
      method: 'POST',
      body: JSON.stringify({ action, reason, editedCorrection }),
    }
  );
  return res.data;
}

export async function fetchSubmissionDecisionsApi(subId: string): Promise<any[]> {
  const res = await request<{ success: boolean; data: any[] }>(`/api/submissions/${subId}/decisions`);
  return res.data;
}

// -------------------------------------------------------------
// Documents & Passages API
// -------------------------------------------------------------
export async function fetchDocumentsApi(): Promise<any[]> {
  const res = await request<{ success: boolean; data: any[] }>('/api/documents');
  return res.data;
}

export async function fetchDocumentPassagesApi(docId: string): Promise<any[]> {
  const res = await request<{ success: boolean; data: any[] }>(`/api/documents/${docId}/passages`);
  return res.data;
}

export async function uploadDocumentApi(docData: {
  filename: string;
  mimeType?: string;
  contentBase64?: string;
  contentText?: string;
}): Promise<any> {
  const res = await request<{ success: boolean; data: any; passageCount: number }>('/api/documents/upload', {
    method: 'POST',
    body: JSON.stringify(docData),
  });
  return res;
}

export async function deleteDocumentApi(docId: string): Promise<void> {
  await request(`/api/documents/${docId}`, { method: 'DELETE' });
}

// -------------------------------------------------------------
// In-App Notifications API
// -------------------------------------------------------------
export async function fetchNotificationsApi(): Promise<{ unreadCount: number; notifications: any[] }> {
  const res = await request<{ success: boolean; unreadCount: number; data: any[] }>('/api/notifications');
  return { unreadCount: res.unreadCount, notifications: res.data };
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await request(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await request('/api/notifications/read-all', { method: 'POST' });
}

// -------------------------------------------------------------
// Analytics API
// -------------------------------------------------------------
export async function fetchAnalyticsApi(filters?: {
  startDate?: string;
  endDate?: string;
  ruleId?: string;
  reviewer?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.ruleId) params.set('ruleId', filters.ruleId);
  if (filters?.reviewer) params.set('reviewer', filters.reviewer);

  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await request<{ success: boolean; data: any }>(`/api/analytics${q}`);
  return res.data;
}

export async function seedDemoAnalyticsApi(): Promise<any> {
  const res = await request<{ success: boolean; message: string; count: number }>('/api/analytics/demo-data', {
    method: 'POST',
  });
  return res;
}

export async function approveClarityProposalApi(proposalId: string): Promise<any> {
  const res = await request<{ success: boolean; data: any }>(`/api/analytics/clarity-proposals/${proposalId}/approve`, {
    method: 'POST',
  });
  return res.data;
}

// -------------------------------------------------------------
// Events API (Append-only audit)
// -------------------------------------------------------------
export async function fetchEventsApi(filters?: { submissionId?: string; ruleId?: string; type?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.submissionId) params.set('submissionId', filters.submissionId);
  if (filters?.ruleId) params.set('ruleId', filters.ruleId);
  if (filters?.type) params.set('type', filters.type);

  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await request<{ success: boolean; data: any[] }>(`/api/events${q}`);
  return res.data;
}
