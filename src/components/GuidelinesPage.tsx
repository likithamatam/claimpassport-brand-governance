/**
 * Claim Passport Brand Guidelines Management
 * Section 4.G: Brand voice, banned terminology, naming, disclaimers, and approval states
 */

import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Edit2,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { BrandGuideline, GuidelineCategory, User as UserType } from '../types';
import { saveGuideline } from '../services/storage';

interface GuidelinesPageProps {
  guidelines: BrandGuideline[];
  currentUser: UserType;
  onRefreshList: () => void;
}

export const GuidelinesPage: React.FC<GuidelinesPageProps> = ({
  guidelines,
  currentUser,
  onRefreshList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<BrandGuideline | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GuidelineCategory>('Banned Terminology');
  const [version, setVersion] = useState('v1.0');
  const [status, setStatus] = useState<BrandGuideline['status']>('Approved');
  const [goodExample, setGoodExample] = useState('');
  const [badExample, setBadExample] = useState('');

  const isBrandManager = currentUser.role === 'Brand Manager';

  const openAddModal = () => {
    setEditingGuideline(null);
    setTitle('');
    setDescription('');
    setCategory('Banned Terminology');
    setVersion('v1.0');
    setStatus(isBrandManager ? 'Approved' : 'Under Review');
    setGoodExample('');
    setBadExample('');
    setModalOpen(true);
  };

  const openEditModal = (g: BrandGuideline) => {
    setEditingGuideline(g);
    setTitle(g.title);
    setDescription(g.description);
    setCategory(g.category);
    setVersion(g.version);
    setStatus(g.status);
    setGoodExample(g.examplesGood?.[0] || '');
    setBadExample(g.examplesBad?.[0] || '');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill out Title and Description.');
      return;
    }

    const guidelineData: BrandGuideline = {
      id: editingGuideline ? editingGuideline.id : `GUIDE-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      version: version.trim() || 'v1.0',
      examplesGood: goodExample.trim() ? [goodExample.trim()] : [],
      examplesBad: badExample.trim() ? [badExample.trim()] : [],
      violationCount: editingGuideline ? editingGuideline.violationCount : 0,
      overrideCount: editingGuideline ? editingGuideline.overrideCount : 0,
      clarityFrictionScore: editingGuideline ? editingGuideline.clarityFrictionScore : 10,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    saveGuideline(guidelineData, currentUser);
    setModalOpen(false);
    onRefreshList();
  };

  const handleApproveRule = (g: BrandGuideline) => {
    if (!isBrandManager) {
      alert('Only a Brand Manager has permission to formally approve brand guidelines.');
      return;
    }
    saveGuideline({ ...g, status: 'Approved' }, currentUser);
    onRefreshList();
  };

  const filtered = guidelines.filter((g) => {
    if (categoryFilter !== 'ALL' && g.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchDesc = g.description.toLowerCase().includes(q);
      const matchId = g.id.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Brand Guidelines & Rules
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-violet-100 text-violet-800 border border-violet-200">
              Governance Framework
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deterministic standards governing voice, banned terminology, naming conventions, and claim disclaimers.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Brand Guideline</span>
        </button>
      </div>

      {/* Two-step approval note */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 flex items-start space-x-3 text-xs">
        <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-indigo-950">Governance Requirement:</strong>{' '}
          Newly submitted guidelines enter <em>Under Review</em> status until approved by a Brand Manager. The automated checking engine evaluates only approved active guidelines.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guidelines by title or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Banned Terminology">Banned Terminology</option>
            <option value="Preferred Product Names">Preferred Product Names</option>
            <option value="Voice & Tone">Voice & Tone</option>
            <option value="Claim Substantiation">Claim Substantiation</option>
            <option value="Required Disclaimers">Required Disclaimers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Under Review">Under Review</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Guidelines Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((g) => {
          const isApproved = g.status === 'Approved';
          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-indigo-700 text-xs">
                      {g.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {g.version}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {g.category}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {g.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                {/* Good / Bad Examples */}
                {(g.examplesGood?.length || g.examplesBad?.length) && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                    {g.examplesGood?.[0] && (
                      <div className="flex items-start space-x-1.5 text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Approved:</strong> "{g.examplesGood[0]}"
                        </div>
                      </div>
                    )}
                    {g.examplesBad?.[0] && (
                      <div className="flex items-start space-x-1.5 text-rose-800 bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                        <X className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Prohibited:</strong> "{g.examplesBad[0]}"
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom stats & action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-3 text-[11px]">
                  <span>
                    <strong>{g.violationCount}</strong> violations
                  </span>
                  <span>
                    <strong>{g.overrideCount}</strong> overrides
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {!isApproved && isBrandManager && (
                    <button
                      onClick={() => handleApproveRule(g)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                    >
                      Approve Rule
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(g)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Guideline"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Guideline Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingGuideline ? `Edit Guideline: ${editingGuideline.id}` : 'Create Brand Guideline'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Rule Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ban on Unsubstantiated Safety Superlatives"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Rule Description & Operational Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain exactly what is prohibited or required and why..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
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
                    <option value="Banned Terminology">Banned Terminology</option>
                    <option value="Preferred Product Names">Preferred Product Names</option>
                    <option value="Voice & Tone">Voice & Tone</option>
                    <option value="Claim Substantiation">Claim Substantiation</option>
                    <option value="Required Disclaimers">Required Disclaimers</option>
                    <option value="Accessibility">Accessibility</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Good / Approved Example
                  </label>
                  <input
                    type="text"
                    value={goodExample}
                    onChange={(e) => setGoodExample(e.target.value)}
                    placeholder="e.g. Tested for food-contact safety"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Bad / Prohibited Example
                  </label>
                  <input
                    type="text"
                    value={badExample}
                    onChange={(e) => setBadExample(e.target.value)}
                    placeholder="e.g. 100% safe bottle"
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
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Save Guideline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
