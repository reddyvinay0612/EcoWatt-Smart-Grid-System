import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { 
  Download, 
  Sun, 
  Moon, 
  BarChart2, 
  TrendingUp, 
  Map as MapIcon, 
  HelpCircle 
} from 'lucide-react';

// Import components
import IndiaMap from './components/IndiaMap';
import StateMap from './components/StateMap';
import Legend from './components/Legend';
import DetailPanel from './components/DetailPanel';
import SearchBar from './components/SearchBar';
import RankingTable from './components/RankingTable';
import Breadcrumb from './components/Breadcrumb';
import ComparisonChart from './components/ComparisonChart';
import FilterButtons from './components/FilterButtons';

// Import data
import { stateData, NATIONAL_AVG } from './data/stateData';
import { getDistrictsForState } from './data/districtData';

// Import charting elements
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  ZAxis 
} from 'recharts';

function App() {
  // Theme & Navigation state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('india'); // 'india' or 'state'
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  
  // Search & Filter state
  const [tierFilter, setTierFilter] = useState('All');
  
  // Comparison selectors
  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  // Load districts dynamically when state is selected
  const districts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState, stateData.find(s => s.name === selectedState)?.value || 1000);
  }, [selectedState]);

  // Sync comparison drop-downs when view switches
  useEffect(() => {
    if (currentView === 'state' && districts.length >= 2) {
      setCompareA(districts[0].name);
      setCompareB(districts[1].name);
    } else {
      setCompareA('Maharashtra');
      setCompareB('Uttar Pradesh');
    }
  }, [currentView, selectedState, districts]);

  // Active dataset depending on view
  const activeDataset = useMemo(() => {
    if (currentView === 'india') {
      return stateData.map(s => {
        let tier = 'Medium';
        if (s.value < 1000) tier = 'Low';
        else if (s.value > 2000) tier = 'High';
        return { ...s, tier };
      });
    } else {
      const stateAvg = stateData.find(s => s.name === selectedState)?.value || 1000;
      return districts.map(d => {
        let tier = 'Medium';
        if (d.value < stateAvg * 0.8) tier = 'Low';
        else if (d.value > stateAvg * 1.2) tier = 'High';
        return { ...d, tier };
      });
    }
  }, [currentView, selectedState, districts]);

  // Comparison items lookup
  const comparisonItems = useMemo(() => {
    const itemA = activeDataset.find(x => x.name === compareA);
    const itemB = activeDataset.find(x => x.name === compareB);
    return { itemA, itemB };
  }, [compareA, compareB, activeDataset]);

  // Scatter correlation data (GDP vs kWh)
  const correlationData = useMemo(() => {
    return activeDataset.map(item => ({
      name: item.name,
      gdp: (item.gdp || 150000) / 1000, // In thousands
      kwh: item.value,
      tier: item.tier
    }));
  }, [activeDataset]);

  // Breadcrumb navigation callback
  const handleNavigate = (view, state, district) => {
    setCurrentView(view);
    setSelectedState(state);
    setSelectedDistrict(district);
  };

  // State selection handler from map click
  const handleSelectState = (stateName) => {
    setSelectedState(stateName);
    setCurrentView('state');
    setSelectedDistrict(null);
  };

  // Export Map container as PNG using html-to-image
  const handleExportPng = () => {
    const node = document.querySelector('.map-container');
    if (!node) return;

    toPng(node, { 
      backgroundColor: isDarkMode ? '#080C14' : '#F8FAFC',
      style: {
        borderRadius: '24px'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${currentView}_electricity_map.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export map visual', err);
      });
  };

  // Selected item details details lookup
  const detailItem = useMemo(() => {
    if (currentView === 'india') {
      if (!selectedState) return null;
      const stateObj = stateData.find(s => s.name === selectedState);
      if (!stateObj) return null;
      let tier = 'Medium';
      if (stateObj.value < 1000) tier = 'Low';
      else if (stateObj.value > 2000) tier = 'High';
      const dev = ((stateObj.value - NATIONAL_AVG) / NATIONAL_AVG) * 100;
      return { ...stateObj, tier, dev };
    } else {
      if (!selectedDistrict) return null;
      const stateAvg = stateData.find(s => s.name === selectedState)?.value || 1000;
      const dev = ((selectedDistrict.value - stateAvg) / stateAvg) * 100;
      return { ...selectedDistrict, dev };
    }
  }, [currentView, selectedState, selectedDistrict]);

  const activeThemeClass = isDarkMode ? 'dark bg-[#080C14] text-slate-100' : 'light bg-slate-50 text-slate-800';

  return (
    <div className={`min-h-screen p-4 sm:p-6 md:p-8 transition-all duration-300 font-sans ${activeThemeClass}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-700/20">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              India Electricity Consumption Dashboard
            </h1>
            <div className="mt-2">
              <Breadcrumb 
                currentView={currentView}
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onNavigate={handleNavigate}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPng}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-slate-700/60 text-slate-200 hover:bg-slate-850' 
                  : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Export PNG</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-slate-700/60 text-amber-400 hover:bg-slate-850' 
                  : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Search, Filter, Map, and detail cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Layout (Map Container, Search, Filter) - Span 7 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <SearchBar 
                data={activeDataset}
                onSelect={(item) => {
                  if (currentView === 'india') {
                    handleSelectState(item.name);
                  } else {
                    setSelectedDistrict(item);
                  }
                }}
                placeholder={currentView === 'india' ? 'Search state/UT...' : 'Search district...'}
                isDarkMode={isDarkMode}
              />

              <FilterButtons 
                tierFilter={tierFilter}
                onFilterChange={setTierFilter}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Map Canvas Card */}
            <div className={`map-container p-6 rounded-3xl border relative transition-all duration-300 ${
              isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white shadow-sm'
            }`}>
              <AnimatePresence mode="wait">
                {currentView === 'india' ? (
                  <motion.div
                    key="india"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IndiaMap 
                      stateData={stateData}
                      selectedState={selectedState}
                      onSelectState={handleSelectState}
                      tierFilter={tierFilter}
                      isDarkMode={isDarkMode}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="state"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StateMap 
                      selectedState={selectedState}
                      districts={districts}
                      selectedDistrict={selectedDistrict}
                      onSelectDistrict={setSelectedDistrict}
                      tierFilter={tierFilter}
                      isDarkMode={isDarkMode}
                      stateAverage={stateData.find(s => s.name === selectedState)?.value || 1000}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Layout (Detail Card, Legend) - Span 5 */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <Legend view={currentView} isDarkMode={isDarkMode} />
            
            {detailItem ? (
              <DetailPanel 
                name={detailItem.name}
                value={detailItem.value}
                tier={detailItem.tier}
                pop={detailItem.pop}
                gdp={detailItem.gdp}
                comparisonToAvg={detailItem.dev}
                isDarkMode={isDarkMode}
                averageLabel={currentView === 'india' ? 'national average' : 'state average'}
                onClose={() => {
                  setSelectedDistrict(null);
                  if (currentView === 'state') setSelectedDistrict(null);
                  else setSelectedState(null);
                }}
              />
            ) : (
              <div className={`p-6 rounded-2xl border text-center py-12 flex-1 flex flex-col justify-center items-center ${
                isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-white text-slate-500 shadow-sm'
              }`}>
                <HelpCircle className="h-8 w-8 mb-3 opacity-60 text-blue-500" />
                <p className="text-xs font-semibold max-w-[240px] leading-relaxed">
                  {currentView === 'india' 
                    ? 'Click on any state on the map to drill down into its districts.' 
                    : 'Click on a district polygon to inspect local telemetry.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Comparison Panel */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Region A</label>
                <select
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-250 text-slate-700'
                  }`}
                >
                  {activeDataset.map(x => (
                    <option key={x.name} value={x.name}>{x.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Region B</label>
                <select
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-250 text-slate-700'
                  }`}
                >
                  {activeDataset.map(x => (
                    <option key={x.name} value={x.name}>{x.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <ComparisonChart 
              itemA={comparisonItems.itemA}
              itemB={comparisonItems.itemB}
              averageValue={currentView === 'india' ? NATIONAL_AVG : (stateData.find(s => s.name === selectedState)?.value || 1000)}
              averageLabel={currentView === 'india' ? 'National Average' : 'State Average'}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Scatter Chart Panel */}
          <div className={`glass-panel p-6 rounded-2xl border ${
            isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Consumption vs. GDP Per Capita Correlation
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} />
                  <XAxis 
                    type="number" 
                    dataKey="gdp" 
                    name="GDP Per Capita" 
                    unit="k" 
                    stroke="#64748B" 
                    fontSize={10}
                    label={{ value: 'GDP (₹ in Thousands)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="kwh" 
                    name="Energy Consumption" 
                    unit=" kWh" 
                    stroke="#64748B" 
                    fontSize={10}
                    label={{ value: 'Per Capita (kWh)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748B', fontSize: 10 }}
                  />
                  <ZAxis range={[60, 300]} />
                  <ChartTooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                            isDarkMode ? 'bg-[#151D30] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}>
                            <p className="font-bold">{data.name}</p>
                            <p>Consumption: <span className="font-bold">{data.kwh.toLocaleString()} kWh</span></p>
                            <p>GDP: <span className="font-bold">₹{(data.gdp * 1000).toLocaleString()}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Regions" 
                    data={correlationData} 
                    fill="#10B981"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ranking List Table */}
        <RankingTable 
          data={activeDataset}
          selectedItem={currentView === 'india' ? (selectedState ? { name: selectedState } : null) : selectedDistrict}
          onSelect={(item) => {
            if (currentView === 'india') {
              handleSelectState(item.name);
            } else {
              setSelectedDistrict(item);
            }
          }}
          isDarkMode={isDarkMode}
          isNational={currentView === 'india'}
        />

      </div>
    </div>
  );
}

export default App;
