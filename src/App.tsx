import { useState } from 'react';
import { DemoProvider } from './context/DemoContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Alerts } from './pages/Alerts';
import { ActivityTimeline } from './pages/ActivityTimeline';
import { Analytics } from './pages/Analytics';
import { Medication } from './pages/Medication';
import { ElderProfile } from './pages/ElderProfile';
import { Devices } from './pages/Devices';
import { Settings } from './pages/Settings';
import { Privacy } from './pages/Privacy';
import { DemoMode } from './pages/DemoMode';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Route selector
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'live':
        return <LiveMonitoring />;
      case 'alerts':
        return <Alerts />;
      case 'timeline':
        return <ActivityTimeline />;
      case 'analytics':
        return <Analytics />;
      case 'medication':
        return <Medication />;
      case 'profile':
        return <ElderProfile />;
      case 'devices':
        return <Devices />;
      case 'privacy':
        return <Privacy />;
      case 'settings':
        return <Settings />;
      case 'demo':
        return <DemoMode />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <DemoProvider>
      <AppContent />
    </DemoProvider>
  );
}

export default App;
