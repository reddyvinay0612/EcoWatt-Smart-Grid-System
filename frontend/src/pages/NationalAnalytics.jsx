import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, ArrowLeft } from 'lucide-react';

// Existing preserved components
import StateMap from '../components/StateMap';
import DetailPanel from '../components/DetailPanel';
import SearchBar from '../components/SearchBar';
import RankingTable from '../components/RankingTable';
import Breadcrumb from '../components/Breadcrumb';
import ComparisonChart from '../components/ComparisonChart';
import FilterButtons from '../components/FilterButtons';

// New command-center panels
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
  const [activeMetric, setActiveMetric] = useState('electricity');
  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  const stateOptimizationLists = useMemo(() => {
    const scored = stateData.map(s => ({
      ...s,
      score: getOptimizationScore(s.electricityConsumption, s.carbonEmission, NATIONAL_AVG, NATIONAL_CARBON_AVG),
    }));
    return {
      needyStates: [...scored].sort((a, b) => b.score - a.score).slice(0, 5),
      benchmarkStates: [...scored].sort((a, b) => a.score - b.score).slice(0, 5),
    };
  }, []);

  const districts = useMemo(() => {
    if (!selectedState) return [];
    const stateObj = stateData.find(s => s.name === selectedState);
    const stateAvg = stateObj?.electricityConsumption || 1000;
    const stateFactor = stateObj?.emissionFactor || 0.85;
    const existing = getDistrictsForState(selectedState, stateAvg);
    const allList = allDistricts[selectedState] || [];
    return fillMissingDistricts(selectedState, existing, allList, stateAvg, stateFactor);
  }, [selectedState]);

  const activeDataset = useMemo(() => {
    if (currentView === 'india') {
      return stateData.map(s => {
        const { tier: elecTier } = getColorScale(s.electricityConsumption);
        const { tier: carbTier } = getColorScale(s.carbonEmission, null, 'carbon');
        return { ...s, value: activeMetric === 'carbon' ? s.carbonEmission : s.electricityConsumption, tier: activeMetric === 'carbon' ? carbTier : elecTier, elecTier, carbTier };
      });
    }
    const stateAvg = stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
    const stateCarbonAvg = stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
    return districts.map(d => {
      const { tier: elecTier } = getColorScale(d.electricityConsumption, stateAvg);
      const { tier: carbTier } = getColorScale(d.carbonEmission, stateCarbonAvg, 'carbon');
      return { ...d, value: activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption, tier: activeMetric === 'carbon' ? carbTier : elecTier, elecTier, carbTier };
    });
  }, [currentView, selectedState, districts, activeMetric]);

  const comparisonItems = useMemo(() => ({
    itemA: activeDataset.find(x => x.name === compareA),
    itemB: activeDataset.find(x => x.name === compareB),
  }), [compareA, compareB, activeDataset]);

  const detailItem = useMemo(() => {
    if (currentView === 'india') {
      if (!selectedState) return null;
      const s = stateData.find(x => x.name === selectedState);
      if (!s) return null;
      const { tier: elecTier } = getColorScale(s.electricityConsumption);
      const { tier: carbTier } = getColorScale(s.carbonEmission, null, 'carbon');
      return { name: s.name, electricityConsumption: s.electricityConsumption, carbonEmission: s.carbonEmission, pop: s.pop, gdp: s.gdp, elecTier, carbTier, elecDev: (((s.electricityConsumption - NATIONAL_AVG) / NATIONAL_AVG) * 100).toFixed(1), carbDev: (((s.carbonEmission - NATIONAL_CARBON_AVG) / NATIONAL_CARBON_AVG) * 100).toFixed(1), isState: true, emissionFactor: s.emissionFactor };
    }
    if (!selectedDistrict) return null;
    const d = districts.find(x => x.name === selectedDistrict);
    if (!d) return null;
    const stateObj = stateData.find(s => s.name === selectedState);
    const stateAvg = stateObj?.electricityConsumption || 1000;
    const stateCarbonAvg = stateObj?.carbonEmission || 800;
    const { tier: elecTier } = getColorScale(d.electricityConsumption, stateAvg);
    const { tier: carbTier } = getColorScale(d.carbonEmission, stateCarbonAvg, 'carbon');
    return { name: d.name, electricityConsumption: d.electricityConsumption, carbonEmission: d.carbonEmission, elecTier, carbTier, elecDev: (((d.electricityConsumption - stateAvg) / stateAvg) * 100).toFixed(1), carbDev: (((d.carbonEmission - stateCarbonAvg) / stateCarbonAvg) * 100).toFixed(1), isState: false };
  }, [currentView, selectedState, selectedDistrict, districts]);

  const handleSelectState = (name) => {
    setSelectedState(name);
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
    toPng(node, { backgroundColor: '#080C14' }).then(url => {
      const a = document.createElement('a');
      a.download = `${currentView}_${activeMetric}_map.png`;
      a.href = url;
      a.click();
    }).catch(console.error);
  };

  // ══════════════════════════════════════════════════════════════════
  //  NATIONAL COMMAND-CENTER LAYOUT
  // ══════════════════════════════════════════════════════════════════
  if (currentView === 'india') {
    return (
      <div className="flex flex-col gap-3 h-full">

        {/* Row 1 — KPI Cards */}
        <KpiCardsRow />

        {/* Row 2 — Main 3-column grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 240px 240px' }}>

          {/* ── Col 1: Live map + toolbar + selected state bar ── */}
          <div className="flex flex-col gap-2">
            {/* Search / filter toolbar */}
            <div className="flex items-center justify-between gap-2">
              <FilterButtons tierFilter={tierFilter} setTierFilter={setTierFilter} />
              <div className="flex items-center gap-2">
                <SearchBar data={activeDataset} onSelect={name => setSelectedState(name)} />
                <button
                  onClick={handleExportPng}
                  className="flex items-center space-x-1.5 bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Download className="h-3 w-3" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* The choropleth map */}
            <div className="map-container-export flex-1 min-h-[370px]">
              <LiveNationalMap
                selectedState={selectedState}
                onSelectState={handleSelectState}
                tierFilter={tierFilter}
              />
            </div>

            {/* Selected state info bar */}
            <SelectedStateBar selectedState={selectedState} />
          </div>

          {/* ── Col 2: Tiers donut + Trend chart ── */}
          <div className="flex flex-col gap-3">
            <ConsumptionTiersDonut />
            <div className="flex-1">
              <ConsumptionTrendChart />
            </div>
          </div>

          {/* ── Col 3: AI Insights ── */}
          <AiInsightsPanel />
        </div>

        {/* Row 3 — Bottom panels */}
        <div className="grid grid-cols-3 gap-3">
          <EnergySourceRings />
          <CarbonSavingsPanel />
          <ForecastBarChart />
        </div>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  STATE DRILL-DOWN LAYOUT (preserved)
  // ══════════════════════════════════════════════════════════════════
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
        {/* Header row */}
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
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <FilterButtons tierFilter={tierFilter} setTierFilter={setTierFilter} />
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              {['electricity', 'carbon'].map(m => (
                <button key={m} onClick={() => setActiveMetric(m)} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all capitalize ${activeMetric === m ? 'bg-accentBlue text-white' : 'text-slate-400 hover:text-slate-200'}`}>
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

        {/* Map + detail */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="map-container-export bg-[#131824] border border-white/5 rounded-xl overflow-hidden" style={{ minHeight: 480 }}>
            <StateMap
              stateName={selectedState}
              districts={activeDataset}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={name => setSelectedDistrict(name)}
              tierFilter={tierFilter}
              isDarkMode={true}
              activeMetric={activeMetric}
            />
          </div>
          {detailItem && <DetailPanel item={detailItem} currentView={currentView} activeMetric={activeMetric} />}
        </div>

        {/* Rankings + Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">District Rankings — {selectedState}</p>
            <RankingTable data={activeDataset} onSelect={name => setSelectedDistrict(name)} metric={activeMetric} type="needy" />
          </div>
          <div className="bg-[#131824] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">District Comparison</p>
            <ComparisonChart items={activeDataset} compareA={compareA} setCompareA={setCompareA} compareB={compareB} setCompareB={setCompareB} comparisonItems={comparisonItems} activeMetric={activeMetric} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NationalAnalytics;
