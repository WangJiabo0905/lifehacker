
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
import { PageView } from './types';

function App() {
  const [view, setView] = useState<PageView>('dreams_view');
  // Initialize to false to FORCE Dream Board on every reload
  const [hasEntered, setHasEntered] = useState(false);

  // REMOVED: Session check. We want the user to see the Dream Board EVERY time they load the app.
  /*
  useEffect(() => {
    const sessionEntered = sessionStorage.getItem('essence_entered');
    if (sessionEntered) {
      setHasEntered(true);
      setView('plan'); 
    }
  }, []);
  */

  const handleEnterApp = () => {
    // We don't save to session anymore, so a refresh will trigger the dream board again.
    setHasEntered(true);
    setView('plan'); // Go to Daily Plan immediately after dreams
  };

  const renderContent = () => {
    // If not entered, force Dream Board in Gatekeeper mode
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
      >
        {renderContent()}
      </Layout>
    </HashRouter>
  );
}

export default App;
