import React from 'react';
import { AlertOctagon, ShieldCheck, ZapOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AlertsPanel({ alerts = [] }) {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const textColor = isDarkMode ? '#cbd5e1' : '#334155';

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertOctagon size={16} color="#DC2626" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Grid Variance & Telemetry Alerts
          </span>
        </div>
        {alerts.length > 0 && (
          <span style={{ fontSize: 8, color: '#DC2626', background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2', border: '1px solid rgba(220, 38, 38, 0.3)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
            {alerts.length} Flagged
          </span>
        )}
      </div>

      {/* Alerts List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180 }}>
        {alerts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, padding: '20px 0', color: labelColor }}>
            <ShieldCheck size={28} color="#10B981" />
            <span style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? '#e2e8f0' : '#475569' }}>
              Load profiles nominal
            </span>
            <span style={{ fontSize: 8, fontWeight: 500, textAlign: 'center', maxWidth: 180 }}>
              No consumption anomalies or critical spikes detected in last 72 hours.
            </span>
          </div>
        ) : (
          alerts.map((al, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: 8,
              background: isDarkMode ? 'rgba(239,68,68,0.04)' : '#FEF2F2',
              border: `1px solid ${isDarkMode ? 'rgba(239,68,68,0.15)' : '#FCA5A5'}`,
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 10
            }}>
              <ZapOff size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#991B1B' }}>
                  <span>{al.status}</span>
                  <span style={{ color: '#EF4444' }}>+{al.increase_percent}%</span>
                </div>
                <div style={{ color: textColor, fontWeight: 600 }}>
                  Load spiked to <strong>{al.value_kwh} kWh</strong> vs hourly average baseline of {al.historical_average_kwh} kWh.
                </div>
                <div style={{ fontSize: 8, color: labelColor, fontWeight: 500, marginTop: 2 }}>
                  Registered at: {new Date(al.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
