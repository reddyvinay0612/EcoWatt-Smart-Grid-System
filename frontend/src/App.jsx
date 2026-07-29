import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  Leaf, 
  Cpu, 
  FileText, 
  Zap, 
  LogOut, 
  Play, 
  Building,
  User as UserIcon
} from 'lucide-react';

import Overview from './pages/Overview';
import Forecasting from './pages/Forecasting';
import Anomalies from './pages/Anomalies';
import CarbonTracker from './pages/CarbonTracker';
import Optimization from './pages/Optimization';
import Reports from './pages/Reports';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-400 space-y-4">
          <h2 className="text-lg font-bold">Something went wrong rendering this page</h2>
          <pre className="text-xs font-mono bg-black/50 p-4 rounded-xl overflow-auto max-w-full white-space-pre-wrap">
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
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const isAuthenticated = !!currentUser;
  const [activePage, setActivePage] = useState('overview');
  const [viewMode, setViewMode] = useState('national'); // Hoisted state: 'national' | 'local'
  const [consumers, setConsumers] = useState([]);
  const [selectedConsumerId, setSelectedConsumerId] = useState('');
  const [activeAnomalyCount, setActiveAnomalyCount] = useState(0);
  const [pendingOptCount, setPendingOptCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState('');

  // Routing guard to force Overview page when National view mode is selected
  useEffect(() => {
    if (viewMode === 'national') {
      setActivePage('overview');
    }
  }, [viewMode]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConsumers();
      loadCounts();
      // Set up periodic counts polling every 10s
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
      console.error("Failed to load consumers", err);
    }
  };

  const loadCounts = async () => {
    try {
      const cid = selectedConsumerId ? parseInt(selectedConsumerId) : null;
      const [anoms, opts] = await Promise.all([
        anomalyService.getAll(cid, 'Active'),
        optimizeService.getRecommendations(cid, 'Pending')
      ]);
      setActiveAnomalyCount(anoms.length);
      setPendingOptCount(opts.length);
    } catch (err) {
      console.error("Failed to load warning counts", err);
    }
  };

  const handleSimulateStep = async () => {
    setIsSimulating(true);
    setSimulationLog('Simulating grid tick...');
    try {
      const res = await dataService.simulateStep();
      setSimulationLog(`Tick: ${new Date(res.timestamp).toLocaleTimeString()} ingested.`);
      loadCounts();
      // Trigger a custom event so the current page knows to refresh its data
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
      console.error("Logout failed:", err);
    }
  };

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onToggleRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onToggleLogin={() => setAuthView('login')} />
    );
  }

  // Find active consumer details
  const activeConsumer = consumers.find(c => c.id.toString() === selectedConsumerId);

  const navigationItems = viewMode === 'national'
    ? [{ id: 'overview', label: 'National Map', icon: LayoutDashboard }]
    : [
        { id: 'overview', label: 'Local Overview', icon: LayoutDashboard },
        { id: 'forecasting', label: 'AI Forecasting', icon: TrendingUp },
        { id: 'anomalies', label: 'Anomaly Detector', icon: AlertTriangle, badge: activeAnomalyCount },
        { id: 'carbon', label: 'Carbon Tracker', icon: Leaf },
        { id: 'optimization', label: 'DR Optimization', icon: Cpu, badge: pendingOptCount },
        { id: 'reports', label: 'Data Audit & Reports', icon: FileText }
      ];

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
              return <Overview consumerId={consumerIdNum} activeConsumer={activeConsumer} />;
          }
        })()}
      </ErrorBoundary>
    );
  };

  return (
    <div className="flex h-screen bg-[#080C14] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-darkCard border-r border-darkBorder flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center space-x-3 border-b border-darkBorder">
            <div className="bg-accentBlue/20 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-accentBlue" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">EcoWatt AI</h1>
              <span className="text-xs text-slate-400">SEMS Optimization</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-accentBlue/10 text-accentBlue border-l-2 border-accentBlue' 
                      : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-accentBlue' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                      item.id === 'anomalies' ? 'bg-accentRed/20 text-accentRed' : 'bg-accentAmber/20 text-accentAmber'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-darkBorder">
          <div 
            onClick={() => setActivePage('profile')}
            className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-slate-800/30 p-2 rounded-xl transition-all"
            title="View Profile Settings"
          >
            <div className="bg-slate-800 p-2 rounded-full shrink-0 flex items-center justify-center h-8 w-8 overflow-hidden">
              {(() => {
                const userKey = `profile_meta_${currentUser?.email || currentUser?.uid}`;
                try {
                  const stored = localStorage.getItem(userKey);
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.avatar) {
                      return <img src={parsed.avatar} alt="Avatar" className="h-full w-full object-cover" />;
                    }
                  }
                } catch (e) {}
                return <UserIcon className="h-4 w-4 text-slate-300" />;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[130px]" title={currentUser?.displayName || 'Operator'}>
                {currentUser?.displayName || 'Operator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]" title={currentUser?.email || 'SEMS Operator'}>
                {currentUser?.email || 'SEMS Operator'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 border border-slate-700/50 hover:bg-accentRed/10 hover:border-accentRed/30 hover:text-accentRed rounded-lg text-xs font-semibold text-slate-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-darkCard border-b border-darkBorder flex items-center justify-between px-8 shrink-0">
          {viewMode === 'local' ? (
            <>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Building className="h-5 w-5 text-accentBlue" />
                  <label htmlFor="consumerSelect" className="text-sm font-semibold">Smart Grid Node:</label>
                </div>
                <select
                  id="consumerSelect"
                  value={selectedConsumerId}
                  onChange={(e) => setSelectedConsumerId(e.target.value)}
                  className="bg-[#0B0F19] border border-darkBorder rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 outline-none focus:border-accentBlue transition-all"
                >
                  {consumers.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.class_type}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                {simulationLog && (
                  <span className="text-xs text-accentGreen pulse-soft font-semibold bg-accentGreen/10 px-3 py-1 rounded-full">
                    {simulationLog}
                  </span>
                )}
                
                <button
                  onClick={handleSimulateStep}
                  disabled={isSimulating}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 disabled:opacity-50 transition-all"
                >
                  <Play className="h-3 w-3 fill-current text-accentBlue" />
                  <span>Simulate Grid Ingestion Tick</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-accentBlue animate-pulse" />
              <span className="text-sm font-bold tracking-wide text-slate-200 uppercase">
                EcoWatt AI National Analytics Center
              </span>
            </div>
          )}
        </header>

        {/* Page Render Container */}
        <main className="flex-1 overflow-y-auto p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
