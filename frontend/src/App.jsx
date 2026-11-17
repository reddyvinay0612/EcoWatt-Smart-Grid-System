import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

import LoginPage         from './pages/LoginPage';
import ProfilePage       from './pages/ProfilePage';
import NationalAnalytics from './pages/NationalAnalytics';
import SolarAnalytics    from './pages/SolarAnalytics';
import StateReportExplorer from './pages/StateReportExplorer';
import PowerGenerationExplorer from './pages/PowerGenerationExplorer';

import Header  from './components/Header';

import LiveConsumptionPanel  from './components/LiveConsumptionPanel';
import ConsumptionTrendChart from './components/ConsumptionTrendChart';
import PredictionPanel       from './components/PredictionPanel';
import ModelComparisonPanel  from './components/ModelComparisonPanel';
import HouseholdSelector     from './components/HouseholdSelector';
import AlertsPanel           from './components/AlertsPanel';
import MonthlyUsageHistory   from './components/MonthlyUsageHistory';
import AgentChatWidget       from './components/AgentChatWidget';
import ChatInterface         from './components/ChatInterface';
import MetricsDashboard      from './components/MetricsDashboard';

import { useAuth }          from './context/AuthContext';
import { useTheme }         from './context/ThemeContext';
import { useLanguage }      from './context/LanguageContext';
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
  const { language, t } = useLanguage();
  // Starts on Official Government Login Page on initial load / until authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('cea_authenticated') === 'true';
  });

  const [activePage,          setActivePage]          = useState('national');
  const [activeQuery,         setActiveQuery]         = useState(null);
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
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem('cea_authenticated');
    sessionStorage.removeItem('cea_officer_name');
    setIsAuthenticated(false);
    setActivePage('login');
  };

  // If not authenticated or on login page, display Official Government Single Sign-On Portal
  if (!isAuthenticated || activePage === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          sessionStorage.setItem('cea_authenticated', 'true');
          if (user?.displayName) {
            sessionStorage.setItem('cea_officer_name', user.displayName);
          }
          setIsAuthenticated(true);
          setActivePage('national');
        }}
        onGuestAccess={() => {
          sessionStorage.setItem('cea_authenticated', 'true');
          setIsAuthenticated(true);
          setActivePage('national');
        }}
      />
    );
  }

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
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
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
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: '#334155',
                    cursor: 'pointer',
                    opacity: isSimulating ? 0.5 : 1
                  }}
                >
                  <Play size={10} fill="#0B296B" color="#0B296B" />
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
      case 'agent':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, height: 'calc(100vh - 180px)', minHeight: 0, overflow: 'hidden', background: '#F5F7FA', padding: '14px 0 14px 0' }}>
            <div style={{ minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
              <MetricsDashboard onPresetClick={(query) => setActiveQuery(query)} />
            </div>
            <div style={{ minHeight: 0 }}>
              <ChatInterface activeQuery={activeQuery} clearActiveQuery={() => setActiveQuery(null)} />
            </div>
          </div>
        );

      case 'evaluation':
        return <ModelComparisonPanel comparisonData={comparisonData} />;
      case 'generation':
        return <PowerGenerationExplorer />;
      case 'solar':
        return <SolarAnalytics />;
      case 'state-reports':
        return <StateReportExplorer />;
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
      background: isDarkMode ? '#0B1329' : '#F4F6F9',
      color: isDarkMode ? '#F1F5F9' : '#0F172A',
      overflow: 'hidden',
      transition: 'background 0.2s, color 0.2s',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>

      {/* Top Header with GIGW Strip, Institutional Bar, Tricolor, Horizontal Nav, Notice Ticker & Breadcrumbs */}
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        onProfileClick={() => setActivePage('profile')}
        selectedHouseholdId={selectedHouseholdId}
      />

      {/* Full-Width Main Content Display (Matching Indian Government portal architecture) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 24px 80px 24px' }}>
          
          {/* Official Indian Gov Title Banner (Exact match to reference image) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                {/* Amber Pre-header Tag */}
                <span style={{
                  display: 'inline-block',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#B45309',
                  fontSize: 9.5,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4
                }}>
                  {t('banner_engine')}
                </span>

                {/* Main Dual Language Title */}
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0B296B', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {activePage === 'generation' ? (language === 'kn' ? 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯುತ್ ಸ್ಥಾವರಗಳ ನೋಂದಣಿ (Power Plants)' : language === 'hi' ? 'राष्ट्रीय विद्युत संयंत्र रजिस्ट्री (Power Plants)' : 'National Power Plant Registry (विद्युत संयंत्र रजिस्ट्री)') :
                   activePage === 'solar' ? (language === 'kn' ? 'ಪಿಎಂ ಸೂರ್ಯ ಘರ್ ಸೌರ ಅಳವಡಿಕೆ ವಿಶ್ಲೇಷಣೆ (Solar Mission)' : language === 'hi' ? 'पीएम सूर्य घर सौर ऊर्जा विश्लेषण (Solar Mission)' : 'PM Surya Ghar Solar Adoption Analytics (सौर ऊर्जा मिशन)') :
                   activePage === 'state-reports' ? (language === 'kn' ? 'ಸಮಗ್ರ ರಾಜ್ಯ ವಿದ್ಯುತ್ ವಿವರಗಳು (State Reports)' : language === 'hi' ? 'व्यापक राज्य विद्युत विवरण (State Reports)' : 'Comprehensive State Electricity Profiles (राज्य विद्युत विवरण)') :
                   activePage === 'overview' ? (language === 'kn' ? 'SCADA ಫೀಡರ್ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ಲೋಡ್ ಮಾನಿಟರ್ (SCADA Telemetry)' : language === 'hi' ? 'SCADA फीडर टेलीमेट्री एवं लोड मॉनिटर (SCADA Telemetry)' : 'SCADA Feeder Telemetry & Load Monitor (ग्रिड टेलीमेट्री)') :
                   activePage === 'evaluation' ? (language === 'kn' ? 'ಮಾದರಿ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಬೆಂಚ್‌ಮಾರ್ಕ್ ಸೇವೆ (Model Benchmark)' : language === 'hi' ? 'मॉडल मूल्यांकन एवं बेंचमार्क सेवा (Model Benchmark)' : 'Model Evaluation & Benchmark Service (मॉडल मूल्यांकन)') :
                   (language === 'kn' ? 'ರಾಷ್ಟ್ರೀಯ ಇಂಧನ ವಿಶ್ಲೇಷಣಾ ವೇದಿಕೆ (National Energy Platform)' : language === 'hi' ? 'राष्ट्रीय ऊर्जा विश्लेषिकी मंच (National Energy Platform)' : 'National Energy Analytics Platform (राष्ट्रीय विद्युत मंच)')}
                </h1>
                <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                  {t('official_service_caption')}
                </p>
              </div>

              {/* Green Status Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#15803D',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }}></span>
                <span>{t('model_active_badge')}</span>
              </div>
            </div>

            {/* Solid Separator Line */}
            <hr style={{ border: 'none', borderBottom: '1px solid #CBD5E1', margin: '12px 0 0 0' }} />
          </div>

          {/* Render Active Page */}
          <ErrorBoundary key={activePage}>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </div>

      {/* Floating Judges Demo Tour Button (Bottom Left, matching reference image) */}
      <div style={{ position: 'fixed', bottom: 20, left: 24, zIndex: 99 }}>
        <button
          onClick={() => {
            const sequence = ['national', 'generation', 'solar', 'state-reports', 'overview', 'evaluation'];
            const nextIdx = (sequence.indexOf(activePage) + 1) % sequence.length;
            setActivePage(sequence[nextIdx]);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#EA580C',
            color: '#FFFFFF',
            border: '2px solid #FFFFFF',
            borderRadius: 999,
            padding: '7px 16px',
            fontSize: 11,
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(234,88,12,0.35)',
            cursor: 'pointer',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>🧭</span>
          <span>{t('judges_tour')}</span>
        </button>
      </div>

      {/* Floating Urja Mitra Assistant (Bottom Right, matching reference image) */}
      <AgentChatWidget />
    </div>
  );
}

export default App;
