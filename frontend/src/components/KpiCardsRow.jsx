import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Zap, Leaf, Sun, Building2, BrainCircuit, Activity } from 'lucide-react';

const spark = (base, noise = 15) =>
  Array.from({ length: 10 }, (_, i) => ({
    v: base + Math.sin(i * 1.3) * noise + (i % 3 === 0 ? noise * 0.5 : -noise * 0.2),
  }));

const CARDS = [
  {
    label: 'Total Electricity',
    value: '124.8',
    unit: 'GW',
    trend: '↑ 12.5%',
    pos: true,
    Icon: Zap,
    color: '#3B82F6',
    iconBg: 'bg-blue-500/20',
    sparkBase: 65,
    noise: 18,
  },
  {
    label: 'Carbon Saved',
    value: '24,987',
    unit: 'Tons',
    trend: '↑ 18.7%',
    pos: true,
    Icon: Leaf,
    color: '#10B981',
    iconBg: 'bg-emerald-500/20',
    sparkBase: 50,
    noise: 12,
  },
  {
    label: 'Renewable Share',
    value: '42.6',
    unit: '%',
    trend: '↑ 8.3%',
    pos: true,
    Icon: Sun,
    color: '#F59E0B',
    iconBg: 'bg-amber-500/20',
    sparkBase: 42,
    noise: 6,
  },
  {
    label: 'Active Plants',
    value: '276',
    unit: '',
    trend: '↑ 5',
    pos: true,
    Icon: Building2,
    color: '#A855F7',
    iconBg: 'bg-purple-500/20',
    sparkBase: 274,
    noise: 4,
  },
  {
    label: 'AI Accuracy',
    value: '94.2',
    unit: '%',
    trend: '↑ 2.1%',
    pos: true,
    Icon: BrainCircuit,
    color: '#06B6D4',
    iconBg: 'bg-cyan-500/20',
    sparkBase: 93,
    noise: 3,
  },
  {
    label: 'Energy Demand',
    value: '98.6',
    unit: 'GW',
    trend: '↑ 9.8%',
    pos: false,
    Icon: Activity,
    color: '#F97316',
    iconBg: 'bg-orange-500/20',
    sparkBase: 88,
    noise: 14,
  },
];

function KpiCardsRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
      {CARDS.map((card, i) => {
        const sparkData = spark(card.sparkBase, card.noise);
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="bg-[#131824] border border-white/5 rounded-xl p-3 hover:border-white/10 hover:shadow-lg hover:shadow-black/30 transition-all cursor-default"
          >
            {/* Icon chip */}
            <div className={`inline-flex p-1.5 rounded-lg ${card.iconBg} mb-2`}>
              <card.Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
            </div>

            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              {card.label}
            </p>

            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-[22px] font-black text-white leading-none">{card.value}</span>
              {card.unit && (
                <span className="text-[10px] font-bold text-slate-500">{card.unit}</span>
              )}
            </div>

            {/* Sparkline */}
            <div className="h-8 w-full mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={card.color}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className={`text-[9px] font-bold mt-0.5 ${card.pos ? 'text-emerald-400' : 'text-red-400'}`}>
              {card.trend}{' '}
              <span className="text-slate-500 font-normal">vs yesterday</span>
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

export default KpiCardsRow;
