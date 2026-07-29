import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { stateData } from '../data/stateData';
import getColorScale from '../utils/colorScale';

const TIERS = [
  { name: 'High Tier',   color: '#EF4444', key: 'High'   },
  { name: 'Medium Tier', color: '#F59E0B', key: 'Medium' },
  { name: 'Low Tier',    color: '#10B981', key: 'Low'    },
];

export default function ConsumptionTiersDonut() {
  const data = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    stateData.forEach(s => { const { tier } = getColorScale(s.electricityConsumption); if (counts[tier] !== undefined) counts[tier]++; });
    const total = stateData.length;
    return TIERS.map(t => ({ ...t, value: counts[t.key], pct: Math.round((counts[t.key] / total) * 100) }));
  }, []);

  return (
    <div style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
        Electricity Consumption Tiers
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 100, height: 100, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value" isAnimationActive>
                {data.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }} formatter={(v, n) => [`${v} states`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          {data.map(t => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }}></span>
                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{t.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 8, color: '#64748b' }}>{`> ${t.key === 'High' ? '2,000' : t.key === 'Medium' ? '1,000' : ''} kWh`}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0' }}>{t.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
