import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
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
import { 
  Sun, 
  Moon, 
  Download, 
  TrendingUp, 
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

// Import components
import IndiaMap from '../components/IndiaMap';
import StateMap from '../components/StateMap';
import Legend from '../components/Legend';
import DetailPanel from '../components/DetailPanel';
import SearchBar from '../components/SearchBar';
import RankingTable from '../components/RankingTable';
import Breadcrumb from '../components/Breadcrumb';
import ComparisonChart from '../components/ComparisonChart';
import FilterButtons from '../components/FilterButtons';

// Import data
import { stateData, NATIONAL_AVG, NATIONAL_CARBON_AVG } from '../data/stateData';
import { getDistrictsForState } from '../data/districtData';
import getColorScale from '../utils/colorScale';

function NationalAnalytics({ setViewMode }) {
  const [currentView, setCurrentView] = useState('india'); // 'india' or 'state'
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [tierFilter, setTierFilter] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Active Metric state
  const [activeMetric, setActiveMetric] = useState('electricity'); // 'electricity' | 'carbon'

  // States for Comparison Tool
  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  // Load districts dynamically when selected state changes
  const districts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState, stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000);
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

  // Prepare active dataset depending on zoom context
  const activeDataset = useMemo(() => {
    if (currentView === 'india') {
      return stateData.map(s => {
        const { tier: elecTier } = getColorScale(s.electricityConsumption);
        const { tier: carbTier } = getColorScale(s.carbonEmission, null, 'carbon');
        return { 
          ...s, 
          value: activeMetric === 'carbon' ? s.carbonEmission : s.electricityConsumption, // For backwards compatibility
          tier: activeMetric === 'carbon' ? carbTier : elecTier,
          elecTier, 
          carbTier 
        };
      });
    } else {
      const stateAvg = stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
      const stateCarbonAvg = stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
      return districts.map(d => {
        const { tier: elecTier } = getColorScale(d.electricityConsumption, stateAvg);
        const { tier: carbTier } = getColorScale(d.carbonEmission, stateCarbonAvg, 'carbon');
        return { 
          ...d, 
          value: activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption, // For backwards compatibility
          tier: activeMetric === 'carbon' ? carbTier : elecTier,
          elecTier, 
          carbTier 
        };
      });
    }
  }, [currentView, selectedState, districts, activeMetric]);

  // Comparison items lookup
  const comparisonItems = useMemo(() => {
    const itemA = activeDataset.find(x => x.name === compareA);
    const itemB = activeDataset.find(x => x.name === compareB);
    return { itemA, itemB };
  }, [compareA, compareB, activeDataset]);

  // Scatter correlation data (Electricity vs Carbon)
  const correlationData = useMemo(() => {
    return activeDataset.map(item => ({
      name: item.name,
      electricity: item.electricityConsumption ?? item.value ?? 0,
      carbon: item.carbonEmission ?? 0,
      tier: activeMetric === 'carbon' ? item.carbTier : item.elecTier
    }));
  }, [activeDataset, activeMetric]);

  // Navigation handlers
  const handleNavigate = (view, state = null, district = null) => {
    setCurrentView(view);
    if (view === 'india') {
      setSelectedState(null);
      setSelectedDistrict(null);
    } else {
      setSelectedState(state);
      setSelectedDistrict(district);
    }
  };

  const handleSelectState = (stateName) => {
    setSelectedState(stateName);
    setCurrentView('state');
    setSelectedDistrict(null);
  };

  // Export Map container as PNG using html-to-image
  const handleExportPng = () => {
    const node = document.querySelector('.map-container-export');
    if (!node) return;

    toPng(node, { 
      backgroundColor: isDarkMode ? '#080C14' : '#F8FAFC',
      style: {
        borderRadius: '24px'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${currentView}_${activeMetric}_map.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export map visual', err);
      });
  };

  // Details card lookup
  const detailItem = useMemo(() => {
    if (currentView === 'india') {
      if (!selectedState) return null;
      const stateObj = stateData.find(s => s.name === selectedState);
      if (!stateObj) return null;
      const elecDev = ((stateObj.electricityConsumption - NATIONAL_AVG) / NATIONAL_AVG) * 100;
      const carbDev = ((stateObj.carbonEmission - NATIONAL_CARBON_AVG) / NATIONAL_CARBON_AVG) * 100;
      const { tier: elecTier } = getColorScale(stateObj.electricityConsumption);
      const { tier: carbTier } = getColorScale(stateObj.carbonEmission, null, 'carbon');
      return { 
        name: stateObj.name, 
        electricityConsumption: stateObj.electricityConsumption, 
        carbonEmission: stateObj.carbonEmission, 
        elecTier, 
        carbTier, 
        elecDev, 
        carbDev, 
        pop: stateObj.pop, 
        gdp: stateObj.gdp, 
        isEmissionEstimated: stateObj.isEmissionEstimated 
      };
    } else {
      if (!selectedDistrict) return null;
      const stateAvg = stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
      const stateCarbonAvg = stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
      const elecDev = ((selectedDistrict.electricityConsumption - stateAvg) / stateAvg) * 100;
      const carbDev = ((selectedDistrict.carbonEmission - stateCarbonAvg) / stateCarbonAvg) * 100;
      const { tier: elecTier } = getColorScale(selectedDistrict.electricityConsumption, stateAvg);
      const { tier: carbTier } = getColorScale(selectedDistrict.carbonEmission, stateCarbonAvg, 'carbon');
      return { 
        name: selectedDistrict.name, 
        electricityConsumption: selectedDistrict.electricityConsumption, 
        carbonEmission: selectedDistrict.carbonEmission, 
        elecTier, 
        carbTier, 
        elecDev, 
        carbDev, 
        pop: selectedDistrict.pop, 
        gdp: selectedDistrict.gdp, 
        isEmissionEstimated: selectedDistrict.isEmissionEstimated 
      };
    }
  }, [currentView, selectedState, selectedDistrict]);

  const activeStateAvg = useMemo(() => {
    if (!selectedState) return 1000;
    const stateObj = stateData.find(s => s.name === selectedState);
    if (!stateObj) return 1000;
    return activeMetric === 'carbon' ? stateObj.carbonEmission : stateObj.electricityConsumption;
  }, [selectedState, activeMetric]);

  const activeElecAvg = useMemo(() => {
    if (currentView === 'india') return NATIONAL_AVG;
    return stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
  }, [currentView, selectedState]);

  const activeCarbonAvg = useMemo(() => {
    if (currentView === 'india') return NATIONAL_CARBON_AVG;
    return stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
  }, [currentView, selectedState]);

  const themeClass = isDarkMode ? 'dark bg-[#080C14] text-slate-100' : 'light bg-slate-50 text-slate-800';

  return (
    <div className={`p-6 space-y-8 rounded-3xl transition-all duration-300 ${themeClass}`}>
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-700/30">
        <div>
          <h2 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            National Electricity & Carbon Audit
          </h2>
          <div className="mt-2">
            <Breadcrumb 
              currentView={currentView}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              onNavigate={handleNavigate}
            />
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {setViewMode && (
            <div className={`flex rounded-xl p-1 border ${
              isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-200/50 border-slate-300'
            }`}>
              <button
                onClick={() => handleNavigate('india')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentView === 'india' ? 'bg-accentBlue text-white shadow' : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                National Map
              </button>
              <button
                onClick={() => setViewMode('local')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-650 hover:text-slate-800'
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
        
        {/* Left / Center Panel (Map & Filters) - Span 7/8 */}
        <div className={`${currentView === 'state' ? 'lg:col-span-8' : 'lg:col-span-7'} space-y-6`}>
          
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
              placeholder={currentView === 'india' ? "Search state..." : "Search district..."}
              isDarkMode={isDarkMode}
            />

            {/* Metric Selector Switch */}
            <div className={`flex rounded-xl p-1 border ${
              isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-200/50 border-slate-300'
            }`}>
              <button
                onClick={() => setActiveMetric('electricity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'electricity' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                }`}
              >
                Electricity (kWh)
              </button>
              <button
                onClick={() => setActiveMetric('carbon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'carbon' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                }`}
              >
                Carbon (CO2)
              </button>
            </div>

            {currentView === 'state' && (
              <button 
                onClick={() => handleNavigate('india')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-accentBlue text-white hover:bg-blue-600 transition-all shadow"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>India Map</span>
              </button>
            )}

            <FilterButtons 
              tierFilter={tierFilter}
              onFilterChange={setTierFilter}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Map View Box */}
          <div className={`map-container-export p-6 rounded-2xl border flex flex-col items-center justify-center relative min-h-[480px] ${
            isDarkMode ? 'border-darkBorder/40 bg-slate-900/10' : 'border-slate-205 bg-white shadow-sm'
          }`}>
            <span className="absolute top-4 left-6 text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {currentView === 'india' 
                ? `India Choropleth View (${activeMetric === 'carbon' ? 'Carbon Emission' : 'Electricity Consumption'})` 
                : `${selectedState} Districts View (${activeMetric === 'carbon' ? 'Carbon Emission' : 'Electricity Consumption'})`
              }
            </span>
            
            <div className={`w-full flex items-center justify-center my-4 ${
              currentView === 'india' ? 'max-w-[440px] aspect-square' : 'max-w-[780px] w-full'
            } map`}>
              <AnimatePresence mode="wait">
                {currentView === 'india' ? (
                  <motion.div
                    key="india-map"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <IndiaMap 
                      stateData={stateData}
                      selectedState={selectedState}
                      onSelectState={handleSelectState}
                      tierFilter={tierFilter}
                      isDarkMode={isDarkMode}
                      activeMetric={activeMetric}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="state-map"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <StateMap 
                      selectedState={selectedState}
                      districts={districts}
                      selectedDistrict={selectedDistrict}
                      onSelectDistrict={setSelectedDistrict}
                      tierFilter={tierFilter}
                      isDarkMode={isDarkMode}
                      stateAverage={activeStateAvg}
                      activeMetric={activeMetric}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Map Legend */}
            <div className="w-full flex justify-around border-t pt-4 border-slate-700/25 text-[10px] sm:text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentRed rounded-sm"></span>
                <span className="text-slate-400">
                  High ({currentView === 'india' ? (activeMetric === 'carbon' ? '>1600' : '>2000') : '>120%'})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                <span className="text-slate-400">
                  Medium ({currentView === 'india' ? (activeMetric === 'carbon' ? '800-1600' : '1000-2000') : '80-120%'})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentGreen rounded-sm"></span>
                <span className="text-slate-400">
                  Low ({currentView === 'india' ? (activeMetric === 'carbon' ? '<800' : '<1000') : '<80%'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Details panel) - Span 4/5 */}
        <div className={`${currentView === 'state' ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-6 flex flex-col`}>
          <Legend view={currentView} isDarkMode={isDarkMode} activeMetric={activeMetric} />
          
          {detailItem ? (
            <DetailPanel 
              name={detailItem.name}
              electricityConsumption={detailItem.electricityConsumption}
              carbonEmission={detailItem.carbonEmission}
              elecTier={detailItem.elecTier}
              carbTier={detailItem.carbTier}
              elecDev={detailItem.elecDev}
              carbDev={detailItem.carbDev}
              pop={detailItem.pop}
              gdp={detailItem.gdp}
              isEmissionEstimated={detailItem.isEmissionEstimated}
              isDarkMode={isDarkMode}
              averageLabel={currentView === 'india' ? 'national average' : 'state average'}
              onClose={() => {
                if (currentView === 'state') setSelectedDistrict(null);
                else setSelectedState(null);
              }}
            />
          ) : (
            <div className={`p-6 rounded-2xl border text-center py-12 flex-1 flex flex-col justify-center items-center ${
              isDarkMode ? 'border-darkBorder/40 bg-slate-900/40 text-slate-400' : 'border-slate-205 bg-white text-slate-500 shadow-sm'
            }`}>
              <HelpCircle className="h-8 w-8 mb-3 opacity-60 text-accentBlue animate-bounce" />
              <p className="text-xs font-semibold max-w-[240px] leading-relaxed">
                {currentView === 'india' 
                  ? 'Click on any state on the map to inspect district metrics.' 
                  : 'Hover/click on a pulsing district pin to inspect energy load.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Tool & Carbon vs Electricity Scatter Correlation row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Comparison Tool - Span 6 */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {currentView === 'india' ? 'State A' : 'District A'}
              </label>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {currentView === 'india' ? 'State B' : 'District B'}
              </label>
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
            averageValueElec={activeElecAvg}
            averageValueCarbon={activeCarbonAvg}
            averageLabel={currentView === 'india' ? 'National Average' : 'State Average'}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Correlation Scatter Chart: Electricity vs Carbon - Span 6 */}
        <div className={`lg:col-span-6 glass-panel p-6 rounded-2xl border ${
          isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
            <TrendingUp className="h-5 w-5 text-accentGreen" />
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Electricity Consumption vs. Carbon Emissions Correlation
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} />
                <XAxis 
                  type="number" 
                  dataKey="electricity" 
                  name="Electricity" 
                  unit=" kWh" 
                  stroke="#64748B" 
                  fontSize={10}
                  label={{ value: 'Per Capita Consumption (kWh)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="carbon" 
                  name="Carbon" 
                  unit=" kg" 
                  stroke="#64748B" 
                  fontSize={10}
                  label={{ value: 'Per Capita Emission (kg CO2)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748B', fontSize: 10 }}
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
                          <p>Electricity: <span className="font-bold">{data.electricity.toLocaleString()} kWh</span></p>
                          <p>Carbon: <span className="font-bold">{data.carbon.toLocaleString()} kg CO2</span></p>
                          <p className="text-[9px] italic text-slate-500">
                            Ratio: {(data.carbon / data.electricity).toFixed(2)} kg/kWh
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Regions" data={correlationData} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Rankings List Table */}
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
      <div className="text-[10px] text-slate-500 text-center font-medium italic">
        * Footnote: Carbon emission figures are estimated for illustrative purposes from assumed local renewable ratios.
      </div>
    </div>
  );
}

export default NationalAnalytics;
