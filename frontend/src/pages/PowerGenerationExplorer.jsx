import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, Search, Download, Maximize2, MapPin, Building, 
  Activity, Layers, Filter, CheckCircle2, X, ChevronRight, BarChart3,
  ArrowLeft, Map as MapIcon, Image as ImageIcon, ZoomIn, ZoomOut,
  ChevronDown, Globe, Sparkles, Star
} from 'lucide-react';
import IndiaMap from '../components/IndiaMap';
import StateMap from '../components/StateMap';
import IndiaPowerPlantMap from '../components/IndiaPowerPlantMap';
import { stateData } from '../data/stateData';
import { getDistrictsForState } from '../data/districtData';
import allDistricts from '../data/allDistricts';
import { fillMissingDistricts } from '../utils/generateMissingDistrictData';
import getColorScale from '../utils/colorScale';
import { useTheme } from '../context/ThemeContext';

const SOURCE_ICONS = {
  'Coal': '/icons/energy/coal.png',
  'Oil & Gas': '/icons/energy/oil_and_gas.png',
  'Gas': '/icons/energy/oil_and_gas.png',
  'Diesel': '/icons/energy/oil_and_gas.png',
  'Nuclear': '/icons/energy/nuclear.png',
  'Hydro': '/icons/energy/hydro.png',
  'Wind': '/icons/energy/wind.png',
  'Solar': '/icons/energy/solar.png',
  'Bio Power': '/icons/energy/bio_power.png',
  'Small Hydro': '/icons/energy/small_hydro.png',
  'Small-Hydro': '/icons/energy/small_hydro.png',
  'Pumped Storage': '/icons/energy/hydro.png',
  'Waste to Energy': '/icons/energy/bio_power.png',
  'Other': '/icons/energy/solar.png'
};

const SOURCE_COLORS = {
  'Coal': '#475569',
  'Oil & Gas': '#B45309',
  'Gas': '#B45309',
  'Nuclear': '#EF4444',
  'Hydro': '#06B6D4',
  'Wind': '#0284C7',
  'Solar': '#F59E0B',
  'Bio Power': '#10B981',
  'Small Hydro': '#14B8A6',
  'Small-Hydro': '#14B8A6',
  'Pumped Storage': '#0284C7',
  'Waste to Energy': '#10B981',
  'Other': '#8B5CF6'
};

