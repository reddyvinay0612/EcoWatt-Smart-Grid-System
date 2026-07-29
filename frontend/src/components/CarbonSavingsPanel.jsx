import React from 'react';
import { motion } from 'framer-motion';
import { TreePine, TrendingUp } from 'lucide-react';

function CarbonSavingsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl p-4"
    >
      <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">Carbon Savings</p>

      <div className="grid grid-cols-2 gap-3">
        {/* CO2 saved */}
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Today's CO₂ Saved</p>
          <p className="text-2xl font-black text-white mt-1 leading-none">24,987</p>
          <p className="text-[9px] font-bold text-slate-400 mt-0.5">Tons</p>
          <div className="flex items-center space-x-1 mt-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400">+18.7% vs yesterday</span>
          </div>
        </div>

        {/* Trees equivalent */}
        <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Equivalent to</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 leading-none">52,430</p>
          <div className="flex items-center space-x-1 mt-0.5">
            <TreePine className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-400">Trees Planted</span>
          </div>
          <div className="flex items-center space-x-1 mt-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400">+18.7% vs yesterday</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CarbonSavingsPanel;
