import React, { useState, useMemo, useEffect } from 'react';
import India from '@react-map/india';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  Search, 
  ArrowUpDown, 
  BarChart2, 
  TrendingUp, 
  Download, 
  Sun, 
  Moon, 
  Map, 
  Globe,
  Users,
  IndianRupee,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const stateDataset = {
  'Andaman and Nicobar Islands': { value: 900, tier: 'Low', pop: '400k', gdp: 220000 },
  'Andhra Pradesh': { value: 2299.25, tier: 'High', pop: '53M', gdp: 220000 },
  'Arunachal Pradesh': { value: 2562.09, tier: 'High', pop: '1.6M', gdp: 210000 },
  'Assam': { value: 1069.96, tier: 'Medium', pop: '36M', gdp: 100000 },
  'Bihar': { value: 835.03, tier: 'Low', pop: '127M', gdp: 54000 },
  'Chandigarh': { value: 2000, tier: 'Medium', pop: '1.2M', gdp: 350000 },
  'Chhattisgarh': { value: 3105.21, tier: 'High', pop: '30M', gdp: 140000 },
  'Dadra and Nagar Haveli': { value: 15642.35, tier: 'High', pop: '400k', gdp: 350000 },
  'Daman and Diu': { value: 15642.35, tier: 'High', pop: '250k', gdp: 350000 },
  'Delhi': { value: 3636.70, tier: 'High', pop: '20M', gdp: 440000 },
  'Goa': { value: 5485.87, tier: 'High', pop: '1.6M', gdp: 580000 },
  'Gujarat': { value: 4646.19, tier: 'High', pop: '64M', gdp: 280000 },
  'Haryana': { value: 4875.30, tier: 'High', pop: '28M', gdp: 290000 },
  'Himachal Pradesh': { value: 3214.53, tier: 'High', pop: '7.4M', gdp: 220000 },
  'Jammu and Kashmir': { value: 2452.77, tier: 'High', pop: '14M', gdp: 120000 },
  'Jharkhand': { value: 1760.78, tier: 'Medium', pop: '39M', gdp: 90000 },
  'Karnataka': { value: 3357.58, tier: 'High', pop: '67M', gdp: 300000 },
  'Kerala': { value: 2486.49, tier: 'High', pop: '35M', gdp: 250000 },
  'Ladakh': { value: 2000, tier: 'Medium', pop: '300k', gdp: 180000 },
  'Lakshadweep': { value: 800, tier: 'Low', pop: '65k', gdp: 200000 },
  'Madhya Pradesh': { value: 1958.49, tier: 'Medium', pop: '85M', gdp: 140000 },
  'Maharashtra': { value: 2990.07, tier: 'High', pop: '125M', gdp: 240000 },
  'Manipur': { value: 1370.01, tier: 'Medium', pop: '3.0M', gdp: 95000 },
  'Meghalaya': { value: 2688.86, tier: 'High', pop: '3.3M', gdp: 100000 },
  'Mizoram': { value: 2024.78, tier: 'High', pop: '1.2M', gdp: 200000 },
  'Nagaland': { value: 1079.26, tier: 'Medium', pop: '2.2M', gdp: 140000 },
  'Odisha': { value: 2598.14, tier: 'High', pop: '44M', gdp: 150000 },
  'Puducherry': { value: 4479.88, tier: 'High', pop: '1.6M', gdp: 240000 },
  'Punjab': { value: 4120.51, tier: 'High', pop: '30M', gdp: 180000 },
  'Rajasthan': { value: 2544.64, tier: 'High', pop: '81M', gdp: 160000 },
  'Sikkim': { value: 2863.31, tier: 'High', pop: '700k', gdp: 520000 },
  'Tamil Nadu': { value: 3659.96, tier: 'High', pop: '77M', gdp: 270000 },
  'Telangana': { value: 4162.38, tier: 'High', pop: '38M', gdp: 310000 },
  'Tripura': { value: 1102.52, tier: 'Medium', pop: '4.1M', gdp: 140000 },
  'Uttar Pradesh': { value: 1502.60, tier: 'Medium', pop: '235M', gdp: 85000 },
  'Uttarakhand': { value: 2974.95, tier: 'High', pop: '11M', gdp: 230000 },
  'West Bengal': { value: 1508.41, tier: 'Medium', pop: '99M', gdp: 150000 }
};

