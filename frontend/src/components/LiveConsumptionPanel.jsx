import React from 'react';
import { Activity, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LiveConsumptionPanel({ currentData }) {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#E2E8F0' : '#0F172A';

  if (!currentData) {
    return (
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 24, textAlign: 'center', color: labelColor }}>
        Loading current consumption telemetry...
      </div>
    );
  }

  const {
    current_consumption_kwh,
    historical_average_kwh,
    area_average_kwh,
    tier,
    deviation_percent,
    temperature,
    humidity
  } = currentData;

  const getTierDetails = (tierName) => {
    switch (tierName) {
      case 'Low':
        return { color: '#10B981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle, label: 'Optimal Load (Low)' };
      case 'High':
        return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', Icon: ShieldAlert, label: 'Peak Load (High)' };
      default:
        return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', Icon: HelpCircle, label: 'Moderate Load (Medium)' };
    }
  };

  const tierMeta = getTierDetails(tier);

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#3B82F6" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Live Load Monitoring
          </span>
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: tierMeta.color,
          background: tierMeta.bg,
          padding: '3px 8px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <tierMeta.Icon size={10} />
          {tierMeta.label}
        </span>
      </div>

      {/* Grid columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        
        {/* Metric 1: Current Meter */}
        <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: labelColor, textTransform: 'uppercase', marginBottom: 4 }}>
            Current Meter Load
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: valueColor }}>{current_consumption_kwh}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: labelColor }}>kWh</span>
          </div>
          <div style={{ fontSize: 8, fontWeight: 800, marginTop: 4, color: deviation_percent >= 0 ? '#EF4444' : '#10B981' }}>
            {deviation_percent >= 0 ? '+' : ''}{deviation_percent}% <span style={{ color: labelColor, fontWeight: 500 }}>vs household avg</span>
          </div>
        </div>

        {/* Metric 2: Historical Average */}
        <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: labelColor, textTransform: 'uppercase', marginBottom: 4 }}>
            Household Daily Average
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: valueColor }}>{historical_average_kwh}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: labelColor }}>kWh</span>
          </div>
          <div style={{ fontSize: 8, fontWeight: 500, marginTop: 4, color: labelColor }}>
            Computed over active 1-year log
          </div>
        </div>

        {/* Metric 3: Weather correlation */}
        <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: labelColor, textTransform: 'uppercase', marginBottom: 4 }}>
            Local Climate Index
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: valueColor }}>
              Temperature: <span style={{ color: '#F59E0B' }}>{temperature}°C</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: valueColor }}>
              Humidity: <span style={{ color: '#06B6D4' }}>{humidity}%</span>
            </div>
          </div>
          <div style={{ fontSize: 8, fontWeight: 500, marginTop: 4, color: labelColor }}>
            Critical input for AC/Heating offsets
          </div>
        </div>

      </div>

    </div>
  );
}
