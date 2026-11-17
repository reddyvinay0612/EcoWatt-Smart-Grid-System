import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Maximize2, MapPin, Zap, TrendingUp, 
  DollarSign, ShieldAlert, BarChart3, PieChart, Users, Building, 
  Sun, Wind, Droplets, Flame, Search, ExternalLink, X, Activity,
  TrendingDown, Layers, Calendar, ChevronRight, CheckCircle2
} from 'lucide-react';
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
  'Trading & Exchange': '/icons/energy/solar.png',
  'Other Res': '/icons/energy/bio_power.png'
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
  'Trading & Exchange': '#8B5CF6',
  'Waste to Energy': '#10B981',
  'Other Res': '#10B981'
};

export default function StateReportExplorer() {
  const { isDarkMode } = useTheme();
  const [statesList, setStatesList] = useState([]);
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [stateDetail, setStateDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalReportOpen, setModalReportOpen] = useState(false);

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const subBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  // Fetch all states summary
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/state-profiles/')
      .then(res => res.json())
      .then(data => {
        if (data.states) {
          setStatesList(data.states);
        }
      })
      .catch(err => console.error("Error loading states list:", err));
  }, []);

  // Fetch selected state detail
  useEffect(() => {
    if (!selectedState) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/state-profiles/${encodeURIComponent(selectedState)}`)
      .then(res => res.json())
      .then(data => {
        setStateDetail(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading state detail:", err);
        setLoading(false);
      });
  }, [selectedState]);

  // Heatmap min/max calculation
  const { heatmapMin, heatmapMax } = useMemo(() => {
    if (!stateDetail?.peak_demand_matrix) return { heatmapMin: 5000, heatmapMax: 15000 };
    let min = Infinity, max = -Infinity;
    stateDetail.peak_demand_matrix.forEach(row => {
      Object.entries(row).forEach(([k, v]) => {
        if (k !== 'year' && typeof v === 'number') {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    return { heatmapMin: min === Infinity ? 5000 : min, heatmapMax: max === -Infinity ? 15000 : max };
  }, [stateDetail]);

  const getHeatmapColor = (val) => {
    if (val === null || val === undefined) return isDarkMode ? 'rgba(255,255,255,0.03)' : '#F1F5F9';
    const ratio = Math.max(0, Math.min(1, (val - heatmapMin) / (heatmapMax - heatmapMin || 1)));
    if (ratio < 0.33) return `rgba(245, 158, 11, ${0.3 + ratio * 0.5})`; // yellow/amber
    if (ratio < 0.66) return `rgba(239, 68, 68, ${0.4 + ratio * 0.4})`; // orange-red
    return `rgba(185, 28, 28, ${0.6 + ratio * 0.4})`; // deep dark red
  };

  if (loading || !stateDetail) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: labelColor }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Loading Comprehensive State Report...</span>
        </div>
      </div>
    );
  }

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
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
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                NITI AAYOG & CENTRAL ELECTRICITY AUTHORITY (CEA)
              </div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: titleColor }}>
                State Electricity Generation Profiles & Distribution Accounts
              </h1>
            </div>
          </div>
          <p style={{ margin: '4px 0 0 42px', fontSize: 10, color: labelColor, fontWeight: 500 }}>
            Official consolidated dossiers covering GSDP energy intensity, 12-year peak demand matrix, DISCOM financials & tariffs.
          </p>
        </div>

        {/* State Selector & Official Report Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            {statesList.map(st => (
              <option key={st.state_name} value={st.state_name}>
                {st.state_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setModalReportOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Maximize2 size={14} /> View Official Report
          </button>
        </div>
      </div>

      {/* ── 1. DEMOGRAPHIC PROFILE & GSDP / GVA CARDS ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        
        {/* Population & Geography */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 90, height: 90, borderRadius: 10, background: isDarkMode ? '#0a0e17' : '#F1F5F9', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${cardBorder}` }}>
            <img src={stateDetail.map_file} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>Population</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8' }}>{stateDetail.districts} Districts</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: titleColor, marginTop: 2 }}>
              {stateDetail.population_cr} <span style={{ fontSize: 12, color: labelColor }}>Cr</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: labelColor, marginTop: 4, fontWeight: 600 }}>
              <span>🏙️ Urban: <b>{stateDetail.urban_cr} Cr</b></span>
              <span>🌾 Rural: <b>{stateDetail.rural_cr} Cr</b></span>
            </div>
          </div>
        </div>

        {/* GSDP & GVA Metrics */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>State GSDP & GVA</span>
            <DollarSign size={15} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 9, color: labelColor, fontWeight: 700 }}>GSDP (Current)</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B' }}>
                ₹{stateDetail.gsdp_lakh_cr} <span style={{ fontSize: 10, color: labelColor }}>Lakh Cr</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: labelColor, fontWeight: 700 }}>GVA (Current)</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>
                ₹{stateDetail.gva_lakh_cr} <span style={{ fontSize: 10, color: labelColor }}>Lakh Cr</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: labelColor, marginTop: 6, fontWeight: 600 }}>
            Source: MoSPI National Accounts
          </div>
        </div>

        {/* Sectoral GVA Share */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase' }}>Sectoral GVA Share</span>
            <PieChart size={15} color="#06B6D4" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {Object.entries(stateDetail.sectoral_gva || {}).slice(0, 4).map(([sec, pct]) => (
              <div key={sec} style={{ background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, color: titleColor }}>
                {sec}: <span style={{ color: '#06B6D4' }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 2. INSTALLED CAPACITY VS. POWER GENERATION MIX ────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Installed Capacity vs. Actual Power Generation Mix
            </h3>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#F59E0B' }}>
            Total Installed: {stateDetail.installed_capacity_mw?.toLocaleString()} MW
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
          
          {/* Installed Capacity Share */}
          <div style={{ padding: 12, background: subBg, borderRadius: 10, border: `1px solid ${cardBorder}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: labelColor, marginBottom: 8, textTransform: 'uppercase' }}>
              Installed Capacity Share (%)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(stateDetail.installed_capacity_mix || {}).map(([src, pct]) => (
                <div key={src}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700, color: titleColor }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img src={SOURCE_ICONS[src] || '/icons/energy/solar.png'} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      <span>{src}</span>
                    </div>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: SOURCE_COLORS[src] || '#10B981', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actual Power Generation Share */}
          <div style={{ padding: 12, background: subBg, borderRadius: 10, border: `1px solid ${cardBorder}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: labelColor, marginBottom: 8, textTransform: 'uppercase' }}>
              Actual Generation Share (%)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(stateDetail.power_generation_mix || {}).map(([src, pct]) => (
                <div key={src}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700, color: titleColor }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img src={SOURCE_ICONS[src] || '/icons/energy/solar.png'} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      <span>{src}</span>
                    </div>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: SOURCE_COLORS[src] || '#10B981', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. RENEWABLE RESOURCE POTENTIAL VS INSTALLED ─────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrendingUp size={18} color="#3B82F6" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Renewable Resource Potential vs. Installed Capacity
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {Object.entries(stateDetail.potentials || {}).map(([src, pot]) => (
            <div key={src} style={{ padding: '12px 14px', background: subBg, borderRadius: 8, border: `1px solid ${cardBorder}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={SOURCE_ICONS[src] || '/icons/energy/solar.png'} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: titleColor }}>{src}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#10B981' }}>
                  {pot.utilization_pct}% Tapped
                </div>
              </div>
              <div style={{ fontSize: 10, color: labelColor, marginBottom: 4 }}>
                Installed: <b>{pot.installed_mw.toLocaleString()} MW</b> / Potential: <b>{pot.potential_mw.toLocaleString()} MW</b>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, pot.utilization_pct)}%`, height: '100%', background: SOURCE_COLORS[src] || '#10B981', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. MONTHLY PEAK DEMAND HEATMAP MATRIX (MW) ────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#EF4444" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly Peak Demand Heatmap Matrix (MW) (2015-16 to 2026-27)
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 700, color: labelColor }}>
            <span>Min ({heatmapMin.toLocaleString()} MW)</span>
            <div style={{ width: 80, height: 8, borderRadius: 4, background: 'linear-gradient(to right, rgba(245,158,11,0.5), rgba(239,68,68,0.9), rgba(185,28,28,1))' }}></div>
            <span>Max ({heatmapMax.toLocaleString()} MW)</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${cardBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 10 }}>
            <thead>
              <tr style={{ background: isDarkMode ? '#1E293B' : '#F1F5F9', color: labelColor, borderBottom: `1px solid ${cardBorder}` }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800 }}>YEAR</th>
                {months.map(m => (
                  <th key={m} style={{ padding: '8px 6px', fontWeight: 800 }}>{m.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stateDetail.peak_demand_matrix?.map((row, rIdx) => (
                <tr key={row.year} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, color: titleColor, background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#FAFAFA' }}>
                    {row.year}
                  </td>
                  {months.map(m => {
                    const val = row[m];
                    const bgColor = getHeatmapColor(val);
                    return (
                      <td key={m} style={{ padding: '6px 4px', background: bgColor, color: val ? '#FFFFFF' : labelColor, fontWeight: 800, fontSize: 9 }}>
                        {val ? val.toLocaleString() : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. PER CAPITA CONSUMPTION & DISTRIBUTION PORTFOLIO ───────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        
        {/* Per Capita Trends (in kWh) */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#06B6D4" />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
                Per Capita Electricity Trends (kWh)
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 10, fontWeight: 700 }}>
              <span style={{ color: '#3B82F6' }}>■ {selectedState}</span>
              <span style={{ color: '#10B981' }}>- - All India Avg</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
            {stateDetail.per_capita_trend?.map(pt => (
              <div key={pt.year} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: subBg, borderRadius: 6, fontSize: 10 }}>
                <span style={{ fontWeight: 800, color: titleColor, width: 60 }}>{pt.year}</span>
                <div style={{ flex: 1, margin: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (pt.state_kwh / 2000) * 100)}%`, height: '100%', background: '#3B82F6', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontWeight: 800 }}>
                  <span style={{ color: '#3B82F6' }}>{pt.state_kwh} kWh</span>
                  <span style={{ color: labelColor }}>({pt.national_avg_kwh} nat)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Portfolio & Losses */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Activity size={16} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              Electricity Distribution Portfolio & Losses
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ padding: 10, background: subBg, borderRadius: 8, border: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: labelColor }}>TOTAL CONSUMERS</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: titleColor, marginTop: 2 }}>{stateDetail.distribution?.consumers_mn} Mn</div>
              <div style={{ fontSize: 8, color: labelColor, marginTop: 2 }}>Top: <b>{stateDetail.distribution?.top_category_consumers}</b></div>
            </div>

            <div style={{ padding: 10, background: subBg, borderRadius: 8, border: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: labelColor }}>TOTAL CONSUMPTION</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: titleColor, marginTop: 2 }}>{stateDetail.distribution?.consumption_mu?.toLocaleString()} MU</div>
              <div style={{ fontSize: 8, color: labelColor, marginTop: 2 }}>Top: <b>{stateDetail.distribution?.top_category_consumption}</b></div>
            </div>

            <div style={{ padding: 10, background: subBg, borderRadius: 8, border: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: labelColor }}>AVG COST OF SUPPLY (ACS)</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444', marginTop: 2 }}>₹{stateDetail.distribution?.acs_inr_kwh} / kWh</div>
              <div style={{ fontSize: 8, color: labelColor, marginTop: 2 }}>ARR: <b>₹{stateDetail.distribution?.arr_inr_kwh} / kWh</b></div>
            </div>

            <div style={{ padding: 10, background: subBg, borderRadius: 8, border: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: labelColor }}>AT&C LOSS</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B', marginTop: 2 }}>{stateDetail.distribution?.atc_loss_pct}%</div>
              <div style={{ fontSize: 8, color: labelColor, marginTop: 2 }}>T&D Loss: <b>{stateDetail.distribution?.td_loss_pct}%</b></div>
            </div>
          </div>

          <div style={{ marginTop: 10, padding: '8px 10px', background: subBg, borderRadius: 6, border: `1px solid ${cardBorder}`, fontSize: 10 }}>
            <span style={{ fontWeight: 800, color: titleColor }}>Operating DISCOMs: </span>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>{stateDetail.distribution?.discoms?.join(', ')}</span>
          </div>
        </div>

      </div>

      {/* ── 6. POWER PURCHASE COST & DISCOM FINANCIALS ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        
        {/* Power Purchase Quantum & Cost */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Layers size={16} color="#8B5CF6" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              Power Purchase & Weighted Avg Cost
            </h3>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${cardBorder}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 10 }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#1E293B' : '#F1F5F9', color: labelColor, borderBottom: `1px solid ${cardBorder}` }}>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>SOURCE</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>QUANTUM (MU)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>SHARE (%)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>COST (₹/kWh)</th>
                </tr>
              </thead>
              <tbody>
                {stateDetail.power_purchase_breakdown?.map(pp => (
                  <tr key={pp.source} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: titleColor }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img src={SOURCE_ICONS[pp.source] || '/icons/energy/solar.png'} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <span>{pp.source}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: titleColor }}>{pp.quantum_mu.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: SOURCE_COLORS[pp.source] || '#10B981', fontWeight: 800 }}>{pp.share_pct}%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontWeight: 900 }}>₹{pp.cost_inr_kwh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DISCOM ACS & ARR Table */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Building size={16} color="#3B82F6" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              DISCOM Average Cost vs. Revenue Realisation
            </h3>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${cardBorder}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 10 }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#1E293B' : '#F1F5F9', color: labelColor, borderBottom: `1px solid ${cardBorder}` }}>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>DISCOM NAME</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>ACS (₹/kWh)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>ARR (₹/kWh)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>GAP (₹/kWh)</th>
                </tr>
              </thead>
              <tbody>
                {stateDetail.discom_financials?.map(df => (
                  <tr key={df.discom_name} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: titleColor }}>{df.discom_name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#EF4444', fontWeight: 800 }}>₹{df.acs_inr_kwh}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontWeight: 800 }}>₹{df.arr_inr_kwh}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: df.gap_inr_kwh <= 0 ? '#10B981' : '#F59E0B', fontWeight: 900 }}>
                      {df.gap_inr_kwh <= 0 ? `+₹${Math.abs(df.gap_inr_kwh)}` : `-₹${df.gap_inr_kwh}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── 7. ACTUAL TARIFF RATES BY DISCOM & CONSUMPTION SHARE ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        
        {/* Actual Tariff Rates Matrix */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <DollarSign size={16} color="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              Actual Tariff Rates (₹/kWh) by Category & DISCOM
            </h3>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${cardBorder}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 10 }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#1E293B' : '#F1F5F9', color: labelColor, borderBottom: `1px solid ${cardBorder}` }}>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>CATEGORY</th>
                  {stateDetail.distribution?.discoms?.slice(0, 3).map(d => (
                    <th key={d} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stateDetail.tariffs_by_discom?.map(tb => (
                  <tr key={tb.category} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: titleColor }}>{tb.category}</td>
                    {stateDetail.distribution?.discoms?.slice(0, 3).map(d => (
                      <td key={d} style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontWeight: 900 }}>
                        ₹{tb[d] || 5.50}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Consumption Share % */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <PieChart size={16} color="#06B6D4" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              Sectoral Electricity Consumption Share (%)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(stateDetail.consumption_share || {}).map(([cat, pct]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: titleColor, marginBottom: 2 }}>
                  <span>{cat}</span>
                  <span style={{ color: '#06B6D4', fontWeight: 800 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#06B6D4', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 8. YEAR OVER YEAR FINANCIAL PROFIT/LOSS & AT&C LOSS TRENDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        
        {/* Profit and Loss Trend (Rs. Crores) */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingDown size={16} color="#EF4444" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              Year over Year Profit / Loss (₹ Crores)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stateDetail.profit_loss_trend?.map(pl => {
              const isProfit = pl.profit_loss_cr >= 0;
              return (
                <div key={pl.year} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: subBg, borderRadius: 6, fontSize: 10 }}>
                  <span style={{ fontWeight: 800, color: titleColor }}>{pl.year}</span>
                  <span style={{ fontWeight: 900, color: isProfit ? '#10B981' : '#EF4444' }}>
                    {isProfit ? `+₹${pl.profit_loss_cr.toLocaleString()} Cr` : `-₹${Math.abs(pl.profit_loss_cr).toLocaleString()} Cr`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AT&C Loss Multi-Year Trend (%) */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldAlert size={16} color="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              AT&C Loss Reduction Trend (%)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stateDetail.atc_loss_trend?.map(atc => (
              <div key={atc.year} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: subBg, borderRadius: 6, fontSize: 10 }}>
                <span style={{ fontWeight: 800, color: titleColor }}>{atc.year}</span>
                <div style={{ flex: 1, margin: '0 12px', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (atc.loss_pct / 30) * 100)}%`, height: '100%', background: '#F59E0B', borderRadius: 3 }} />
                </div>
                <span style={{ fontWeight: 900, color: '#F59E0B' }}>{atc.loss_pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── FULL SCREEN OFFICIAL REPORT MODAL ─────────────────────────── */}
      {modalReportOpen && (
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
                <FileText size={18} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: titleColor }}>
                  {stateDetail.state_name} - Official Electricity Generation Report (ICED / CEA / NITI Aayog)
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={stateDetail.report_file}
                  download={`State_Report_${stateDetail.state_name}.jpg`}
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
                  <Download size={13} /> Download Original JPG
                </a>
                <button
                  onClick={() => setModalReportOpen(false)}
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
            <div style={{ flex: 1, overflow: 'auto', padding: 20, background: '#0a0e17', display: 'flex', justifyContent: 'center' }}>
              <img
                src={stateDetail.report_file}
                alt={`${stateDetail.state_name} Official Report`}
                style={{ width: '100%', maxWidth: 1000, objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
