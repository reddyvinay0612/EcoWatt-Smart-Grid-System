import React, { useState, useEffect, useMemo, memo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ZoomIn, ZoomOut, RotateCcw, Zap, ArrowLeft, Layers, Sparkles } from 'lucide-react';
import allPlantsData from '../data/powerPlantsGeo.json';

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
  "Dadra and Nagar Haveli and Daman and Diu": "dadra-and-nagar-haveli",
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

const SOURCE_CONFIG = {
  'Coal': { color: '#1E293B', shape: 'circle', label: 'Coal', border: '#475569' },
  'Oil & Gas': { color: '#64748B', shape: 'circle', label: 'Oil & Gas', border: '#94A3B8' },
  'Nuclear': { color: '#EF4444', shape: 'circle', label: 'Nuclear', border: '#FCA5A5' },
  'Hydro': { color: '#06B6D4', shape: 'circle', label: 'Hydro', border: '#67E8F9' },
  'Wind': { color: '#0284C7', shape: 'star', label: 'Wind', border: '#38BDF8' },
  'Solar': { color: '#F59E0B', shape: 'star', label: 'Solar', border: '#FDE68A' },
  'Bio Power': { color: '#10B981', shape: 'circle', label: 'Bio Power', border: '#6EE7B7' },
  'Small-Hydro': { color: '#14B8A6', shape: 'circle', label: 'Small-Hydro', border: '#5EEAD4' },
  'Pumped Storage': { color: '#84CC16', shape: 'circle', label: 'Pumped Storage', border: '#BEF264' }
};

// 5-Point SVG Star Path centered at (0,0)
const StarPath = ({ fill, stroke, size = 1.0 }) => (
  <path
    d={`M 0 ${-5 * size} L ${1.5 * size} ${-1.5 * size} L ${5.2 * size} ${-1.5 * size} L ${2.2 * size} ${1.2 * size} L ${3.3 * size} ${5 * size} L 0 ${2.6 * size} L ${-3.3 * size} ${5 * size} L ${-2.2 * size} ${1.2 * size} L ${-5.2 * size} ${-1.5 * size} L ${-1.5 * size} ${-1.5 * size} Z`}
    fill={fill}
    stroke={stroke || '#FFFFFF'}
    strokeWidth={0.6}
  />
);

