import React, { useState, useMemo } from 'react';
import India from '@react-map/india';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Legend as ChartLegend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  BarChart2, 
  TrendingUp, 
  Download, 
  Sun, 
  Moon, 
  Map, 
  TrendingDown,
  Globe,
  Users,
  IndianRupee
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

function NationalAnalytics({ setViewMode }) {
  const [selectedState, setSelectedState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tierFilter, setTierFilter] = useState('All'); // 'All', 'High', 'Medium', 'Low'
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });
  
  // States for Comparison Tool
  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  // Compute map colors based on filters
  const stateColors = useMemo(() => {
    const colors = {};
    Object.keys(stateDataset).forEach(state => {
      const data = stateDataset[state];
      if (tierFilter !== 'All' && data.tier !== tierFilter) {
        colors[state] = isDarkMode ? '#111827' : '#F3F4F6'; // Faded out
      } else {
        colors[state] = data.tier === 'High' ? '#EF4444' : data.tier === 'Medium' ? '#F59E0B' : '#10B981';
      }
    });
    return colors;
  }, [tierFilter, isDarkMode]);

  // Filtered and sorted states list for search and ranking table
  const processedStates = useMemo(() => {
    let list = Object.keys(stateDataset).map(name => ({
      name,
      ...stateDataset[name]
    }));

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
  }, [searchQuery, tierFilter, sortConfig]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Select search result
  const handleSelectSearchResult = (stateName) => {
    setSelectedState(stateName);
    setSearchQuery('');
  };

  // Recharts Bar Data for Comparison
  const comparisonData = useMemo(() => {
    const dataA = stateDataset[compareA] || { value: 0 };
    const dataB = stateDataset[compareB] || { value: 0 };
    return [
      { name: compareA, Consumption: dataA.value, fill: dataA.tier === 'High' ? '#EF4444' : dataA.tier === 'Medium' ? '#F59E0B' : '#10B981' },
      { name: compareB, Consumption: dataB.value, fill: dataB.tier === 'High' ? '#EF4444' : dataB.tier === 'Medium' ? '#F59E0B' : '#10B981' },
      { name: 'National Avg', Consumption: NATIONAL_AVG, fill: '#3B82F6' }
    ];
  }, [compareA, compareB]);

  // Recharts Scatter Plot Data for correlation
  const correlationData = useMemo(() => {
    return Object.keys(stateDataset).map(name => ({
      name,
      gdp: stateDataset[name].gdp / 1000, // In Thousands
      kwh: stateDataset[name].value,
      tier: stateDataset[name].tier
    }));
  }, []);

  // Export Map View as PNG (Native Implementation)
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
      
      // Draw background matching active theme
      context.fillStyle = isDarkMode ? '#0B0F19' : '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw SVG map
      context.drawImage(image, 0, 20, 600, 600);
      
      // Create PNG and trigger download
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = 'india_electricity_consumption_map.png';
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
          <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            India-wide per-capita electrical audit, regional benchmarks, and correlation diagnostics.
          </p>
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
                placeholder="Search state..."
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
                  {processedStates.slice(0, 5).map(s => (
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
                  {processedStates.length === 0 && (
                    <div className="p-3 text-xs text-slate-500 text-center">No states found</div>
                  )}
                </div>
              )}
            </div>

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

          {/* Interactive Choropleth Map Panel */}
          <div className={`glass-panel p-6 rounded-2xl border flex flex-col items-center justify-center relative min-h-[480px] ${
            isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
          }`}>
            <span className="absolute top-4 left-6 text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              India Consumption Heatmap
            </span>
            <div className="w-full max-w-[420px] aspect-square flex items-center justify-center my-4">
              <India
                type="select-single"
                size={380}
                mapColor={isDarkMode ? '#1E293B' : '#E5E7EB'}
                strokeColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
                strokeWidth={1.5}
                hoverColor="#38BDF8"
                selectColor="#60A5FA"
                cityColors={stateColors}
                onSelect={(stateCode) => setSelectedState(stateCode)}
                hints={true}
                hintTextColor="#FFFFFF"
                hintBackgroundColor="#151D30"
                hintPadding="8px 12px"
                hintBorderRadius={8}
              />
            </div>
            
            {/* Map Legend inline */}
            <div className="w-full flex justify-around border-t pt-4 border-slate-700/25 text-[10px] sm:text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentRed rounded-sm"></span>
                <span className="text-slate-400">High (&gt;2k)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                <span className="text-slate-400">Medium (1k-2k)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentGreen rounded-sm"></span>
                <span className="text-slate-400">Low (&lt;1k)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Details, Legend, Metrics) - Span 5 */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Detail Side Panel / Mobile Bottom Sheet */}
          <div className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between ${
            isDarkMode ? 'border-darkBorder/40' : 'border-slate-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`font-bold text-base mb-4 border-b pb-2 ${
                isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
              }`}>
                State-wise Details
              </h3>
              
              {selectedState && stateDataset[selectedState] ? (
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
                      <span className="text-xs text-slate-400 font-semibold">National Baseline Deviation</span>
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
              )}
            </div>
            
            {/* National Baseline reference stats */}
            <div className={`p-4 rounded-xl border mt-5 text-xs space-y-2.5 ${
              isDarkMode ? 'bg-[#060A12]/40 border-slate-800/60' : 'bg-slate-100 border-slate-200 shadow-sm'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">National Average:</span>
                <span className="font-bold">1,390 kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Highest (Daman & Diu):</span>
                <span className="font-bold text-accentRed">15,642.4 kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Lowest (Bihar):</span>
                <span className="font-bold text-accentGreen">835.0 kWh</span>
              </div>
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
              Side-by-Side State Comparison
            </h3>
          </div>

          {/* Select dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">State A</label>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {Object.keys(stateDataset).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">State B</label>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {Object.keys(stateDataset).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
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
                  name="States" 
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
              State-wise Electricity Consumption Rankings
            </h3>
          </div>
          <span className="text-slate-400 text-xs font-medium">
            {processedStates.length} Regions Audited
          </span>
        </div>

        {/* Scrollable Table Wrapper */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className={`border-b text-slate-400 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <th className="pb-3 font-semibold text-center w-16">Rank</th>
                <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('name')}>
                  <div className="flex items-center">
                    State / Union Territory <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
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
              {processedStates.map((state, idx) => {
                const globalIdx = Object.keys(stateDataset)
                  .map(name => ({ name, value: stateDataset[name].value }))
                  .sort((a, b) => b.value - a.value)
                  .findIndex(x => x.name === state.name) + 1;
                  
                return (
                  <tr 
                    key={state.name} 
                    onClick={() => setSelectedState(state.name)}
                    className={`cursor-pointer border-b transition-all ${
                      selectedState === state.name 
                        ? isDarkMode 
                          ? 'bg-slate-900/50 border-slate-700/60' 
                          : 'bg-slate-100 border-slate-300'
                        : isDarkMode 
                          ? 'border-slate-800/40 hover:bg-slate-950/30' 
                          : 'border-slate-200/60 hover:bg-slate-100/50'
                    }`}
                  >
                    <td className="py-3 font-bold text-center text-slate-400">{globalIdx}</td>
                    <td className="py-3 font-semibold text-slate-200">{state.name}</td>
                    <td className="py-3 font-extrabold">{state.value.toLocaleString()} kWh</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        state.tier === 'High' 
                          ? 'bg-accentRed/10 text-accentRed' 
                          : state.tier === 'Medium' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-accentGreen/10 text-accentGreen'
                      }`}>
                        {state.tier}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-medium">{state.pop}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NationalAnalytics;
