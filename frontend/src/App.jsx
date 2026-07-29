import React, { useState, useEffect } from 'react';
import { Play, Building } from 'lucide-react';

import Forecasting    from './pages/Forecasting';
import Anomalies      from './pages/Anomalies';
import CarbonTracker  from './pages/CarbonTracker';
import Optimization   from './pages/Optimization';
import Reports        from './pages/Reports';
import LoginPage      from './pages/LoginPage';
import ProfilePage    from './pages/ProfilePage';
import NationalAnalytics from './pages/NationalAnalytics'; // command-center

import Header  from './components/Header';
import Sidebar from './components/Sidebar';

import { useAuth }                                                    from './context/AuthContext';
import { consumerService, dataService, anomalyService, optimizeService } from './services/api';

/* ─── Error Boundary ─────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, i) { console.error('ErrorBoundary:', e, i); }
  render() {
    if (this.state.hasError) return (
      <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-400 space-y-4">
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <pre className="text-xs font-mono bg-black/50 p-4 rounded-xl overflow-auto whitespace-pre-wrap">{this.state.error?.toString()}</pre>
        <button onClick={() => this.setState({ hasError: false, error: null })} className="bg-accentRed text-white px-4 py-2 rounded-xl text-xs font-semibold">Retry</button>
      </div>
    );
    return this.props.children;
  }
}

/* ─── App ─────────────────────────────────────────────────────────── */
function App() {
  const { currentUser, logout } = useAuth();
  const isAuthenticated = !!currentUser;

  const [activePage,          setActivePage]          = useState('overview');
  const [consumers,           setConsumers]           = useState([]);
  const [selectedConsumerId,  setSelectedConsumerId]  = useState('');
  const [activeAnomalyCount,  setActiveAnomalyCount]  = useState(0);
  const [pendingOptCount,     setPendingOptCount]     = useState(0);
  const [isSimulating,        setIsSimulating]        = useState(false);
  const [simulationLog,       setSimulationLog]       = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    loadConsumers();
    loadCounts();
    const iv = setInterval(loadCounts, 10000);
    return () => clearInterval(iv);
  }, [isAuthenticated, selectedConsumerId]);

  const loadConsumers = async () => {
    try {
      const data = await consumerService.getAll();
      setConsumers(data);
      if (data.length > 0 && !selectedConsumerId) setSelectedConsumerId(data[0].id.toString());
    } catch (e) { console.error(e); }
  };

  const loadCounts = async () => {
    try {
      const cid = selectedConsumerId ? parseInt(selectedConsumerId) : null;
      const [anoms, opts] = await Promise.all([anomalyService.getAll(cid, 'Active'), optimizeService.getRecommendations(cid, 'Pending')]);
      setActiveAnomalyCount(anoms.length);
      setPendingOptCount(opts.length);
    } catch (e) { console.error(e); }
  };

  const handleSimulateStep = async () => {
    setIsSimulating(true); setSimulationLog('Simulating grid tick...');
    try {
      const res = await dataService.simulateStep();
      setSimulationLog(`Tick: ${new Date(res.timestamp).toLocaleTimeString()} ingested.`);
      loadCounts();
      window.dispatchEvent(new CustomEvent('grid-tick'));
      setTimeout(() => setSimulationLog(''), 4000);
    } catch (e) { setSimulationLog('Simulation failed.'); }
    finally { setIsSimulating(false); }
  };

  const handleLogout = async () => {
    try { await logout(); setActivePage('overview'); } catch (e) { console.error(e); }
  };

  if (!isAuthenticated) return <LoginPage />;

  const cid = selectedConsumerId ? parseInt(selectedConsumerId) : null;
  const activeConsumer = consumers.find(c => c.id.toString() === selectedConsumerId);

  // Pages that use the local (per-consumer) sub-header
  const localPages = ['forecasting', 'anomalies', 'carbon', 'optimization', 'reports'];
  const isLocalPage = localPages.includes(activePage);

  const renderPage = () => (
    <ErrorBoundary key={activePage}>
      {(() => {
        switch (activePage) {
          case 'overview':    return <NationalAnalytics />;
          case 'forecasting': return <Forecasting consumerId={cid} activeConsumer={activeConsumer} />;
          case 'anomalies':   return <Anomalies   consumerId={cid} activeConsumer={activeConsumer} onActionComplete={loadCounts} />;
          case 'carbon':      return <CarbonTracker consumerId={cid} activeConsumer={activeConsumer} />;
          case 'optimization':return <Optimization  consumerId={cid} activeConsumer={activeConsumer} onActionComplete={loadCounts} />;
          case 'reports':     return <Reports consumerId={cid} consumers={consumers} />;
          case 'profile':     return <ProfilePage onBackToDashboard={() => setActivePage('overview')} />;
          default:            return <NationalAnalytics />;
        }
      })()}
    </ErrorBoundary>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0e17', color: '#f1f5f9', overflow: 'hidden' }}>

      {/* ── Top Header ── */}
      <Header
        onProfileClick={() => setActivePage('profile')}
        notificationCount={activeAnomalyCount}
      />

      {/* ── Body (sidebar + main) ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          activeAnomalyCount={activeAnomalyCount}
          pendingOptCount={pendingOptCount}
          onLogout={handleLogout}
        />

        {/* Main content column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Local-mode sub-header */}
          {isLocalPage && (
            <div style={{ height: 48, background: '#0d1219', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building size={14} color="#3B82F6" />
                <label htmlFor="cSelect" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Smart Grid Node:</label>
                <select id="cSelect" value={selectedConsumerId} onChange={e => setSelectedConsumerId(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#e2e8f0', outline: 'none' }}>
                  {consumers.map(c => <option key={c.id} value={c.id}>[{c.class_type}] {c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {simulationLog && <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>{simulationLog}</span>}
                <button onClick={handleSimulateStep} disabled={isSimulating}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: '#cbd5e1', cursor: 'pointer', opacity: isSimulating ? 0.5 : 1 }}>
                  <Play size={10} fill="#3B82F6" color="#3B82F6" />
                  Simulate Grid Tick
                </button>
              </div>
            </div>
          )}

          {/* Scrollable page area */}
          <main style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
