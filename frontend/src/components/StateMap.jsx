import React, { useState, useEffect } from 'react';
import stateMapFiles from '../data/stateMapFiles';
import getColorScale from '../utils/colorScale';
import { ShieldAlert, Loader } from 'lucide-react';

function StateMap({ 
  selectedState, 
  districts, 
  selectedDistrict, 
  onSelectDistrict, 
  tierFilter, 
  isDarkMode, 
  stateAverage, // Active metric average for this state
  activeMetric = 'electricity'
}) {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [hoveredPin, setHoveredPin] = useState(null);

  // Reset loading states when selected state changes
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [selectedState]);

  const mapPath = stateMapFiles[selectedState];

  // Procedural coordinate allocator for overlaying pins on JPEGs
  const getPinPosition = (index) => {
    const coords = [
      { top: '25%', left: '35%' },
      { top: '35%', left: '60%' },
      { top: '50%', left: '28%' },
      { top: '48%', left: '72%' },
      { top: '72%', left: '40%' },
      { top: '68%', left: '65%' },
      { top: '85%', left: '32%' },
      { top: '80%', left: '58%' }
    ];
    return coords[index % coords.length];
  };

  if (!mapPath || imgError) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 rounded-2xl border text-center min-h-[350px] ${
        isDarkMode ? 'border-darkBorder/40 bg-slate-900/10' : 'border-slate-200 bg-white'
      }`}>
        <ShieldAlert className="h-10 w-10 text-amber-500 mb-4 animate-pulse" />
        <h4 className="font-bold text-sm text-slate-300 dark:text-slate-205">
          District map not available for this state yet
        </h4>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">
          No JPEG boundary file found at path lookup. Verify that the files match spelling precisely.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 items-stretch min-h-[450px]">
      
      {/* Left side: Interactive Map Overlay */}
      <div className={`relative flex-1 flex items-center justify-center border rounded-2xl overflow-hidden p-6 ${
        isDarkMode ? 'border-darkBorder/40 bg-[#0B0F19]' : 'border-slate-200 bg-slate-100'
      }`}>
        
        {/* Loading Spinner */}
        {imgLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm z-10">
            <Loader className="h-8 w-8 text-accentBlue animate-spin mb-2" />
            <span className="text-slate-400 text-xs font-semibold">Loading state map visual...</span>
          </div>
        )}

        {/* Map Image container */}
        <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
          <img
            src={mapPath}
            alt={`${selectedState} Map`}
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgLoading(false);
              setImgError(true);
            }}
            className="w-full h-full object-contain rounded-xl shadow-lg border border-slate-700/20"
          />

          {/* Interactive Colored Hotspot Pins Overlay */}
          {!imgLoading && districts.map((d, index) => {
            const value = activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption;
            const { color, tier } = getColorScale(value, stateAverage, activeMetric);
            const pos = getPinPosition(index);
            const isSelected = selectedDistrict?.name === d.name;
            const isFiltered = tierFilter !== 'All' && tier !== tierFilter;

            if (isFiltered) return null;

            return (
              <div
                key={d.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                style={{ top: pos.top, left: pos.left }}
                onClick={() => onSelectDistrict(d)}
                onMouseEnter={() => setHoveredPin(d.name)}
                onMouseLeave={() => setHoveredPin(null)}
              >
                {/* Pulsing ring */}
                <span 
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ backgroundColor: isSelected ? '#60A5FA' : color }}
                ></span>
                {/* Core dot */}
                <span 
                  className={`relative inline-flex rounded-full h-3.5 w-3.5 border transition-all ${
                    isSelected ? 'scale-125 border-white ring-4 ring-blue-500/30' : 'border-black/30'
                  }`}
                  style={{ backgroundColor: isSelected ? '#3B82F6' : color }}
                ></span>

                {/* Local Tooltip on Hover */}
                {hoveredPin === d.name && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#151D30] border border-slate-700/40 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-xl z-50">
                    {d.name} ({value} {activeMetric === 'carbon' ? 'kg CO2' : 'kWh'})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side: Clickable District Badges List */}
      <div className="w-full md:w-64 flex flex-col justify-start space-y-2 max-h-[380px] overflow-y-auto pr-1">
        <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
          Select District
        </h5>
        {districts.map((d) => {
          const value = activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption;
          const { color, tier } = getColorScale(value, stateAverage, activeMetric);
          const isSelected = selectedDistrict?.name === d.name;
          const isFiltered = tierFilter !== 'All' && tier !== tierFilter;

          if (isFiltered) return null;

          const dev = ((value - stateAverage) / stateAverage) * 100;

          return (
            <button
              key={d.name}
              onClick={() => onSelectDistrict(d)}
              className={`w-full flex flex-col p-3 rounded-xl border text-left transition-all ${
                isSelected 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold'
                  : isDarkMode
                  ? 'bg-[#0F1626]/50 border-darkBorder/40 text-slate-300 hover:bg-[#0F1626] hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="w-full flex items-center justify-between font-bold mb-1 text-xs">
                <span>{d.name}</span>
                <span style={{ color }}>
                  {value.toLocaleString()} {activeMetric === 'carbon' ? 'kg' : 'kWh'}
                </span>
              </div>
              <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span className="capitalize">{tier} Tier</span>
                <span className={dev > 0 ? 'text-accentRed' : 'text-accentGreen'}>
                  {dev > 0 ? '+' : ''}{dev.toFixed(0)}% vs avg
                </span>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default StateMap;
