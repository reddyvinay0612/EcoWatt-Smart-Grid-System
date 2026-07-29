import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const generateWeekData = () => {
  const days = ['12 May', '13 May', '14 May', '15 May', '16 May', '17 May', '18 May'];
  return days.map(d => ({
    day: d,
    gw: Math.round(55 + Math.random() * 45),
  }));
};

const DATA = generateWeekData();

const TIME_RANGES = ['This Week', 'Last Week', 'This Month'];

function ConsumptionTrendChart() {
  const [range, setRange] = useState('This Week');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Energy Consumption Trend</p>
        <div className="relative">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 text-[9px] font-bold text-slate-300 pl-2.5 pr-6 py-1 rounded-lg outline-none cursor-pointer hover:border-white/20 transition-colors"
          >
            {TIME_RANGES.map(r => <option key={r}>{r}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="day" stroke="#475569" fontSize={8} tickLine={false} />
            <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#131824', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Area type="monotone" dataKey="gw" name="GW" stroke="#10B981" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: '#10B981', r: 2, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default ConsumptionTrendChart;
