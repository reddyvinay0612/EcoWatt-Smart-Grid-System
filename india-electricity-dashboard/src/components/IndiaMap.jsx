import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getColorScale } from '../utils/colorScale';

// Reliable public CDN source for India States GeoJSON
const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/harsh-chhabra/India-States-Districts-GeoJSON/master/India_States.geojson';

function IndiaMap({ stateData, selectedState, onSelectState, tierFilter, isDarkMode }) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[450px]" onMouseMove={handleMouseMove}>
      <div className="w-full max-w-[440px] aspect-square flex items-center justify-center my-4">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 800,
            center: [82.0, 22.0] // Center coordinates for India Map
          }}
          className="w-full h-full select-none"
        >
          <Geographies geography={INDIA_GEOJSON_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Read state name from properties (supporting multiple variations ST_NM, NAME_1, state_name)
                const geoName = geo.properties.ST_NM || geo.properties.NAME_1 || geo.properties.state_name || '';
                
                // Map the GeoJSON name to our dataset name
                const matched = stateData.find(s => 
                  s.name.toLowerCase().replace(/\s+/g, '') === geoName.toLowerCase().replace(/\s+/g, '') ||
                  (geoName.toLowerCase().includes('jammu') && s.name.toLowerCase().includes('jammu')) ||
                  (geoName.toLowerCase().includes('orissa') && s.name.toLowerCase().includes('odisha'))
                );

                const value = matched ? matched.value : 0;
                const { color, tier } = getColorScale(value);

                // Apply filter visibility
                const isFiltered = tierFilter !== 'All' && tier !== tierFilter;
                const fill = isFiltered 
                  ? (isDarkMode ? '#111827' : '#F3F4F6') 
                  : (selectedState === matched?.name ? '#60A5FA' : color);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      if (matched) {
                        setTooltipContent(`${matched.name}: ${matched.value.toLocaleString()} kWh`);
                      } else {
                        setTooltipContent(geoName);
                      }
                    }}
                    onMouseLeave={() => setTooltipContent('')}
                    onClick={() => {
                      if (matched) {
                        onSelectState(matched.name);
                      }
                    }}
                    style={{
                      default: {
                        fill: fill,
                        outline: 'none',
                        stroke: isDarkMode ? '#0B0F19' : '#FFFFFF',
                        strokeWidth: 1.0,
                        transition: 'all 0.2s'
                      },
                      hover: {
                        fill: '#38BDF8',
                        outline: 'none',
                        stroke: isDarkMode ? '#0B0F19' : '#FFFFFF',
                        strokeWidth: 1.5,
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: '#60A5FA',
                        outline: 'none',
                        stroke: isDarkMode ? '#0B0F19' : '#FFFFFF',
                        strokeWidth: 1.5
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Floating Map Tooltip */}
      {tooltipContent && (
        <div 
          style={{
            position: 'fixed',
            backgroundColor: '#151D30',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 1000,
            top: tooltipPos.y + 20,
            left: tooltipPos.x + 20,
            fontSize: '11px',
            fontWeight: '750',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

export default IndiaMap;
