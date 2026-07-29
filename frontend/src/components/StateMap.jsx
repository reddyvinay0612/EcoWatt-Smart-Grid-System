import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import stateMapFiles from '../data/stateMapFiles';
import districtCentroids from '../data/districtCentroids';
import getColorScale from '../utils/colorScale';
import { ShieldAlert, Loader } from 'lucide-react';

const stateGeoJSONFiles = {
  "Andaman and Nicobar Islands": "andaman-and-nicobar",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  "Assam": "assam",
  "Bihar": "bihar",
  "Chandigarh": "chandigarh",
  "Chhattisgarh": "chhattisgarh",
  "Dadra and Nagar Haveli": "dadra-and-nagar-haveli",
  "Daman and Diu": "daman-and-diu",
  "Delhi": "delhi",
  "Goa": "goa",
  "Gujarat": "gujarat",
  "Haryana": "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu and Kashmir": "jammu-and-kashmir",
  "Jharkhand": "jharkhand",
  "Karnataka": "karnataka",
  "Kerala": "kerala",
  "Ladakh": "ladakh",
  "Lakshadweep": "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  "Maharashtra": "maharashtra",
  "Manipur": "manipur",
  "Meghalaya": "meghalaya",
  "Mizoram": "mizoram",
  "Nagaland": "nagaland",
  "Odisha": "odisha",
  "Puducherry": "puducherry",
  "Punjab": "punjab",
  "Rajasthan": "rajasthan",
  "Sikkim": "sikkim",
  "Tamil Nadu": "tamil-nadu",
  "Telangana": "telangana",
  "Tripura": "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  "Uttarakhand": "uttarakhand",
  "West Bengal": "west-bengal"
};

