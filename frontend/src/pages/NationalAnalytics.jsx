import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, ArrowLeft } from 'lucide-react';

// ── Preserved existing components ──────────────────────────────────
import StateMap       from '../components/StateMap';
import DetailPanel    from '../components/DetailPanel';
import SearchBar      from '../components/SearchBar';
import RankingTable   from '../components/RankingTable';
import Breadcrumb     from '../components/Breadcrumb';
import ComparisonChart from '../components/ComparisonChart';
import FilterButtons  from '../components/FilterButtons';

// ── New command-center panels ───────────────────────────────────────
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

export default function NationalAnalytics({ setViewMode }) {
  const [view,             setView]           = useState('india');
  const [selectedState,    setSelectedState]  = useState(null);
  const [selectedDistrict, setSelectedDist]   = useState(null);
  const [tierFilter,       setTierFilter]     = useState('All');
  const [activeMetric,     setActiveMetric]   = useState('electricity');
  const [compareA,         setCompareA]       = useState('Maharashtra');
  const [compareB,         setCompareB]       = useState('Uttar Pradesh');

  // Optimization rankings
  const ranked = useMemo(() => {
    const s = stateData.map(x => ({ ...x, score: getOptimizationScore(x.electricityConsumption, x.carbonEmission, NATIONAL_AVG, NATIONAL_CARBON_AVG) }));
    return { needy: [...s].sort((a,b)=>b.score-a.score).slice(0,5), bench: [...s].sort((a,b)=>a.score-b.score).slice(0,5) };
  }, []);

  // Districts
  const districts = useMemo(() => {
    if (!selectedState) return [];
    const obj = stateData.find(s=>s.name===selectedState);
    const avg = obj?.electricityConsumption||1000, fac = obj?.emissionFactor||0.85;
    return fillMissingDistricts(selectedState, getDistrictsForState(selectedState,avg), allDistricts[selectedState]||[], avg, fac);
  }, [selectedState]);

  // Active dataset
  const dataset = useMemo(() => {
    if (view==='india') return stateData.map(s=>{
      const {tier:et}=getColorScale(s.electricityConsumption), {tier:ct}=getColorScale(s.carbonEmission,null,'carbon');
      return {...s, value:activeMetric==='carbon'?s.carbonEmission:s.electricityConsumption, tier:activeMetric==='carbon'?ct:et, elecTier:et, carbTier:ct};
    });
    const sa=stateData.find(s=>s.name===selectedState)?.electricityConsumption||1000;
    const ca=stateData.find(s=>s.name===selectedState)?.carbonEmission||800;
    return districts.map(d=>{
      const {tier:et}=getColorScale(d.electricityConsumption,sa), {tier:ct}=getColorScale(d.carbonEmission,ca,'carbon');
      return {...d, value:activeMetric==='carbon'?d.carbonEmission:d.electricityConsumption, tier:activeMetric==='carbon'?ct:et, elecTier:et, carbTier:ct};
    });
  }, [view, selectedState, districts, activeMetric]);

  const cmpItems = useMemo(()=>({ itemA:dataset.find(x=>x.name===compareA), itemB:dataset.find(x=>x.name===compareB) }),[compareA,compareB,dataset]);

  const detailItem = useMemo(()=>{
    if (view==='india'){
      if (!selectedState) return null;
      const s=stateData.find(x=>x.name===selectedState); if(!s) return null;
      const {tier:et}=getColorScale(s.electricityConsumption), {tier:ct}=getColorScale(s.carbonEmission,null,'carbon');
      return {name:s.name,electricityConsumption:s.electricityConsumption,carbonEmission:s.carbonEmission,pop:s.pop,gdp:s.gdp,elecTier:et,carbTier:ct,elecDev:(((s.electricityConsumption-NATIONAL_AVG)/NATIONAL_AVG)*100).toFixed(1),carbDev:(((s.carbonEmission-NATIONAL_CARBON_AVG)/NATIONAL_CARBON_AVG)*100).toFixed(1),isState:true,emissionFactor:s.emissionFactor};
    }
    if (!selectedDistrict) return null;
    const d=districts.find(x=>x.name===selectedDistrict); if(!d) return null;
    const sa=stateData.find(s=>s.name===selectedState)?.electricityConsumption||1000;
    const ca=stateData.find(s=>s.name===selectedState)?.carbonEmission||800;
    const {tier:et}=getColorScale(d.electricityConsumption,sa), {tier:ct}=getColorScale(d.carbonEmission,ca,'carbon');
    return {name:d.name,electricityConsumption:d.electricityConsumption,carbonEmission:d.carbonEmission,elecTier:et,carbTier:ct,elecDev:(((d.electricityConsumption-sa)/sa)*100).toFixed(1),carbDev:(((d.carbonEmission-ca)/ca)*100).toFixed(1),isState:false};
  },[view,selectedState,selectedDistrict,districts]);

  const handleSelectState = name => { setSelectedState(name); setView('state'); setSelectedDist(null); };
  const handleNav = (v,s=null,d=null) => { setView(v); if(v==='india'){setSelectedState(null);setSelectedDist(null);}else{setSelectedState(s);setSelectedDist(d);} };
  const handleExport = () => {
    const n=document.querySelector('.map-export'); if(!n) return;
    toPng(n,{backgroundColor:'#0a0e17'}).then(u=>{const a=document.createElement('a');a.download=`map_${activeMetric}.png`;a.href=u;a.click();}).catch(console.error);
  };

  /* ══════════════════════════════════════════════════════════════════
     NATIONAL COMMAND-CENTER VIEW
  ══════════════════════════════════════════════════════════════════ */
  if (view === 'india') return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, height:'100%' }}>

      {/* Row 1 — KPI Cards */}
      <KpiCardsRow />

      {/* Row 2 — Map | Tiers+Trend | AI Insights */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 230px 230px', gap:10, flex:'1 1 auto', minHeight:0 }}>

        {/* Col 1: map + toolbar + state bar */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, minHeight:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexShrink:0 }}>
            <FilterButtons tierFilter={tierFilter} setTierFilter={setTierFilter} />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <SearchBar data={dataset} onSelect={n=>setSelectedState(n)} />
              <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 10px', fontSize:9, fontWeight:700, color:'#94a3b8', cursor:'pointer' }}>
                <Download size={11} /> Export
              </button>
            </div>
          </div>
          <div className="map-export" style={{ flex:'1 1 auto', minHeight:0 }}>
            <LiveNationalMap selectedState={selectedState} onSelectState={handleSelectState} tierFilter={tierFilter} />
          </div>
          <div style={{ flexShrink:0 }}>
            <SelectedStateBar selectedState={selectedState} />
          </div>
        </div>

        {/* Col 2: Tiers donut + Trend chart stacked */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
          <div style={{ flexShrink:0 }}>
            <ConsumptionTiersDonut />
          </div>
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
            <ConsumptionTrendChart />
          </div>
        </div>

        {/* Col 3: AI Insights (full height) */}
        <div style={{ minHeight:0 }}>
          <AiInsightsPanel />
        </div>
      </div>

      {/* Row 3 — Energy Rings | Carbon Savings | Forecast */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, flexShrink:0 }}>
        <EnergySourceRings />
        <CarbonSavingsPanel />
        <ForecastBarChart />
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     STATE DRILL-DOWN VIEW (all existing functionality preserved)
  ══════════════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence mode="wait">
      <motion.div key="sv" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.3}} style={{display:'flex',flexDirection:'column',gap:14}}>

        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={()=>handleNav('india')} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 12px', fontSize:10, fontWeight:700, color:'#94a3b8', cursor:'pointer' }}>
              <ArrowLeft size={13} /> National Map
            </button>
            <Breadcrumb currentView={view} selectedState={selectedState} selectedDistrict={selectedDistrict} onNavigate={handleNav} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <FilterButtons tierFilter={tierFilter} setTierFilter={setTierFilter} />
            <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:2 }}>
              {['electricity','carbon'].map(m=>(
                <button key={m} onClick={()=>setActiveMetric(m)} style={{ padding:'4px 12px', borderRadius:6, fontSize:10, fontWeight:700, textTransform:'capitalize', cursor:'pointer', border:'none', background:activeMetric===m?'#3B82F6':'transparent', color:activeMetric===m?'#fff':'#94a3b8' }}>{m}</button>
              ))}
            </div>
            <SearchBar data={dataset} onSelect={n=>setSelectedDist(n)} />
            <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 10px', fontSize:9, fontWeight:700, color:'#94a3b8', cursor:'pointer' }}>
              <Download size={11} /> Export
            </button>
          </div>
        </div>

        {/* State map + detail */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14 }}>
          <div className="map-export" style={{ background:'#131824', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden', minHeight:480 }}>
            <StateMap stateName={selectedState} districts={dataset} selectedDistrict={selectedDistrict} onSelectDistrict={n=>setSelectedDist(n)} tierFilter={tierFilter} isDarkMode={true} activeMetric={activeMetric} />
          </div>
          {detailItem && <DetailPanel item={detailItem} currentView={view} activeMetric={activeMetric} />}
        </div>

        {/* Rankings + Comparison */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'#131824', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:10, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>District Rankings — {selectedState}</div>
            <RankingTable data={dataset} onSelect={n=>setSelectedDist(n)} metric={activeMetric} type="needy" />
          </div>
          <div style={{ background:'#131824', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:10, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>District Comparison</div>
            <ComparisonChart items={dataset} compareA={compareA} setCompareA={setCompareA} compareB={compareB} setCompareB={setCompareB} comparisonItems={cmpItems} activeMetric={activeMetric} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
