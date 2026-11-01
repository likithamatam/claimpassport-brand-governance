/**
 * Claim Passport - First-Run Judge & User Guide Modal
 * Interactive walkthrough for judges and new stakeholders to test the end-to-end journey.
 */

import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Lock,
  Database,
  Award,
  X,
  Play,
} from 'lucide-react';

interface FirstRunGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDemoScenario: () => void;
}

export const FirstRunGuideModal: React.FC<FirstRunGuideModalProps> = ({
  isOpen,
  onClose,
  onLaunchDemoScenario,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '1',
      title: 'Submit Content with Intent Lock',
      desc: 'Content Creators draft copy and lock their marketing goal (e.g. "Announce hydration bottle launch"). Intent Lock guarantees revisions preserve the core message.',
      icon: Lock,
    },
    {
      num: '2',
      title: 'Run AI & Living Fact Verification',
      desc: 'Detects expired facts (FACT-012 expired 2026-09-30), flags ungrounded claims ("100% safe"), and checks banned marketing terms.',
      icon: Sparkles,
    },
    {
      num: '3',
      title: 'Inspect Evidence & Grounded Passages',
      desc: 'Every finding cites the exact document passage, lab trial, or fact owner. Unsupported claims are flagged for human review, never approved silently.',
      icon: Database,
    },
    {
      num: '4',
      title: 'Human Review & Intent-Locked Revision',
      desc: 'Accept or edit verified corrections (swapping ungrounded "100% safe" with certified BPA-free specs). Request reviewer sign-off.',
      icon: FileCheck2,
    },
    {
      num: '5',
      title: 'Governance Sign-Off & Certificate',
      desc: 'Reviewers issue immutable, versioned approvals. Creators attempting to approve get HTTP 403 Forbidden. A cryptographic certificate is stamped.',
      icon: Award,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-white">
              <ShieldCheck className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Claim Passport: Quick-Start Guide</h3>
              <p className="text-xs text-indigo-200">How to prove every claim before publication in 5 steps</p>
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
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-3">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition flex items-start space-x-3.5"
                >
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {st.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center">
                      <Icon className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                      {st.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900">
            <strong className="block text-indigo-950 mb-1">Testing the Demo Scenario:</strong>
            The test copy <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">"Trusted by 10,000+ customers. Our new bottle is 100% safe!"</span> simulates an expired census metric and an unsupported absolute safety assertion.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Close Guide
          </button>
          <button
            onClick={() => {
              onClose();
              onLaunchDemoScenario();
            }}
            className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
            <span>Try the Demo Scenario Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
