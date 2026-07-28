import React from 'react';

function Legend({ view, isDarkMode }) {
  const isNational = view === 'india';

  return (
    <div className={`glass-panel p-4 rounded-xl border transition-all ${
      isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
        isDarkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Consumption Ranges
      </h4>
      <div className="space-y-2.5 text-xs">
        {/* High */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-red-500 rounded-md shadow-sm"></span>
            <span className="font-semibold text-slate-350 dark:text-slate-300">High Consumption</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            {isNational ? '> 2,000 kWh' : '> 120% average'}
          </span>
        </div>

        {/* Medium */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-amber-500 rounded-md shadow-sm"></span>
            <span className="font-semibold text-slate-350 dark:text-slate-300">Medium Consumption</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            {isNational ? '1,000 – 2,000 kWh' : '80% – 120% average'}
          </span>
        </div>

        {/* Low */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md shadow-sm"></span>
            <span className="font-semibold text-slate-350 dark:text-slate-300">Low Consumption</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            {isNational ? '< 1,000 kWh' : '< 80% average'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Legend;
