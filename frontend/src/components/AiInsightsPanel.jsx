import React from 'react';
import { BrainCircuit, TrendingUp, Sun, Shield, Zap, Sparkles } from 'lucide-react';

const INSIGHTS = [
  { Icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', text: 'Energy demand in Karnataka likely to increase by 8% tomorrow based on weather patterns.' },
  { Icon: Sun,        color: '#10B981', bg: 'rgba(16,185,129,0.12)', text: 'Solar generation efficiency at peak performance (95%) — optimal output window active.' },
  { Icon: Shield,     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', text: 'Grid stability is optimal across 80% of states — no critical anomalies detected.' },
  { Icon: Zap,        color: '#A855F7', bg: 'rgba(168,85,247,0.12)', text: 'Rajasthan wind farms operating at 112% rated capacity — excess routed to national grid.' },
];

export default function AiInsightsPanel() {
  return (
    <div style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}>
            <BrainCircuit size={18} color="#fff" />
          </div>
          <span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, background: '#10B981', borderRadius: '50%', border: '2px solid #131824', animation: 'pulse 2s infinite' }}></span>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', lineHeight: 1 }}>AI Powered Insights</div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>ML predictions · Updated 2m ago</div>
        </div>
      </div>

      {/* Insights */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {INSIGHTS.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 9, padding: '8px 10px' }}>
            <div style={{ background: item.bg, borderRadius: 7, padding: 5, flexShrink: 0 }}>
              <item.Icon size={11} color={item.color} />
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{item.text}</p>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(90deg,#7c3aed,#3B82F6)', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', transition: 'opacity 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}>
        <Sparkles size={12} />
        Generate AI Report
      </button>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
