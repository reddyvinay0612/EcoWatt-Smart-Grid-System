import React from 'react';

function Legend({ view, isDarkMode, activeMetric = 'electricity' }) {
  const isNational = view === 'india';
  const isCarbon = activeMetric === 'carbon';

  const getRanges = () => {
    if (!isNational) {
      return {
        high: '> 120% state average',
        medium: '80% – 120% state average',
        low: '< 80% state average'
      };
    }
    if (isCarbon) {
      return {
        high: '> 1,600 kg CO2',
        medium: '800 – 1,600 kg CO2',
        low: '< 800 kg CO2'
      };
    }
    return {
      high: '> 2,000 kWh',
      medium: '1,000 – 2,000 kWh',
      low: '< 1,000 kWh'
    };
  };

  const ranges = getRanges();

  return (
    <div className={`glass-panel p-4 rounded-xl border transition-all ${
      isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-205 bg-white shadow-sm'
    }`}>
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {isCarbon ? 'Carbon Emission Tiers' : 'Electricity Consumption Tiers'}
      </h4>
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-accentRed rounded-md shadow-sm"></span>
            <span className="font-semibold text-slate-350 dark:text-slate-300">High Tier</span>
          </div>
          <span className="text-slate-400 font-bold">{ranges.high}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-amber-500 rounded-md shadow-sm"></span>
            <span className="font-semibold text-slate-355 dark:text-slate-300">Medium Tier</span>
          </div>
          <span className="text-slate-400 font-bold">{ranges.medium}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-accentGreen rounded-md shadow-sm"></span>
            <span className="font-semibold text-slate-355 dark:text-slate-300">Low Tier</span>
          </div>
          <span className="text-slate-400 font-bold">{ranges.low}</span>
        </div>
      </div>
    </div>
  );
}

export default Legend;
