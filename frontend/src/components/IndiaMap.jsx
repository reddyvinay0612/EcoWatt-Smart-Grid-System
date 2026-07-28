import React from 'react';
import India from '@react-map/india';
import getColorScale from '../utils/colorScale';

function IndiaMap({ 
  stateData, 
  selectedState, 
  onSelectState, 
  tierFilter, 
  isDarkMode, 
  activeMetric = 'electricity' 
}) {
  // Compute state colors dynamically based on active metric
  const stateColors = {};
  stateData.forEach(s => {
    const value = activeMetric === 'carbon' ? s.carbonEmission : s.electricityConsumption;
    const { color, tier } = getColorScale(value, null, activeMetric);
    
    const isFiltered = tierFilter !== 'All' && tier !== tierFilter;
    if (isFiltered) {
      stateColors[s.name] = isDarkMode ? '#111827' : '#F3F4F6';
    } else {
      stateColors[s.name] = selectedState === s.name ? '#60A5FA' : color;
    }
  });

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[450px]">
      <div className="w-full max-w-[400px] aspect-square flex items-center justify-center my-4">
        <India
          type="select-single"
          size={380}
          mapColor={isDarkMode ? '#1E293B' : '#E5E7EB'}
          strokeColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
          strokeWidth={1.5}
          hoverColor="#38BDF8"
          selectColor="#60A5FA"
          cityColors={stateColors}
          onSelect={(stateCode) => onSelectState(stateCode)}
          hints={true}
          hintTextColor="#FFFFFF"
          hintBackgroundColor="#151D30"
          hintPadding="8px 12px"
          hintBorderRadius={8}
        />
      </div>
    </div>
  );
}

export default IndiaMap;
