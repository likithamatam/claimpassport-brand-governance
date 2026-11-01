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
import { SourceDocumentsPage } from './components/SourceDocumentsPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { PythonStackModal } from './components/PythonStackModal';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { FirstRunGuideModal } from './components/FirstRunGuideModal';
import { AIDisclosureModal } from './components/AIDisclosureModal';
import {
  getCurrentUser,
  setCurrentUser,
  getSubmissions,
  getFacts,
  getGuidelines,
  getAuditLogs,
} from './services/storage';
import {
  getMeApi,
  logoutApi,
  fetchSubmissionsApi,
  fetchFactsApi,
  fetchGuidelinesApi,
  fetchNotificationsApi,
  getStoredUser,
} from './services/api';
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
  const [currentUser, setCurrentUserState] = useState<User>(getStoredUser() || getCurrentUser());
  const [submissions, setSubmissions] = useState<ContentSubmission[]>(getSubmissions());
  const [facts, setFacts] = useState<LivingFact[]>(getFacts());
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>(getGuidelines());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getAuditLogs());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // Active submission passed to review workbench
  const [activeSubmission, setActiveSubmission] = useState<ContentSubmission | null>(null);

  // Modals state
  const [pythonModalOpen, setPythonModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [firstRunGuideOpen, setFirstRunGuideOpen] = useState(false);
  const [aiDisclosureOpen, setAiDisclosureOpen] = useState(false);

  // Refresh all data from persistent SQLite API
  const refreshAllData = async () => {
    try {
      const [subs, fcts, guides, notifs] = await Promise.all([
        fetchSubmissionsApi().catch(() => getSubmissions()),
        fetchFactsApi().catch(() => getFacts()),
        fetchGuidelinesApi().catch(() => getGuidelines()),
        fetchNotificationsApi().catch(() => ({ unreadCount: 0, notifications: [] })),
      ]);
      setSubmissions(subs);
      setFacts(fcts);
      setGuidelines(guides);
      setNotifications(notifs.notifications || []);
      setUnreadNotificationsCount(notifs.unreadCount || 0);
      setAuditLogs(getAuditLogs());
    } catch {
      setSubmissions(getSubmissions());
      setFacts(getFacts());
      setGuidelines(getGuidelines());
      setAuditLogs(getAuditLogs());
    }
  };

  useEffect(() => {
    // Check authenticated session
    getMeApi().then((user) => {
      if (user) {
        setCurrentUserState(user);
        setCurrentUser(user);
      }
    });

    refreshAllData();
  }, []);

  const handleUserChange = (user: User) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    refreshAllData();
  };

  const handleLogout = async () => {
    await logoutApi();
    const fallbackUser = getCurrentUser();
    setCurrentUserState(fallbackUser);
  };

  const handleSelectSubmission = (sub: ContentSubmission) => {
    setActiveSubmission(sub);
    setCurrentView('review');
  };

  const handleLoadRequiredDemoScenario = () => {
    const demoSub = submissions.find((s) => s.id === 'SUB-4053' || s.id === 'SUB-001') || {
      id: 'SUB-4053',
      title: 'Hydration Launch Campaign Draft (SUB-4053)',
      content: 'Trusted by 10,000+ customers. Our new bottle is 100% safe!',
      intent: 'Announce new hydration bottle launch highlighting customer adoption and safety assurance',
      contentType: 'Social Copy' as const,
      targetAudience: 'General Consumers' as const,
      status: 'Submitted' as const,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedReviewer: 'Jordan Taylor',
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
    (s) => s.status === 'Submitted' || s.status === 'Under Review' || s.status === 'Changes Requested'
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
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onOpenGuide={() => setFirstRunGuideOpen(true)}
        onOpenAIDisclosure={() => setAiDisclosureOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
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

            {currentView === 'documents' && (
              <SourceDocumentsPage currentUser={currentUser} />
            )}

            {currentView === 'analytics' && (
              <AnalyticsPage
                currentUser={currentUser}
                onRefreshAll={refreshAllData}
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

      {/* Auth & Demo Accounts Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleUserChange}
      />

      {/* In-App Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onRefresh={refreshAllData}
        onNavigateSubmission={(subId) => {
          setNotificationsModalOpen(false);
          const found = submissions.find((s) => s.id === subId);
          if (found) handleSelectSubmission(found);
        }}
      />

      {/* First-Run Judge Guide Modal */}
      <FirstRunGuideModal
        isOpen={firstRunGuideOpen}
        onClose={() => setFirstRunGuideOpen(false)}
        onLaunchDemoScenario={() => {
          handleLoadRequiredDemoScenario();
          setCurrentView('review');
        }}
      />

      {/* AI & Data Governance Disclosure Modal */}
      <AIDisclosureModal
        isOpen={aiDisclosureOpen}
        onClose={() => setAiDisclosureOpen(false)}
      />
    </div>
  );
}
