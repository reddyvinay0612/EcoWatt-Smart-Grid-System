import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Zap, Leaf, Sun, Building2, BrainCircuit, Activity } from 'lucide-react';

const spark = (base, noise) =>
  Array.from({ length: 10 }, (_, i) => ({ v: base + Math.sin(i * 1.4) * noise }));

const CARDS = [
  { label: 'Total Electricity', value: '124.8', unit: 'GW',    trend: '↑ 12.5%', pos: true,  Icon: Zap,         color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',   b: 80, n: 18 },
  { label: 'Carbon Saved',      value: '24,987', unit: 'Tons',  trend: '↑ 18.7%', pos: true,  Icon: Leaf,        color: '#10B981', bg: 'rgba(16,185,129,0.15)',   b: 55, n: 12 },
  { label: 'Renewable Share',   value: '42.6',   unit: '%',     trend: '↑ 8.3%',  pos: true,  Icon: Sun,         color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',   b: 42, n: 6  },
  { label: 'Active Plants',     value: '276',    unit: '',      trend: '↑ 5',     pos: true,  Icon: Building2,   color: '#A855F7', bg: 'rgba(168,85,247,0.15)',   b: 272, n: 5 },
  { label: 'AI Accuracy',       value: '94.2',   unit: '%',     trend: '↑ 2.1%',  pos: true,  Icon: BrainCircuit,color: '#06B6D4', bg: 'rgba(6,182,212,0.15)',    b: 93, n: 3  },
  { label: 'Energy Demand',     value: '98.6',   unit: 'GW',    trend: '↑ 9.8%',  pos: false, Icon: Activity,    color: '#F97316', bg: 'rgba(249,115,22,0.15)',   b: 85, n: 14 },
];

export default function KpiCardsRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
      {CARDS.map((c, i) => (
        <div key={c.label} style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', cursor: 'default', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.35)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>

          <div style={{ background: c.bg, borderRadius: 8, padding: 6, display: 'inline-flex', marginBottom: 8 }}>
            <c.Icon size={14} color={c.color} />
          </div>

          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>
            {c.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{c.value}</span>
            {c.unit && <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{c.unit}</span>}
          </div>

          {/* Sparkline */}
          <div style={{ height: 32, marginTop: 6 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark(c.b, c.n)}>
                <Line type="monotone" dataKey="v" stroke={c.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: 9, fontWeight: 700, marginTop: 3, color: c.pos ? '#10B981' : '#EF4444' }}>
            {c.trend} <span style={{ color: '#64748b', fontWeight: 400 }}>vs yesterday</span>
          </div>
        </div>
      ))}
    </div>
  );
}
