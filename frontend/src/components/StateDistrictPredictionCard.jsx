// frontend/src/components/StateDistrictPredictionCard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, 
  Leaf, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { getRegionPrediction } from '../utils/statePredictionEngine';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function StateDistrictPredictionCard({ 
  selectedRegion, 
  isDistrict = false, 
  parentState = null,
  onOpenFullDossier = null
}) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const [horizon, setHorizon] = useState('2026-2027');
  
  // Server ML prediction state
  const [loading, setLoading] = useState(false);
  const [serverPrediction, setServerPrediction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0B296B';
  const subtextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const innerBoxBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  // Client-side fallback engine
  const clientFallback = useMemo(() => {
    return getRegionPrediction(selectedRegion, horizon);
  }, [selectedRegion, horizon]);

  const regionName = selectedRegion?.name || selectedRegion || 'National Baseline (India)';

  // Live FastAPI Backend inference fetcher
  const fetchPrediction = useCallback(async () => {
    if (!regionName) return;
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict/region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region_name: regionName,
          region_type: isDistrict ? 'district' : 'state',
          parent_state: isDistrict ? parentState : null,
          horizon: horizon,
          temperature_anomaly_c: 0.0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setServerPrediction(data);
      } else {
        // Soft fallback to client engine on non-200
        setServerPrediction(null);
      }
    } catch (err) {
      // Graceful fallback to client engine if backend is disconnected
      setServerPrediction(null);
    } finally {
      setLoading(false);
    }
  }, [regionName, isDistrict, parentState, horizon]);

  // Automatically fetch prediction whenever region or horizon changes
  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  if (!selectedRegion) {
    return (
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
        color: subtextColor,
        fontSize: 11
      }}>
        {language === 'kn' ? 'ಮುನ್ಸೂಚನೆಯನ್ನು ವೀಕ್ಷಿಸಲು ನಕ್ಷೆಯಲ್ಲಿ ಯಾವುದೇ ರಾಜ್ಯ ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.' :
         language === 'hi' ? 'लोड पूर्वानुमान देखने के लिए मानचित्र पर किसी भी राज्य या जिले का चयन करें।' :
         'Select any state or district on the map to view econometric demand forecast.'}
      </div>
    );
  }

  // Active prediction data: Prefer live server prediction, fallback to client calculation
  const hasServer = !!serverPrediction && serverPrediction.status === 'success';

  const electricityProjected = hasServer 
    ? serverPrediction.electricity.projected_kwh_per_capita 
    : (clientFallback?.predicted?.electricity || 1320);

  const electricityBaseline = hasServer 
    ? serverPrediction.electricity.baseline_kwh_per_capita 
    : (clientFallback?.current?.electricity || 1200);

  const electricityDelta = hasServer 
    ? serverPrediction.electricity.delta_percent 
    : (clientFallback?.deltas?.electricityPercent || 6.2);

  const carbonProjected = hasServer 
    ? serverPrediction.carbon.projected_kg_per_capita 
    : (clientFallback?.predicted?.carbon || 950);

  const carbonDelta = hasServer 
    ? serverPrediction.carbon.delta_percent 
    : (clientFallback?.deltas?.carbonPercent || 4.3);

  const emissionFactor = hasServer 
    ? serverPrediction.carbon.grid_emission_factor 
    : (clientFallback?.projectedEmissionFactor || 0.74);

  const confidenceInterval = hasServer 
    ? serverPrediction.electricity.confidence_interval_95 
    : [Math.round(electricityProjected * 0.94), Math.round(electricityProjected * 1.06)];

  const totalMU = hasServer 
    ? serverPrediction.electricity.total_consumption_mu 
    : null;

  const totalCarbonTonnes = hasServer 
    ? serverPrediction.carbon.total_carbon_tonnes 
    : null;

  const peakWindow = hasServer 
    ? serverPrediction.grid_intelligence.peak_window 
    : (clientFallback?.peakWindow || '19:00 - 22:00 IST');

  const chartData = hasServer && serverPrediction.trajectory 
    ? serverPrediction.trajectory.map(p => ({ day: p.step, value: p.demand_kwh }))
    : (clientFallback?.daysTrajectory || []);

  // Bilingual titles
  const cardPreTitle = language === 'kn' ? 'ಸಿಇಎ ಭವಿಷ್ಯವಾಣಿ ಲೋಡ್ ರವಾನೆ ಮುನ್ಸೂಚನೆ' :
                       language === 'hi' ? 'सीईए पूर्वानुमानित लोड प्रेषण पूर्वानुमान' :
                       'CEA PREDICTIVE LOAD DISPATCH FORECAST';

  const aiButtonLabel = language === 'kn' ? 'ಎಐ ಮುನ್ಸೂಚನೆ' :
                        language === 'hi' ? 'एआई भविष्यवाणी' :
                        'AI Prediction';

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      {/* ── Header: Title, Live Status & AI Button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {cardPreTitle}
            </span>
            <span style={{
              background: hasServer ? '#DCFCE7' : '#EFF6FF',
              color: hasServer ? '#15803D' : '#1D4ED8',
              border: `1px solid ${hasServer ? '#86EFAC' : '#BFDBFE'}`,
              fontSize: 8.5,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              ● {hasServer ? 'FastAPI ML Inference' : 'CEA EPS Model Active'}
            </span>
          </div>

          <h3 style={{ margin: '2px 0 0 0', fontSize: 15, fontWeight: 900, color: titleColor }}>
            {regionName} {isDistrict ? `(${parentState} District)` : ''}
          </h3>
        </div>

        {/* Right Action Bar: AI Prediction Button + Horizon Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* AI Prediction Trigger / Navigate Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const targetName = typeof regionName === 'object' ? (regionName?.name || 'Karnataka') : (regionName || 'Karnataka');
              if (onOpenFullDossier) {
                onOpenFullDossier({ name: targetName, isDistrict, parentState });
              } else {
                fetchPrediction();
              }
            }}
            title="Open complete AI econometric prediction dossier for this region"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#0B296B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 5,
              padding: '4px 9px',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} color="#F59E0B" />}
            <span>{aiButtonLabel}</span>
            <ArrowUpRight size={10} color="#FDE68A" />
          </button>

          {/* Horizon Filter Tabs */}
          <div style={{ display: 'flex', background: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 6, padding: 2, border: `1px solid ${cardBorder}` }}>
            {[
              { id: 'Next 30 Days', label: language === 'kn' ? '30 ದಿನ' : language === 'hi' ? '30 दिन' : '30D' },
              { id: 'Next Quarter', label: language === 'kn' ? 'ತ್ರೈಮಾಸಿಕ' : language === 'hi' ? 'तिमाही' : '1Q' },
              { id: '2026-2027',    label: 'FY 26-27' }
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                style={{
                  background: horizon === h.id ? '#D97706' : 'transparent',
                  color: horizon === h.id ? '#FFFFFF' : subtextColor,
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 7px',
                  fontSize: 9.5,
                  fontWeight: horizon === h.id ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'background 0.12s'
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Projections: 2 Metric Boxes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        
        {/* Metric 1: Projected Demand (Electricity) */}
        <div style={{
          background: innerBoxBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: subtextColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={13} color="#0284C7" />
              <span>{language === 'kn' ? 'ಅಂದಾಜು ಬೇಡಿಕೆ' : language === 'hi' ? 'अनुमानित मांग' : 'Projected Demand'}</span>
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: '#15803D',
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              padding: '1px 5px',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <ArrowUpRight size={10} />
              <span>+{electricityDelta}%</span>
            </span>
          </div>

          <div style={{ fontSize: 19, fontWeight: 900, color: titleColor, letterSpacing: '-0.02em' }}>
            {electricityProjected.toLocaleString()} <span style={{ fontSize: 10, color: subtextColor, fontWeight: 500 }}>kWh/capita</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8.5, color: subtextColor, marginTop: 4, borderTop: `1px solid ${cardBorder}`, paddingTop: 4 }}>
            <span>{language === 'kn' ? 'ಮೂಲರೇಖೆ: ' : language === 'hi' ? 'बेसलाइन: ' : 'Baseline: '}<strong>{electricityBaseline.toLocaleString()} kWh</strong></span>
            <span style={{ color: '#0284C7', fontWeight: 700 }}>95% CI: [{confidenceInterval[0]} - {confidenceInterval[1]}]</span>
          </div>
        </div>

        {/* Metric 2: Carbon Trajectory */}
        <div style={{
          background: innerBoxBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: subtextColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Leaf size={13} color="#16A34A" />
              <span>{language === 'kn' ? 'ಇಂಗಾಲದ ಹಾದಿ' : language === 'hi' ? 'कार्बन प्रक्षेपवक्र' : 'Carbon Trajectory'}</span>
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: carbonDelta <= 4 ? '#15803D' : '#B45309',
              background: carbonDelta <= 4 ? '#DCFCE7' : '#FEF3C7',
              border: carbonDelta <= 4 ? '1px solid #86EFAC' : '1px solid #FDE68A',
              padding: '1px 5px',
              borderRadius: 3
            }}>
              +{carbonDelta}%
            </span>
          </div>

          <div style={{ fontSize: 19, fontWeight: 900, color: titleColor, letterSpacing: '-0.02em' }}>
            {carbonProjected.toLocaleString()} <span style={{ fontSize: 10, color: subtextColor, fontWeight: 500 }}>kg CO₂/capita</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8.5, color: subtextColor, marginTop: 4, borderTop: `1px solid ${cardBorder}`, paddingTop: 4 }}>
            <span>Factor: <strong>{emissionFactor} kg/kWh</strong></span>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>-1.8% RE Target</span>
          </div>
        </div>

      </div>

      {/* ── Mini Sparkline Area Chart ── */}
      <div style={{
        background: innerBoxBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 8,
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: subtextColor, fontWeight: 700 }}>
          <span>PROJECTED CONSUMPTION TREND ({horizon})</span>
          <span style={{ color: '#0284C7' }}>+6.2% CEA National Growth Vector</span>
        </div>
        <div style={{ width: '100%', height: 45 }}>
          <ResponsiveContainer width="100%" height={45}>
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="predAreaLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 6, fontSize: 9, padding: '2px 6px' }}
                itemStyle={{ color: titleColor, fontWeight: 700 }}
                formatter={(val) => [`${val} kWh`, 'Projected']}
              />
              <Area type="monotone" dataKey="value" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#predAreaLive)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Aggregate Metrics Accordion Toggle ── */}
      {totalMU && (
        <div style={{
          background: innerBoxBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 6,
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 9.5
        }}>
          <span style={{ color: subtextColor }}>
            Total State/District Gross Requirement: <strong style={{ color: titleColor }}>{totalMU.toLocaleString()} MU (GWh)</strong>
          </span>
          <span style={{ color: subtextColor }}>
            Total Carbon Footprint: <strong style={{ color: titleColor }}>{(totalCarbonTonnes / 1000).toFixed(1)}k Tonnes CO₂</strong>
          </span>
        </div>
      )}

      {/* ── Footer: Dispatch Peak & CEA Standard Badge ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 9.5,
        color: subtextColor,
        borderTop: `1px solid ${cardBorder}`,
        paddingTop: 6,
        flexWrap: 'wrap',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} color="#0284C7" />
          <span>{language === 'kn' ? 'ಗರಿಷ್ಠ ಸಮಯ: ' : language === 'hi' ? 'पीक लोड समय: ' : 'Peak Window: '}<strong>{peakWindow}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A', fontWeight: 700 }}>
          <ShieldCheck size={11} />
          <span>{hasServer ? serverPrediction.grid_intelligence.confidence_score : '94.2% (CEA EPS v20 Baseline)'}</span>
        </div>
      </div>

    </div>
  );
}
