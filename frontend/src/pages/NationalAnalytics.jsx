import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ── Preserved existing components ──────────────────────────────────
import StateMap        from '../components/StateMap';
import DetailPanel     from '../components/DetailPanel';
import SearchBar       from '../components/SearchBar';
import RankingTable    from '../components/RankingTable';
import Breadcrumb      from '../components/Breadcrumb';
import ComparisonChart from '../components/ComparisonChart';
import FilterButtons   from '../components/FilterButtons';

// ── Command-center panels ───────────────────────────────────────────
import KpiCardsRow           from '../components/KpiCardsRow';
import LiveNationalMap       from '../components/LiveNationalMap';
import SelectedStateBar      from '../components/SelectedStateBar';
import ConsumptionTiersDonut from '../components/ConsumptionTiersDonut';
import ConsumptionTrendChart from '../components/ConsumptionTrendChart';
import AiInsightsPanel       from '../components/AiInsightsPanel';
import EnergySourceRings     from '../components/EnergySourceRings';
import CarbonSavingsPanel    from '../components/CarbonSavingsPanel';
import ForecastBarChart      from '../components/ForecastBarChart';

// ── Data & utils ───────────────────────────────────────────────────
import { stateData, NATIONAL_AVG, NATIONAL_CARBON_AVG } from '../data/stateData';
import { getDistrictsForState }                          from '../data/districtData';
import allDistricts                                      from '../data/allDistricts';
import getColorScale                                     from '../utils/colorScale';
import { fillMissingDistricts }                          from '../utils/generateMissingDistrictData';
import { getOptimizationScore }                          from '../utils/optimizationEngine';

