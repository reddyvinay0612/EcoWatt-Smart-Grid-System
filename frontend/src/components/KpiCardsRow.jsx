import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Zap, Leaf, Sun, Building2, BrainCircuit, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#FFFFFF' : '#0F172A';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
      {CARDS.map((c) => (
        <div 
          key={c.label} 
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: '8px 10px',
            cursor: 'default',
            boxShadow: isDarkMode ? 'none' : '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ background: c.bg, borderRadius: 6, padding: 4, display: 'inline-flex' }}>
              <c.Icon size={11} color={c.color} />
            </div>
            <div style={{ fontSize: 8, fontWeight: 800, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.label}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: valueColor, lineHeight: 1 }}>{c.value}</span>
            {c.unit && <span style={{ fontSize: 8, fontWeight: 700, color: labelColor }}>{c.unit}</span>}
          </div>

          {/* Sparkline */}
          <div style={{ height: 20, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark(c.b, c.n)}>
                <Line type="monotone" dataKey="v" stroke={c.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: 8, fontWeight: 800, marginTop: 2, color: c.pos ? '#10B981' : '#EF4444' }}>
            {c.trend} <span style={{ color: labelColor, fontWeight: 500 }}>vs yesterday</span>
          </div>
        </div>
      ))}
    </div>
  );
}
