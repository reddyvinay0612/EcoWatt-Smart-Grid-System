import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DATA  = DAYS.map((d,i) => ({ day: d, gw: Math.round(60 + Math.abs(Math.sin(i*0.9+0.3))*110) }));
const COLORS = ['#3B82F6','#4f76e0','#5b6de0','#6b5ce0','#7c3aed','#8b3ae0','#A855F7'];

export default function ForecastBarChart() {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px', overflow: 'hidden' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>7 Day Energy Forecast</div>
      <div style={{ width: '100%', height: 130 }}>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={DATA} margin={{ top: 5, right: 4, left: -30, bottom: 0 }}>
            <defs>
              {DATA.map((_, i) => (
                <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={COLORS[i]} stopOpacity={1}   />
                  <stop offset="100%" stopColor={COLORS[i]} stopOpacity={0.55} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#E2E8F0'} vertical={false} />
            <XAxis dataKey="day" stroke={labelColor} fontSize={9} tickLine={false} />
            <YAxis stroke={labelColor} fontSize={9} tickLine={false} axisLine={false} unit=" GW" />
            <Tooltip contentStyle={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 8, fontSize: 10, color: titleColor }} labelStyle={{ color: labelColor, fontWeight: 'bold' }} formatter={v => [`${v} GW`, 'Forecast']} />
            <Bar dataKey="gw" radius={[4, 4, 0, 0]}>
              {DATA.map((_, i) => <Cell key={i} fill={`url(#bg${i})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
