import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, ArrowLeft, Sparkles, ArrowUpRight } from 'lucide-react';
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
import LiveNationalMap       from '../components/LiveNationalMap';
import SelectedStateBar      from '../components/SelectedStateBar';
import ConsumptionTiersDonut from '../components/ConsumptionTiersDonut';
import ConsumptionTrendChart from '../components/ConsumptionTrendChart';
import AiInsightsPanel       from '../components/AiInsightsPanel';
import EnergySourceRings     from '../components/EnergySourceRings';
import CarbonSavingsPanel    from '../components/CarbonSavingsPanel';
import ForecastBarChart      from '../components/ForecastBarChart';
import StateDistrictPredictionCard from '../components/StateDistrictPredictionCard';

// ── Data & utils ───────────────────────────────────────────────────
import { stateData, NATIONAL_AVG, NATIONAL_CARBON_AVG } from '../data/stateData';
import { getDistrictsForState }                          from '../data/districtData';
import allDistricts                                      from '../data/allDistricts';
import getColorScale                                     from '../utils/colorScale';
import { fillMissingDistricts }                          from '../utils/generateMissingDistrictData';
import { getOptimizationScore }                          from '../utils/optimizationEngine';

export default function NationalAnalytics({ onNavigateToPrediction }) {
  const { isDarkMode } = useTheme();
  const [view,             setView]           = useState('india');
  const [selectedState,    setSelectedState]  = useState(null);
  const [selectedDistrict, setSelectedDist]   = useState(null);
  const [tierFilter,       setTierFilter]     = useState('All');
  const [activeMetric,     setActiveMetric]   = useState('electricity');
  const [compareA,         setCompareA]       = useState('Maharashtra');
  const [compareB,         setCompareB]       = useState('Uttar Pradesh');

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const buttonBg = isDarkMode ? '#1E293B' : '#F8FAFC';
  const buttonBorder = isDarkMode ? '#334155' : '#CBD5E1';

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

  const selectedStateObj = useMemo(() => {
    if (!selectedState) return null;
    return stateData.find(s => s.name === selectedState);
  }, [selectedState]);

  const activeBaseAvg = useMemo(() => {
    if (selectedStateObj) {
      return activeMetric === 'carbon' ? selectedStateObj.carbonEmission : selectedStateObj.electricityConsumption;
    }
    return activeMetric === 'carbon' ? NATIONAL_CARBON_AVG : NATIONAL_AVG;
  }, [selectedStateObj, activeMetric]);

  /* ══════════════════════════════════════════════════════════════════
     NATIONAL COMMAND-CENTER VIEW
  ══════════════════════════════════════════════════════════════════ */
  if (view === 'india') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Official Government Module Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 8,
        padding: '12px 18px',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              CENTRAL ELECTRICITY AUTHORITY (CEA) • NATIONAL POWER DISPATCH
            </span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 900, color: titleColor }}>
            National Energy Transmission & State-Wise Consumption Matrix
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 10, color: labelColor, fontWeight: 500 }}>
            Real-time SCADA telemetry across 36 States & UTs • Frequency reference: 50.02 Hz in-band.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#059669',
            background: isDarkMode ? 'rgba(5, 150, 105, 0.12)' : '#DCFCE7',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            padding: '4px 10px',
            borderRadius: 5
          }}>
            ● National Grid Synchronized (POSOCO)
          </div>
        </div>
      </div>

      {/* Row 2 — Main 3-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 240px', gap: 14, alignItems: 'stretch' }}>

        {/* Col 1: Map Toolbar + Live Map + Selected State Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', gap: 8 }}>
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
              {/* AI Prediction Primary Action Button */}
              <button
                onClick={() => {
                  if (onNavigateToPrediction) {
                    onNavigateToPrediction({
                      name: selectedState || 'Karnataka',
                      isDistrict: false,
                      parentState: null
                    });
                  }
                }}
                title="Navigate to comprehensive AI Econometric Prediction dossier for selected region"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#0B296B',
                  color: '#FFFFFF',
                  border: '1px solid #1D4ED8',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(11,41,107,0.2)'
                }}
              >
                <Sparkles size={12} color="#F59E0B" />
                <span>AI Prediction</span>
                <ArrowUpRight size={11} color="#FDE68A" />
              </button>

              <SearchBar data={dataset} onSelect={n => handleSelectState(n)} isDarkMode={isDarkMode} />
              <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 5, background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: '5px 10px', fontSize: 9, fontWeight: 700, color: labelColor, cursor: 'pointer' }}>
                <Download size={11} /> Export
              </button>
            </div>
          </div>

          <div className="map-export" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden', height: 490 }}>
            <LiveNationalMap 
              selectedState={selectedState} 
              onSelectState={handleSelectState} 
              tierFilter={tierFilter}
              activeMetric={activeMetric}
              setActiveMetric={setActiveMetric}
            />
          </div>

          <SelectedStateBar selectedState={selectedState} onOpenPrediction={onNavigateToPrediction} />

          {/* Predictive Energy Consumption & Carbon Emissions Card (State Level) */}
          <StateDistrictPredictionCard 
            selectedRegion={selectedStateObj || { 
              name: 'National Baseline (India)', 
              electricityConsumption: NATIONAL_AVG, 
              carbonEmission: NATIONAL_CARBON_AVG, 
              emissionFactor: 0.82 
            }}
            isDistrict={false}
            onOpenFullDossier={onNavigateToPrediction}
          />
        </div>

        {/* Col 2: Tiers Donut + Trend Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            <ConsumptionTiersDonut activeMetric={activeMetric} />
          </div>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            <ConsumptionTrendChart baseAvg={activeBaseAvg} />
          </div>
        </div>

        {/* Col 3: AI Insights */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <AiInsightsPanel />
        </div>

      </div>

      {/* Row 3 — Bottom 3 Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <EnergySourceRings />
        </div>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <CarbonSavingsPanel />
        </div>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <ForecastBarChart />
        </div>
      </div>

      {/* Row 4 — Bottom Full-Width Comparison Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 16 }}>
          <ComparisonChart
            items={dataset}
            compareA={compareA}
            setCompareA={setCompareA}
            compareB={compareB}
            setCompareB={setCompareB}
            averageValueElec={NATIONAL_AVG}
            averageValueCarbon={NATIONAL_CARBON_AVG}
            averageLabel="National Average"
            isDarkMode={isDarkMode}
            height={260}
          />
        </div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* AI Prediction Button for State / District Drill-Down */}
              <button
                onClick={() => {
                  if (onNavigateToPrediction) {
                    onNavigateToPrediction({
                      name: selectedDistrict || selectedState,
                      isDistrict: !!selectedDistrict,
                      parentState: selectedState
                    });
                  }
                }}
                title="Open AI Prediction Dossier for this state or selected district"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#0B296B',
                  color: '#FFFFFF',
                  border: '1px solid #1D4ED8',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(11,41,107,0.2)'
                }}
              >
                <Sparkles size={12} color="#F59E0B" />
                <span>{selectedDistrict ? `AI Prediction (${selectedDistrict})` : `AI Prediction (${selectedState})`}</span>
                <ArrowUpRight size={11} color="#FDE68A" />
              </button>

              <SearchBar data={dataset} onSelect={n => setSelectedDist(n)} isDarkMode={isDarkMode} />
              <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 5, background: buttonBg, border: `1px solid ${buttonBorder}`, borderRadius: 8, padding: '5px 10px', fontSize: 9, fontWeight: 700, color: labelColor, cursor: 'pointer' }}>
                <Download size={11} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* State map + detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="map-export" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden', minHeight: 460 }}>
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

            {/* Predictive Forecast for Selected District or State */}
            <StateDistrictPredictionCard
              selectedRegion={detailItem || selectedStateObj || { name: selectedState, electricityConsumption: 1200, carbonEmission: 900, emissionFactor: 0.85 }}
              isDistrict={!!detailItem && !detailItem.isState}
              parentState={selectedState}
              onOpenFullDossier={onNavigateToPrediction}
            />
          </div>
          {detailItem ? (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
              <DetailPanel
                {...detailItem}
                parentState={detailItem.isState ? null : selectedState}
                averageLabel={detailItem.isState ? 'National Avg' : 'State Avg'}
                activeMetric={activeMetric}
                isDarkMode={isDarkMode}
                onOpenPrediction={onNavigateToPrediction}
                onClose={() => setSelectedDist(null)}
              />
            </div>
          ) : (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', textAlign: 'center', color: labelColor }}>
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
