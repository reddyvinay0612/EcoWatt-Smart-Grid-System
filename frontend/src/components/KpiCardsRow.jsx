import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Zap, Leaf, Sun, Building2, BrainCircuit, Activity } from 'lucide-react';

const spark = (base, noise = 15) =>
  Array.from({ length: 10 }, (_, i) => ({ v: base + (Math.sin(i * 1.1) * noise) + (Math.random() * noise * 0.5) }));

const KPI_CONFIG = [
  {
    id: 'electricity',
    label: 'Total Electricity',
    value: '124.8',
    unit: 'GW',
    trend: '+12.5%',
    positive: true,
    icon: Zap,
    color: '#3B82F6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    sparkBase: 60,
  },
  {
    id: 'carbon',
    label: 'Carbon Saved',
    value: '24,987',
    unit: 'Tons',
    trend: '+18.7%',
    positive: true,
    icon: Leaf,
    color: '#10B981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    sparkBase: 45,
  },
  {
    id: 'renewable',
    label: 'Renewable Share',
    value: '42.6',
    unit: '%',
    trend: '+8.3%',
    positive: true,
    icon: Sun,
    color: '#F59E0B',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    sparkBase: 40,
  },
  {
    id: 'plants',
    label: 'Active Plants',
    value: '276',
    unit: '',
    trend: '+5 vs yesterday',
    positive: true,
    icon: Building2,
    color: '#A855F7',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    sparkBase: 270,
    noise: 8,
  },
  {
    id: 'ai',
    label: 'AI Accuracy',
    value: '94.2',
    unit: '%',
    trend: '+2.1%',
    positive: true,
    icon: BrainCircuit,
    color: '#06B6D4',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    sparkBase: 90,
    noise: 5,
  },
  {
    id: 'demand',
    label: 'Energy Demand',
    value: '98.6',
    unit: 'GW',
    trend: '+9.8%',
    positive: false,
    icon: Activity,
    color: '#F97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    sparkBase: 80,
  },
];

function KpiCardsRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {KPI_CONFIG.map((kpi, idx) => {
        const Icon = kpi.icon;
        const sparkData = spark(kpi.sparkBase, kpi.noise || 15);
        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.4 }}
            className="bg-[#131824] border border-white/5 rounded-xl p-3.5 hover:border-white/10 hover:shadow-lg transition-all cursor-default group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${kpi.bg} border ${kpi.border}`}>
                <Icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-xl font-black text-white leading-none">{kpi.value}</span>
              {kpi.unit && <span className="text-[10px] font-bold text-slate-500">{kpi.unit}</span>}
            </div>

            {/* Mini sparkline */}
            <div className="h-8 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={kpi.color}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={`text-[9px] font-bold mt-1 ${kpi.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {kpi.positive ? '↑' : '↓'} {kpi.trend} vs yesterday
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default KpiCardsRow;
