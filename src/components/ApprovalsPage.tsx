/**
 * Claim Passport Approvals & Sign-off Workflow
 * Section 4.J: Review queues, feedback comments, role gating, and formal governance certificates
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  UserCheck,
  Send,
  MessageSquare,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { ContentSubmission, User as UserType } from '../types';
import { updateSubmissionStatus } from '../services/storage';

interface ApprovalsPageProps {
  submissions: ContentSubmission[];
  currentUser: UserType;
  onRefreshSubmissions: () => void;
  onSelectSubmission: (sub: ContentSubmission) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  submissions,
  currentUser,
  onRefreshSubmissions,
  onSelectSubmission,
}) => {
  const [selectedSub, setSelectedSub] = useState<ContentSubmission | null>(
    submissions.find((s) => s.status === 'Under Review' || s.status === 'Submitted' || s.status === 'Changes Requested') || submissions[0] || null
  );

  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved'>('Pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [actionNotification, setActionNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const canApprove = currentUser.role === 'Brand Manager' || currentUser.role === 'Reviewer';

  // Synchronize selectedSub whenever submissions prop updates
  useEffect(() => {
    if (selectedSub) {
      const refreshed = submissions.find((s) => s.id === selectedSub.id);
      if (refreshed) {
        setSelectedSub(refreshed);
      }
    } else if (submissions.length > 0) {
      setSelectedSub(
        submissions.find((s) => s.status === 'Under Review' || s.status === 'Submitted' || s.status === 'Changes Requested') || submissions[0]
      );
    }
  }, [submissions]);

  const handleApprove = () => {
    if (!selectedSub) return;
    if (!canApprove) {
      setActionNotification({
        type: 'error',
        text: `Approval Denied: Your active role (${currentUser.role}) does not have governance authority to approve publications. Please switch to a Reviewer or Brand Manager in the top-right header.`,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const certHash = `CP-CERT-${Math.floor(10000 + Math.random() * 90000)}-${Date.now().toString().slice(-4)}`;
      const stamp = {
        approvedBy: currentUser.name,
        role: currentUser.role,
        timestamp: new Date().toISOString(),
        certificateHash: certHash,
        verifiedFactsCount: Math.max(1, selectedSub.findings.filter((f) => f.actionStatus === 'Accepted').length),
      };

      const updated = updateSubmissionStatus(
        selectedSub.id,
        'Approved',
        currentUser,
        stamp,
        commentText.trim() || 'Approved for publication under verified Claim Passport standards.'
      );

      if (updated) {
        setSelectedSub(updated);
      }
      setCommentText('');
      setFeedbackError(null);
      onRefreshSubmissions();
      setActionNotification({
        type: 'success',
        text: `Content formally approved! Governance Certificate ${certHash} issued.`,
      });
    } catch (err: any) {
      setActionNotification({
        type: 'error',
        text: `Approval failed: ${err?.message || 'Storage error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = () => {
    if (!selectedSub) return;

    // Requirement 3: Require reviewer feedback before requesting changes
    if (!commentText.trim()) {
      setFeedbackError('Reviewer feedback is required before requesting changes. Please enter actionable revision guidance in the feedback box.');
      return;
    }

    setFeedbackError(null);
    setIsProcessing(true);

    try {
      // Requirement 4 & 5: update status to "Changes Requested" and save comment with ID, reviewer, timestamp
      const updated = updateSubmissionStatus(
        selectedSub.id,
        'Changes Requested',
        currentUser,
        undefined,
        commentText.trim()
      );

      // Requirement 6: Update selected submission and submission queue immediately
      if (updated) {
        setSelectedSub(updated);
      }
      setCommentText('');
      onRefreshSubmissions();

      // Requirement 8: Clear success message
      setActionNotification({
        type: 'success',
        text: `Changes requested successfully for ${selectedSub.id}. Workflow status updated to "Changes Requested" and reviewer feedback logged.`,
      });
    } catch (err: any) {
      setActionNotification({
        type: 'error',
        text: `Failed to request changes: ${err?.message || 'Storage error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCommentOnly = () => {
    if (!selectedSub || !commentText.trim()) return;
    setIsProcessing(true);
    try {
      const updated = updateSubmissionStatus(
        selectedSub.id,
        selectedSub.status,
        currentUser,
        undefined,
        commentText.trim()
      );
      if (updated) {
        setSelectedSub(updated);
      }
      setCommentText('');
      setFeedbackError(null);
      onRefreshSubmissions();
      setActionNotification({
        type: 'success',
        text: 'Reviewer comment logged to audit trail.',
      });
    } catch (err: any) {
      setActionNotification({
        type: 'error',
        text: `Failed to post comment: ${err?.message || 'Storage error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (activeTab === 'Pending') return s.status === 'Submitted' || s.status === 'Under Review' || s.status === 'Changes Requested';
    if (activeTab === 'Approved') return s.status === 'Approved';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Approvals & Governance Sign-off
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
              Human-in-the-Loop Gate
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Examine claim evidence, exchange feedback, and issue publication certificates.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          {(['Pending', 'Approved', 'All'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Role permission info banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
        canApprove
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2">
          <UserCheck className="h-4 w-4 shrink-0" />
          <span>
            Operating as <strong>{currentUser.name}</strong> ({currentUser.role}).{' '}
            {canApprove
              ? 'You hold verified authority to approve submissions and sign governance certificates.'
              : 'Content Creators cannot approve submissions. You can review comments and revise drafts.'}
          </span>
        </div>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/70 border border-current">
          {currentUser.role}
        </span>
      </div>

      {/* Main Layout: List on Left, Detail & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Submissions List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            Submissions Queue ({filtered.length})
          </span>

          <div className="space-y-2.5">
            {filtered.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              const isApproved = sub.status === 'Approved';
              const isChangesRequested = sub.status === 'Changes Requested';

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedSub(sub);
                    setFeedbackError(null);
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm'
                      : 'bg-white/80 hover:bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-indigo-700">
                      {sub.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isChangesRequested
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : sub.status === 'Under Review'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {sub.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    "{sub.content}"
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Creator: {sub.createdBy.name}</span>
                    <span>{sub.findings.length} findings</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7 space-y-5">
          {selectedSub ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              {/* Action Notification Banner */}
              {actionNotification && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
                    actionNotification.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {actionNotification.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{actionNotification.text}</span>
                  </div>
                  <button
                    onClick={() => setActionNotification(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Submission Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">
                      {selectedSub.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedSub.contentType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedSub.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedSub.status === 'Changes Requested'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : selectedSub.status === 'Under Review'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {selectedSub.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedSub.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: {selectedSub.targetAudience} • Created by {selectedSub.createdBy.name}
                  </p>
                </div>

                <button
                  onClick={() => onSelectSubmission(selectedSub)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Workbench
                </button>
              </div>

              {/* Content Body */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Submitted Content Text:
                </span>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  "{selectedSub.content}"
                </p>
              </div>

              {/* Intent Lock Objective */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block mb-0.5">
                  Locked Intent (Purpose):
                </span>
                <p className="text-indigo-950 font-semibold">
                  "{selectedSub.intent}"
                </p>
              </div>

              {/* Findings Summary */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Claim Verification Findings ({selectedSub.findings.length})
                </span>
                {selectedSub.findings.length === 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>No compliance findings detected. All claims substantiated.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSub.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{f.category}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                              {f.severity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {f.evidenceId || 'No Evidence'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">
                            Flagged: <strong className="text-slate-900">"{f.flaggedText}"</strong>
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {f.actionStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approval Stamp Certificate if approved */}
              {selectedSub.approvalStamp && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-emerald-900 text-sm">
                      <Award className="h-5 w-5 text-emerald-600" />
                      <span>Formal Brand Governance Sign-Off Certificate</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-emerald-200/80 rounded">
                      {selectedSub.approvalStamp.certificateHash}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      Approver: <strong>{selectedSub.approvalStamp.approvedBy}</strong> ({selectedSub.approvalStamp.role})
                    </div>
                    <div>
                      Timestamp: {new Date(selectedSub.approvalStamp.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-800 pt-1 border-t border-emerald-200">
                    Verified through Claim Passport immutable governance ledger. Does not auto-publish to external channels.
                  </p>
                </div>
              )}

              {/* Reviewer Feedback / Comments History */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Reviewer Feedback & Dialogue
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSub.comments?.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-800">{c.authorName} ({c.authorRole})</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700">{c.text}</p>
                    </div>
                  ))}
                  {(!selectedSub.comments || selectedSub.comments.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No comments yet.</p>
                  )}
                </div>

                {/* Add Feedback Input */}
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      if (feedbackError) setFeedbackError(null);
                    }}
                    placeholder="Add instructions, legal guidance, or revision feedback before requesting changes..."
                    className={`w-full p-2.5 text-xs bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition ${
                      feedbackError ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                    }`}
                  />
                  {feedbackError && (
                    <p className="text-xs text-rose-600 font-semibold flex items-center mt-1">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1 shrink-0" />
                      {feedbackError}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleAddCommentOnly}
                      disabled={!commentText.trim() || isProcessing}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
                    >
                      Post Comment Only
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRequestChanges}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition flex items-center disabled:opacity-60 shadow-xs"
                      >
                        {isProcessing ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mr-1.5" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Request Changes</span>
                        )}
                      </button>

                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition flex items-center ${
                          canApprove
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Issue Governance Sign-Off</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select a submission from the queue to review and approve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
