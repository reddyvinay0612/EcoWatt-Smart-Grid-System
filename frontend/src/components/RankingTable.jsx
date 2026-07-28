import React, { useState } from 'react';
import { ArrowUpDown, ArrowDown } from 'lucide-react';

function RankingTable({ data, selectedItem, onSelect, isDarkMode, isNational }) {
  const [sortMetric, setSortMetric] = useState('electricity'); // 'electricity' | 'carbon'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Map sort keys
  const sortKey = sortMetric === 'carbon' ? 'carbonEmission' : 'electricityConsumption';

  const sortedData = [...data].sort((a, b) => {
    // Fallback lookups in case property names vary
    const valA = a[sortKey] ?? a.value ?? 0;
    const valB = b[sortKey] ?? b.value ?? 0;

    return sortDirection === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all ${
      isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-205 bg-white shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b pb-3 border-slate-700/20">
        <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {isNational ? 'State Energy & Emission Rankings' : 'District Energy & Emission Rankings'}
        </h3>
        
        {/* Metric Sorting selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-semibold">Sort By:</span>
          <select
            value={sortMetric}
            onChange={(e) => setSortMetric(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-750'
            }`}
          >
            <option value="electricity">Electricity Consumption</option>
            <option value="carbon">Carbon Emission</option>
          </select>
          
          <button
            onClick={toggleSortDirection}
            className={`p-1.5 rounded-lg border hover:bg-slate-800 transition-all ${
              isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
            }`}
            title={`Sort ${sortDirection === 'desc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-700/20 text-slate-400">
              <th className="pb-3 font-semibold text-center w-16">Rank</th>
              <th className="pb-3 font-semibold">
                {isNational ? 'State / UT' : 'District'}
              </th>
              <th className="pb-3 font-semibold">
                Electricity (kWh)
              </th>
              <th className="pb-3 font-semibold">
                Carbon (kg CO2)
              </th>
              <th className="pb-3 font-semibold">
                Active Tier
              </th>
              <th className="pb-3 font-semibold">
                Population
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => {
              // Calculate global index under active sort
              const globalIdx = idx + 1;
              const elecVal = item.electricityConsumption ?? item.value ?? 0;
              const carbVal = item.carbonEmission ?? 0;
              
              // Get item tier under active sort metric
              const activeTier = sortMetric === 'carbon' ? item.carbTier ?? item.tier : item.elecTier ?? item.tier;

              return (
                <tr 
                  key={item.name} 
                  onClick={() => onSelect(item)}
                  className={`cursor-pointer border-b transition-all ${
                    selectedItem?.name === item.name 
                      ? isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-200 border-slate-350'
                      : isDarkMode ? 'border-slate-850/40 hover:bg-slate-900/20' : 'border-slate-100/65 hover:bg-slate-100/50'
                  }`}
                >
                  <td className="py-3 font-bold text-center text-slate-400">{globalIdx}</td>
                  <td className={`py-3 font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-850'}`}>
                    {item.name}
                  </td>
                  <td className="py-3 font-extrabold">{elecVal.toLocaleString()} kWh</td>
                  <td className="py-3 font-extrabold text-slate-300">{carbVal.toLocaleString()} kg</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTier === 'High' ? 'bg-accentRed/10 text-accentRed' 
                      : activeTier === 'Medium' ? 'bg-amber-500/10 text-amber-500' 
                      : 'bg-accentGreen/10 text-accentGreen'
                    }`}>
                      {activeTier}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 font-medium">{item.pop || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RankingTable;
