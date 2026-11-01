/**
 * Claim Passport - AI and Data Disclosure
 * Transparent disclosure of the AI model, data boundaries, and human-in-the-loop governance.
 */

import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Lock,
  UserCheck,
  CheckCircle2,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface AIDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIDisclosureModal: React.FC<AIDisclosureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">AI & Data Governance Disclosure</h3>
              <p className="text-xs text-slate-300">Compliance & Regulatory Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[11px] font-bold text-indigo-900 uppercase block mb-1">
              Active LLM Model Architecture
            </span>
            <p className="text-slate-800 font-semibold">
              Google Gemini 3.8 Flash (<code className="font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">gemini-3.8-flash</code>)
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Configured via environment variable <code className="font-mono bg-white px-1 py-0.2 rounded border">GEMINI_MODEL</code> with deterministic rules engine fallback.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <Lock className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-900 block mb-0.5">What Data Is Sent to the Model:</strong>
                Only the marketing text snippet, Intent Lock purpose, and retrieved evidence passages (via BM25) from approved documents and living facts. No raw databases, user credentials, or customer PII are ever sent.
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <UserCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-900 block mb-0.5">No Automatic Publication (Human-in-the-Loop):</strong>
                Zero content is published automatically. The AI acts exclusively as an auditor and assistive drafter. Final publication sign-off requires an authorized human Reviewer or Brand Manager.
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-900 block mb-0.5">Role Enforcement & Segregation of Duties:</strong>
                Content Creators are strictly prohibited from approving their own content. The Express API enforces 403 Forbidden with immutable event logging on any unauthorized approval attempt.
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-900 block mb-0.5">Graceful Degradation:</strong>
                If the Gemini API is unreachable or times out, the platform enters <span className="font-semibold text-rose-700">"AI unavailable: rules-only mode"</span> and routes unsupported claims to human review. It never approves silently.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