function StateMap({ 
  selectedState, 
  districts, 
  selectedDistrict, 
  onSelectDistrict, 
  tierFilter, 
  isDarkMode, 
  stateAverage, 
  activeMetric = 'electricity'
}) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [mapConfig, setMapConfig] = useState({ center: [78.9629, 20.5937], scale: 1000 });
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [hoveredPin, setHoveredPin] = useState(null);

  // Reset loading states and fetch GeoJSON
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
    setGeoJsonData(null);

    const filename = stateGeoJSONFiles[selectedState];
    if (!filename) {
      setImgError(true);
      setImgLoading(false);
      return;
    }

    const path = `/states/geojson/${filename}.geojson`;

    fetch(path)
      .then(res => {
        if (!res.ok) throw new Error("Local map file not found");
        return res.json();
      })
      .then(data => {
        setGeoJsonData(data);
        
        // Calculate bounding box bounds to auto-fit state maps
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        let hasCoords = false;

        data.features.forEach(feature => {
          if (!feature.geometry) return;
          const coords = feature.geometry.coordinates;
          
          const processCoords = (pts) => {
            pts.forEach(pt => {
              if (Array.isArray(pt[0])) {
                processCoords(pt);
              } else {
                const [lng, lat] = pt;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                hasCoords = true;
              }
            });
          };
          processCoords(coords);
        });
        
        if (hasCoords) {
          const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
          const lngDiff = maxLng - minLng;
          const latDiff = maxLat - minLat;
          const maxDiff = Math.max(lngDiff, latDiff);
          // Calibrate scale based on bounding box to fill the 500x500 viewport
          const scale = Math.min(60000, 20000 / (maxDiff || 1));
          setMapConfig({ center, scale });
        }
        setImgLoading(false);
      })
      .catch(err => {
        console.warn(`GeoJSON failed for ${selectedState}, falling back to JPEG:`, err);
        setImgError(true);
        setImgLoading(false);
      });
  }, [selectedState]);

  // Robust fuzzy matching helper for district names
  const findDistrictMatch = (geoName) => {
    if (!geoName) return null;
    const cleanGeo = geoName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Try exact match
    let match = districts.find(d => d.name.toLowerCase() === geoName.toLowerCase());
    if (match) return match;
    
    // Try stripped match
    match = districts.find(d => d.name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanGeo);
    if (match) return match;
    
    // Try partial match
    match = districts.find(d => {
      const cleanD = d.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanD.includes(cleanGeo) || cleanGeo.includes(cleanD);
    });
    return match;
  };

  const handleMouseEnter = (e, district, value, tier) => {
    const rect = e.target.getBoundingClientRect();
    const parentContainer = e.target.ownerDocument.getElementById("state-map-container");
    const parentRect = parentContainer?.getBoundingClientRect();
    
    if (rect && parentRect) {
      setHoveredPin({
        name: district.name,
        value,
        tier,
        top: rect.top - parentRect.top - 65, // Positioned directly above
        left: rect.left - parentRect.left + (rect.width / 2)
      });
    }
  };

  // Rendering for when GeoJSON files are missing
  const renderFallbackMap = () => {
    const mapPath = stateMapFiles[selectedState];
    if (!mapPath) {
      return (
        <div className={`flex flex-col items-center justify-center p-12 rounded-2xl border text-center min-h-[350px] ${
          isDarkMode ? 'border-darkBorder/40 bg-slate-900/10' : 'border-slate-205 bg-white'
        }`}>
          <ShieldAlert className="h-10 w-10 text-amber-500 mb-4 animate-pulse" />
          <h4 className="font-bold text-sm text-slate-300 dark:text-slate-205">
            District map not available for this state yet
          </h4>
          <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">
            No geographic reference file found for {selectedState}.
          </p>
        </div>
      );
    }

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

    const targetDistrictName = selectedDistrict
      ? (typeof selectedDistrict === 'object' ? selectedDistrict.name : selectedDistrict)
      : null;

    return (
      <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
        <img
          src={mapPath}
          alt={`${selectedState} Map`}
          className="w-full h-full object-contain rounded-xl shadow-lg border border-slate-700/20"
        />
        {districts.map((d, index) => {
          const value = activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption;
          const { color, tier } = getColorScale(value, stateAverage, activeMetric);
          const pos = getPinPosition(index);
          const isSelected = targetDistrictName && targetDistrictName.toLowerCase() === d.name.toLowerCase();
          const isFiltered = tierFilter !== 'All' && tier !== tierFilter;

          if (isFiltered || index >= 10) return null;

          return (
            <div
              key={d.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              style={{ top: pos.top, left: pos.left }}
              onClick={() => onSelectDistrict(d)}
            >
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color }}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border ${isSelected ? 'scale-125 border-white ring-4 ring-blue-500/30' : 'border-black/30'}`} style={{ backgroundColor: color }}></span>
            </div>
          );
        })}
      </div>
    );
  };

  const targetDistrictName = selectedDistrict
    ? (typeof selectedDistrict === 'object' ? selectedDistrict.name : selectedDistrict)
    : null;

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 items-stretch min-h-[450px]">
      
      {/* Left side: Vector Map Display */}
      <div 
        id="state-map-container"
        className={`relative flex-1 flex items-center justify-center border rounded-2xl overflow-hidden p-4 min-h-[420px] ${
          isDarkMode ? 'border-darkBorder/40 bg-[#0B0F19]' : 'border-slate-200 bg-slate-100'
        }`}
      >
        {imgLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F19]/60 backdrop-blur-sm z-10">
            <Loader className="h-8 w-8 text-accentBlue animate-spin mb-2" />
            <span className="text-slate-400 text-xs font-semibold">Loading state boundaries...</span>
          </div>
        )}

        {/* Hover Tooltip display */}
        {hoveredPin && (
          <div 
            className="absolute bg-slate-900/95 border border-slate-700/60 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-2xl z-50 pointer-events-none transform -translate-x-1/2 flex flex-col space-y-0.5"
            style={{ top: hoveredPin.top, left: hoveredPin.left }}
          >
            <span className="font-extrabold text-slate-100">{hoveredPin.name}</span>
            <span className="text-[9px] text-slate-400 font-semibold">{selectedState}</span>
            <span className="text-[10px] text-blue-400 font-black mt-0.5">
              {hoveredPin.value.toLocaleString()} {activeMetric === 'carbon' ? 'kg CO2' : 'kWh'}/capita
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {hoveredPin.tier} Tier
            </span>
          </div>
        )}

        {!imgLoading && (
          geoJsonData ? (
            <div className="w-full h-full max-w-[500px] aspect-square flex items-center justify-center">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: mapConfig.scale,
                  center: mapConfig.center
                }}
                width={500}
                height={500}
                className="w-full h-full"
              >
                <Geographies geography={geoJsonData}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const districtName = geo.properties.district || geo.properties.DISTRICT || geo.properties.NAME_2 || geo.properties.district_name;
                      const matchedDistrict = findDistrictMatch(districtName);
                      
                      const isGeoSelected = targetDistrictName && matchedDistrict && targetDistrictName.toLowerCase() === matchedDistrict.name.toLowerCase();
                      
                      const value = matchedDistrict ? (activeMetric === 'carbon' ? matchedDistrict.carbonEmission : matchedDistrict.electricityConsumption) : null;
                      const { color, tier } = matchedDistrict ? getColorScale(value, stateAverage, activeMetric) : { color: isDarkMode ? '#1E293B' : '#CBD5E1', tier: 'Unknown' };

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => matchedDistrict && onSelectDistrict(matchedDistrict)}
                          style={{
                            default: {
                              fill: isGeoSelected ? `${color}35` : (isDarkMode ? '#0A0E17' : '#F8FAFC'),
                              stroke: isGeoSelected ? '#3B82F6' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                              strokeWidth: isGeoSelected ? 2.5 : 0.75,
                              outline: 'none',
                              transition: 'fill 0.2s ease, stroke 0.2s'
                            },
                            hover: {
                              fill: matchedDistrict ? `${color}20` : (isDarkMode ? '#1E293B' : '#F1F5F9'),
                              stroke: '#3B82F6',
                              strokeWidth: 1.5,
                              outline: 'none',
                              cursor: 'pointer'
                            },
                            pressed: {
                              fill: isDarkMode ? '#0F172A' : '#E2E8F0',
                              stroke: '#3B82F6',
                              strokeWidth: 2,
                              outline: 'none'
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* Plot centroid markers strictly inside boundaries */}
                {Object.entries(districtCentroids[selectedState] || {}).map(([districtName, coords]) => {
                  const matchedDistrict = findDistrictMatch(districtName);
                  if (!matchedDistrict) return null;

                  const value = activeMetric === 'carbon' ? matchedDistrict.carbonEmission : matchedDistrict.electricityConsumption;
                  const { color, tier } = getColorScale(value, stateAverage, activeMetric);
                  const isSelected = targetDistrictName && targetDistrictName.toLowerCase() === matchedDistrict.name.toLowerCase();
                  
                  const isFiltered = tierFilter !== 'All' && tier !== tierFilter;
                  if (isFiltered) return null;

                  return (
                    <Marker key={districtName} coordinates={[coords.lng, coords.lat]}>
                      <circle
                        r={isSelected ? 6.5 : 4.5}
                        fill={isSelected ? '#3B82F6' : color}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                        className="cursor-pointer transition-all duration-200 hover:scale-125 focus:outline-none"
                        onClick={() => onSelectDistrict(matchedDistrict)}
                        onMouseEnter={(e) => handleMouseEnter(e, matchedDistrict, value, tier)}
                        onMouseLeave={() => setHoveredPin(null)}
                      />
                    </Marker>
                  );
                })}
              </ComposableMap>
            </div>
          ) : (
            renderFallbackMap()
          )
        )}
      </div>

      {/* Right side: Clickable District Badges List */}
      <div className="w-full md:w-64 flex flex-col justify-start space-y-2 max-h-[420px] overflow-y-auto pr-1">
        <div className="mb-2">
          <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Select District
          </h5>
          <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
            Showing all {districts.length} districts of {selectedState}
          </span>
        </div>
        {districts.map((d) => {
          const value = activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption;
          const { color, tier } = getColorScale(value, stateAverage, activeMetric);
          const isSelected = targetDistrictName && targetDistrictName.toLowerCase() === d.name.toLowerCase();
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
                  : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="w-full flex items-center justify-between font-bold mb-1 text-xs">
                <span>{d.name}{d.isEstimated ? ' *' : ''}</span>
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
