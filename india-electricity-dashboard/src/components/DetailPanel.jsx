import React from 'react';
import { Users, Globe, IndianRupee } from 'lucide-react';

function DetailPanel({ name, value, tier, pop, gdp, comparisonToAvg, isDarkMode, onClose, averageLabel = 'national' }) {
  const getBadgeClass = (t) => {
    switch (t) {
      case 'High':
        return 'bg-red-500/10 border border-red-500/25 text-red-500';
      case 'Medium':
        return 'bg-amber-500/10 border border-amber-500/25 text-amber-500';
      default:
        return 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-500';
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl border-t p-6 z-50 max-h-[80vh] overflow-y-auto transform transition-transform duration-300 translate-y-0 lg:relative lg:translate-y-0 lg:rounded-2xl lg:shadow-none lg:border lg:z-0 ${
      isDarkMode 
        ? 'bg-[#0B0F19] border-slate-800 text-slate-100 lg:bg-slate-900/40 lg:border-slate-800' 
        : 'bg-white border-slate-200 text-slate-800 lg:bg-white lg:border-slate-200 lg:shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-700/20">
        <h3 className="font-extrabold text-base">Regional Inspections</h3>
        <button 
          onClick={onClose}
          className="lg:hidden text-xs font-bold text-slate-500 dark:text-slate-400 border px-2.5 py-1 rounded-lg"
        >
          Close
        </button>
      </div>

      <div className="space-y-5">
        {/* Name and badge */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold truncate max-w-[180px]">{name}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(tier)}`}>
            {tier} Consumption
          </span>
        </div>

        {/* Info Grid */}
        <div className={`space-y-3.5 p-4 rounded-xl border ${
          isDarkMode ? 'bg-[#060A12] border-slate-800/80' : 'bg-slate-150/60 border-slate-250/70'
        }`}>
          {/* Consumption */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <IndianRupee className="h-3.5 w-3.5 mr-1" /> Per-Capita kWh
            </span>
            <span className="text-base font-extrabold">
              {value?.toLocaleString()} kWh
            </span>
          </div>

          {/* Population */}
          <div className="flex justify-between items-center border-t border-slate-700/10 pt-3">
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <Users className="h-3.5 w-3.5 mr-1" /> Population
            </span>
            <span className="text-sm font-semibold">{pop || 'N/A'}</span>
          </div>

          {/* GDP */}
          <div className="flex justify-between items-center border-t border-slate-700/10 pt-3">
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <Globe className="h-3.5 w-3.5 mr-1" /> Est GDP Per Capita
            </span>
            <span className="text-sm font-semibold">
              {gdp ? `₹${gdp.toLocaleString()}` : 'N/A'}
            </span>
          </div>

          {/* Average comparison */}
          <div className="flex justify-between items-center border-t border-slate-700/10 pt-3">
            <span className="text-xs text-slate-400 font-semibold">
              Comparison to {averageLabel}
            </span>
            <div className="text-right">
              <span className={`text-sm font-bold block ${
                comparisonToAvg > 0 ? 'text-red-500' : 'text-emerald-500'
              }`}>
                {comparisonToAvg > 0 ? '+' : ''}
                {comparisonToAvg.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-500 font-medium block">
                vs benchmark average
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailPanel;
