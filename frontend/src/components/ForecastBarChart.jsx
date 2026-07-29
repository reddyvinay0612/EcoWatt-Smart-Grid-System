import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FORECAST_DATA = DAYS.map(d => ({
  day: d,
  gw: Math.round(70 + Math.random() * 100),
}));

const BAR_COLORS = ['#3B82F6', '#4F7CE0', '#6366F1', '#7C3AED', '#8B5CF6', '#9333EA', '#A855F7'];

function ForecastBarChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl p-4"
    >
      <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">7 Day Energy Forecast</p>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={FORECAST_DATA} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              {FORECAST_DATA.map((_, i) => (
                <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BAR_COLORS[i]} stopOpacity={1} />
                  <stop offset="100%" stopColor={BAR_COLORS[i]} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="day" stroke="#475569" fontSize={9} tickLine={false} />
            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} unit=" GW" />
            <Tooltip
              contentStyle={{ backgroundColor: '#131824', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }}
              labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
              formatter={val => [`${val} GW`, 'Forecast']}
            />
            <Bar dataKey="gw" radius={[4, 4, 0, 0]}>
              {FORECAST_DATA.map((_, i) => (
                <Cell key={i} fill={`url(#barGrad${i})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default ForecastBarChart;
