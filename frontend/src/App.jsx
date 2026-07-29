import React, { useState, useEffect } from 'react';
import { Play, Building } from 'lucide-react';

import Overview from './pages/Overview';
import Forecasting from './pages/Forecasting';
import Anomalies from './pages/Anomalies';
import CarbonTracker from './pages/CarbonTracker';
import Optimization from './pages/Optimization';
import Reports from './pages/Reports';
import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage'; // Integrated register view within LoginPage
import ProfilePage from './pages/ProfilePage';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import { useAuth } from './context/AuthContext';
import { authService, consumerService, dataService, anomalyService, optimizeService } from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-400 space-y-4">
          <h2 className="text-lg font-bold">Something went wrong rendering this page</h2>
          <pre className="text-xs font-mono bg-black/50 p-4 rounded-xl overflow-auto max-w-full whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-accentRed text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-600 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { currentUser, logout } = useAuth();
  const [authView, setAuthView] = useState('login');
  const isAuthenticated = !!currentUser;

  const [activePage, setActivePage] = useState('overview');
  const [viewMode, setViewMode] = useState('national');
  const [consumers, setConsumers] = useState([]);
  const [selectedConsumerId, setSelectedConsumerId] = useState('');
  const [activeAnomalyCount, setActiveAnomalyCount] = useState(0);
  const [pendingOptCount, setPendingOptCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState('');

  // Force overview when switching to national view
  useEffect(() => {
    if (viewMode === 'national') setActivePage('overview');
  }, [viewMode]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConsumers();
      loadCounts();
      const interval = setInterval(loadCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, selectedConsumerId]);

  const loadConsumers = async () => {
    try {
      const data = await consumerService.getAll();
      setConsumers(data);
      if (data.length > 0 && !selectedConsumerId) {
        setSelectedConsumerId(data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load consumers', err);
    }
  };

  const loadCounts = async () => {
    try {
      const cid = selectedConsumerId ? parseInt(selectedConsumerId) : null;
      const [anoms, opts] = await Promise.all([
        anomalyService.getAll(cid, 'Active'),
        optimizeService.getRecommendations(cid, 'Pending'),
      ]);
      setActiveAnomalyCount(anoms.length);
      setPendingOptCount(opts.length);
    } catch (err) {
      console.error('Failed to load warning counts', err);
    }
  };

  const handleSimulateStep = async () => {
    setIsSimulating(true);
    setSimulationLog('Simulating grid tick...');
    try {
      const res = await dataService.simulateStep();
      setSimulationLog(`Tick: ${new Date(res.timestamp).toLocaleTimeString()} ingested.`);
      loadCounts();
      window.dispatchEvent(new CustomEvent('grid-tick'));
      setTimeout(() => setSimulationLog(''), 4000);
    } catch (err) {
      setSimulationLog('Simulation failed.');
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setActivePage('overview');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Auth guard
  if (!isAuthenticated) {
    return <LoginPage onToggleRegister={() => setAuthView('register')} />;
  }

  const activeConsumer = consumers.find(c => c.id.toString() === selectedConsumerId);

  const renderPage = () => {
    const consumerIdNum = selectedConsumerId ? parseInt(selectedConsumerId) : null;
    return (
      <ErrorBoundary key={activePage}>
        {(() => {
          switch (activePage) {
            case 'overview':
              return (
                <Overview
                  consumerId={consumerIdNum}
                  activeConsumer={activeConsumer}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              );
            case 'forecasting':
              return <Forecasting consumerId={consumerIdNum} activeConsumer={activeConsumer} />;
            case 'anomalies':
              return <Anomalies consumerId={consumerIdNum} activeConsumer={activeConsumer} onActionComplete={loadCounts} />;
            case 'carbon':
              return <CarbonTracker consumerId={consumerIdNum} activeConsumer={activeConsumer} />;
            case 'optimization':
              return <Optimization consumerId={consumerIdNum} activeConsumer={activeConsumer} onActionComplete={loadCounts} />;
            case 'reports':
              return <Reports consumerId={consumerIdNum} consumers={consumers} />;
            case 'profile':
              return <ProfilePage onBackToDashboard={() => setActivePage('overview')} />;
            default:
              return <Overview consumerId={consumerIdNum} activeConsumer={activeConsumer} viewMode={viewMode} setViewMode={setViewMode} />;
          }
        })()}
      </ErrorBoundary>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#080C14] text-slate-100 overflow-hidden">
      {/* Top Header */}
      <Header
        onProfileClick={() => setActivePage('profile')}
        notificationCount={activeAnomalyCount}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          activeAnomalyCount={activeAnomalyCount}
          pendingOptCount={pendingOptCount}
          onLogout={handleLogout}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Local view sub-header (only in local mode) */}
          {viewMode === 'local' && (
            <div className="h-12 bg-[#0d1117] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center space-x-3">
                <Building className="h-4 w-4 text-accentBlue" />
                <label htmlFor="consumerSelect" className="text-xs font-bold text-slate-400">Smart Grid Node:</label>
                <select
                  id="consumerSelect"
                  value={selectedConsumerId}
                  onChange={e => setSelectedConsumerId(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 outline-none focus:border-accentBlue transition-all"
                >
                  {consumers.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.class_type}] {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-3">
                {simulationLog && (
                  <span className="text-[10px] text-accentGreen font-bold bg-accentGreen/10 px-3 py-1 rounded-full">
                    {simulationLog}
                  </span>
                )}
                <button
                  onClick={handleSimulateStep}
                  disabled={isSimulating}
                  className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-50 transition-all"
                >
                  <Play className="h-3 w-3 fill-current text-accentBlue" />
                  <span>Simulate Grid Tick</span>
                </button>
              </div>
            </div>
          )}

          {/* Page */}
          <main className="flex-1 overflow-y-auto p-4">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
