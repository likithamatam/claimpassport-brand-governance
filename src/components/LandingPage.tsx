/**
 * Claim Passport Landing Page
 * Section 4.A of Inkloom AI Hackathon requirements
 */

import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  FileCheck2,
  Lock,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onOpenDashboard: () => void;
  onExploreFeatures: () => void;
  onLoadDemoScenario: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDashboard,
  onExploreFeatures,
  onLoadDemoScenario,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24 border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Built for the Inkloom AI Hackathon</span>
            <span className="text-indigo-400">•</span>
            <span>Enterprise Brand Governance</span>
          </div>

          {/* Heading & Tagline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Prove Every Claim <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
              Before You Publish.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Claim Passport is the AI-powered brand governance and content verification platform that checks marketing copy against approved brand guidelines, verified living facts, and audit evidence — with final control always held by authorized humans.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition group"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={onExploreFeatures}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300 transition"
            >
              Explore Features
            </button>

            <button
              onClick={onLoadDemoScenario}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-sm border border-indigo-200 transition"
            >
              <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
              Run Required Demo
            </button>
          </div>

          {/* Hero Visual Card: Required Demo Preview */}
          <div className="mt-14 max-w-4xl mx-auto bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl text-left border border-slate-800 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400">ClaimPassport_Verification_Engine.run()</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                Retrieval-First Verification
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-2">
                  Submitted Draft Copy:
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  “<span className="text-amber-400 bg-amber-950/50 px-1 rounded border border-amber-800">Trusted by 10,000+ customers</span>. Our new bottle is <span className="text-rose-400 bg-rose-950/50 px-1 rounded border border-rose-800">100% safe!</span>”
                </p>
                <div className="mt-3 text-[11px] text-slate-400">
                  <span className="text-indigo-400 font-semibold">Intent Lock:</span> Announce hydration bottle launch & safety assurance
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 text-amber-300">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong className="text-amber-200">Finding 1 — Stale Fact:</strong> Fact #12 expired 30 Sept 2026. Refresh requested from owner.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <strong className="text-rose-200">Finding 2 — Needs Evidence:</strong> "100% safe" lacks approved registry proof. Flagged for review.
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-emerald-400 font-sans font-bold text-xs">
                    Intent-Locked Revision Ready
                  </span>
                  <span className="text-[10px] text-slate-400">Human Sign-off Required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Governance Workflow */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            End-To-End Governance
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            How Claim Passport Protects Your Brand
          </p>
          <p className="mt-3 text-sm text-slate-600">
            A deterministic, auditable process that eliminates ungrounded claims without slowing down creators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900">Submit with Intent</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Creator specifies marketing copy along with an <strong>Intent Lock</strong> objective, preventing AI rewrites from distorting original messaging.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900">Cross-Check Living Facts</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Deterministic engine extracts factual claims and compares them to approved sources. Checks expiration dates and flags stale metrics.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900">Evidence-First Review</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every finding displays exact guideline citations, owner contacts, and confidence scores. No auto-rejections without human review.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="font-bold text-base text-slate-900">Authorised Sign-off</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Designated brand managers or reviewers approve the verified text. Generates an immutable governance certificate before external publish.
            </p>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars / Feature Cards */}
      <section id="features" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Core Capabilities
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              Architected for Integrity & Compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl p-7 bg-slate-50 border border-slate-200 hover:border-indigo-300 transition shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-indigo-200">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Living Fact Registry</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Facts are not static strings in a wiki. Every claim links to an assigned owner, primary lab or census source, and an automated expiry date. Stale claims can never be treated as verified.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Deterministic expiry date checks against current time
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Automated owner refresh tasks and audit logs
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl p-7 bg-slate-50 border border-slate-200 hover:border-indigo-300 transition shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-violet-200">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Evidence-First Review</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                No black-box scores. Every flagged issue cites the exact guideline, document reference, or ungrounded gap. If evidence is missing, the system explicitly says so rather than hallucinating validation.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Issue cards with category, severity, and confidence
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Mandatory justification logged for any reviewer override
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl p-7 bg-slate-50 border border-slate-200 hover:border-indigo-300 transition shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-amber-200">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Intent Lock Engine</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Creators lock their intended purpose before checking. When generating corrections, the system preserves that objective without inventing new unsupported claims or silently overriding creative voice.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Side-by-side comparison before accepting suggested copy
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Creator approval mandatory for any rewrite application
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl p-7 bg-slate-50 border border-slate-200 hover:border-indigo-300 transition shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-emerald-200">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Guideline Health Insights</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Monitors which brand rules cause repeated confusion, frequent overrides, or reviewer disputes. Highlights rules needing clarification so governance evolves with marketing reality.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  Friction scoring identifying ambiguous instructions
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  CSV report export for quarterly brand compliance audits
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Human Oversight Statement */}
      <section className="py-14 bg-slate-900 text-slate-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400 mb-4">
            <UserCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Human-in-the-Loop & Privacy Commitment
          </h3>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Claim Passport is designed around human oversight. Automated models propose findings and substantiate facts, but final publication decisions remain strictly with authorized humans. Submitted content is verified through secure retrieval channels without unauthorized external training.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-indigo-400" />
              Role-Based Access Enforcement
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-indigo-400" />
              Immutable Audit Logs
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-indigo-400" />
              Zero Hallucination Retrieval
            </span>
          </div>

          <div className="mt-8">
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-900/50 transition"
            >
              Enter Claim Passport Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
