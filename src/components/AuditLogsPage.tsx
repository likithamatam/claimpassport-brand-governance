/**
 * Claim Passport Audit History Page
 * Immutable Governance Ledger of all claim verifications, overrides, and approvals
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogsPageProps {
  logs: AuditLogEntry[];
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchTarget = log.targetId.toLowerCase().includes(q);
      const matchSummary = log.summary.toLowerCase().includes(q);
      if (!matchUser && !matchTarget && !matchSummary) return false;
    }
    return true;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DISMISSED_FINDING':
      case 'OVERRODE_FINDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'REFRESH_REQUESTED':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'SUBMITTED':
      case 'VERIFIED':
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Governance Audit Ledger
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-900 text-white">
              Immutable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full audit trail of all claim verifications, reviewer dismissals, owner refreshes, and formal sign-offs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user, ID, or action..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="APPROVED">APPROVED</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="DISMISSED_FINDING">DISMISSED_FINDING</option>
            <option value="OVERRODE_FINDING">OVERRODE_FINDING</option>
            <option value="REFRESH_REQUESTED">REFRESH_REQUESTED</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Summary & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-sans">
                    <span className="font-bold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400">{log.userRole}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-indigo-700 font-bold whitespace-nowrap">
                    {log.targetId}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700 max-w-md">
                    <p className="font-medium text-slate-800">{log.summary}</p>
                    {log.reason && (
                      <p className="text-[11px] text-slate-500 mt-0.5 bg-slate-100 p-1.5 rounded border border-slate-200/80">
                        <strong>Reason:</strong> {log.reason}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