export default function NationalAnalytics() {
  const { isDarkMode } = useTheme();
  const [view,             setView]           = useState('india');
  const [selectedState,    setSelectedState]  = useState(null);
  const [selectedDistrict, setSelectedDist]   = useState(null);
  const [tierFilter,       setTierFilter]     = useState('All');
  const [activeMetric,     setActiveMetric]   = useState('electricity');
  const [compareA,         setCompareA]       = useState('Maharashtra');
  const [compareB,         setCompareB]       = useState('Uttar Pradesh');

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const buttonBg = isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const buttonBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1';

  // Robust state selector handler
  const handleSelectState = (input) => {
    if (!input) return;
    const match = stateData.find(s => 
      s.name.toLowerCase() === String(input).toLowerCase() || 
      s.id.toLowerCase() === String(input).toLowerCase()
    );
    const stateName = match ? match.name : String(input);
    setSelectedState(stateName);
    setView('state');
    setSelectedDist(null);
  };

  const handleNav = (v, s = null, d = null) => {
    setView(v);
    if (v === 'india') {
      setSelectedState(null);
      setSelectedDist(null);
    } else {
      setSelectedState(s);
      setSelectedDist(d);
    }
  };

  // Optimization rankings
  const ranked = useMemo(() => {
    const s = stateData.map(x => ({ ...x, score: getOptimizationScore(x.electricityConsumption, x.carbonEmission, NATIONAL_AVG, NATIONAL_CARBON_AVG) }));
    return { needy: [...s].sort((a,b)=>b.score-a.score).slice(0,5), bench: [...s].sort((a,b)=>a.score-b.score).slice(0,5) };
  }, []);

  // Districts for selected state
  const districts = useMemo(() => {
    if (!selectedState) return [];
    const obj = stateData.find(s => s.name === selectedState);
    const avg = obj?.electricityConsumption || 1000, fac = obj?.emissionFactor || 0.85;
    return fillMissingDistricts(selectedState, getDistrictsForState(selectedState, avg), allDistricts[selectedState] || [], avg, fac);
  }, [selectedState]);

  // Active dataset
  const dataset = useMemo(() => {
    if (view === 'india') return stateData.map(s => {
      const { tier: et } = getColorScale(s.electricityConsumption);
      const { tier: ct } = getColorScale(s.carbonEmission, null, 'carbon');
      return { ...s, value: activeMetric === 'carbon' ? s.carbonEmission : s.electricityConsumption, tier: activeMetric === 'carbon' ? ct : et, elecTier: et, carbTier: ct, isState: true };
    });
    const sa = stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
    const ca = stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
    return districts.map(d => {
      const { tier: et } = getColorScale(d.electricityConsumption, sa);
      const { tier: ct } = getColorScale(d.carbonEmission, ca, 'carbon');
      return { ...d, value: activeMetric === 'carbon' ? d.carbonEmission : d.electricityConsumption, tier: activeMetric === 'carbon' ? ct : et, elecTier: et, carbTier: ct, isState: false };
    });
  }, [view, selectedState, districts, activeMetric]);

  const detailItem = useMemo(() => {
    if (view === 'india') {
      if (!selectedState) return null;
      const s = stateData.find(x => x.name === selectedState);
      if (!s) return null;
      const { tier: et } = getColorScale(s.electricityConsumption);
      const { tier: ct } = getColorScale(s.carbonEmission, null, 'carbon');
      return {
        name: s.name,
        electricityConsumption: s.electricityConsumption,
        carbonEmission: s.carbonEmission,
        pop: s.pop,
        gdp: s.gdp,
        elecTier: et,
        carbTier: ct,
        elecDev: (((s.electricityConsumption - NATIONAL_AVG) / NATIONAL_AVG) * 100).toFixed(1),
        carbDev: (((s.carbonEmission - NATIONAL_CARBON_AVG) / NATIONAL_CARBON_AVG) * 100).toFixed(1),
        isState: true,
        emissionFactor: s.emissionFactor
      };
    }
    if (!selectedDistrict) return null;
    const d = districts.find(x => x.name.toLowerCase() === String(selectedDistrict).toLowerCase());
    if (!d) return null;
    const sa = stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000;
    const ca = stateData.find(s => s.name === selectedState)?.carbonEmission || 800;
    const { tier: et } = getColorScale(d.electricityConsumption, sa);
    const { tier: ct } = getColorScale(d.carbonEmission, ca, 'carbon');
    return {
      name: d.name,
      electricityConsumption: d.electricityConsumption,
      carbonEmission: d.carbonEmission,
      elecTier: et,
      carbTier: ct,
      elecDev: (((d.electricityConsumption - sa) / sa) * 100).toFixed(1),
      carbDev: (((d.carbonEmission - ca) / ca) * 100).toFixed(1),
      isState: false
    };
  }, [view, selectedState, selectedDistrict, districts]);

  const handleExport = () => {
    const n = document.querySelector('.map-export');
    if (!n) return;
    toPng(n, { backgroundColor: isDarkMode ? '#0a0e17' : '#F8FAFC' }).then(u => {
      const a = document.createElement('a');
      a.download = `map_${activeMetric}.png`;
      a.href = u;
      a.click();
    }).catch(console.error);
  };

  /* ══════════════════════════════════════════════════════════════════
     NATIONAL COMMAND-CENTER VIEW
  ══════════════════════════════════════════════════════════════════ */
  if (view === 'india') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Row 1 — KPI Summary Cards */}
      <KpiCardsRow />

      {/* Row 2 — Main 3-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 240px', gap: 14, alignItems: 'stretch' }}>

        {/* Col 1: Map Toolbar + Live Map + Selected State Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilterButtons tierFilter={tierFilter} onFilterChange={setTierFilter} isDarkMode={isDarkMode} />
              
              {/* Metric Selector Toggler */}
              <div style={{ display: 'flex', background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: 2 }}>
                {['electricity', 'carbon'].map(m => (
                  <button key={m} onClick={() => setActiveMetric(m)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', border: 'none', background: activeMetric === m ? '#3B82F6' : 'transparent', color: activeMetric === m ? '#fff' : labelColor }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SearchBar data={dataset} onSelect={n => handleSelectState(n)} isDarkMode={isDarkMode} />
              <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 5, background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: '5px 10px', fontSize: 9, fontWeight: 700, color: labelColor, cursor: 'pointer' }}>
                <Download size={11} /> Export
              </button>
            </div>
          </div>

          <div className="map-export" style={{ height: 380 }}>
            <LiveNationalMap 
              selectedState={selectedState} 
              onSelectState={handleSelectState} 
              tierFilter={tierFilter}
              activeMetric={activeMetric}
              setActiveMetric={setActiveMetric}
            />
          </div>

          <SelectedStateBar selectedState={selectedState} />
        </div>

        {/* Col 2: Tiers Donut + Trend Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ConsumptionTiersDonut activeMetric={activeMetric} />
          <ConsumptionTrendChart />
        </div>

        {/* Col 3: AI Insights */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AiInsightsPanel />
        </div>

      </div>

      {/* Row 3 — Bottom 3 Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <EnergySourceRings />
        <CarbonSavingsPanel />
        <ForecastBarChart />
      </div>

    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     STATE DRILL-DOWN VIEW (preserves full district detail & maps)
  ══════════════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence mode="wait">
      <motion.div key="sv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => handleNav('india')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: labelColor, cursor: 'pointer' }}>
              <ArrowLeft size={13} /> National Map
            </button>
            <Breadcrumb currentView={view} selectedState={selectedState} selectedDistrict={selectedDistrict} onNavigate={handleNav} isDarkMode={isDarkMode} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <FilterButtons tierFilter={tierFilter} onFilterChange={setTierFilter} isDarkMode={isDarkMode} />
            <div style={{ display: 'flex', background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: 2 }}>
              {['electricity', 'carbon'].map(m => (
                <button key={m} onClick={() => setActiveMetric(m)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', border: 'none', background: activeMetric === m ? '#3B82F6' : 'transparent', color: activeMetric === m ? '#fff' : labelColor }}>
                  {m}
                </button>
              ))}
            </div>
            <SearchBar data={dataset} onSelect={n => setSelectedDist(n)} isDarkMode={isDarkMode} />
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 5, background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: '5px 10px', fontSize: 9, fontWeight: 700, color: labelColor, cursor: 'pointer' }}>
              <Download size={11} /> Export
            </button>
          </div>
        </div>

        {/* State map + detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
          <div className="map-export" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden', minHeight: 480 }}>
            <StateMap
              selectedState={selectedState}
              districts={dataset}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={d => setSelectedDist(typeof d === 'object' ? d.name : d)}
              tierFilter={tierFilter}
              isDarkMode={isDarkMode}
              stateAverage={
                activeMetric === 'carbon'
                  ? (stateData.find(s => s.name === selectedState)?.carbonEmission || 800)
                  : (stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000)
              }
              activeMetric={activeMetric}
            />
          </div>
          {detailItem ? (
            <DetailPanel
              {...detailItem}
              parentState={detailItem.isState ? null : selectedState}
              averageLabel={detailItem.isState ? 'National Avg' : 'State Avg'}
              activeMetric={activeMetric}
              isDarkMode={isDarkMode}
              onClose={() => setSelectedDist(null)}
            />
          ) : (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: labelColor }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Select a district on the map or from the list to view detailed audit</span>
            </div>
          )}
        </div>

        {/* District Rankings + Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
              District Rankings — {selectedState}
            </div>
            <RankingTable data={dataset} onSelect={d => setSelectedDist(typeof d === 'object' ? d.name : d)} metric={activeMetric} type="needy" isDarkMode={isDarkMode} />
          </div>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 16 }}>
            <ComparisonChart
              items={dataset}
              compareA={compareA}
              setCompareA={setCompareA}
              compareB={compareB}
              setCompareB={setCompareB}
              averageValueElec={stateData.find(s => s.name === selectedState)?.electricityConsumption || 1000}
              averageValueCarbon={stateData.find(s => s.name === selectedState)?.carbonEmission || 800}
              averageLabel="State Average"
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
