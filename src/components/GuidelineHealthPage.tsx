/**
 * Claim Passport Guideline Health & Analytics Insights
 * Sections 4.I & 4.L: Friction detection, rule clarification recommendations, and CSV export
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { BrandGuideline, ContentSubmission, LivingFact } from '../types';
import { isFactExpired } from '../services/rulesEngine';

interface GuidelineHealthPageProps {
  guidelines: BrandGuideline[];
  submissions: ContentSubmission[];
  facts: LivingFact[];
}

export const GuidelineHealthPage: React.FC<GuidelineHealthPageProps> = ({
  guidelines,
  submissions,
  facts,
}) => {
  const [downloading, setDownloading] = useState(false);

  const expiredFactsCount = facts.filter((f) => isFactExpired(f.expiryDate)).length;
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length;
  const totalSubmissions = submissions.length || 1;

  // Compute issue category totals
  const categoryStats: Record<string, number> = {
    'Stale Fact': 0,
    'Needs Evidence': 0,
    'Banned Terminology': 0,
    'Voice & Tone': 0,
    'Missing Disclaimer': 0,
    'Naming Inconsistency': 0,
  };

  submissions.forEach((s) => {
    s.findings.forEach((f) => {
      if (categoryStats[f.category] !== undefined) {
        categoryStats[f.category]++;
      } else {
        categoryStats[f.category] = 1;
      }
    });
  });

  // Calculate friction score for each guideline:
  // Friction = (overrideCount * 2 + violationCount) / total
  const frictionRules = [...guidelines].map((g) => {
    const overrides = g.overrideCount || 0;
    const violations = g.violationCount || 0;
    // Friction score 0-100
    const rawFriction = Math.min(100, Math.round((overrides * 30 + violations * 4)));
    let recommendation = 'Guideline performing stably within normal boundaries.';
    let needsClarification = false;

    if (overrides >= 2 || rawFriction >= 40) {
      needsClarification = true;
      recommendation = `Reviewers have overridden this rule ${overrides} times. Creative teams frequently request exceptions. Suggest clarifying permitted contextual nuances rather than blanket prohibition.`;
    } else if (violations >= 10) {
      recommendation = `High violation frequency (${violations} occurrences). Consider providing more positive phrasing examples during creator onboarding.`;
    }

    return {
      ...g,
      computedFriction: rawFriction,
      recommendation,
      needsClarification,
    };
  }).sort((a, b) => b.computedFriction - a.computedFriction);

  const handleDownloadCsv = () => {
    setDownloading(true);
    try {
      let csv = 'Rule_ID,Title,Category,Status,Version,Violations,Overrides,Friction_Score,Clarification_Recommendation\n';
      frictionRules.forEach((r) => {
        csv += `"${r.id}","${r.title.replace(/"/g, '""')}","${r.category}","${r.status}","${r.version}",${r.violationCount},${r.overrideCount},${r.computedFriction},"${r.recommendation.replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `claim_passport_guideline_health_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Guideline Health & Governance Insights
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
              Audit Intelligence
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Identify ambiguous guidelines, reviewer friction, repeated violations, and turnaround metrics.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={downloading}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-400" />
          <span>Export Governance Report (CSV)</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Avg. Review Turnaround</span>
          <div className="mt-2 text-2xl font-black text-slate-900">4.2 Hours</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            ↓ 68% faster with Claim Passport
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Publication Approval Rate</span>
          <div className="mt-2 text-2xl font-black text-indigo-600">
            {Math.round((approvedCount / totalSubmissions) * 100)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {approvedCount} of {totalSubmissions} certified
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Stale Facts Blocked</span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {expiredFactsCount}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-1 block">
            Prevented stale publishing
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Guidelines Requiring Clarity</span>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {frictionRules.filter((r) => r.needsClarification).length}
          </div>
          <span className="text-[11px] text-rose-600/80 mt-1 block">
            High override friction
          </span>
        </div>
      </div>

      {/* Guideline Friction Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Guideline Friction & Clarity Index
            </h2>
            <p className="text-xs text-slate-500">
              Identifies guidelines where creators and reviewers frequently disagree. Rules are not labeled wrong; recommendations propose clarifying operational nuances.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {frictionRules.length} Guidelines Evaluated
          </span>
        </div>

        <div className="space-y-3.5">
          {frictionRules.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-xl border transition ${
                r.needsClarification
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-indigo-700">
                    {r.id}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                    {r.category}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-600">
                    <strong>{r.violationCount}</strong> flags
                  </span>
                  <span className="text-slate-600">
                    <strong className="text-rose-600">{r.overrideCount}</strong> overrides
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.computedFriction > 40
                        ? 'bg-rose-100 text-rose-800'
                        : r.computedFriction > 20
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Friction: {r.computedFriction}/100
                  </span>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                <div className="md:col-span-6 text-slate-600">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Operational Rule:
                  </span>
                  <p className="line-clamp-2">{r.description}</p>
                </div>

                <div className="md:col-span-6 p-3 rounded-lg bg-white border border-slate-200 text-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 flex items-center">
                    <Sliders className="h-3 w-3 mr-1" />
                    Governance Recommendation:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {r.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Breakdown Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          Frequent Issue Categories Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Overview of non-compliance patterns flagged by the verification engine.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {Object.entries(categoryStats).map(([cat, count]) => (
            <div key={cat} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block truncate" title={cat}>
                {cat}
              </span>
              <div className="mt-1 text-xl font-black text-slate-900">{count}</div>
              <span className="text-[10px] text-slate-400">Occurrences</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
