import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { stateData } from '../data/stateData';
import getColorScale from '../utils/colorScale';

const TIER_COLORS = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
};

function ConsumptionTiersDonut() {
  const tierCounts = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    stateData.forEach(s => {
      const { tier } = getColorScale(s.electricityConsumption);
      if (counts[tier] !== undefined) counts[tier]++;
    });
    const total = stateData.length;
    return [
      { name: 'High Tier', value: counts.High, pct: ((counts.High / total) * 100).toFixed(0), color: TIER_COLORS.High },
      { name: 'Medium Tier', value: counts.Medium, pct: ((counts.Medium / total) * 100).toFixed(0), color: TIER_COLORS.Medium },
      { name: 'Low Tier', value: counts.Low, pct: ((counts.Low / total) * 100).toFixed(0), color: TIER_COLORS.Low },
    ];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl p-4"
    >
      <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">Electricity Consumption Tiers</p>

      <div className="flex items-center space-x-3">
        {/* Donut */}
        <div className="h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tierCounts}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive={true}
              >
                {tierCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#131824', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }}
                formatter={(val, name) => [val + ' states', name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1">
          {tierCounts.map(t => (
            <div key={t.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }}></span>
                <span className="text-[9px] text-slate-400 font-semibold">{t.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-slate-500">{t.value} states</span>
                <span className="text-[10px] font-bold text-slate-200">{t.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default ConsumptionTiersDonut;
