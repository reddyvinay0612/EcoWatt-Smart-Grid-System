import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

import LoginPage         from './pages/LoginPage';
import ProfilePage       from './pages/ProfilePage';
import NationalAnalytics from './pages/NationalAnalytics';

import Header  from './components/Header';
import Sidebar from './components/Sidebar';

import LiveConsumptionPanel  from './components/LiveConsumptionPanel';
import ConsumptionTrendChart from './components/ConsumptionTrendChart';
import PredictionPanel       from './components/PredictionPanel';
import ModelComparisonPanel  from './components/ModelComparisonPanel';
import HouseholdSelector     from './components/HouseholdSelector';
import AlertsPanel           from './components/AlertsPanel';
import MonthlyUsageHistory   from './components/MonthlyUsageHistory';

import { useAuth }          from './context/AuthContext';
import { useTheme }         from './context/ThemeContext';
import { householdService } from './services/api';

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

/* ─── App ────────────────────────────────────────────────────────── */
function App() {
  const { currentUser, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const isAuthenticated = !!currentUser;

  const [activePage,          setActivePage]          = useState('national'); // Default to National Analytics
  const [households,          setHouseholds]          = useState([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  
  const [currentData,         setCurrentData]         = useState(null);
  const [predictionData,      setPredictionData]      = useState(null);
  const [alertsData,          setAlertsData]          = useState([]);
  const [comparisonData,      setComparisonData]      = useState(null);
  
  const [isSimulating,        setIsSimulating]        = useState(false);
  const [simulationLog,       setSimulationLog]       = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    loadHouseholds();
    loadComparison();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedHouseholdId) return;
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 15000); // Poll loads every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedHouseholdId]);

  const loadHouseholds = async () => {
    try {
      const data = await householdService.getAll();
      setHouseholds(data);
      if (data.length > 0) {
        setSelectedHouseholdId(data[0].id);
      }
    } catch (e) {
      console.error("Error loading households:", e);
    }
  };

  const loadComparison = async () => {
    try {
      const data = await householdService.getModelComparison();
      setComparisonData(data);
    } catch (e) {
      console.error("Error loading model metrics:", e);
    }
  };

  const loadTelemetry = async () => {
    try {
      const [curr, pred, alrt] = await Promise.all([
        householdService.getCurrentConsumption(selectedHouseholdId),
        householdService.getPrediction(selectedHouseholdId),
        householdService.getAlerts(selectedHouseholdId)
      ]);
      setCurrentData(curr);
      setPredictionData(pred);
      setAlertsData(alrt);
    } catch (e) {
      console.error("Error loading household telemetry:", e);
    }
  };

  const handleSimulateStep = async () => {
    setIsSimulating(true);
    setSimulationLog('Simulating meter pulse...');
    try {
      const res = await householdService.simulateStep();
      setSimulationLog(`Meter tick: ${new Date(res.timestamp).toLocaleTimeString()} logged.`);
      loadTelemetry();
      setTimeout(() => setSimulationLog(''), 4000);
    } catch (e) {
      setSimulationLog('Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setActivePage('national');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) return <LoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'national':
        return <NationalAnalytics />;
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Top Toolbar Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDarkMode ? '#131824' : '#FFFFFF',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
              borderRadius: 12,
              padding: '10px 18px',
              flexWrap: 'wrap',
              gap: 10
            }}>
              <HouseholdSelector
                households={households}
                selectedId={selectedHouseholdId}
                onSelect={setSelectedHouseholdId}
              />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {simulationLog && (
                  <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: 999, fontWeight: 700 }}>
                    {simulationLog}
                  </span>
                )}
                <button
                  onClick={handleSimulateStep}
                  disabled={isSimulating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1'}`,
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 10,
                    fontWeight: 750,
                    color: isDarkMode ? '#cbd5e1' : '#334155',
                    cursor: 'pointer',
                    opacity: isSimulating ? 0.5 : 1
                  }}
                >
                  <Play size={10} fill="#3B82F6" color="#3B82F6" />
                  Simulate Smart Meter Tick
                </button>
              </div>
            </div>

            {/* Row 1: Live Load Telemetry Card */}
            <LiveConsumptionPanel currentData={currentData} />

            {/* Row 2: 2 Column Grid - Forecast Chart + Active Spikes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 14, alignItems: 'stretch' }}>
              <PredictionPanel predictionData={predictionData} />
              <AlertsPanel alerts={alertsData} />
            </div>

            {/* Row 3: Load Trend Analysis */}
            <ConsumptionTrendChart historicalData={predictionData?.historical_24h} />

            {/* Row 4: Monthly Anomaly Alert & Analyzer */}
            <MonthlyUsageHistory selectedHouseholdId={selectedHouseholdId} />

          </div>
        );
      case 'evaluation':
        return <ModelComparisonPanel comparisonData={comparisonData} />;
      case 'profile':
        return <ProfilePage onBackToDashboard={() => setActivePage('national')} selectedHouseholdId={selectedHouseholdId} />;
      default:
        return <NationalAnalytics />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: isDarkMode ? '#0a0e17' : '#F8FAFC',
      color: isDarkMode ? '#f1f5f9' : '#0F172A',
      overflow: 'hidden',
      transition: 'background 0.2s, color 0.2s',
    }}>

      {/* Top Header */}
      <Header
        onProfileClick={() => setActivePage('profile')}
        selectedHouseholdId={selectedHouseholdId}
      />

      {/* Sidebar + Main Display */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={handleLogout}
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <main style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <ErrorBoundary key={activePage}>
              {renderPage()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
