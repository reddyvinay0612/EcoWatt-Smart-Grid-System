import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, ArrowLeft } from 'lucide-react';

// Existing components (preserved)
import StateMap from '../components/StateMap';
import DetailPanel from '../components/DetailPanel';
import SearchBar from '../components/SearchBar';
import RankingTable from '../components/RankingTable';
import Breadcrumb from '../components/Breadcrumb';
import ComparisonChart from '../components/ComparisonChart';
import FilterButtons from '../components/FilterButtons';

// New command-center components
import KpiCardsRow from '../components/KpiCardsRow';
import LiveNationalMap from '../components/LiveNationalMap';
import SelectedStateBar from '../components/SelectedStateBar';
import ConsumptionTiersDonut from '../components/ConsumptionTiersDonut';
import ConsumptionTrendChart from '../components/ConsumptionTrendChart';
import AiInsightsPanel from '../components/AiInsightsPanel';
import EnergySourceRings from '../components/EnergySourceRings';
import CarbonSavingsPanel from '../components/CarbonSavingsPanel';
import ForecastBarChart from '../components/ForecastBarChart';

// Data
import { stateData, NATIONAL_AVG, NATIONAL_CARBON_AVG } from '../data/stateData';
import { getDistrictsForState } from '../data/districtData';
import allDistricts from '../data/allDistricts';
import getColorScale from '../utils/colorScale';
import { fillMissingDistricts } from '../utils/generateMissingDistrictData';
import { getOptimizationScore } from '../utils/optimizationEngine';

