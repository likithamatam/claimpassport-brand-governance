/**
 * Claim Passport Sidebar Navigation
 */

import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Database,
  BookOpenCheck,
  CheckCircle2,
  TrendingUp,
  History,
  Home,
  ShieldAlert,
  CalendarClock,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  pendingReviewsCount: number;
  expiredFactsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole,
  pendingReviewsCount,
  expiredFactsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'review',
      label: 'Review Content',
      icon: FileCheck2,
      badge: 'Intent Lock',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'facts',
      label: 'Living Fact Registry',
      icon: Database,
      badge: expiredFactsCount > 0 ? `${expiredFactsCount} Stale` : null,
      badgeColor: 'bg-amber-100 text-amber-700 font-semibold',
    },
    {
      id: 'guidelines',
      label: 'Brand Guidelines',
      icon: BookOpenCheck,
      badge: null,
    },
    {
      id: 'approvals',
      label: 'Approvals & Sign-off',
      icon: CheckCircle2,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount}` : null,
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
    },
    {
      id: 'insights',
      label: 'Guideline Health',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Audit History',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="py-5 px-3 space-y-1">
        <div className="px-3 pb-3">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Platform Navigation
          </p>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-indigo-700/80 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Product Info
          </p>
        </div>

        <button
          onClick={() => onNavigate('landing')}
          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
            currentView === 'landing'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Home className="h-4 w-4 text-slate-400" />
          <span>Product Landing Page</span>
        </button>
      </div>

      {/* Role permission info box at bottom of sidebar */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200 text-slate-600">
        <div className="flex items-center space-x-2 mb-1.5">
          <ShieldAlert className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900">Governance Gate</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Current Role: <strong className="text-indigo-700">{userRole}</strong>.
          {userRole === 'Content Creator' && ' You can draft copy and run intent checks. Formal sign-off requires a Reviewer or Brand Manager.'}
          {userRole === 'Reviewer' && ' You can approve claims, examine evidence, and request creator revisions.'}
          {userRole === 'Brand Manager' && ' You have full governance authority to manage guidelines and issue publication certificates.'}
          {userRole === 'Fact Owner' && ' You manage the Living Fact Registry and respond to staleness refresh alerts.'}
        </p>
      </div>
    </aside>
  );
};
