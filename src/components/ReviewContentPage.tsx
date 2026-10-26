/**
 * Claim Passport Review Content Page
 * Core Content Review, Evidence-First Findings, Intent Lock, and Human Oversight
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  CalendarX2,
  Clock,
  User,
  Edit3,
  Check,
  X,
  RotateCcw,
  MessageSquare,
  FileText,
  HelpCircle,
  Filter,
  Eye,
  Info,
  Layers,
} from 'lucide-react';
import {
  ContentSubmission,
  LivingFact,
  BrandGuideline,
  ReviewFinding,
  User as UserType,
  FindingActionStatus,
} from '../types';
import { verifyContent, SYSTEM_CURRENT_DATE } from '../services/rulesEngine';
import { saveSubmission, updateSubmissionStatus } from '../services/storage';

interface ReviewContentPageProps {
  initialSubmission?: ContentSubmission | null;
  facts: LivingFact[];
  guidelines: BrandGuideline[];
  currentUser: UserType;
  onSave: (submission: ContentSubmission) => void;
  onNavigate: (view: string) => void;
}

export const ReviewContentPage: React.FC<ReviewContentPageProps> = ({
  initialSubmission,
  facts,
  guidelines,
  currentUser,
  onSave,
  onNavigate,
}) => {
  // Form State
  const [title, setTitle] = useState(
    initialSubmission?.title || 'Hydration Launch Social Copy'
  );
  const [content, setContent] = useState(
    initialSubmission?.content || 'Trusted by 10,000+ customers. Our new bottle is 100% safe!'
  );
  const [intent, setIntent] = useState(
    initialSubmission?.intent || 'Announce new hydration bottle launch highlighting customer adoption and safety assurance'
  );
  const [contentType, setContentType] = useState<ContentSubmission['contentType']>(
    initialSubmission?.contentType || 'Social Copy'
  );
  const [targetAudience, setTargetAudience] = useState<ContentSubmission['targetAudience']>(
    initialSubmission?.targetAudience || 'General Consumers'
  );

  // Field Validation State
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    intent?: string;
    content?: string;
  }>({});

  // Engine State
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState('');
  const [hasChecked, setHasChecked] = useState(
    Boolean(initialSubmission && (initialSubmission.findings?.length > 0 || initialSubmission.status !== 'Draft'))
  );
  const [findings, setFindings] = useState<ReviewFinding[]>(
    initialSubmission?.findings || []
  );
  const [suggestedRevision, setSuggestedRevision] = useState(
    initialSubmission?.suggestedRevision || 'Meet our BPA-free bottle, designed for everyday use.'
  );
  const [intentPreserved, setIntentPreserved] = useState(
    initialSubmission?.intentPreserved ?? true
  );
  const [intentLockNotes, setIntentLockNotes] = useState(
    initialSubmission?.intentLockNotes || 'Intent Lock applied: Preserved safety and launch readiness goals using verified BPA-free specs.'
  );
  const [engineMessage, setEngineMessage] = useState<string>(
    initialSubmission?.findings?.length ? 'Grounded in Living Fact Registry and Brand Guidelines' : ''
  );
  const [isLiveAI, setIsLiveAI] = useState<boolean>(false);

  // Filters & Filter State
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Dismiss Modal State
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [activeDismissFinding, setActiveDismissFinding] = useState<ReviewFinding | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissError, setDismissError] = useState<string | null>(null);

  // Edit Suggestion Modal State
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [customCorrection, setCustomCorrection] = useState('');

  // UI Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Load active submission if prop changes
  useEffect(() => {
    if (initialSubmission) {
      setTitle(initialSubmission.title);
      setContent(initialSubmission.content);
      setIntent(initialSubmission.intent);
      setContentType(initialSubmission.contentType);
      setTargetAudience(initialSubmission.targetAudience);
      setFindings(initialSubmission.findings || []);
      setSuggestedRevision(initialSubmission.suggestedRevision || '');
      setIntentPreserved(initialSubmission.intentPreserved ?? true);
      setIntentLockNotes(initialSubmission.intentLockNotes || '');
      setHasChecked(Boolean(initialSubmission.findings?.length > 0 || initialSubmission.status !== 'Draft'));
      setFieldErrors({});
    }
  }, [initialSubmission]);

  const loadRequiredDemoScenario = () => {
    setTitle('Hydration Launch Social Copy (Required Hackathon Demo)');
    setContent('Trusted by 10,000+ customers. Our new bottle is 100% safe!');
    setIntent('Announce new hydration bottle launch highlighting customer adoption and safety assurance');
    setContentType('Social Copy');
    setTargetAudience('General Consumers');
    setFieldErrors({});
    setNotification({
      type: 'info',
      text: 'Loaded required demonstration scenario: "Trusted by 10,000+ customers. Our new bottle is 100% safe!" Click "Check Content Against Brand Standards" to run live verification.',
    });
  };

  const handleRunCheck = async () => {
    // Requirement 2: Validate the content title, mandatory Intent Lock purpose, and marketing text
    const errors: { title?: string; intent?: string; content?: string } = {};
    if (!title.trim()) {
      errors.title = 'Content Title / Campaign Name is required.';
    }
    if (!intent.trim()) {
      errors.intent = 'Mandatory Intent Lock purpose is required before verification.';
    }
    if (!content.trim()) {
      errors.content = 'Marketing or promotional text is required before verification.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setNotification({
        type: 'error',
        text: 'Validation Error: Please fill in the Content Title, Intent Lock Purpose, and Marketing Text before checking.',
      });
      return;
    }

    setFieldErrors({});
    setIsChecking(true);
    setNotification(null);

    // Progressive step sequence
    setCheckProgress('1/5: Validating input text and character length...');
    await new Promise((r) => setTimeout(r, 250));
    setCheckProgress('2/5: Extracting factual claims and metric propositions...');
    await new Promise((r) => setTimeout(r, 350));
    setCheckProgress('3/5: Checking brand terminology, banned phrases, and regulatory rules...');
    await new Promise((r) => setTimeout(r, 350));
    setCheckProgress(`4/5: Querying Living Fact Registry & evaluating expiry against ${SYSTEM_CURRENT_DATE}...`);
    await new Promise((r) => setTimeout(r, 350));
    setCheckProgress('5/5: Enforcing Intent Lock and synthesizing verified revision...');

    try {
      const result = await verifyContent(
        title.trim(),
        content.trim(),
        intent.trim(),
        contentType,
        targetAudience,
        facts,
        guidelines
      );

      setHasChecked(true);
      setFindings(result.findings);
      setSuggestedRevision(result.suggestedRevision);
      setIntentPreserved(result.intentPreserved);
      setIntentLockNotes(result.intentLockNotes);
      setEngineMessage(result.engineMessage);
      setIsLiveAI(result.isLiveAI);

      if (result.findings.length > 0) {
        setNotification({
          type: 'success',
          text: `Verification completed: Found ${result.findings.length} findings with full evidence traceability.`,
        });
      } else {
        setNotification({
          type: 'success',
          text: 'Verification completed: All statements verified against active Living Facts with zero compliance violations.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Verification failed: ${err?.message || 'Check connection or retry.'}`,
      });
    } finally {
      setIsChecking(false);
      setCheckProgress('');
    }
  };

  const handleAcceptFinding = (finding: ReviewFinding) => {
    const updated = findings.map((f) => {
      if (f.id === finding.id) {
        return { ...f, actionStatus: 'Accepted' as FindingActionStatus };
      }
      return f;
    });
    setFindings(updated);

    // Apply correction directly to content if found
    if (finding.flaggedText && finding.suggestedCorrection) {
      const newText = content.replace(new RegExp(finding.flaggedText, 'gi'), finding.suggestedCorrection);
      setContent(newText);
    }

    setNotification({
      type: 'success',
      text: `Accepted suggestion for "${finding.flaggedText}". Updated draft copy.`,
    });
  };

  const handleOpenDismissModal = (finding: ReviewFinding) => {
    setActiveDismissFinding(finding);
    setDismissReason('');
    setDismissError(null);
    setDismissModalOpen(true);
  };

  const handleConfirmDismiss = () => {
    if (!activeDismissFinding) return;
    if (!dismissReason.trim()) {
      setDismissError('A justified reason is required by brand compliance to dismiss an automated finding.');
      return;
    }

    const updated = findings.map((f) => {
      if (f.id === activeDismissFinding.id) {
        return {
          ...f,
          actionStatus: 'Dismissed' as FindingActionStatus,
          dismissReason: dismissReason.trim(),
        };
      }
      return f;
    });
    setFindings(updated);
    setDismissModalOpen(false);

    setNotification({
      type: 'info',
      text: `Dismissed finding for "${activeDismissFinding.flaggedText}". Audit justification logged.`,
    });
  };

  const handleStartEditCorrection = (finding: ReviewFinding) => {
    setEditingFindingId(finding.id);
    setCustomCorrection(finding.userEditedCorrection || finding.suggestedCorrection);
  };

  const handleSaveCustomCorrection = (findingId: string) => {
    if (!customCorrection.trim()) return;

    const updated = findings.map((f) => {
      if (f.id === findingId) {
        return {
          ...f,
          actionStatus: 'Edited' as FindingActionStatus,
          userEditedCorrection: customCorrection.trim(),
        };
      }
      return f;
    });
    setFindings(updated);
    setEditingFindingId(null);

    setNotification({
      type: 'success',
      text: 'Saved customized suggestion. Reviewer audit record updated.',
    });
  };

  const handleApplyFullSuggestedRevision = () => {
    if (!suggestedRevision) return;
    setContent(suggestedRevision);
    setNotification({
      type: 'success',
      text: 'Applied Intent-Locked revision to content draft. Human approved!',
    });
  };

  const handleSaveSubmission = (targetStatus: ContentSubmission['status']) => {
    // Validate fields before submitting
    if (!title.trim() || !intent.trim() || !content.trim()) {
      setNotification({
        type: 'error',
        text: 'Cannot save: Please provide Title, Intent Lock purpose, and marketing text.',
      });
      return;
    }

    const subId = initialSubmission?.id || `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const submission: ContentSubmission = {
      id: subId,
      title: title.trim(),
      content: content.trim(),
      intent: intent.trim(),
      contentType,
      targetAudience,
      status: targetStatus,
      createdBy: initialSubmission?.createdBy || currentUser,
      createdAt: initialSubmission?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedReviewer: initialSubmission?.assignedReviewer || 'Jordan Taylor',
      findings,
      suggestedRevision,
      intentPreserved,
      intentLockNotes,
      comments: initialSubmission?.comments || [],
    };

    saveSubmission(submission, currentUser);
    onSave(submission);

    setNotification({
      type: 'success',
      text: `Saved submission ${submission.id} ("${submission.title}") with status "${targetStatus}".`,
    });

    if (targetStatus === 'Submitted' || targetStatus === 'Under Review') {
      setTimeout(() => onNavigate('approvals'), 1000);
    }
  };

  // Filtered Findings
  const filteredFindings = findings.filter((f) => {
    if (filterSeverity !== 'ALL' && f.severity !== filterSeverity) return false;
    if (filterCategory !== 'ALL' && f.category !== filterCategory) return false;
    return true;
  });

  const isChangesRequested = initialSubmission?.status === 'Changes Requested';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Content Review & Verification
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
              Intent Lock Active
            </span>
            {isChangesRequested && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                Changes Requested
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluate claims against living facts and brand standards before publication.
          </p>
        </div>

        {/* Demo Scenario Button */}
        <button
          onClick={loadRequiredDemoScenario}
          className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 shadow-xs transition"
        >
          <Sparkles className="h-4 w-4 mr-1.5 text-indigo-600" />
          <span>Load Hackathon Demo Scenario</span>
        </button>
      </div>

      {/* Changes Requested Banner if applicable */}
      {isChangesRequested && initialSubmission?.comments && initialSubmission.comments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Reviewer Requested Changes:</span>
          </div>
          <p className="text-amber-900 pl-6 italic">
            "{initialSubmission.comments[initialSubmission.comments.length - 1].text}"
          </p>
          <p className="text-[11px] text-amber-800 pl-6">
            Review the findings below, revise your copy, and click <strong>"Resubmit for Approval"</strong> when ready.
          </p>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-indigo-600" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Input Workbench & Intent Lock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Workbench (Inputs) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Draft Specifications
              </span>
              <span className="text-[11px] text-slate-400">
                Evaluation Reference Date: <strong>{SYSTEM_CURRENT_DATE}</strong>
              </span>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Content Title / Campaign Name <span className="text-rose-500">*</span>
                </label>
                {fieldErrors.title && (
                  <span className="text-[11px] text-rose-600 font-semibold">{fieldErrors.title}</span>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. EcoShield Fall Product Launch Copy"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                  fieldErrors.title ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                }`}
              />
            </div>

            {/* Intent Lock Input */}
            <div className={`p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 via-violet-50/50 to-white border transition ${
              fieldErrors.intent ? 'border-rose-400 ring-2 ring-rose-200' : 'border-indigo-200/80'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-indigo-900 flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                  Intent Lock: Content Purpose (Mandatory) <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  Preserved across all AI rewrites
                </span>
              </div>
              <input
                type="text"
                value={intent}
                onChange={(e) => {
                  setIntent(e.target.value);
                  if (fieldErrors.intent) setFieldErrors((prev) => ({ ...prev, intent: undefined }));
                }}
                placeholder="Specify the content's exact purpose in one clear sentence..."
                className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {fieldErrors.intent ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.intent}</p>
              ) : (
                <p className="text-[11px] text-indigo-900/70 mt-1.5 leading-relaxed">
                  Intent Lock ensures any suggested correction honors your primary goal without injecting unverified promises.
                </p>
              )}
            </div>

            {/* Content Type & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Social Copy">Social Media Copy</option>
                  <option value="Blog Article">Blog / Editorial Post</option>
                  <option value="Product Packaging">Product Packaging / Label</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Press Release">Press Release</option>
                  <option value="Ad Headline">Ad Headline / Banner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General Consumers">General Consumers</option>
                  <option value="Eco-conscious Shoppers">Eco-conscious Shoppers</option>
                  <option value="B2B Enterprise">B2B Enterprise Buyers</option>
                  <option value="Healthcare Providers">Healthcare & Clinical</option>
                </select>
              </div>
            </div>

            {/* Marketing / Promotional Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Marketing Copy / Promotional Text <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {content.length} chars
                </span>
              </div>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (fieldErrors.content) setFieldErrors((prev) => ({ ...prev, content: undefined }));
                }}
                placeholder="Paste promotional copy or marketing claims here..."
                className={`w-full p-3.5 text-sm font-sans bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed ${
                  fieldErrors.content ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                }`}
              />
              {fieldErrors.content && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.content}</p>
              )}
            </div>

            {/* Check Content Action Button */}
            <div className="pt-2">
              <button
                onClick={handleRunCheck}
                disabled={isChecking}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isChecking ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Claims & Living Facts...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Check Content Against Brand Standards</span>
                  </>
                )}
              </button>

              {isChecking && checkProgress && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center animate-pulse">
                  <p className="text-xs font-mono font-medium text-indigo-800">
                    {checkProgress}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submission Workflow Actions */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Active User: <strong>{currentUser.name}</strong> ({currentUser.role})
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSaveSubmission('Draft')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSaveSubmission('Submitted')}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
              >
                {isChangesRequested ? 'Resubmit for Approval →' : 'Submit for Approval →'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Intent Lock Comparison Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Intent Lock Rewrite Engine
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Zero Hallucinations
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              When issues are identified, Claim Passport generates an intent-preserved correction using <strong>only approved Living Facts</strong>. The author must explicitly approve final wording.
            </div>

            {/* Side-by-side comparison */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Original Submitted Copy
                </span>
                <p className="text-slate-800 font-medium">"{content}"</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Intent-Locked Suggested Revision
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    100% Verified Facts
                  </span>
                </div>
                <p className="text-emerald-950 font-bold text-sm leading-relaxed">
                  "{suggestedRevision}"
                </p>
                <p className="text-[11px] text-emerald-800 leading-normal pt-1 border-t border-emerald-200">
                  <strong>Intent Rationale:</strong> {intentLockNotes}
                </p>
              </div>
            </div>

            {/* Creator Approval Button */}
            <div className="pt-2">
              <button
                onClick={handleApplyFullSuggestedRevision}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Apply Intent-Locked Revision to Draft</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Human confirmation required. Never replaces content silently.
              </p>
            </div>
          </div>

          {/* Engine Grounding Badge */}
          {engineMessage && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-bold text-indigo-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verification Engine State</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  isLiveAI ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'bg-slate-800 text-slate-300'
                }`}>
                  {isLiveAI ? 'Live Gemini 3.8 Flash' : 'Deterministic Rules & Facts'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {engineMessage}
              </p>
            </div>
          )}

          {/* Fictional Demo Badge Info Card */}
          <div className="p-4 rounded-2xl bg-slate-100 text-slate-700 text-xs border border-slate-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold">
              <Info className="h-4 w-4" />
              <span>Hackathon Scenario Notes</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Illustrative fictional brand demonstration: Fact #12 ("10,000+ customers") expired on 30 Sept 2026. "100% safe" violates GUIDE-001 (Needs Evidence). Verified BPA-free specifications (FACT-007) provide compliant replacement.
            </p>
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Evidence-First Findings ({hasChecked ? filteredFindings.length : 0})
              </h2>
              {hasChecked && findings.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                  {findings.filter((f) => f.severity === 'Critical' || f.severity === 'High').length} High/Critical
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every issue cites approved evidence, guidelines, or explicitly states evidence is missing.
            </p>
          </div>

          {/* Filters Bar */}
          {hasChecked && findings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Filter:</span>
              </div>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Stale Fact">Stale Fact</option>
                <option value="Needs Evidence">Needs Evidence</option>
                <option value="Banned Terminology">Banned Terminology</option>
                <option value="Voice & Tone">Voice & Tone</option>
              </select>
            </div>
          )}
        </div>

        {/* State 1: Initial state (Never ran yet) -> Do NOT display "No Issues Found"! */}
        {!hasChecked && (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <ShieldCheck className="h-10 w-10 text-indigo-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              Ready for Brand Governance Verification
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Enter your copy and click <strong>"Check Content Against Brand Standards"</strong> above. Claim Passport will verify claims against the Living Fact Registry, check expiration dates, and test brand guidelines.
            </p>
          </div>
        )}

        {/* State 2: Checked and 0 issues found */}
        {hasChecked && filteredFindings.length === 0 && (
          <div className="text-center py-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-950">
              All Verification Checks Completed Successfully
            </h3>
            <p className="text-xs text-emerald-800 max-w-lg mx-auto mt-1">
              All factual propositions are grounded in active Living Facts. Verification checks performed:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-emerald-800">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 font-medium">✓ Customer Metric Staleness (Evaluated vs 2026-10-26)</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 font-medium">✓ Absolute Safety Guarantee Policy (FTC / FDA)</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 font-medium">✓ Official Product Naming Convention</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 font-medium">✓ Environmental Standards Disclaimers</span>
            </div>
          </div>
        )}

        {/* State 3: Checked and findings exist */}
        {hasChecked && filteredFindings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFindings.map((finding) => {
              const isDismissed = finding.actionStatus === 'Dismissed';
              const isAccepted = finding.actionStatus === 'Accepted';
              const isEdited = finding.actionStatus === 'Edited';

              let severityBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (finding.severity === 'Critical') {
                severityBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
              } else if (finding.severity === 'High') {
                severityBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
              } else if (finding.severity === 'Medium') {
                severityBadgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
              }

              return (
                <div
                  key={finding.id}
                  className={`rounded-2xl p-5 border transition flex flex-col justify-between ${
                    isDismissed
                      ? 'bg-slate-50/80 border-slate-200 opacity-60'
                      : isAccepted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Bar: Category & Severity */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center">
                        {finding.category === 'Stale Fact' && (
                          <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" />
                        )}
                        {finding.category === 'Needs Evidence' && (
                          <AlertOctagon className="h-3.5 w-3.5 mr-1 text-rose-600" />
                        )}
                        {finding.category}
                      </span>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {finding.confidence}% Conf.
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadgeColor}`}>
                          {finding.severity}
                        </span>
                      </div>
                    </div>

                    {/* Flagged Text Highlight */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Flagged Phrase:
                      </span>
                      <span className="text-xs font-bold text-slate-900 bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200">
                        "{finding.flaggedText}"
                      </span>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {finding.explanation}
                    </p>

                    {/* Evidence Citation Details */}
                    <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-900">
                          Evidence Source:
                        </span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {finding.evidenceId || 'None'}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">
                        {finding.evidenceSource || 'No matching approved source exists in registry.'}
                      </p>
                      {finding.factOwner && (
                        <div className="flex items-center justify-between pt-1 text-slate-500">
                          <span>Owner: <strong>{finding.factOwner}</strong></span>
                          {finding.expiryDate && (
                            <span className="text-amber-700 font-semibold">
                              Expired: {finding.expiryDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Suggested Correction */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                          Suggested Correction:
                        </span>
                        {isEdited && (
                          <span className="text-[10px] text-indigo-700 font-semibold">
                            (Customized)
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-indigo-950">
                        "{finding.userEditedCorrection || finding.suggestedCorrection}"
                      </p>
                    </div>

                    {/* Dismissal Note if applicable */}
                    {isDismissed && finding.dismissReason && (
                      <div className="p-2 rounded-lg bg-slate-200 text-[11px] text-slate-700">
                        <strong>Dismissal Justification:</strong> {finding.dismissReason}
                      </div>
                    )}
                  </div>

                  {/* Interactive Card Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleAcceptFinding(finding)}
                        disabled={isAccepted}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                          isAccepted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isAccepted ? 'Accepted' : 'Accept Suggestion'}
                      </button>

                      <button
                        onClick={() => handleStartEditCorrection(finding)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenDismissModal(finding)}
                        className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 rounded-lg transition"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setNotification({
                            type: 'info',
                            text: `Review request dispatched to ${finding.factOwner || 'Jordan Taylor (Senior Reviewer)'}.`,
                          });
                        }}
                        className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-indigo-600 rounded-lg transition"
                      >
                        Request Review
                      </button>
                    </div>
                  </div>

                  {/* Inline Editing Drawer */}
                  {editingFindingId === finding.id && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-2">
                      <label className="font-bold text-slate-800 block">
                        Edit Proposed Correction:
                      </label>
                      <input
                        type="text"
                        value={customCorrection}
                        onChange={(e) => setCustomCorrection(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingFindingId(null)}
                          className="px-2 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveCustomCorrection(finding.id)}
                          className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg"
                        >
                          Save Correction
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mandatory Dismissal Justification Modal */}
      {dismissModalOpen && activeDismissFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                Dismiss Finding Justification
              </h3>
              <button
                onClick={() => setDismissModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Brand compliance requires an auditable reason before overriding automated findings for:
              <br />
              <strong className="text-slate-900">"{activeDismissFinding.flaggedText}"</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Reason for Override / Dismissal <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={dismissReason}
                onChange={(e) => {
                  setDismissReason(e.target.value);
                  if (dismissError) setDismissError(null);
                }}
                placeholder="e.g. Legal has verified this specific phrasing under separate counsel opinion #991..."
                className={`w-full p-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  dismissError ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                }`}
              />
              {dismissError && (
                <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 shrink-0" />
                  {dismissError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDismissModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDismiss}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm & Log Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
