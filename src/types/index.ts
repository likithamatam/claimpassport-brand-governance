/**
 * Type Definitions for Claim Passport
 */

export type UserRole = 'Content Creator' | 'Brand Manager' | 'Reviewer' | 'Fact Owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department: string;
}

export type FactStatus = 'Approved' | 'Expiring Soon' | 'Expired' | 'Deactivated';

export interface LivingFact {
  id: string; // e.g. "FACT-012"
  claim: string; // Approved statement
  sourceReference: string; // Document / link / study
  ownerName: string;
  ownerEmail: string;
  status: FactStatus;
  createdAt: string;
  expiryDate: string; // YYYY-MM-DD
  lastVerifiedDate: string;
  category: 'Metrics & Traction' | 'Product Specs' | 'Compliance & Safety' | 'Sustainability' | 'Pricing & Terms';
  refreshRequested?: boolean;
  refreshNotes?: string;
}

export type GuidelineCategory = 
  | 'Voice & Tone'
  | 'Preferred Product Names'
  | 'Banned Terminology'
  | 'Required Disclaimers'
  | 'Writing Style'
  | 'Claim Substantiation'
  | 'Accessibility';

export type GuidelineStatus = 'Approved' | 'Under Review' | 'Draft' | 'Deprecated';

export interface BrandGuideline {
  id: string; // e.g. "GUIDE-001"
  title: string;
  description: string;
  category: GuidelineCategory;
  status: GuidelineStatus;
  version: string;
  examplesGood: string[];
  examplesBad: string[];
  violationCount: number;
  overrideCount: number;
  clarityFrictionScore?: number; // 0-100 indicating reviewer override friction
  updatedAt: string;
}

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type FindingCategory = 
  | 'Stale Fact'
  | 'Needs Evidence'
  | 'Banned Terminology'
  | 'Voice & Tone'
  | 'Missing Disclaimer'
  | 'Naming Inconsistency'
  | 'Claim Substantiation';

export type FindingActionStatus = 'Pending' | 'Accepted' | 'Edited' | 'Dismissed' | 'Review Requested';

export interface ReviewFinding {
  id: string;
  category: FindingCategory;
  flaggedText: string;
  severity: FindingSeverity;
  confidence: number; // 0 to 100%
  explanation: string;
  evidenceSource?: string;
  evidenceId?: string; // e.g. FACT-012 or GUIDE-003
  factOwner?: string;
  expiryDate?: string;
  suggestedCorrection: string;
  userEditedCorrection?: string;
  actionStatus: FindingActionStatus;
  dismissReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type ContentStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Approved';

export interface ContentSubmission {
  id: string;
  title: string;
  content: string;
  intent: string; // Intent Lock purpose specified by creator
  contentType: 'Social Copy' | 'Blog Article' | 'Product Packaging' | 'Email Campaign' | 'Press Release' | 'Ad Headline';
  targetAudience: 'General Consumers' | 'Eco-conscious Shoppers' | 'B2B Enterprise' | 'Healthcare Providers';
  status: ContentStatus;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  assignedReviewer?: string;
  findings: ReviewFinding[];
  suggestedRevision: string;
  userAppliedRevision?: string;
  intentPreserved: boolean;
  intentLockNotes?: string;
  approvalStamp?: {
    approvedBy: string;
    role: UserRole;
    timestamp: string;
    certificateHash: string;
    verifiedFactsCount: number;
  };
  comments?: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'SUBMITTED' | 'VERIFIED' | 'ACCEPTED_SUGGESTION' | 'OVERRODE_FINDING' | 'DISMISSED_FINDING' | 'APPROVED' | 'REQUESTED_CHANGES' | 'REFRESH_REQUESTED' | 'FACT_UPDATED' | 'GUIDELINE_UPDATED';
  targetType: 'Submission' | 'Fact' | 'Guideline' | 'Finding';
  targetId: string;
  summary: string;
  reason?: string;
}