const NATIONAL_AVG = 1390;

// Deterministic Procedural District Boundary & Value Generator
const getDistrictsForState = (stateName, stateAverage) => {
  const districtNames = {
    'Maharashtra': ['Mumbai City', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati'],
    'Karnataka': ['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Dharwad', 'Dakshina Kannada', 'Kalaburagi', 'Ballari', 'Udupi'],
    'Uttar Pradesh': ['Noida (G.B. Nagar)', 'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Ghaziabad', 'Meerut'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Jamnagar', 'Bhavnagar', 'Anand'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode'],
    'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'],
    'Telangana': ['Hyderabad', 'Medchal-Malkajgiri', 'Ranga Reddy', 'Warangal', 'Nizamabad', 'Khammam'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Hooghly', 'Paschim Medinipur', 'Purba Bardhaman'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
    'Kerala': ['Thiruvananthapuram', 'Ernakulam (Kochi)', 'Kozhikode', 'Thrissur', 'Malappuram', 'Palakkad'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kurnool']
  };

  const names = districtNames[stateName] || [
    `${stateName} North`, `${stateName} South`, `${stateName} East`, 
    `${stateName} West`, `${stateName} Central`, `${stateName} Rural`
  ];

  let seed = 0;
  for (let i = 0; i < stateName.length; i++) {
    seed += stateName.charCodeAt(i);
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Generate 12 control points (3 rows of 4 points) for a contiguous 2x3 grid
  const cPoints = [];
  for (let r = 0; r < 3; r++) {
    cPoints[r] = [];
    for (let c = 0; c < 4; c++) {
      const baseValX = c * 133.3;
      const baseValY = r * 200.0;
      const offsetX = (c === 0 || c === 3) ? 0 : (random() - 0.5) * 40;
      const offsetY = (r === 0 || r === 2) ? 0 : (random() - 0.5) * 40;
      cPoints[r].push([baseValX + offsetX, baseValY + offsetY]);
    }
  }

  const districts = [];
  let nameIdx = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const p0 = cPoints[r][c];
      const p1 = cPoints[r][c+1];
      const p2 = cPoints[r+1][c+1];
      const p3 = cPoints[r+1][c];
      
      const path = `M ${p0[0].toFixed(1)},${p0[1].toFixed(1)} L ${p1[0].toFixed(1)},${p1[1].toFixed(1)} L ${p2[0].toFixed(1)},${p2[1].toFixed(1)} L ${p3[0].toFixed(1)},${p3[1].toFixed(1)} Z`;
      
      const variance = 0.55 + random() * 0.9;
      const val = Math.round(stateAverage * variance * 100) / 100;
      
      let tier = 'Medium';
      if (val < stateAverage * 0.8) tier = 'Low';
      else if (val > stateAverage * 1.2) tier = 'High';
      
      const popEstimate = `${Math.round(1 + random() * 8)}M`;
      const gdpEstimate = Math.round((stateDataset[stateName]?.gdp || 150000) * (0.6 + random() * 0.8));
      
      districts.push({
        name: names[nameIdx] || `${stateName} District ${nameIdx + 1}`,
        value: val,
        tier,
        pop: popEstimate,
        gdp: gdpEstimate,
        path
      });
      nameIdx++;
    }
  }

  return districts;
};

function NationalAnalytics({ setViewMode }) {
  // Navigation & Drilldown state
  const [drilldownMode, setDrilldownMode] = useState('india'); // 'india' or 'state'
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  
  // Search & Global state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tierFilter, setTierFilter] = useState('All'); 
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // States for Comparison Tool
  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  // Load districts dynamically when a state is selected
  const districts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState, stateDataset[selectedState].value);
  }, [selectedState]);

  // Adjust drilldown zoom & mode
  const handleSelectState = (stateCode) => {
    if (!stateCode) return;
    setSelectedState(stateCode);
    setDrilldownMode('state');
    setSelectedDistrict(null);
  };

  // Navigation handlers
  const handleBackToIndia = () => {
    setDrilldownMode('india');
    setSelectedState(null);
    setSelectedDistrict(null);
  };

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district);
  };

  // Sync state comparison drop-downs based on zoom level
  useEffect(() => {
    if (drilldownMode === 'state' && districts.length >= 2) {
      setCompareA(districts[0].name);
      setCompareB(districts[1].name);
    } else {
      setCompareA('Maharashtra');
      setCompareB('Uttar Pradesh');
    }
  }, [drilldownMode, selectedState, districts]);

  // Track Mouse movement for District custom tooltips
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Compute map colors based on filters
  const stateColors = useMemo(() => {
    const colors = {};
    Object.keys(stateDataset).forEach(state => {
      const data = stateDataset[state];
      if (tierFilter !== 'All' && data.tier !== tierFilter) {
        colors[state] = isDarkMode ? '#111827' : '#F3F4F6'; 
      } else {
        colors[state] = data.tier === 'High' ? '#EF4444' : data.tier === 'Medium' ? '#F59E0B' : '#10B981';
      }
    });
    return colors;
  }, [tierFilter, isDarkMode]);

  // List of active rows depending on zoom context (India states vs selected State districts)
  const activeItems = useMemo(() => {
    let list = [];
    if (drilldownMode === 'india') {
      list = Object.keys(stateDataset).map(name => ({
        name,
        ...stateDataset[name]
      }));
    } else {
      list = districts.map(d => ({
        name: d.name,
        value: d.value,
        tier: d.tier,
        pop: d.pop,
        gdp: d.gdp
      }));
    }

    if (searchQuery) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (tierFilter !== 'All') {
      list = list.filter(s => s.tier === tierFilter);
    }

    list.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [drilldownMode, districts, searchQuery, tierFilter, sortConfig]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Select search result
  const handleSelectSearchResult = (itemName) => {
    if (drilldownMode === 'india') {
      handleSelectState(itemName);
    } else {
      const match = districts.find(d => d.name === itemName);
      if (match) setSelectedDistrict(match);
    }
    setSearchQuery('');
  };

  // Recharts Bar Data for Comparison (State vs State or District vs District)
  const comparisonData = useMemo(() => {
    if (drilldownMode === 'india') {
      const dataA = stateDataset[compareA] || { value: 0 };
      const dataB = stateDataset[compareB] || { value: 0 };
      return [
        { name: compareA, Consumption: dataA.value, fill: dataA.tier === 'High' ? '#EF4444' : dataA.tier === 'Medium' ? '#F59E0B' : '#10B981' },
        { name: compareB, Consumption: dataB.value, fill: dataB.tier === 'High' ? '#EF4444' : dataB.tier === 'Medium' ? '#F59E0B' : '#10B981' },
        { name: 'National Avg', Consumption: NATIONAL_AVG, fill: '#3B82F6' }
      ];
    } else {
      const distA = districts.find(d => d.name === compareA) || { value: 0, tier: 'Medium' };
      const distB = districts.find(d => d.name === compareB) || { value: 0, tier: 'Medium' };
      const stateAvg = stateDataset[selectedState]?.value || NATIONAL_AVG;
      return [
        { name: compareA, Consumption: distA.value, fill: distA.tier === 'High' ? '#EF4444' : distA.tier === 'Medium' ? '#F59E0B' : '#10B981' },
        { name: compareB, Consumption: distB.value, fill: distB.tier === 'High' ? '#EF4444' : distB.tier === 'Medium' ? '#F59E0B' : '#10B981' },
        { name: 'State Avg', Consumption: stateAvg, fill: '#8B5CF6' }
      ];
    }
  }, [compareA, compareB, drilldownMode, districts, selectedState]);

  // Recharts Scatter Plot Data (GDP vs Consumption)
  const correlationData = useMemo(() => {
    if (drilldownMode === 'india') {
      return Object.keys(stateDataset).map(name => ({
        name,
        gdp: stateDataset[name].gdp / 1000, 
        kwh: stateDataset[name].value,
        tier: stateDataset[name].tier
      }));
    } else {
      return districts.map(d => ({
        name: d.name,
        gdp: d.gdp / 1000,
        kwh: d.value,
        tier: d.tier
      }));
    }
  }, [drilldownMode, districts]);

  // Export Map View as PNG
  const handleExportPng = () => {
    const svgElement = document.querySelector('.map svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 650;
      const context = canvas.getContext('2d');
      
      context.fillStyle = isDarkMode ? '#0B0F19' : '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 20, 600, 600);
      
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = `${drilldownMode}_electricity_consumption_map.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  const themeClass = isDarkMode ? 'dark bg-[#080C14] text-slate-100' : 'light bg-slate-50 text-slate-800';

  return (
    <div className={`p-6 space-y-8 rounded-3xl transition-all duration-300 ${themeClass}`}>
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-700/30">
        <div>
          <h2 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            National Electricity Consumption Dashboard
          </h2>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-xs font-semibold mt-2 text-slate-400">
            <button onClick={handleBackToIndia} className="hover:text-accentBlue transition-all">
              India
            </button>
            {selectedState && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button 
                  onClick={() => { setSelectedDistrict(null); setDrilldownMode('state'); }} 
                  className={`hover:text-accentBlue transition-all ${!selectedDistrict ? 'text-accentBlue font-bold' : ''}`}
                >
                  {selectedState}
                </button>
              </>
            )}
            {selectedDistrict && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-accentBlue font-bold">{selectedDistrict.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          {setViewMode && (
            <div className={`flex rounded-xl p-1 border ${
              isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-200/50 border-slate-300'
            }`}>
              <button
                onClick={() => setViewMode('national')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accentBlue text-white shadow transition-all"
              >
                National Map
              </button>
              <button
                onClick={() => setViewMode('local')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Local Telemetry
              </button>
            </div>
          )}
          <button
            onClick={handleExportPng}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-700/60 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title="Export map view as PNG"
          >
            <Download className="h-4 w-4" />
            <span>Export Map</span>
          </button>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-700/60 text-amber-400 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Center Panel (Map & Filters) - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Map Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={drilldownMode === 'india' ? "Search state..." : "Search district..."}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm font-medium outline-none border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border-slate-800 text-slate-200 focus:border-slate-700' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-slate-300 shadow-sm'
                }`}
              />
              {/* Search Suggestions */}
              {searchQuery && (
                <div className={`absolute z-50 left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-xl border shadow-xl ${
                  isDarkMode ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {activeItems.slice(0, 5).map(s => (
                    <button
                      key={s.name}
                      onClick={() => handleSelectSearchResult(s.name)}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold ${
                        isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.name} ({s.value.toFixed(1)} kWh)
                    </button>
                  ))}
                  {activeItems.length === 0 && (
                    <div className="p-3 text-xs text-slate-500 text-center">No results found</div>
                  )}
                </div>
              )}
            </div>

            {/* Breadcrumb Back Button */}
            {drilldownMode === 'state' && (
              <button 
                onClick={handleBackToIndia}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-accentBlue text-white hover:bg-blue-600 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>India Map</span>
              </button>
            )}

            {/* Tier Filters */}
            <div className={`flex rounded-xl p-1 border border-darkBorder/40 ${isDarkMode ? 'bg-slate-950/40' : 'bg-slate-200/50'}`}>
              {['All', 'High', 'Medium', 'Low'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tierFilter === tier 
                      ? 'bg-accentBlue text-white shadow' 
                      : isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Map View Box */}
          <div className={`glass-panel p-6 rounded-2xl border flex flex-col items-center justify-center relative min-h-[480px] ${
            isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
          }`}>
            <span className="absolute top-4 left-6 text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {drilldownMode === 'india' ? 'India Choropleth View' : `${selectedState} Districts View`}
            </span>
            
            <div className="w-full max-w-[420px] aspect-square flex items-center justify-center my-4 map">
              {drilldownMode === 'india' ? (
                <India
                  type="select-single"
                  size={380}
                  mapColor={isDarkMode ? '#1E293B' : '#E5E7EB'}
                  strokeColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
                  strokeWidth={1.5}
                  hoverColor="#38BDF8"
                  selectColor="#60A5FA"
                  cityColors={stateColors}
                  onSelect={(stateCode) => handleSelectState(stateCode)}
                  hints={true}
                  hintTextColor="#FFFFFF"
                  hintBackgroundColor="#151D30"
                  hintPadding="8px 12px"
                  hintBorderRadius={8}
                />
              ) : (
                <svg 
                  version="1.1" 
                  viewBox="0 0 400 400" 
                  className="w-full h-full select-none" 
                  onMouseMove={handleMouseMove}
                >
                  {districts.map((d, index) => {
                    const isFiltered = tierFilter !== 'All' && d.tier !== tierFilter;
                    const baseFill = isFiltered 
                      ? (isDarkMode ? '#111827' : '#F3F4F6')
                      : d.tier === 'High' 
                      ? '#EF4444' 
                      : d.tier === 'Medium' 
                      ? '#F59E0B' 
                      : '#10B981';

                    return (
                      <path
                        key={index}
                        d={d.path}
                        onClick={() => handleSelectDistrict(d)}
                        onMouseEnter={() => setHoveredDistrict(d.name)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        style={{
                          fill: selectedDistrict?.name === d.name 
                            ? '#60A5FA' 
                            : hoveredDistrict === d.name
                            ? '#38BDF8' 
                            : baseFill,
                          stroke: isDarkMode ? '#0B0F19' : '#FFFFFF',
                          strokeWidth: 1.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Custom Tooltip for Districts */}
            {drilldownMode === 'state' && hoveredDistrict && (
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
                  fontWeight: '700',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
              >
                {hoveredDistrict} ({districts.find(d => d.name === hoveredDistrict)?.value} kWh)
              </div>
            )}
            
            {/* Map Legend */}
            <div className="w-full flex justify-around border-t pt-4 border-slate-700/25 text-[10px] sm:text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentRed rounded-sm"></span>
                <span className="text-slate-400">High ({drilldownMode === 'india' ? '>2k' : '>120%'})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                <span className="text-slate-400">Medium ({drilldownMode === 'india' ? '1k-2k' : '80-120%'})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentGreen rounded-sm"></span>
                <span className="text-slate-400">Low ({drilldownMode === 'india' ? '<1k' : '<80%'})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Details sidebar) - Span 5 */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Detail Panel */}
          <div className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between ${
            isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`font-bold text-base mb-4 border-b pb-2 ${
                isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
              }`}>
                {drilldownMode === 'india' ? 'State Details' : 'District Details'}
              </h3>
              
              {/* India View Details */}
              {drilldownMode === 'india' && (
                selectedState && stateDataset[selectedState] ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedState}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        stateDataset[selectedState].tier === 'High' 
                          ? 'bg-accentRed/10 border border-accentRed/25 text-accentRed'
                          : stateDataset[selectedState].tier === 'Medium'
                          ? 'bg-amber-500/10 border border-amber-500/25 text-amber-500'
                          : 'bg-accentGreen/10 border border-accentGreen/25 text-accentGreen'
                      }`}>
                        {stateDataset[selectedState].tier} Tier
                      </span>
                    </div>

                    <div className={`space-y-3.5 p-4 rounded-xl border ${
                      isDarkMode ? 'bg-[#0B0F19] border-slate-800/80' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-semibold flex items-center">
                          <IndianRupee className="h-3.5 w-3.5 mr-1" /> Per-Capita Consumption
                        </span>
                        <span className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                          {stateDataset[selectedState].value.toLocaleString()} kWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" /> Population
                        </span>
                        <span className="text-sm font-semibold text-slate-300">
                          {stateDataset[selectedState].pop}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold flex items-center">
                          <Globe className="h-3.5 w-3.5 mr-1" /> GDP Per-Capita (Est)
                        </span>
                        <span className="text-sm font-semibold text-slate-300">
                          ₹{stateDataset[selectedState].gdp.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold">National average comparison</span>
                        <div className="text-right">
                          <span className={`text-sm font-bold block ${
                            stateDataset[selectedState].value > NATIONAL_AVG ? 'text-accentRed' : 'text-accentGreen'
                          }`}>
                            {stateDataset[selectedState].value > NATIONAL_AVG ? '+' : ''}
                            {((stateDataset[selectedState].value - NATIONAL_AVG) / NATIONAL_AVG * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            vs 1,390 kWh baseline
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <p className="pulse-soft font-semibold">Select a state on the map or ranking list to view detailed metrics.</p>
                  </div>
                )
              )}

              {/* State District View Details */}
              {drilldownMode === 'state' && (
                selectedDistrict ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedDistrict.name}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedDistrict.tier === 'High' 
                          ? 'bg-accentRed/10 border border-accentRed/25 text-accentRed'
                          : selectedDistrict.tier === 'Medium'
                          ? 'bg-amber-500/10 border border-amber-500/25 text-amber-500'
                          : 'bg-accentGreen/10 border border-accentGreen/25 text-accentGreen'
                      }`}>
                        {selectedDistrict.tier} Tier (Local)
                      </span>
                    </div>

                    <div className={`space-y-3.5 p-4 rounded-xl border ${
                      isDarkMode ? 'bg-[#0B0F19] border-slate-800/80' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-semibold flex items-center">
                          <IndianRupee className="h-3.5 w-3.5 mr-1" /> Per-Capita Consumption
                        </span>
                        <span className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                          {selectedDistrict.value.toLocaleString()} kWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" /> Est Population
                        </span>
                        <span className="text-sm font-semibold text-slate-300">
                          {selectedDistrict.pop}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold flex items-center">
                          <Globe className="h-3.5 w-3.5 mr-1" /> Est GDP Per-Capita
                        </span>
                        <span className="text-sm font-semibold text-slate-300">
                          ₹{selectedDistrict.gdp.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold">State Average Comparison</span>
                        <div className="text-right">
                          <span className={`text-sm font-bold block ${
                            selectedDistrict.value > stateDataset[selectedState].value ? 'text-accentRed' : 'text-accentGreen'
                          }`}>
                            {selectedDistrict.value > stateDataset[selectedState].value ? '+' : ''}
                            {((selectedDistrict.value - stateDataset[selectedState].value) / stateDataset[selectedState].value * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            vs {stateDataset[selectedState].value} kWh state average
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-700/20 pt-3">
                        <span className="text-xs text-slate-400 font-semibold">National Average Comparison</span>
                        <div className="text-right">
                          <span className={`text-sm font-bold block ${
                            selectedDistrict.value > NATIONAL_AVG ? 'text-accentRed' : 'text-accentGreen'
                          }`}>
                            {selectedDistrict.value > NATIONAL_AVG ? '+' : ''}
                            {((selectedDistrict.value - NATIONAL_AVG) / NATIONAL_AVG * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            vs 1,390 kWh baseline
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <p className="pulse-soft font-semibold">Select a district on the map or ranking list to inspect details.</p>
                  </div>
                )
              )}
            </div>
            
            {/* National Baseline Comparison Card */}
            <div className={`p-4 rounded-xl border mt-5 text-xs space-y-2.5 ${
              isDarkMode ? 'bg-[#060A12]/40 border-slate-800/60' : 'bg-slate-100 border-slate-200 shadow-sm'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">National Average:</span>
                <span className="font-bold">1,390 kWh</span>
              </div>
              {selectedState && (
                <div className="flex justify-between border-t border-slate-700/10 pt-2">
                  <span className="text-slate-400 font-medium">{selectedState} Average:</span>
                  <span className="font-bold text-accentBlue">{stateDataset[selectedState].value} kWh</span>
                </div>
              )}
              {drilldownMode === 'state' && districts.length > 0 && (
                <>
                  <div className="flex justify-between border-t border-slate-700/10 pt-2">
                    <span className="text-slate-400 font-medium">Highest District:</span>
                    <span className="font-bold text-accentRed">
                      {[...districts].sort((a,b) => b.value - a.value)[0]?.name}: {[...districts].sort((a,b) => b.value - a.value)[0]?.value} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Lowest District:</span>
                    <span className="font-bold text-accentGreen">
                      {[...districts].sort((a,b) => a.value - b.value)[0]?.name}: {[...districts].sort((a,b) => a.value - b.value)[0]?.value} kWh
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Tool & GDP Scatter Correlation row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Comparison Tool - Span 6 */}
        <div className={`lg:col-span-6 glass-panel p-6 rounded-2xl border ${
          isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
            <BarChart2 className="h-5 w-5 text-accentBlue" />
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {drilldownMode === 'india' ? 'Side-by-Side State Comparison' : 'Side-by-Side District Comparison'}
            </h3>
          </div>

          {/* Select dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {drilldownMode === 'india' ? 'State A' : 'District A'}
              </label>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {drilldownMode === 'india' ? (
                  Object.keys(stateDataset).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))
                ) : (
                  districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))
                )}
              </select>
            </div>
            
            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {drilldownMode === 'india' ? 'State B' : 'District B'}
              </label>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {drilldownMode === 'india' ? (
                  Object.keys(stateDataset).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))
                ) : (
                  districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} unit=" kWh" />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#151D30' : '#FFFFFF', borderColor: isDarkMode ? '#1E293B' : '#E5E7EB', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
                />
                <Bar dataKey="Consumption" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {comparisonData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation Diagnostics Scatter Chart - Span 6 */}
        <div className={`lg:col-span-6 glass-panel p-6 rounded-2xl border ${
          isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
            <TrendingUp className="h-5 w-5 text-accentGreen" />
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Consumption vs. GDP Per Capita Correlation
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} />
                <XAxis 
                  type="number" 
                  dataKey="gdp" 
                  name="GDP Per Capita" 
                  unit="k" 
                  stroke="#64748B" 
                  fontSize={10}
                  label={{ value: 'GDP Per Capita (₹ in Thousands)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="kwh" 
                  name="Energy Consumption" 
                  unit=" kWh" 
                  stroke="#64748B" 
                  fontSize={10}
                  label={{ value: 'Per Capita Energy (kWh)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748B', fontSize: 10 }}
                />
                <ZAxis range={[60, 300]} />
                <ChartTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: isDarkMode ? '#151D30' : '#FFFFFF', borderColor: isDarkMode ? '#1E293B' : '#E5E7EB', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          isDarkMode ? 'bg-[#151D30] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                          <p className="font-bold">{data.name}</p>
                          <p>Per Capita Consumption: <span className="font-bold">{data.kwh.toLocaleString()} kWh</span></p>
                          <p>Est GDP Per Capita: <span className="font-bold">₹{(data.gdp * 1000).toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Items" 
                  data={correlationData} 
                  fill="#10B981"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Sortable Ranking List - Spans Full Width */}
      <div className={`glass-panel p-6 rounded-2xl border ${
        isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-6 border-b pb-2 border-slate-700/20">
          <div className="flex items-center space-x-2">
            <Map className="h-5 w-5 text-accentAmber" />
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {drilldownMode === 'india' ? 'State-wise Electricity Consumption Rankings' : `${selectedState} District Rankings`}
            </h3>
          </div>
          <span className="text-slate-400 text-xs font-medium">
            {activeItems.length} Regions Audited
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className={`border-b text-slate-400 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <th className="pb-3 font-semibold text-center w-16">Rank</th>
                <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('name')}>
                  <div className="flex items-center">
                    {drilldownMode === 'india' ? 'State / Union Territory' : 'District'} <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                  </div>
                </th>
                <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('value')}>
                  <div className="flex items-center">
                    Per-Capita Consumption (kWh) <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                  </div>
                </th>
                <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('tier')}>
                  <div className="flex items-center">
                    Category Tier <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
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
              {activeItems.map((item, idx) => {
                const globalIdx = (drilldownMode === 'india' 
                  ? Object.keys(stateDataset).map(name => ({ name, value: stateDataset[name].value }))
                  : districts.map(d => ({ name: d.name, value: d.value }))
                )
                .sort((a, b) => b.value - a.value)
                .findIndex(x => x.name === item.name) + 1;
                  
                return (
                  <tr 
                    key={item.name} 
                    onClick={() => {
                      if (drilldownMode === 'india') {
                        handleSelectState(item.name);
                      } else {
                        const target = districts.find(d => d.name === item.name);
                        if (target) setSelectedDistrict(target);
                      }
                    }}
                    className={`cursor-pointer border-b transition-all ${
                      (drilldownMode === 'india' && selectedState === item.name) || (drilldownMode === 'state' && selectedDistrict?.name === item.name)
                        ? isDarkMode 
                          ? 'bg-slate-900/50 border-slate-700/60' 
                          : 'bg-slate-100 border-slate-300'
                        : isDarkMode 
                          ? 'border-slate-800/40 hover:bg-slate-950/30' 
                          : 'border-slate-200/60 hover:bg-slate-100/50'
                    }`}
                  >
                    <td className="py-3 font-bold text-center text-slate-400">{globalIdx}</td>
                    <td className="py-3 font-semibold text-slate-200">{item.name}</td>
                    <td className="py-3 font-extrabold">{item.value.toLocaleString()} kWh</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.tier === 'High' 
                          ? 'bg-accentRed/10 text-accentRed' 
                          : item.tier === 'Medium' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-accentGreen/10 text-accentGreen'
                      }`}>
                        {item.tier}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-medium">{item.pop}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-[10px] text-slate-500 text-center font-medium italic border-t pt-3 border-slate-700/10">
          * Footnote: District-level values are illustrative estimates generated relative to the respective state averages.
        </div>
      </div>
    </div>
  );
}

export default NationalAnalytics;
