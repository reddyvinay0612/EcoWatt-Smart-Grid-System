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
  const stateColors = {};
  stateData.forEach(s => {
    const value = activeMetric === 'carbon' ? s.carbonEmission : s.electricityConsumption;
    const { color, tier } = getColorScale(value, null, activeMetric);
    
    const isFiltered = tierFilter !== 'All' && tier !== tierFilter;
    if (isFiltered) {
      stateColors[s.name] = isDarkMode ? '#1E293B' : '#F3F4F6';
    } else {
      stateColors[s.name] = selectedState === s.name ? '#60A5FA' : color;
    }
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px 0' }}>
      <div style={{ width: '100%', maxWidth: 360, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <India
          type="select-single"
          size={320}
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
