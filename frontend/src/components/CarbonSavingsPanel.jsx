import React from 'react';
import { TrendingUp, TreePine } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CarbonSavingsPanel() {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#FFFFFF' : '#0F172A';

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Carbon Savings</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* CO2 saved */}
        <div style={{ background: isDarkMode ? 'rgba(16,185,129,0.07)' : '#F0FDF4', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's CO₂ Saved</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: valueColor, marginTop: 4, lineHeight: 1 }}>24,987</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: labelColor, marginTop: 2 }}>Tons</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 9, fontWeight: 800, color: '#10B981' }}>
            <TrendingUp size={10} />
            +18.7% vs yesterday
          </div>
        </div>

        {/* Trees */}
        <div style={{ background: isDarkMode ? 'rgba(16,185,129,0.05)' : '#F0FDF4', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equivalent to</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 4, lineHeight: 1 }}>52,430</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9, fontWeight: 700, color: labelColor }}>
            <TreePine size={12} color="#10B981" />
            Trees Planted
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 9, fontWeight: 800, color: '#10B981' }}>
            <TrendingUp size={10} />
            +18.7% vs yesterday
          </div>
        </div>

      </div>
    </div>
  );
}
