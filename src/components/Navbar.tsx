/**
 * Claim Passport Top Navigation Bar
 * Header with active role badge, quick role switcher, notification pill, and demo scenario trigger
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Code2,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { getUsers, setCurrentUser, resetToDemoData } from '../services/storage';

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onNavigate: (view: string) => void;
  onOpenPythonStack: () => void;
  onLoadDemoScenario: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  onNavigate,
  onOpenPythonStack,
  onLoadDemoScenario,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const users = getUsers();

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    onUserChange(user);
    setDropdownOpen(false);
  };

  const handleResetData = () => {
    if (confirm('Reset all Living Facts, Submissions, Guidelines, and Audit Logs to initial Hackathon Demo state?')) {
      resetToDemoData();
      window.location.reload();
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Brand Manager':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'Reviewer':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Fact Owner':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Content Creator':
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 text-white">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Claim<span className="text-indigo-600">Passport</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Inkloom AI Hackathon
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Brand Governance That Proves Every Claim Before Publication
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Demo Scenario Trigger */}
            <button
              onClick={onLoadDemoScenario}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs transition"
              title="Loads the required fictional brand test: 'Trusted by 10,000+ customers. Our new bottle is 100% safe!'"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
              <span className="hidden sm:inline">Load Required Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Python / FastAPI / Streamlit Code Export */}
            <button
              onClick={onOpenPythonStack}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
              title="View & Download FastAPI backend, Streamlit UI, and MySQL schema deliverables"
            >
              <Code2 className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
              <span className="hidden md:inline">Python & MySQL Code</span>
            </button>

            {/* Reset Seed Data */}
            <button
              onClick={handleResetData}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Reset dataset to pristine hackathon initial state"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 pl-2.5 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition text-left"
              >
                <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-xs">
                  <div className="font-semibold text-slate-900 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500">{currentUser.role}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role (Role-Based Access)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Test permissions as different stakeholders:
                    </p>
                  </div>

                  <div className="py-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full text-left px-4 py-2.5 flex items-start space-x-3 hover:bg-slate-50 transition ${
                          currentUser.id === u.id ? 'bg-indigo-50/60' : ''
                        }`}
                      >
                        <div className="h-7 w-7 mt-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(u.role)}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{u.department}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center">
                    <UserCheck className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                    Enforced at backend & UI approval gates.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
