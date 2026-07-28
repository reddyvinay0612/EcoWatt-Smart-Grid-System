import React from 'react';

function FilterButtons({ tierFilter, onFilterChange, isDarkMode }) {
  return (
    <div className={`flex rounded-xl p-1 border transition-all ${
      isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-200/50 border-slate-300'
    }`}>
      {['All', 'High', 'Medium', 'Low'].map(tier => (
        <button
          key={tier}
          onClick={() => onFilterChange(tier)}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tierFilter === tier 
              ? 'bg-blue-600 text-white shadow' 
              : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-650 hover:text-slate-950'
          }`}
        >
          {tier}
        </button>
      ))}
    </div>
  );
}

export default FilterButtons;
