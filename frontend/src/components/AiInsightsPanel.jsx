import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, TrendingUp, Sun, Shield, Zap } from 'lucide-react';

const INSIGHTS = [
  {
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    text: 'Energy demand in Karnataka likely to increase by 8% tomorrow based on weather patterns.',
  },
  {
    icon: Sun,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    text: 'Solar generation efficiency at peak performance (95%) — optimal output window.',
  },
  {
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    text: 'Grid stability is optimal across 80% of monitored states with no anomalies detected.',
  },
  {
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    text: 'Rajasthan wind farms operating at 112% of rated capacity — excess fed to national grid.',
  },
];

function AiInsightsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl p-4 flex flex-col h-full"
    >
      {/* Header with AI badge */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="relative shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-accentGreen rounded-full border border-[#131824] animate-pulse"></span>
        </div>
        <div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.15em]">AI Powered Insights</p>
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">ML-generated predictions · Updated 2m ago</p>
        </div>
      </div>

      {/* Insights list */}
      <div className="space-y-2.5 flex-1">
        {INSIGHTS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-start space-x-2.5 bg-white/[0.03] border border-white/5 rounded-lg p-2.5"
            >
              <div className={`shrink-0 p-1.5 rounded-lg ${item.bg}`}>
                <Icon className={`h-3 w-3 ${item.color}`} />
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{item.text}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Generate report button */}
      <button className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-[10px] py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Generate AI Report</span>
      </button>
    </motion.div>
  );
}

export default AiInsightsPanel;