function NationalAnalytics({ setViewMode }) {
  const [currentView, setCurrentView] = useState('india');
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [tierFilter, setTierFilter] = useState('All');
  const [isDarkMode] = useState(true);
  const [activeMetric, setActiveMetric] = useState('electricity');
  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  // Optimization rankings
  const stateOptimizationLists = useMemo(() => {
    const statesWithScores = stateData.map(s => ({
      ...s,
      score: getOptimizationScore(s.electricityConsumption, s.carbonEmission, NATIONAL_AVG, NATIONAL_CARBON_AVG)
    }));
    return {
      needyStates: [...statesWithScores].sort((a, b) => b.score - a.score).slice(0, 5),
      benchmarkStates: [...statesWithScores].sort((a, b) => a.score - b.score).slice(0, 5),
    };
  }, []);

  // Districts for selected state
  const districts = useMemo(() => {
    if (!selectedState) return [];
    const stateObj = stateData.find(s => s.name === selectedState);
    const stateAvg = stateObj?.electricityConsumption || 1000;
    const stateFactor = stateObj?.emissionFactor || 0.85;
    const existing = getDistrictsForState(selectedState, stateAvg);
    const allStateDistrictsList = allDistricts[selectedState] || [];
    return fillMissingDistricts(selectedState, existing, allStateDistrictsList, stateAvg, stateFactor);
  }, [selectedState]);

  // Active dataset
  const activeDataset = useMemo(() => {
    if (currentView === 'india') {
      return stateData.map(s => {
        const { tier: elecTier } = getColorScale(s.electricityConsumption);
        const { tier: carbTier } = getColorScale(s.carbonEmission, null, 'carbon');
        return { ...s, value: activeMetric === 'carbon' ? s.carbonEmission : s.electricityConsumption, tier: activeMetric === 'carbon' ? carbTier : elecTier, elecTier, carbTier };
      });
    } else {
      const stateAvg = stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
      const stateCarbonAvg = stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
      return districts.map(d => {
        const { tier: elecTier } = getColorScale(d.electricityConsumption, stateAvg);
        const { tier: carbTier } = getColorScale(d.carbonEmission, stateCarbonAvg, 'carbon');
        return { ...d, value: activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption, tier: activeMetric === 'carbon' ? carbTier : elecTier, elecTier, carbTier };
      });
    }
  }, [currentView, selectedState, districts, activeMetric]);

  const comparisonItems = useMemo(() => ({
    itemA: activeDataset.find(x => x.name === compareA),
    itemB: activeDataset.find(x => x.name === compareB),
  }), [compareA, compareB, activeDataset]);

  const handleSelectState = (stateName) => {
    setSelectedState(stateName);
    setCurrentView('state');
    setSelectedDistrict(null);
  };

  const handleNavigate = (view, state = null, district = null) => {
    setCurrentView(view);
    if (view === 'india') { setSelectedState(null); setSelectedDistrict(null); }
    else { setSelectedState(state); setSelectedDistrict(district); }
  };

  const handleExportPng = () => {
    const node = document.querySelector('.map-container-export');
    if (!node) return;
    toPng(node, { backgroundColor: '#080C14', style: { borderRadius: '16px' } })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = `${currentView}_${activeMetric}_map.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch(err => console.error('Export failed', err));
  };

  // Detail item for selected state/district
  const detailItem = useMemo(() => {
    if (currentView === 'india') {
      if (!selectedState) return null;
      const stateObj = stateData.find(s => s.name === selectedState);
      if (!stateObj) return null;
      const elecDev = ((stateObj.electricityConsumption - NATIONAL_AVG) / NATIONAL_AVG) * 100;
      const carbDev = ((stateObj.carbonEmission - NATIONAL_CARBON_AVG) / NATIONAL_CARBON_AVG) * 100;
      const { tier: elecTier } = getColorScale(stateObj.electricityConsumption);
      const { tier: carbTier } = getColorScale(stateObj.carbonEmission, null, 'carbon');
      return { name: stateObj.name, electricityConsumption: stateObj.electricityConsumption, carbonEmission: stateObj.carbonEmission, pop: stateObj.pop, gdp: stateObj.gdp, elecTier, carbTier, elecDev: elecDev.toFixed(1), carbDev: carbDev.toFixed(1), isState: true, emissionFactor: stateObj.emissionFactor };
    } else {
      if (!selectedDistrict) return null;
      const dist = districts.find(d => d.name === selectedDistrict);
      if (!dist) return null;
      const stateObj = stateData.find(s => s.name === selectedState);
      const stateAvg = stateObj?.electricityConsumption || 1000;
      const stateCarbonAvg = stateObj?.carbonEmission || 800;
      const elecDev = ((dist.electricityConsumption - stateAvg) / stateAvg) * 100;
      const carbDev = ((dist.carbonEmission - stateCarbonAvg) / stateCarbonAvg) * 100;
      const { tier: elecTier } = getColorScale(dist.electricityConsumption, stateAvg);
      const { tier: carbTier } = getColorScale(dist.carbonEmission, stateCarbonAvg, 'carbon');
      return { name: dist.name, electricityConsumption: dist.electricityConsumption, carbonEmission: dist.carbonEmission, elecTier, carbTier, elecDev: elecDev.toFixed(1), carbDev: carbDev.toFixed(1), isState: false };
    }
  }, [currentView, selectedState, selectedDistrict, districts]);

  // ---- NATIONAL COMMAND CENTER VIEW ----
  if (currentView === 'india') {
    return (
      <div className="space-y-3">
        {/* KPI Cards Row */}
        <KpiCardsRow />

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_220px] gap-3">

          {/* Left: Live map + state bar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FilterButtons tierFilter={tierFilter} setTierFilter={setTierFilter} />
              </div>
              <div className="flex items-center space-x-2">
                <SearchBar data={activeDataset} onSelect={name => { setSelectedState(name); }} />
                <button
                  onClick={handleExportPng}
                  className="flex items-center space-x-1.5 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="map-container-export flex-1 min-h-[380px]">
              <LiveNationalMap
                selectedState={selectedState}
                onSelectState={handleSelectState}
                tierFilter={tierFilter}
              />
            </div>
            <SelectedStateBar selectedState={selectedState} />
          </div>

          {/* Center-right: Tiers donut + trend chart */}
          <div className="flex flex-col gap-3">
            <ConsumptionTiersDonut />
            <ConsumptionTrendChart />
          </div>

          {/* Far right: AI insights */}
          <AiInsightsPanel />
        </div>

        {/* Bottom 3 panels row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <EnergySourceRings />
          <CarbonSavingsPanel />
          <ForecastBarChart />
        </div>

        {/* Ranking leaderboard (preserved) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">States Needing Optimization</p>
            <RankingTable data={stateOptimizationLists.needyStates} onSelect={handleSelectState} metric={activeMetric} type="needy" />
          </div>
          <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">Top Performing States</p>
            <RankingTable data={stateOptimizationLists.benchmarkStates} onSelect={handleSelectState} metric={activeMetric} type="benchmark" />
          </div>
        </div>

        {/* Comparison chart (preserved) */}
        <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">State Comparison Tool</p>
          <ComparisonChart
            items={activeDataset}
            compareA={compareA} setCompareA={setCompareA}
            compareB={compareB} setCompareB={setCompareB}
            comparisonItems={comparisonItems}
            activeMetric={activeMetric}
          />
        </div>
      </div>
    );
  }

  // ---- STATE DRILL-DOWN VIEW (preserved) ----
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="state-view"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Breadcrumb and controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNavigate('india')}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>National Map</span>
            </button>
            <Breadcrumb currentView={currentView} selectedState={selectedState} selectedDistrict={selectedDistrict} onNavigate={handleNavigate} />
          </div>
          <div className="flex items-center space-x-2">
            <FilterButtons tierFilter={tierFilter} setTierFilter={setTierFilter} />
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              {['electricity', 'carbon'].map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all capitalize ${activeMetric === m ? 'bg-accentBlue text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <SearchBar data={activeDataset} onSelect={name => setSelectedDistrict(name)} />
            <button onClick={handleExportPng} className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all">
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* State map + detail panel */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="map-container-export bg-[#131824] border border-white/5 rounded-xl overflow-hidden" style={{ minHeight: 480 }}>
            <StateMap
              stateName={selectedState}
              districts={activeDataset}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={name => setSelectedDistrict(name)}
              tierFilter={tierFilter}
              isDarkMode={isDarkMode}
              activeMetric={activeMetric}
            />
          </div>

          {detailItem && (
            <DetailPanel item={detailItem} currentView={currentView} activeMetric={activeMetric} />
          )}
        </div>

        {/* Ranking + Comparison for state view */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">District Rankings — {selectedState}</p>
            <RankingTable data={activeDataset} onSelect={name => setSelectedDistrict(name)} metric={activeMetric} type="needy" />
          </div>
          <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">District Comparison</p>
            <ComparisonChart
              items={activeDataset}
              compareA={compareA} setCompareA={setCompareA}
              compareB={compareB} setCompareB={setCompareB}
              comparisonItems={comparisonItems}
              activeMetric={activeMetric}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NationalAnalytics;
