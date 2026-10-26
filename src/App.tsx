/**
 * Claim Passport - Main Application Component
 * Brand Governance That Proves Every Claim Before It Is Published
 * Inkloom AI Hackathon
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { ReviewContentPage } from './components/ReviewContentPage';
import { FactRegistryPage } from './components/FactRegistryPage';
import { GuidelinesPage } from './components/GuidelinesPage';
import { ApprovalsPage } from './components/ApprovalsPage';
import { GuidelineHealthPage } from './components/GuidelineHealthPage';
import { AuditLogsPage } from './components/AuditLogsPage';
import { PythonStackModal } from './components/PythonStackModal';
import {
  getCurrentUser,
  setCurrentUser,
  getSubmissions,
  getFacts,
  getGuidelines,
  getAuditLogs,
} from './services/storage';
import {
  User,
  ContentSubmission,
  LivingFact,
  BrandGuideline,
  AuditLogEntry,
} from './types';
import { isFactExpired } from './services/rulesEngine';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentUser, setCurrentUserState] = useState<User>(getCurrentUser());
  const [submissions, setSubmissions] = useState<ContentSubmission[]>(getSubmissions());
  const [facts, setFacts] = useState<LivingFact[]>(getFacts());
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>(getGuidelines());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getAuditLogs());

  // Active submission passed to review workbench
  const [activeSubmission, setActiveSubmission] = useState<ContentSubmission | null>(null);

  // Python stack deliverables modal
  const [pythonModalOpen, setPythonModalOpen] = useState(false);

  const refreshAllData = () => {
    setSubmissions(getSubmissions());
    setFacts(getFacts());
    setGuidelines(getGuidelines());
    setAuditLogs(getAuditLogs());
  };

  const handleUserChange = (user: User) => {
    setCurrentUserState(user);
    setCurrentUser(user);
  };

  const handleSelectSubmission = (sub: ContentSubmission) => {
    setActiveSubmission(sub);
    setCurrentView('review');
  };

  const handleLoadRequiredDemoScenario = () => {
    // Select or create the required demo scenario
    const demoSub = submissions.find((s) => s.id === 'SUB-001') || {
      id: 'SUB-001',
      title: 'Hydration Launch Social Copy (Required Hackathon Demo)',
      content: 'Trusted by 10,000+ customers. Our new bottle is 100% safe!',
      intent: 'Announce new hydration bottle launch highlighting customer adoption and safety assurance',
      contentType: 'Social Copy' as const,
      targetAudience: 'General Consumers' as const,
      status: 'Under Review' as const,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      findings: [],
      suggestedRevision: 'Meet our BPA-free bottle, designed for everyday use.',
      intentPreserved: true,
      intentLockNotes: 'Preserved launch and safety assurance intent using verified BPA-free specs.',
    };

    setActiveSubmission(demoSub);
    setCurrentView('review');
  };

  // Calculations for badges
  const pendingReviewsCount = submissions.filter(
    (s) => s.status === 'Submitted' || s.status === 'Under Review'
  ).length;

  const expiredFactsCount = facts.filter((f) => isFactExpired(f.expiryDate)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onNavigate={setCurrentView}
        onOpenPythonStack={() => setPythonModalOpen(true)}
        onLoadDemoScenario={handleLoadRequiredDemoScenario}
      />

      {/* Main View Body */}
      {currentView === 'landing' ? (
        <LandingPage
          onOpenDashboard={() => setCurrentView('dashboard')}
          onExploreFeatures={() => {
            const el = document.getElementById('features');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onLoadDemoScenario={handleLoadRequiredDemoScenario}
        />
      ) : (
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Sidebar */}
          <div className="hidden md:block">
            <Sidebar
              currentView={currentView}
              onNavigate={(v) => {
                if (v === 'review') setActiveSubmission(null);
                setCurrentView(v);
              }}
              userRole={currentUser.role}
              pendingReviewsCount={pendingReviewsCount}
              expiredFactsCount={expiredFactsCount}
            />
          </div>

          {/* Page Content View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                submissions={submissions}
                facts={facts}
                guidelines={guidelines}
                auditLogs={auditLogs}
                currentUser={currentUser}
                onNavigate={setCurrentView}
                onSelectSubmission={handleSelectSubmission}
                onLoadDemoScenario={handleLoadRequiredDemoScenario}
              />
            )}

            {currentView === 'review' && (
              <ReviewContentPage
                initialSubmission={activeSubmission}
                facts={facts}
                guidelines={guidelines}
                currentUser={currentUser}
                onSave={(_saved) => {
                  refreshAllData();
                }}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'facts' && (
              <FactRegistryPage
                facts={facts}
                currentUser={currentUser}
                onRefreshList={refreshAllData}
              />
            )}

            {currentView === 'guidelines' && (
              <GuidelinesPage
                guidelines={guidelines}
                currentUser={currentUser}
                onRefreshList={refreshAllData}
              />
            )}

            {currentView === 'approvals' && (
              <ApprovalsPage
                submissions={submissions}
                currentUser={currentUser}
                onRefreshSubmissions={refreshAllData}
                onSelectSubmission={handleSelectSubmission}
              />
            )}

            {currentView === 'insights' && (
              <GuidelineHealthPage
                guidelines={guidelines}
                submissions={submissions}
                facts={facts}
              />
            )}

            {currentView === 'audit' && (
              <AuditLogsPage logs={auditLogs} />
            )}
          </main>
        </div>
      )}

      {/* Python / MySQL Stack Deliverables Modal */}
      <PythonStackModal
        isOpen={pythonModalOpen}
        onClose={() => setPythonModalOpen(false)}
      />
    </div>
  );
}
