import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['12 May','13 May','14 May','15 May','16 May','17 May','18 May'];
const DATA  = DAYS.map(d => ({ day: d, gw: Math.round(30 + Math.abs(Math.sin(DAYS.indexOf(d) * 0.8)) * 70) }));

export default function ConsumptionTrendChart() {
  const { isDarkMode } = useTheme();
  const [range, setRange] = useState('This Week');

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Energy Consumption Trend</div>
        <div style={{ position: 'relative' }}>
          <select value={range} onChange={e => setRange(e.target.value)}
            style={{
              appearance: 'none',
              background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1'}`,
              borderRadius: 7,
              padding: '4px 22px 4px 8px',
              fontSize: 9,
              fontWeight: 700,
              color: isDarkMode ? '#cbd5e1' : '#0F172A',
              cursor: 'pointer',
              outline: 'none'
            }}>
            <option>This Week</option><option>Last Week</option><option>This Month</option>
          </select>
          <ChevronDown size={9} color={labelColor} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ width: '100%', height: 130 }}>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={DATA} margin={{ top: 5, right: 4, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#E2E8F0'} vertical={false} />
            <XAxis dataKey="day" stroke={labelColor} fontSize={8} tickLine={false} />
            <YAxis stroke={labelColor} fontSize={8} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 8, fontSize: 10, color: titleColor }} labelStyle={{ color: labelColor }} formatter={v => [`${v} GW`, 'GW']} />
            <Area type="monotone" dataKey="gw" stroke="#10B981" strokeWidth={2} fill="url(#tG)" dot={{ fill: '#10B981', r: 2, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
