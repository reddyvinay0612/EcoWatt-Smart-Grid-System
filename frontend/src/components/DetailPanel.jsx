import React, { useState } from 'react';
import { Users, Globe, HelpCircle, Activity, Leaf, ShieldAlert } from 'lucide-react';
import OptimizationPanel from './OptimizationPanel';
import PredictionPanel from './PredictionPanel';
import OptimizationResultPanel from './OptimizationResultPanel';

export default function DetailPanel({ 
  name, 
  electricityConsumption = 0, 
  carbonEmission = 0, 
  elecTier = 'Low', 
  carbTier = 'Low', 
  elecDev = 0, 
  carbDev = 0, 
  pop, 
  gdp, 
  isEmissionEstimated, 
  onClose, 
  averageLabel = 'Average', 
  isDarkMode = true,
  parentState, // Passed from parent to query parent state ML models if inspecting a district
  activeMetric = 'electricity'
}) {
  const [activeTab, setActiveTab] = useState('current');

  const getBadgeClass = (tier) => {
    switch (tier) {
      case 'High':
        return 'bg-accentRed/10 border border-accentRed/25 text-accentRed';
      case 'Medium':
        return 'bg-amber-500/10 border border-amber-500/25 text-amber-500';
      default:
        return 'bg-accentGreen/10 border border-accentGreen/25 text-accentGreen';
    }
  };

  const isDistrict = !!parentState;
  const forecastState = isDistrict ? parentState : name;

  // Safe numeric conversion for deviation values
  const safeElecDev = typeof elecDev === 'number' ? elecDev : parseFloat(elecDev) || 0;
  const safeCarbDev = typeof carbDev === 'number' ? carbDev : parseFloat(carbDev) || 0;

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subtextColor = isDarkMode ? '#94A3B8' : '#475569';
  const boxBg = isDarkMode ? '#060A12' : '#F8FAFC';

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 16,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxHeight: '85vh',
      overflowY: 'auto'
    }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${cardBorder}` }}>
        <div>
          <span style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 800, color: subtextColor, letterSpacing: '0.1em' }}>
            {isDistrict ? `${parentState} District Audit` : 'State Audit'}
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: textColor, margin: '2px 0 0 0' }}>{name || 'Selected Region'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: subtextColor, cursor: 'pointer' }}>
            Close
          </button>
        )}
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}`, fontSize: 11, fontWeight: 700, gap: 8 }}>
        {[
          { id: 'current', label: 'Current Data' },
          { id: 'prediction', label: 'Prediction (ML)' },
          { id: 'optimization', label: 'Optimization' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              paddingBottom: 8,
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? '#3B82F6' : subtextColor,
              fontWeight: activeTab === tab.id ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'current' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Metric 1: Electricity Consumption */}
          <div style={{ background: boxBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: subtextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#3B82F6" />
                Electricity Consumption
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeClass(elecTier)}`}>
                {elecTier}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: textColor }}>
                {Number(electricityConsumption || 0).toLocaleString()} <span style={{ fontSize: 10, fontWeight: 500, color: subtextColor }}>kWh/capita</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: safeElecDev > 0 ? '#EF4444' : '#10B981' }}>
                {safeElecDev > 0 ? '+' : ''}{safeElecDev.toFixed(1)}% <span style={{ fontSize: 8, color: subtextColor }}>vs {averageLabel}</span>
              </span>
            </div>
          </div>

          {/* Metric 2: Carbon Emission */}
          <div style={{ background: boxBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: subtextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Leaf size={14} color="#10B981" />
                Carbon Emission
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeClass(carbTier)}`}>
                {carbTier}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: textColor }}>
                {Number(carbonEmission || 0).toLocaleString()} <span style={{ fontSize: 10, fontWeight: 500, color: subtextColor }}>kg CO2/capita</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: safeCarbDev > 0 ? '#EF4444' : '#10B981' }}>
                {safeCarbDev > 0 ? '+' : ''}{safeCarbDev.toFixed(1)}% <span style={{ fontSize: 8, color: subtextColor }}>vs {averageLabel}</span>
              </span>
            </div>

            {isEmissionEstimated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${cardBorder}`, fontSize: 9, color: subtextColor }}>
                <HelpCircle size={12} color="#64748b" />
                <span>Carbon emission estimated from generation mix ratio.</span>
              </div>
            )}
          </div>

          {/* Demographics */}
          <div style={{ background: boxBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: subtextColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} color="#64748b" /> Population
              </span>
              <span style={{ fontWeight: 800, color: textColor }}>{pop || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${cardBorder}`, paddingTop: 6 }}>
              <span style={{ color: subtextColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={13} color="#64748b" /> Est GDP Per Capita
              </span>
              <span style={{ fontWeight: 800, color: textColor }}>
                {gdp ? `₹${Number(gdp).toLocaleString()}` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Rule-based Optimization Recommendations */}
          <div style={{ paddingTop: 8, borderTop: `1px solid ${cardBorder}` }}>
            <OptimizationPanel 
              electricityConsumption={electricityConsumption}
              carbonEmission={carbonEmission}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      {activeTab === 'prediction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isDistrict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 10, color: '#3B82F6' }}>
              <HelpCircle size={14} />
              <span>Forecasting model for parent state of <strong>{parentState}</strong></span>
            </div>
          )}
          <PredictionPanel 
            stateName={forecastState} 
            activeMetric={activeMetric} 
            isDarkMode={isDarkMode} 
          />
        </div>
      )}

      {activeTab === 'optimization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isDistrict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 10, color: '#10B981' }}>
              <HelpCircle size={14} />
              <span>Optimization model for parent state of <strong>{parentState}</strong></span>
            </div>
          )}
          <OptimizationResultPanel 
            stateName={forecastState} 
            isDarkMode={isDarkMode} 
          />
        </div>
      )}

    </div>
  );
}
