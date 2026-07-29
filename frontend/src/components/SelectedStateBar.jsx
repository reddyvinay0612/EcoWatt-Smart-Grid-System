import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { stateData } from '../data/stateData';
import { useTheme } from '../context/ThemeContext';

export default function SelectedStateBar({ selectedState }) {
  const { isDarkMode } = useTheme();
  const s = stateData.find(x => x.name === selectedState);

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#FFFFFF' : '#0F172A';

  if (!s) return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, color: labelColor, fontWeight: 600 }}>Click any state on the map to view detailed analytics</span>
    </div>
  );

  const renewShare = ((1 - s.emissionFactor) * 100).toFixed(1);
  const demandForecast = Math.round(s.electricityConsumption * 1.092).toLocaleString();

  const metrics = [
    { label: 'Consumption',     value: `${s.electricityConsumption.toLocaleString()} kWh`, trend: '+8.7%',  up: true  },
    { label: 'Carbon Emission', value: `${s.carbonEmission.toLocaleString()} Tons`,         trend: '-6.3%',  up: false },
    { label: 'Renewable Share', value: `${renewShare}%`,                                    trend: '+12.4%', up: true  },
    { label: 'Demand Forecast', value: `${demandForecast} kWh`,                             trend: '+9.2%',  up: true  },
  ];

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 20, overflowX: 'auto' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selected State</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#3B82F6', marginTop: 2 }}>{s.name}</div>
      </div>
      <div style={{ width: 1, height: 32, background: cardBorder, flexShrink: 0 }}></div>
      {metrics.map(m => (
        <div key={m.label} style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: valueColor, marginTop: 2 }}>{m.value}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, fontSize: 9, fontWeight: 800, color: m.up ? '#10B981' : '#EF4444' }}>
            {m.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {m.trend}
          </div>
        </div>
      ))}
    </div>
  );
}
