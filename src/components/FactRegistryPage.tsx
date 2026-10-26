/**
 * Claim Passport Living Fact Registry
 * Section 4.F: Living facts with deterministic expiry dates, owner tasks, and staleness prevention
 */

import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CalendarX2,
  Edit2,
  Trash2,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { LivingFact, User as UserType } from '../types';
import {
  saveFact,
  deleteFact,
  requestFactRefresh,
} from '../services/storage';
import { isFactExpired, isFactExpiringSoon, SYSTEM_CURRENT_DATE } from '../services/rulesEngine';

interface FactRegistryPageProps {
  facts: LivingFact[];
  currentUser: UserType;
  onRefreshList: () => void;
}

export const FactRegistryPage: React.FC<FactRegistryPageProps> = ({
  facts,
  currentUser,
  onRefreshList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Approved' | 'Expiring Soon' | 'Expired'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<LivingFact | null>(null);

  // Form Fields
  const [claim, setClaim] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [ownerName, setOwnerName] = useState(currentUser.name);
  const [ownerEmail, setOwnerEmail] = useState(currentUser.email);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [category, setCategory] = useState<LivingFact['category']>('Product Specs');

  // Refresh Task Modal
  const [refreshModalOpen, setRefreshModalOpen] = useState(false);
  const [refreshTargetFact, setRefreshTargetFact] = useState<LivingFact | null>(null);
  const [refreshNotes, setRefreshNotes] = useState('');

  const openAddModal = () => {
    setEditingFact(null);
    setClaim('');
    setSourceReference('');
    setOwnerName(currentUser.name);
    setOwnerEmail(currentUser.email);
    setExpiryDate('2027-12-31');
    setCategory('Product Specs');
    setModalOpen(true);
  };

  const openEditModal = (fact: LivingFact) => {
    setEditingFact(fact);
    setClaim(fact.claim);
    setSourceReference(fact.sourceReference);
    setOwnerName(fact.ownerName);
    setOwnerEmail(fact.ownerEmail);
    setExpiryDate(fact.expiryDate);
    setCategory(fact.category);
    setModalOpen(true);
  };

  const handleSaveFact = () => {
    if (!claim.trim() || !sourceReference.trim() || !expiryDate.trim()) {
      alert('Please fill out Claim, Supporting Source Reference, and Expiry Date.');
      return;
    }

    const isExpired = isFactExpired(expiryDate);
    const isSoon = isFactExpiringSoon(expiryDate);
    let calculatedStatus: LivingFact['status'] = 'Approved';
    if (isExpired) calculatedStatus = 'Expired';
    else if (isSoon) calculatedStatus = 'Expiring Soon';

    const factData: LivingFact = {
      id: editingFact ? editingFact.id : `FACT-${Math.floor(100 + Math.random() * 900)}`,
      claim: claim.trim(),
      sourceReference: sourceReference.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      status: calculatedStatus,
      createdAt: editingFact ? editingFact.createdAt : new Date().toISOString().split('T')[0],
      expiryDate,
      lastVerifiedDate: new Date().toISOString().split('T')[0],
      category,
      refreshRequested: editingFact ? editingFact.refreshRequested : false,
    };

    saveFact(factData, currentUser);
    setModalOpen(false);
    onRefreshList();
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to deactivate/delete Fact ${id}?`)) {
      deleteFact(id, currentUser);
      onRefreshList();
    }
  };

  const openRefreshTaskModal = (fact: LivingFact) => {
    setRefreshTargetFact(fact);
    setRefreshNotes(`Triggering verification task for ${fact.id} to owner ${fact.ownerName}.`);
    setRefreshModalOpen(true);
  };

  const handleSendRefreshTask = () => {
    if (!refreshTargetFact) return;
    requestFactRefresh(refreshTargetFact.id, refreshNotes, currentUser);
    setRefreshModalOpen(false);
    onRefreshList();
    alert(`Refresh task dispatched to ${refreshTargetFact.ownerName} (${refreshTargetFact.ownerEmail}). Fact marked with active refresh workflow.`);
  };

  // Filtered list
  const filteredFacts = facts.filter((f) => {
    const expired = isFactExpired(f.expiryDate);
    const expiringSoon = isFactExpiringSoon(f.expiryDate);

    let computedStatus: LivingFact['status'] = 'Approved';
    if (expired) computedStatus = 'Expired';
    else if (expiringSoon) computedStatus = 'Expiring Soon';

    if (statusFilter !== 'ALL' && computedStatus !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchClaim = f.claim.toLowerCase().includes(q);
      const matchSource = f.sourceReference.toLowerCase().includes(q);
      const matchOwner = f.ownerName.toLowerCase().includes(q);
      const matchId = f.id.toLowerCase().includes(q);
      if (!matchClaim && !matchSource && !matchOwner && !matchId) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Living Fact Registry
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Every approved marketing statement links to an unexpired document reference and assigned owner.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Approved Fact</span>
        </button>
      </div>

      {/* Staleness Prevention Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3 shadow-xs">
        <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold text-amber-950">Deterministic Staleness Policy:</strong>{' '}
          Facts past their registered expiry date (evaluated against current date <strong>{SYSTEM_CURRENT_DATE}</strong>) are automatically flagged as stale. They can <em>never</em> be treated as verified by the AI engine until the Fact Owner reviews and refreshes the data.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search claim, Fact ID, source, or owner..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1 text-xs text-slate-500 mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </div>

          {(['ALL', 'Approved', 'Expiring Soon', 'Expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none ml-2"
          >
            <option value="ALL">All Categories</option>
            <option value="Metrics & Traction">Metrics & Traction</option>
            <option value="Product Specs">Product Specs</option>
            <option value="Compliance & Safety">Compliance & Safety</option>
            <option value="Sustainability">Sustainability</option>
          </select>
        </div>
      </div>

      {/* Facts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fact ID & Category</th>
                <th className="py-3 px-4">Approved Claim Statement</th>
                <th className="py-3 px-4">Supporting Source Reference</th>
                <th className="py-3 px-4">Owner & Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacts.map((fact) => {
                const expired = isFactExpired(fact.expiryDate);
                const expiringSoon = isFactExpiringSoon(fact.expiryDate);
                const isDemoFact12 = fact.id === 'FACT-012';

                return (
                  <tr
                    key={fact.id}
                    className={`hover:bg-slate-50/80 transition ${
                      expired ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* ID & Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {fact.id}
                        </span>
                        {isDemoFact12 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            Required Demo
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {fact.category}
                      </span>
                    </td>

                    {/* Claim */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">"{fact.claim}"</p>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <p className="text-[11px] font-mono text-slate-500 truncate" title={fact.sourceReference}>
                        {fact.sourceReference}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Verified: {fact.lastVerifiedDate}
                      </span>
                    </td>

                    {/* Owner & Expiry */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{fact.ownerName}</div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className={`text-[10px] font-mono ${expired ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                          {fact.expiryDate} {expired ? '(Expired)' : ''}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {expired ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired (Stale)
                        </span>
                      ) : expiringSoon ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approved & Active
                        </span>
                      )}
                      {fact.refreshRequested && (
                        <span className="block text-[9px] text-amber-700 font-medium mt-1">
                          Refresh task active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {expired && (
                          <button
                            onClick={() => openRefreshTaskModal(fact)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                            title="Assign refresh task to Fact Owner"
                          >
                            Refresh Task
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(fact)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Fact"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fact.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete / Deactivate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Fact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingFact ? `Edit Fact: ${editingFact.id}` : 'Add Approved Living Fact'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Claim / Approved Statement
                </label>
                <textarea
                  rows={2}
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="e.g. 10,000+ active customers worldwide"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Supporting Source / Lab Report Reference
                </label>
                <input
                  type="text"
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder="e.g. SGS Lab Certificate #2026-99 or CRM Q3 Audit"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Product Specs">Product Specs</option>
                    <option value="Metrics & Traction">Metrics & Traction</option>
                    <option value="Compliance & Safety">Compliance & Safety</option>
                    <option value="Sustainability">Sustainability</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Expiry Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Assigned Owner Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFact}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Save Fact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Task Modal */}
      {refreshModalOpen && refreshTargetFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <RefreshCw className="h-4 w-4 text-amber-600 mr-2" />
                Dispatch Fact Refresh Task
              </h3>
              <button onClick={() => setRefreshModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Fact <strong className="text-slate-900">{refreshTargetFact.id}</strong> expired on{' '}
              <strong className="text-rose-600">{refreshTargetFact.expiryDate}</strong>. Assigning a refresh notification to fact owner <strong>{refreshTargetFact.ownerName}</strong> ({refreshTargetFact.ownerEmail}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Instructions for Fact Owner:
              </label>
              <textarea
                rows={3}
                value={refreshNotes}
                onChange={(e) => setRefreshNotes(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRefreshModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRefreshTask}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                Send Refresh Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
