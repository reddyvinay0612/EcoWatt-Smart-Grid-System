import React from 'react';
import { TrendingUp, TreePine } from 'lucide-react';

export default function CarbonSavingsPanel() {
  return (
    <div style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Carbon Savings</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* CO2 saved */}
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's CO₂ Saved</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 4, lineHeight: 1 }}>24,987</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 2 }}>Tons</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 9, fontWeight: 700, color: '#10B981' }}>
            <TrendingUp size={10} />
            +18.7% vs yesterday
          </div>
        </div>

        {/* Trees */}
        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equivalent to</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 4, lineHeight: 1 }}>52,430</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9, fontWeight: 700, color: '#64748b' }}>
            <TreePine size={12} color="#10B981" />
            Trees Planted
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 9, fontWeight: 700, color: '#10B981' }}>
            <TrendingUp size={10} />
            +18.7% vs yesterday
          </div>
        </div>

      </div>
    </div>
  );
}