export default function IndiaPowerPlantMap({
  selectedState = 'All India',
  onSelectState,
  onSelectPlant,
  isDarkMode = true
}) {
  // Source Filter Checkboxes
  const [activeSources, setActiveSources] = useState({
    'Coal': true,
    'Oil & Gas': true,
    'Nuclear': true,
    'Hydro': true,
    'Wind': true,
    'Solar': true,
    'Bio Power': true,
    'Small-Hydro': true,
    'Pumped Storage': true
  });

  const [categoryStatus, setCategoryStatus] = useState('Operational');
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [mapConfig, setMapConfig] = useState({ center: [80.5, 22.0], scale: 980 });
  const [hoveredPlant, setHoveredPlant] = useState(null);
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });

  const isNationalView = selectedState === 'All India';

  // Fetch GeoJSON and calculate optimal center / scale when selectedState changes
  useEffect(() => {
    setHoveredPlant(null);
    
    if (isNationalView) {
      fetch('/states/geojson/india_all.geojson')
        .then(res => res.json())
        .then(data => {
          setGeoJsonData(data);
          setMapConfig({ center: [82.0, 22.5], scale: 980 });
        })
        .catch(err => console.error("Error loading national GeoJSON:", err));
      return;
    }

    // Single State View: load dedicated state GeoJSON
    const filename = stateGeoJSONFiles[selectedState];
    if (!filename) {
      setMapConfig({ center: [82.0, 22.5], scale: 980 });
      return;
    }

    fetch(`/states/geojson/${filename}.geojson`)
      .then(res => res.json())
      .then(data => {
        setGeoJsonData(data);
        
        // Calculate exact bounding box to auto-fit this state into the viewport
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        let hasCoords = false;

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

        if (data.features) {
          data.features.forEach(f => {
            if (f.geometry?.coordinates) processCoords(f.geometry.coordinates);
          });
        }

        if (hasCoords) {
          const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
          const lngDiff = maxLng - minLng;
          const latDiff = maxLat - minLat;
          const maxDiff = Math.max(lngDiff, latDiff) || 1;
          const scale = Math.min(22000, Math.max(1800, 4800 / maxDiff));
          setMapConfig({ center, scale });
        }
      })
      .catch(err => console.error(`Error loading GeoJSON for ${selectedState}:`, err));
  }, [selectedState, isNationalView]);

  // Filtered Plants based on state and active sources
  const filteredPlants = useMemo(() => {
    return allPlantsData.filter(p => {
      // State match
      if (!isNationalView && p.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      // Source match
      const srcCat = p.source_category || p.source;
      if (activeSources[srcCat] === false) {
        return false;
      }
      return true;
    });
  }, [selectedState, isNationalView, activeSources]);

  // Total visible capacity (MW)
  const totalVisibleMW = useMemo(() => {
    return filteredPlants.reduce((acc, p) => acc + (p.capacity_mw || 0), 0);
  }, [filteredPlants]);

  const allSelected = Object.values(activeSources).every(v => v === true);

  const toggleSelectAll = () => {
    const nextVal = !allSelected;
    const updated = {};
    Object.keys(activeSources).forEach(k => { updated[k] = nextVal; });
    setActiveSources(updated);
  };

  const toggleSource = (src) => {
    setActiveSources(prev => ({ ...prev, [src]: !prev[src] }));
  };

  const handleZoomIn = () => {
    setMapConfig(c => ({ ...c, scale: c.scale * 1.3 }));
  };

  const handleZoomOut = () => {
    setMapConfig(c => ({ ...c, scale: Math.max(500, c.scale / 1.3) }));
  };

  const handleResetZoom = () => {
    if (isNationalView) {
      setMapConfig({ center: [82.0, 22.5], scale: 980 });
    } else {
      // Re-trigger auto-fit
      setSelectedState(prev => prev);
    }
  };

  const cardBg = isDarkMode ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const panelBg = isDarkMode ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)';
  const mapFill = isDarkMode ? '#131D2E' : '#F8FAFC';
  const mapStroke = isDarkMode ? '#334155' : '#CBD5E1';

  return (
    <div 
      onMouseMove={(e) => {
        // Track mouse coordinates for tooltip smoothly without forcing state rerenders on the SVG
        setMouseCoord({ x: e.clientX, y: e.clientY });
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 520,
        background: cardBg,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}
    >
      
      {/* ── TOP BANNER: Title, Status Switcher & Total Capacity ──────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        borderBottom: `1px solid ${cardBorder}`,
        background: isDarkMode ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
        zIndex: 10
      }}>
        {/* Left: Title & Status tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!isNationalView && (
            <button
              onClick={() => onSelectState && onSelectState('All India')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(59,130,246,0.15)',
                color: '#3B82F6',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={13} /> Back to India Map
            </button>
          )}

          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: titleColor, letterSpacing: '-0.01em' }}>
              {isNationalView ? 'India Power Map - Operational Generating Stations' : `${selectedState} - Power Map (Operational)`}
            </div>
            <div style={{ fontSize: 9, color: labelColor, fontWeight: 600 }}>
              Official Geospatial Power Plant Distribution • As on June 2026
            </div>
          </div>

          {/* Status Buttons */}
          <div style={{ display: 'flex', background: isDarkMode ? '#1E293B' : '#E2E8F0', padding: 2, borderRadius: 6, marginLeft: 6 }}>
            {['Operational', 'Pipeline', 'Retired'].map(status => (
              <button
                key={status}
                onClick={() => setCategoryStatus(status)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: categoryStatus === status ? '#3B82F6' : 'transparent',
                  color: categoryStatus === status ? '#FFFFFF' : labelColor,
                  transition: 'all 0.15s'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Capacity Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: isDarkMode ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8,
            padding: '5px 12px'
          }}>
            <Zap size={14} color="#F59E0B" />
            <div>
              <span style={{ fontSize: 8, fontWeight: 800, color: labelColor, textTransform: 'uppercase', display: 'block' }}>
                Capacity ({filteredPlants.length} Plants)
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#F59E0B' }}>
                {totalVisibleMW.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span style={{ fontSize: 9, color: labelColor }}>MW</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAP CONTAINER ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Floating Source Filter Checkbox Card (Left side, exactly matching image 2) */}
        <div style={{
          position: 'absolute',
          left: 14,
          top: 14,
          zIndex: 20,
          background: panelBg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${cardBorder}`,
          borderRadius: 10,
          padding: '10px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          maxWidth: 165,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {/* Select All Toggle */}
          <div 
            onClick={toggleSelectAll}
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', paddingBottom: 5, borderBottom: `1px solid ${cardBorder}` }}
          >
            <input 
              type="checkbox" 
              checked={allSelected} 
              onChange={() => {}} 
              style={{ cursor: 'pointer', accentColor: '#3B82F6' }} 
            />
            <span style={{ fontSize: 10, fontWeight: 900, color: titleColor }}>Select All</span>
          </div>

          {/* Individual Source Checkboxes with Dots & Stars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(SOURCE_CONFIG).map(([src, conf]) => {
              const isChecked = activeSources[src] !== false;
              return (
                <div
                  key={src}
                  onClick={() => toggleSource(src)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '2px 0',
                    opacity: isChecked ? 1 : 0.4,
                    transition: 'opacity 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', accentColor: '#3B82F6' }}
                    />
                    <span style={{ fontSize: 10, fontWeight: 700, color: titleColor }}>
                      {conf.label}
                    </span>
                  </div>

                  {/* Symbol Icon */}
                  {conf.shape === 'star' ? (
                    <svg width="12" height="12" viewBox="-6 -6 12 12" style={{ marginLeft: 4 }}>
                      <StarPath fill={conf.color} stroke={conf.border} size={0.9} />
                    </svg>
                  ) : (
                    <span style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: conf.color,
                      border: `1.5px solid ${conf.border || '#FFFFFF'}`,
                      display: 'inline-block',
                      marginLeft: 4
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Zoom Controls (Bottom Right) */}
        <div style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: panelBg,
          backdropFilter: 'blur(8px)',
          border: `1px solid ${cardBorder}`,
          borderRadius: 8,
          padding: 4
        }}>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              color: titleColor,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              color: titleColor,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Map View"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              color: titleColor,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* ── VECTOR MAP CANVAS WITH PLANT MARKERS ─────────────────────── */}
        {geoJsonData && (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: mapConfig.scale,
              center: mapConfig.center
            }}
            width={820}
            height={650}
            style={{ width: '100%', height: '100%' }}
          >
            {/* 1. Base District & State Polygons */}
            <Geographies geography={geoJsonData}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const geoStateName = geo.properties?.NAME_1 || geo.properties?.name || '';
                  const isGeoSelected = !isNationalView || (selectedState !== 'All India' && geoStateName.toLowerCase() === selectedState.toLowerCase());
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (isNationalView && geoStateName && onSelectState) {
                          onSelectState(geoStateName);
                        }
                      }}
                      style={{
                        default: {
                          fill: isGeoSelected ? (isDarkMode ? '#141E33' : '#F1F5F9') : mapFill,
                          stroke: isDarkMode ? 'rgba(56,189,248,0.35)' : '#94A3B8',
                          strokeWidth: isNationalView ? 0.45 : 0.75,
                          outline: 'none',
                          cursor: isNationalView ? 'pointer' : 'default'
                        },
                        hover: {
                          fill: isDarkMode ? '#1E2D48' : '#E2E8F0',
                          stroke: '#38BDF8',
                          strokeWidth: 0.9,
                          outline: 'none',
                          cursor: isNationalView ? 'pointer' : 'default'
                        },
                        pressed: {
                          fill: '#2563EB',
                          outline: 'none'
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* 2. Power Plant Dots & Stars */}
            {filteredPlants.map((plant, idx) => {
              const srcCat = plant.source_category || plant.source || 'Solar';
              const conf = SOURCE_CONFIG[srcCat] || SOURCE_CONFIG['Solar'];
              const isStar = conf.shape === 'star';
              
              // Scale size slightly by capacity MW and view mode
              const cap = plant.capacity_mw || 10;
              const baseScale = isNationalView ? 0.85 : 1.1;
              const scaleMod = baseScale * (cap > 1000 ? 1.2 : (cap > 250 ? 1.0 : 0.85));

              return (
                <Marker
                  key={`${plant.plant_name}-${idx}`}
                  coordinates={[plant.lng, plant.lat]}
                  onMouseEnter={() => setHoveredPlant(plant)}
                  onMouseLeave={() => setHoveredPlant(null)}
                  onClick={() => {
                    if (onSelectPlant) onSelectPlant(plant);
                  }}
                  style={{
                    default: { cursor: 'pointer' },
                    hover: { cursor: 'pointer' }
                  }}
                >
                  {isStar ? (
                    <StarPath fill={conf.color} stroke={conf.border} size={scaleMod} />
                  ) : (
                    <circle
                      r={3.0 * scaleMod}
                      fill={conf.color}
                      stroke={conf.border || '#FFFFFF'}
                      strokeWidth={0.7}
                    />
                  )}
                </Marker>
              );
            })}
          </ComposableMap>
        )}

        {/* ── SMOOTH NON-FLICKERING HOVER TOOLTIP ───────────────────────── */}
        {hoveredPlant && (
          <div
            style={{
              position: 'fixed',
              left: mouseCoord.x + 12,
              top: mouseCoord.y - 50,
              zIndex: 9999,
              background: isDarkMode ? '#0F172A' : '#FFFFFF',
              border: `1px solid ${SOURCE_CONFIG[hoveredPlant.source_category || hoveredPlant.source]?.color || '#3B82F6'}`,
              borderRadius: 8,
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              minWidth: 190,
              maxWidth: 260
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: SOURCE_CONFIG[hoveredPlant.source_category || hoveredPlant.source]?.color || '#3B82F6'
              }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, lineHeight: 1.2 }}>
                {hoveredPlant.plant_name}
              </span>
            </div>

            <div style={{ fontSize: 10, color: labelColor, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Capacity:</span>
                <b style={{ color: '#10B981' }}>{hoveredPlant.capacity_mw?.toLocaleString()} MW</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Source:</span>
                <b style={{ color: SOURCE_CONFIG[hoveredPlant.source_category || hoveredPlant.source]?.color || titleColor }}>
                  {hoveredPlant.source}
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Operator:</span>
                <b style={{ color: titleColor }}>{hoveredPlant.agency}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Location:</span>
                <b style={{ color: '#38BDF8' }}>{hoveredPlant.district ? `${hoveredPlant.district}, ` : ''}{hoveredPlant.state}</b>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
