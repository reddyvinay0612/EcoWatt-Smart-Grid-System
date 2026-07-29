import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import IndiaMap from './IndiaMap';
import { stateData } from '../data/stateData';

const LEGEND_ITEMS = [
  { label: 'Excellent', range: '> 2,000 kWh', color: '#EF4444', tier: 'High' },
  { label: 'Good', range: '1,000–2,000 kWh', color: '#F59E0B', tier: 'Medium' },
  { label: 'Moderate', range: '500–1,000 kWh', color: '#10B981', tier: 'Low' },
  { label: 'Critical', range: '< 500 kWh', color: '#64748B', tier: 'None' },
];

function LiveNationalMap({ selectedState, onSelectState, tierFilter }) {
  const [activeMetric, setActiveMetric] = useState('electricity');
  const [mapScale, setMapScale] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Live National Energy Map</p>
          <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Real-time Electricity Consumption Overview</p>
        </div>
        <div className="relative">
          <select
            value={activeMetric}
            onChange={e => setActiveMetric(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 px-3 py-1.5 pr-7 rounded-lg outline-none hover:border-white/20 transition-colors cursor-pointer"
          >
            <option value="electricity">Electricity Consumption (kWh)</option>
            <option value="carbon">Carbon Emission (kg CO₂)</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Map body */}
      <div className="relative flex-1 min-h-[300px]">
        {/* Left legend floating panel */}
        <div className="absolute left-3 top-3 z-10 bg-[#0d1117]/90 border border-white/10 rounded-xl p-3 backdrop-blur-sm space-y-2">
          {LEGEND_ITEMS.map(item => (
            <div key={item.tier} className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
              <div>
                <p className="text-[9px] font-bold text-slate-300">{item.label}</p>
                <p className="text-[8px] text-slate-500">{item.range}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="w-full h-full flex items-center justify-center" style={{ transform: `scale(${mapScale})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}>
          <IndiaMap
            stateData={stateData}
            selectedState={selectedState}
            onSelectState={onSelectState}
            tierFilter={tierFilter || 'All'}
            isDarkMode={true}
            activeMetric={activeMetric}
          />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col space-y-1">
          <button
            onClick={() => setMapScale(s => Math.min(s + 0.1, 1.5))}
            className="bg-[#0d1117]/90 border border-white/10 text-slate-400 hover:text-white h-7 w-7 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMapScale(s => Math.max(s - 0.1, 0.7))}
            className="bg-[#0d1117]/90 border border-white/10 text-slate-400 hover:text-white h-7 w-7 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default LiveNationalMap;
