/**
 * Claim Passport Main Dashboard View
 * Section 4.C: KPIs, Category breakdown chart, frequent violations, recent activity
 */

import React from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CalendarX2,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Database,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  ContentSubmission,
  LivingFact,
  BrandGuideline,
  AuditLogEntry,
  User,
} from '../types';
import { isFactExpired } from '../services/rulesEngine';

interface DashboardViewProps {
  submissions: ContentSubmission[];
  facts: LivingFact[];
  guidelines: BrandGuideline[];
  auditLogs: AuditLogEntry[];
  currentUser: User;
  onNavigate: (view: string) => void;
  onSelectSubmission: (sub: ContentSubmission) => void;
  onLoadDemoScenario: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  submissions,
  facts,
  guidelines,
  auditLogs,
  currentUser,
  onNavigate,
  onSelectSubmission,
  onLoadDemoScenario,
}) => {
  // Calculations
  const totalSubmissions = submissions.length;
  const pendingReviews = submissions.filter((s) => s.status === 'Submitted' || s.status === 'Under Review').length;
  const approvedThisWeek = submissions.filter((s) => s.status === 'Approved').length;

  const expiredFacts = facts.filter((f) => isFactExpired(f.expiryDate));
  const expiredFactsCount = expiredFacts.length;

  // Findings counts
  let criticalFindings = 0;
  let highFindings = 0;
  const categoryCounts: Record<string, number> = {
    'Stale Fact': 0,
    'Needs Evidence': 0,
    'Banned Terminology': 0,
    'Voice & Tone': 0,
    'Missing Disclaimer': 0,
    'Naming Inconsistency': 0,
  };

  submissions.forEach((sub) => {
    sub.findings.forEach((f) => {
      if (f.severity === 'Critical') criticalFindings++;
      if (f.severity === 'High') highFindings++;
      if (categoryCounts[f.category] !== undefined) {
        categoryCounts[f.category]++;
      } else {
        categoryCounts[f.category] = 1;
      }
    });
  });

  // Top violated guidelines sorted by violations
  const topViolated = [...guidelines]
    .sort((a, b) => (b.violationCount || 0) - (a.violationCount || 0))
    .slice(0, 3);

  const totalFindingsCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Claim Passport Brand Governance Core</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            You are operating with <strong className="text-indigo-400">{currentUser.role}</strong> authority in {currentUser.department}. All claim checks require human sign-off before external publication.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onLoadDemoScenario}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950 transition"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Run Required Demo
          </button>
          <button
            onClick={() => onNavigate('review')}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Check New Copy
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Submissions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Submissions</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalSubmissions}</div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center">
            Across creative & growth teams
          </p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-medium">
            <span>Pending Reviews</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{pendingReviews}</div>
          <p className="text-[11px] text-indigo-600/80 mt-1">
            Awaiting reviewer or manager
          </p>
        </div>

        {/* Critical & High Findings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>High/Critical Issues</span>
            <AlertOctagon className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {criticalFindings + highFindings}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">
            {criticalFindings} critical, {highFindings} high
          </p>
        </div>

        {/* Expired Facts */}
        <div
          onClick={() => onNavigate('facts')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Stale / Expired Facts</span>
            <CalendarX2 className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{expiredFactsCount}</div>
          <p className="text-[11px] text-amber-600/80 mt-1 flex items-center">
            <span>Needs owner refresh</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </p>
        </div>

        {/* Approved This Week */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Approved Copy</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{approvedThisWeek}</div>
          <p className="text-[11px] text-emerald-600/80 mt-1">
            Signed off with certificates
          </p>
        </div>
      </div>

      {/* Main Content Grid: Categories Breakdown & Top Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Category Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Issues by Governance Category
              </h2>
              <p className="text-xs text-slate-500">
                Live distribution of verified findings across all marketing copy
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              {totalFindingsCount} Total Findings
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalFindingsCount) * 100);
              let barColor = 'bg-indigo-600';
              if (cat === 'Needs Evidence') barColor = 'bg-rose-500';
              if (cat === 'Stale Fact') barColor = 'bg-amber-500';
              if (cat === 'Banned Terminology') barColor = 'bg-red-600';
              if (cat === 'Naming Inconsistency') barColor = 'bg-violet-500';

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 mr-1.5" />
                Needs Evidence
              </span>
              <span className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-1.5" />
                Stale Fact
              </span>
              <span className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 mr-1.5" />
                Tone & Guidelines
              </span>
            </div>
            <button
              onClick={() => onNavigate('insights')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
            >
              View Guideline Health
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>
        </div>

        {/* Most Frequently Violated Guidelines */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Top Violated Guidelines
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Ranked</span>
            </div>

            <div className="space-y-3">
              {topViolated.map((g, idx) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-indigo-700 font-mono text-[11px]">{g.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">
                      {g.violationCount} Violations
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 truncate">{g.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {g.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('guidelines')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center space-x-1"
            >
              <span>Manage Brand Guidelines</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Submissions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Content Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Review copy, inspect evidence findings, and apply Intent Lock revisions
              </p>
            </div>
            <button
              onClick={() => onNavigate('review')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <span>+ New Submission</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Title & Purpose</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Issues</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.slice(0, 5).map((sub) => {
                  const isDemo = sub.id === 'SUB-001';
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => onSelectSubmission(sub)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 truncate max-w-[200px]">
                            {sub.title}
                          </span>
                          {isDemo && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                              Demo Scenario
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[260px] mt-0.5">
                          "{sub.content}"
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{sub.contentType}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            sub.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sub.status === 'Under Review'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {sub.findings.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {sub.findings.length} findings
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubmission(sub);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Audit Trail</h2>
              <span className="text-[11px] text-slate-400 font-mono">Immutable</span>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                    <span>{log.userName}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {log.action}: {log.targetId}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {log.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('audit')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-center"
            >
              View Full Governance Ledger →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