export default function PowerGenerationExplorer() {
  const { isDarkMode } = useTheme();
  
  // State
  const [summaryData, setSummaryData] = useState(null);
  const [selectedState, setSelectedState] = useState('All India');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPlantName, setSelectedPlantName] = useState(null);
  const [stateDetail, setStateDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Map View mode: 'plants' (interactive geospatial dots & stars map), 'choropleth' (state tiers), or 'scan' (official image scan)
  const [mapMode, setMapMode] = useState('plants');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [modalMapOpen, setModalMapOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const subBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  // 1. Fetch national summary on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/power-generation/summary')
      .then(res => res.json())
      .then(data => {
        setSummaryData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading power generation summary:", err);
        setLoading(false);
      });
  }, []);

  // 2. Fetch state details when state changes
  useEffect(() => {
    setSelectedDistrict(null);
    setSelectedPlantName(null);
    if (selectedState === 'All India') {
      setStateDetail(null);
      setCurrentPage(1);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/power-generation/state/${encodeURIComponent(selectedState)}`)
      .then(res => res.json())
      .then(data => {
        setStateDetail(data);
        setLoading(false);
        setCurrentPage(1);
      })
      .catch(err => {
        console.error(`Error loading power generation for ${selectedState}:`, err);
        setLoading(false);
      });
  }, [selectedState]);

  // Current active official power map scan image
  const currentMapFile = useMemo(() => {
    if (selectedState === 'All India') {
      return summaryData?.national_summary?.national_power_map || '/power_maps/India Power Map.jpg';
    }
    return stateDetail?.power_map_file || '/power_maps/India Power Map.jpg';
  }, [selectedState, summaryData, stateDetail]);

  // Source list for the current view
  const currentSources = useMemo(() => {
    if (selectedState === 'All India') {
      return summaryData?.national_summary?.source_breakdown || [];
    }
    return stateDetail?.sources || [];
  }, [selectedState, summaryData, stateDetail]);

  // Total capacity and plant count for current view
  const currentTotalCapacity = useMemo(() => {
    if (selectedState === 'All India') {
      return summaryData?.national_summary?.total_capacity_mw || 548856.99;
    }
    return stateDetail?.total_capacity_mw || 0;
  }, [selectedState, summaryData, stateDetail]);

  const currentTotalPlants = useMemo(() => {
    if (selectedState === 'All India') {
      return summaryData?.national_summary?.total_plants_count || 2399;
    }
    return stateDetail?.total_plants || 0;
  }, [selectedState, summaryData, stateDetail]);

  // Compute districts for selected state (for StateMap vector drilldown)
  const stateDistricts = useMemo(() => {
    if (selectedState === 'All India') return [];
    const obj = stateData.find(s => s.name.toLowerCase() === selectedState.toLowerCase());
    const avg = obj?.electricityConsumption || 1000;
    const fac = obj?.emissionFactor || 0.85;
    return fillMissingDistricts(
      selectedState, 
      getDistrictsForState(selectedState, avg), 
      allDistricts[selectedState] || [], 
      avg, 
      fac
    );
  }, [selectedState]);

  // Handle clicking a state on the All-India interactive map
  const handleSelectStateFromMap = (input) => {
    if (!input) return;
    const match = stateData.find(s => 
      s.id.toLowerCase() === String(input).toLowerCase() || 
      s.name.toLowerCase() === String(input).toLowerCase()
    );
    const stateName = match ? match.name : String(input);
    setSelectedState(stateName);
  };

  // Plant list data
  const [plantsList, setPlantsList] = useState([]);
  useEffect(() => {
    const url = new URL('http://localhost:8000/api/v1/power-generation/plants');
    if (selectedState !== 'All India') url.searchParams.set('state', selectedState);
    if (selectedSource !== 'All') url.searchParams.set('source', selectedSource);
    if (searchQuery) url.searchParams.set('search', searchQuery);
    url.searchParams.set('limit', '2500');

    fetch(url.toString())
      .then(res => res.json())
      .then(data => {
        setPlantsList(data.plants || []);
      })
      .catch(err => console.error("Error loading power plants:", err));
  }, [selectedState, selectedSource, searchQuery]);

  // Handle district selection safely (whether passed as object or string from StateMap)
  const handleSelectDistrict = (dist) => {
    if (!dist) {
      setSelectedDistrict(null);
      return;
    }
    const distName = typeof dist === 'object' ? (dist.name || '') : String(dist);
    setSelectedDistrict(prev => (prev === distName ? null : distName));
  };

  const selectedDistrictName = useMemo(() => {
    if (!selectedDistrict) return null;
    return typeof selectedDistrict === 'object' ? (selectedDistrict.name || '') : String(selectedDistrict);
  }, [selectedDistrict]);

  // Filter plants by selected district or clicked plant
  const displayPlants = useMemo(() => {
    let list = plantsList;
    if (selectedPlantName) {
      const pLower = selectedPlantName.toLowerCase().trim();
      const filtered = list.filter(p => p.plant_name.toLowerCase() === pLower || p.plant_name.toLowerCase().includes(pLower));
      if (filtered.length > 0) return filtered;
    }
    if (selectedDistrictName) {
      const dLower = selectedDistrictName.toLowerCase().trim();
      const filtered = list.filter(p => 
        p.plant_name.toLowerCase().includes(dLower) || 
        (p.district && p.district.toLowerCase().includes(dLower)) ||
        (p.state && p.state.toLowerCase().includes(dLower))
      );
      if (filtered.length > 0) return filtered;
    }
    return list;
  }, [plantsList, selectedDistrictName, selectedPlantName]);

  // Pagination for plants table
  const paginatedPlants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayPlants.slice(start, start + pageSize);
  }, [displayPlants, currentPage]);

  const totalPages = Math.ceil(displayPlants.length / pageSize) || 1;

  // Handle clicking a plant marker directly on the geospatial map
  const handleSelectPlantMarker = (plant) => {
    if (!plant) return;
    setSelectedPlantName(plant.plant_name);
    // Scroll table into view smoothly
    const tbl = document.getElementById('plant-registry-table');
    if (tbl) tbl.scrollIntoView({ behavior: 'smooth' });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!displayPlants.length) return;
    const headers = ['Plant Name', 'State', 'Source', 'Implementing Agency', 'Operational Units', 'Capacity (MW)'];
    const rows = displayPlants.map(p => [
      `"${p.plant_name.replace(/"/g, '""')}"`,
      `"${p.state || selectedState}"`,
      `"${p.source}"`,
      `"${p.agency.replace(/"/g, '""')}"`,
      `"${p.units}"`,
      p.capacity_mw
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Power_Plants_${selectedState.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      
      {/* ── TOP HEADER BAR ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 8,
        padding: '14px 20px',
        gap: 12
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: isDarkMode ? '#1E293B' : '#0A2540',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF9933'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                CENTRAL ELECTRICITY AUTHORITY (CEA) • GOVERNMENT OF INDIA
              </div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: titleColor }}>
                National Power Generation & Geospatial Plant Registry
              </h1>
            </div>
          </div>
          <p style={{ margin: '4px 0 0 42px', fontSize: 10, color: labelColor, fontWeight: 500 }}>
            {selectedState === 'All India' 
              ? 'Official CEA geospatial inventory of all 2,399 generating stations (Coal, Solar, Wind, Hydro, Bio Power, Nuclear) with 548,856 MW national capacity.' 
              : `Official CEA generation profile and generating station registry for ${selectedState}.`}
          </p>
        </div>

        {/* State Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {selectedState !== 'All India' && (
            <button
              onClick={() => setSelectedState('All India')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(59,130,246,0.15)',
                color: '#3B82F6',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <ArrowLeft size={14} /> Back to All India
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                background: isDarkMode ? '#1E293B' : '#F1F5F9',
                color: titleColor,
                border: `1px solid ${cardBorder}`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                minWidth: 200
              }}
            >
              <option value="All India">🇮🇳 All India (548,856 MW)</option>
              {summaryData?.states?.map(st => (
                <option key={st.state_name} value={st.state_name}>
                  {st.state_name} ({st.total_capacity_mw.toLocaleString()} MW)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setModalMapOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Maximize2 size={14} /> Official Scan
          </button>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        
        {/* Card 1: Total Operational Capacity */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>Operational Capacity</span>
            <Zap size={15} color="#F59E0B" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>
            {currentTotalCapacity.toLocaleString()} <span style={{ fontSize: 11, color: labelColor }}>MW</span>
          </div>
          <div style={{ fontSize: 9, color: labelColor, marginTop: 2, fontWeight: 600 }}>
            {selectedState === 'All India' ? 'Official National Installed Capacity' : `State total capacity for ${selectedState}`}
          </div>
        </div>

        {/* Card 2: Total Registered Plants */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>Registered Power Plants</span>
            <Building size={15} color="#10B981" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {currentTotalPlants.toLocaleString()} <span style={{ fontSize: 11, color: labelColor }}>Units</span>
          </div>
          <div style={{ fontSize: 9, color: labelColor, marginTop: 2, fontWeight: 600 }}>
            Individually cataloged generating stations
          </div>
        </div>

        {/* Card 3: Top Generation Source */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>Leading Energy Source</span>
            <Layers size={15} color="#06B6D4" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#06B6D4', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentSources[0]?.source && (
              <img 
                src={SOURCE_ICONS[currentSources[0].source] || '/icons/energy/solar.png'} 
                alt="" 
                style={{ width: 20, height: 20, objectFit: 'contain' }}
              />
            )}
            {currentSources[0]?.source || 'Solar'}
          </div>
          <div style={{ fontSize: 9, color: labelColor, marginTop: 2, fontWeight: 600 }}>
            {currentSources[0]?.capacity_mw?.toLocaleString()} MW ({currentSources[0]?.percentage || 0}%)
          </div>
        </div>

        {/* Card 4: Top Agency */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>Key Agency</span>
            <Activity size={15} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#8B5CF6', marginTop: 6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {summaryData?.national_summary?.top_agencies?.[0]?.agency || 'NTPC / State GENCO'}
          </div>
          <div style={{ fontSize: 9, color: labelColor, marginTop: 2, fontWeight: 600 }}>
            Largest operational asset operator
          </div>
        </div>

      </div>

      {/* ── MAIN MAP CARD: Interactive Geospatial Map with Dots & Stars ─────────── */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        
        {/* Map Header with View Modes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedState !== 'All India' && (
              <button
                onClick={() => setSelectedState('All India')}
                title="Back to All India Map"
                style={{
                  background: isDarkMode ? '#1E293B' : '#E2E8F0',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 8px',
                  color: titleColor,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <MapPin size={16} color="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {selectedState === 'All India' ? 'India Power Map • All Operational Generating Stations' : `${selectedState} • Power Stations Distribution`}
            </h3>
          </div>

          {/* Mode Switch Toggle: Dots & Stars Map vs Scan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: isDarkMode ? '#1E293B' : '#F1F5F9', padding: '3px 4px', borderRadius: 8 }}>
            <button
              onClick={() => setMapMode('plants')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                background: mapMode === 'plants' ? '#3B82F6' : 'transparent',
                color: mapMode === 'plants' ? '#FFFFFF' : labelColor,
                transition: 'all 0.15s'
              }}
            >
              <Sparkles size={12} /> Geospatial Dots & Stars Map
            </button>

            <button
              onClick={() => setMapMode('scan')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                background: mapMode === 'scan' ? '#3B82F6' : 'transparent',
                color: mapMode === 'scan' ? '#FFFFFF' : labelColor,
                transition: 'all 0.15s'
              }}
            >
              <ImageIcon size={12} /> Official Scan
            </button>
          </div>
        </div>

        {/* Map Display Container */}
        <div style={{
          height: 600,
          background: isDarkMode ? '#0a0e17' : '#F8FAFC',
          borderRadius: 10,
          overflow: 'hidden',
          border: `1px solid ${cardBorder}`,
          position: 'relative'
        }}>
          {mapMode === 'plants' ? (
            <IndiaPowerPlantMap
              selectedState={selectedState}
              onSelectState={handleSelectStateFromMap}
              onSelectPlant={handleSelectPlantMarker}
              isDarkMode={isDarkMode}
            />
          ) : (
            /* OFFICIAL SCAN VIEW */
            <div 
              onClick={() => setModalMapOpen(true)}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <img
                src={currentMapFile}
                alt={`${selectedState} Power Map`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: 'rgba(0,0,0,0.7)',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Maximize2 size={13} /> Click to Enlarge Official Scan
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── ENERGY SOURCE MIX & DISTRICTS BREAKDOWN ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) minmax(380px, 1fr)', gap: 16 }}>
        
        {/* Left: Energy Sources Breakdown */}
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} color="#10B981" />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {selectedState} • Energy Generation Mix
              </h3>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>
              {currentSources.length} Sources
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {currentSources.map(s => (
              <div
                key={s.source}
                onClick={() => setSelectedSource(selectedSource === s.source ? 'All' : s.source)}
                style={{
                  padding: '8px 12px',
                  background: selectedSource === s.source ? 'rgba(59,130,246,0.1)' : subBg,
                  border: `1px solid ${selectedSource === s.source ? '#3B82F6' : cardBorder}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img 
                      src={SOURCE_ICONS[s.source] || '/icons/energy/solar.png'} 
                      alt="" 
                      style={{ width: 18, height: 18, objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 800, color: titleColor }}>{s.source}</span>
                    <span style={{ fontSize: 10, color: labelColor }}>({s.plant_count} plants)</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: titleColor }}>
                    {s.capacity_mw.toLocaleString()} MW <span style={{ color: SOURCE_COLORS[s.source] || '#10B981', marginLeft: 4 }}>({s.percentage}%)</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, s.percentage)}%`,
                    height: '100%',
                    background: SOURCE_COLORS[s.source] || '#10B981',
                    borderRadius: 3
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Districts Breakdown / Active Filters Info */}
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={16} color="#3B82F6" />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {selectedState !== 'All India' ? `Districts in ${selectedState}` : 'Quick State Capacity Index'}
              </h3>
            </div>
            {(selectedDistrictName || selectedPlantName) && (
              <button
                onClick={() => { setSelectedDistrict(null); setSelectedPlantName(null); }}
                style={{ fontSize: 10, color: '#3B82F6', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800 }}
              >
                Clear Selection
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {selectedState !== 'All India' && stateDistricts.length > 0 ? (
              stateDistricts.map(d => {
                const isSel = selectedDistrictName === d.name;
                return (
                  <div
                    key={d.name}
                    onClick={() => handleSelectDistrict(d.name)}
                    style={{
                      padding: '8px 12px',
                      background: isSel ? 'rgba(56,189,248,0.15)' : subBg,
                      border: `1px solid ${isSel ? '#38BDF8' : cardBorder}`,
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: isSel ? '#38BDF8' : '#10B981' }}></span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: titleColor }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: labelColor, fontWeight: 600 }}>
                      {d.electricityConsumption?.toLocaleString()} kWh
                    </span>
                  </div>
                );
              })
            ) : (
              summaryData?.states?.slice(0, 15).map(st => (
                <div
                  key={st.state_name}
                  onClick={() => setSelectedState(st.state_name)}
                  style={{
                    padding: '7px 12px',
                    background: subBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: titleColor }}>{st.state_name}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B' }}>{st.total_capacity_mw.toLocaleString()} MW</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── POWER PLANT REGISTRY TABLE CARD ────────────────────────────── */}
      <div 
        id="plant-registry-table"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {/* Table Top Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={18} color="#3B82F6" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Power Plant Registry ({displayPlants.length} Units {selectedDistrictName ? `in ${selectedDistrictName}` : `in ${selectedState}`})
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color={labelColor} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search plant or agency..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  background: isDarkMode ? '#1E293B' : '#F1F5F9',
                  color: titleColor,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 6,
                  padding: '6px 12px 6px 30px',
                  fontSize: 11,
                  fontWeight: 600,
                  outline: 'none',
                  width: 180
                }}
              />
              {searchQuery && (
                <X 
                  size={12} 
                  color={labelColor} 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                />
              )}
            </div>

            {/* Source Filter Select */}
            <select
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setCurrentPage(1); }}
              style={{
                background: isDarkMode ? '#1E293B' : '#F1F5F9',
                color: titleColor,
                border: `1px solid ${cardBorder}`,
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">⚡ All Sources</option>
              <option value="Solar">☀️ Solar</option>
              <option value="Wind">💨 Wind</option>
              <option value="Coal">🛒 Coal</option>
              <option value="Hydro">🌊 Hydro</option>
              <option value="Small Hydro">🎡 Small Hydro</option>
              <option value="Bio Power">💡 Bio Power</option>
              <option value="Nuclear">🏭 Nuclear</option>
              <option value="Gas">🏗️ Oil & Gas</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(16,185,129,0.15)',
                color: '#10B981',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${cardBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11 }}>
            <thead>
              <tr style={{ background: isDarkMode ? '#1E293B' : '#F1F5F9', color: labelColor, borderBottom: `1px solid ${cardBorder}` }}>
                <th style={{ padding: '10px 14px', fontWeight: 800 }}>PLANT NAME</th>
                <th style={{ padding: '10px 14px', fontWeight: 800 }}>STATE</th>
                <th style={{ padding: '10px 14px', fontWeight: 800 }}>SOURCE</th>
                <th style={{ padding: '10px 14px', fontWeight: 800 }}>AGENCY / OPERATOR</th>
                <th style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'center' }}>UNITS</th>
                <th style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right' }}>CAPACITY (MW)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlants.length > 0 ? (
                paginatedPlants.map((plant, idx) => (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${cardBorder}`,
                      background: plant.plant_name === selectedPlantName ? 'rgba(56,189,248,0.15)' : (idx % 2 === 0 ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'))
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: titleColor }}>
                      {plant.plant_name}
                    </td>
                    <td style={{ padding: '10px 14px', color: labelColor, fontWeight: 600 }}>
                      <span 
                        onClick={() => setSelectedState(plant.state)}
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: '#38BDF8' }}
                      >
                        {plant.state || selectedState}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img 
                          src={SOURCE_ICONS[plant.source] || '/icons/energy/solar.png'} 
                          alt="" 
                          style={{ width: 16, height: 16, objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span style={{ fontWeight: 700, color: SOURCE_COLORS[plant.source] || titleColor }}>
                          {plant.source}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: titleColor, fontWeight: 600 }}>
                      {plant.agency}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: labelColor, fontWeight: 600 }}>
                      {plant.units}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#10B981' }}>
                      {plant.capacity_mw.toLocaleString()} MW
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: labelColor }}>
                    No power plants matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: labelColor, fontWeight: 600 }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, displayPlants.length)} of {displayPlants.length} plants
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  background: isDarkMode ? '#1E293B' : '#F1F5F9',
                  color: titleColor,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 11, fontWeight: 800, color: titleColor, padding: '0 6px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  background: isDarkMode ? '#1E293B' : '#F1F5F9',
                  color: titleColor,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── FULL SCREEN POWER MAP MODAL ─────────────────────────────────── */}
      {modalMapOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div style={{
            width: '90vw',
            maxWidth: 1200,
            height: '90vh',
            background: isDarkMode ? '#0F172A' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: `1px solid ${cardBorder}`,
              background: isDarkMode ? '#1E293B' : '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: titleColor }}>
                  {selectedState} - Geospatial Power Plant Distribution Map
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={currentMapFile}
                  download={`Power_Map_${selectedState.replace(/\s+/g, '_')}.jpg`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#10B981',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  <Download size={13} /> Download JPG
                </a>
                <button
                  onClick={() => setModalMapOpen(false)}
                  style={{
                    background: '#EF4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e17', padding: 20 }}>
              <img
                src={currentMapFile}
                alt={`${selectedState} Power Map`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
