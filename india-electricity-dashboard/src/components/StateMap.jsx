import React, { useState } from 'react';
import { getColorScale } from '../utils/colorScale';

function StateMap({ selectedState, districts, selectedDistrict, onSelectDistrict, tierFilter, isDarkMode, stateAverage }) {
  const [hoveredName, setHoveredName] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center min-h-[450px]"
      onMouseMove={handleMouseMove}
    >
      <div className="w-full max-w-[420px] aspect-square flex items-center justify-center my-4 map">
        <svg version="1.1" viewBox="0 0 400 400" className="w-full h-full select-none">
          {districts.map((d, index) => {
            // Calculate relative tier color based on state average
            const { color, tier } = getColorScale(d.value, stateAverage);

            const isFiltered = tierFilter !== 'All' && tier !== tierFilter;
            const baseFill = isFiltered 
              ? (isDarkMode ? '#111827' : '#F3F4F6')
              : (selectedDistrict?.name === d.name ? '#60A5FA' : color);

            return (
              <path
                key={index}
                d={d.path}
                onClick={() => onSelectDistrict(d)}
                onMouseEnter={() => setHoveredName(d.name)}
                onMouseLeave={() => setHoveredName(null)}
                style={{
                  fill: baseFill,
                  stroke: isDarkMode ? '#0B0F19' : '#FFFFFF',
                  strokeWidth: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Floating tooltip for districts */}
      {hoveredName && (
        <div 
          style={{
            position: 'fixed',
            backgroundColor: '#151D30',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 1000,
            top: mousePos.y + 20,
            left: mousePos.x + 20,
            fontSize: '11px',
            fontWeight: '750',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          }}
        >
          {hoveredName} ({districts.find(d => d.name === hoveredName)?.value} kWh)
        </div>
      )}
    </div>
  );
}

export default StateMap;
