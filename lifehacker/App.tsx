
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DreamBoard } from './pages/DreamBoard';
import { DreamManagerPage } from './pages/DreamManager';
import { DailyPlanPage } from './pages/DailyPlan';
import { WorkTimerPage } from './pages/WorkTimer';
import { ExpensesPage } from './pages/Expenses';
import { FinancePage } from './pages/Finance';
import { ListsPage } from './pages/Lists';
import { DataBackupPage } from './pages/DataBackup';
import { Onboarding, CURRENT_VERSION } from './components/Onboarding';
import { PageView } from './types';

function App() {
  const [view, setView] = useState<PageView>('dreams_view');
  // Initialize to false to FORCE Dream Board on every reload
  const [hasEntered, setHasEntered] = useState(false);
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<'TOUR' | 'UPDATE'>('TOUR');

  useEffect(() => {
    // Check local storage for onboarding status and version
    const hasSeenTour = localStorage.getItem('essence_has_seen_tour');
    const lastSeenVersion = localStorage.getItem('essence_last_seen_version');

    if (!hasSeenTour) {
        // New User: Show Tour
        // We set a small timeout to ensure it doesn't clash with the Dream Board if they enter quickly
        // But logic below handles "when" it shows (after Enter)
    } else if (lastSeenVersion !== CURRENT_VERSION) {
        // Existing user, new version: Show Update Note
        setOnboardingMode('UPDATE');
        setShowOnboarding(true);
    }
  }, []);

  const handleEnterApp = () => {
    setHasEntered(true);
    setView('plan'); 

    // Trigger Tour for new users AFTER they click "Enter App"
    const hasSeenTour = localStorage.getItem('essence_has_seen_tour');
    if (!hasSeenTour) {
        setTimeout(() => {
            setOnboardingMode('TOUR');
            setShowOnboarding(true);
        }, 500);
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (onboardingMode === 'TOUR') {
        localStorage.setItem('essence_has_seen_tour', 'true');
        // Also mark current version as seen so they don't get the update popup right after tour
        localStorage.setItem('essence_last_seen_version', CURRENT_VERSION);
    } else {
        localStorage.setItem('essence_last_seen_version', CURRENT_VERSION);
    }
  };

  // Exposed for Settings Page to re-trigger
  const triggerTutorial = () => {
      setOnboardingMode('TOUR');
      setShowOnboarding(true);
  };

  // Pass triggerTutorial down via Layout if needed, or Navigation can access context/props
  // For simplicity, we can pass it as a prop to Layout -> Navigation

  const renderContent = () => {
    // Gatekeeper: If user hasn't entered via Dream Board, show it in Gatekeeper mode
    if (!hasEntered) {
      return <DreamBoard onEnterApp={handleEnterApp} isGatekeeper={true} />;
    }

    switch (view) {
      case 'dreams_view':
        return <DreamBoard onEnterApp={() => {}} isGatekeeper={false} />;
      case 'dreams_manage':
        return <DreamManagerPage />;
      case 'plan':
        return <DailyPlanPage />;
      case 'work':
        return <WorkTimerPage />;
      case 'expense':
        return <ExpensesPage />;
      case 'finance':
        return <FinancePage />;
      case 'list_not_todo':
        return <ListsPage type="NOT_TO_DO" />;
      case 'list_success':
        return <ListsPage type="SUCCESS" />;
      case 'list_ideas':
        return <ListsPage type="IDEAS" />;
      case 'list_inspiration':
        return <ListsPage type="INSPIRATION" />;
      case 'data_backup':
        return <DataBackupPage />;
      default:
        return <DailyPlanPage />;
    }
  };

  return (
    <HashRouter>
      <Layout 
        currentPage={view} 
        onNavigate={setView}
        isDreamMode={!hasEntered}
        onTriggerTutorial={triggerTutorial} // Pass down
      >
        {renderContent()}
        
        {showOnboarding && (
            <Onboarding 
                currentView={view} 
                onChangeView={setView} 
                onClose={handleCloseOnboarding} 
                mode={onboardingMode}
            />
        )}
      </Layout>
    </HashRouter>
  );
}

export default App;
