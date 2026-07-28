import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

function RankingTable({ data, selectedItem, onSelect, isDarkMode, isNational }) {
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });

  const sortedData = [...data].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    
    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all ${
      isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <h3 className={`font-bold text-base mb-4 border-b pb-2 ${
        isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
      }`}>
        {isNational ? 'State Energy Rankings' : 'District Energy Rankings'}
      </h3>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-700/20 text-slate-400">
              <th className="pb-3 font-semibold text-center w-16">Rank</th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('name')}>
                <div className="flex items-center">
                  {isNational ? 'State / UT' : 'District'} <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('value')}>
                <div className="flex items-center">
                  Consumption (kWh) <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('tier')}>
                <div className="flex items-center">
                  Tier <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('pop')}>
                <div className="flex items-center">
                  Population <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => {
              const globalIdx = [...data]
                .sort((a, b) => b.value - a.value)
                .findIndex(x => x.name === item.name) + 1;
                
              return (
                <tr 
                  key={item.name} 
                  onClick={() => onSelect(item)}
                  className={`cursor-pointer border-b transition-all ${
                    selectedItem?.name === item.name 
                      ? isDarkMode 
                        ? 'bg-slate-800/60 border-slate-700/60' 
                        : 'bg-slate-200 border-slate-350'
                      : isDarkMode 
                        ? 'border-slate-800/40 hover:bg-slate-900/20' 
                        : 'border-slate-100/60 hover:bg-slate-100/50'
                  }`}
                >
                  <td className="py-3 font-bold text-center text-slate-400">{globalIdx}</td>
                  <td className={`py-3 font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</td>
                  <td className="py-3 font-extrabold">{item.value.toLocaleString()} kWh</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.tier === 'High' 
                        ? 'bg-red-500/10 text-red-500' 
                        : item.tier === 'Medium' 
                        ? 'bg-amber-500/10 text-amber-500' 
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {item.tier}
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
