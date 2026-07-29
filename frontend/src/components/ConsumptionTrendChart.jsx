import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const DAYS = ['12 May','13 May','14 May','15 May','16 May','17 May','18 May'];
const DATA  = DAYS.map(d => ({ day: d, gw: Math.round(30 + Math.abs(Math.sin(DAYS.indexOf(d) * 0.8)) * 70) }));

export default function ConsumptionTrendChart() {
  const [range, setRange] = useState('This Week');

  return (
    <div style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Energy Consumption Trend</div>
        <div style={{ position: 'relative' }}>
          <select value={range} onChange={e => setRange(e.target.value)}
            style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 22px 4px 8px', fontSize: 9, fontWeight: 700, color: '#cbd5e1', cursor: 'pointer', outline: 'none' }}>
            <option>This Week</option><option>Last Week</option><option>This Month</option>
          </select>
          <ChevronDown size={9} color="#64748b" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 5, right: 4, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" stroke="#475569" fontSize={8} tickLine={false} />
            <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }} labelStyle={{ color: '#94a3b8' }} formatter={v => [`${v} GW`, 'GW']} />
            <Area type="monotone" dataKey="gw" stroke="#10B981" strokeWidth={2} fill="url(#tG)" dot={{ fill: '#10B981', r: 2, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
