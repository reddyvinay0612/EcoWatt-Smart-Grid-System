import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Sun, Sparkles, DollarSign, Calendar, Zap, Leaf, Layers, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Map of states to filename
const stateGeoJSONFiles = {
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  "Assam": "assam",
  "Bihar": "bihar",
  "Chandigarh": "chandigarh",
  "Chhattisgarh": "chhattisgarh",
  "Delhi": "delhi",
  "Goa": "goa",
  "Gujarat": "gujarat",
  "Haryana": "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu and Kashmir": "jammu-and-kashmir",
  "Jharkhand": "jharkhand",
  "Karnataka": "karnataka",
  "Kerala": "kerala",
  "Ladakh": "ladakh",
  "Lakshadweep": "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  "Maharashtra": "maharashtra",
  "Manipur": "manipur",
  "Meghalaya": "meghalaya",
  "Mizoram": "mizoram",
  "Nagaland": "nagaland",
  "Odisha": "odisha",
  "Puducherry": "puducherry",
  "Punjab": "punjab",
  "Rajasthan": "rajasthan",
  "Sikkim": "sikkim",
  "Tamil Nadu": "tamil-nadu",
  "Telangana": "telangana",
  "Tripura": "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  "Uttarakhand": "uttarakhand",
  "West Bengal": "west-bengal"
};

export default function SolarAnalytics() {
  const { isDarkMode } = useTheme();

  // State & Research Gap Comparison Mode
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [viewMode, setViewMode] = useState('micro_ecowatt'); // 'micro_ecowatt' vs 'macro_iced'
  const [stateSummary, setStateSummary] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [mapConfig, setMapConfig] = useState({ center: [76.5, 15.0], scale: 3500 });
  const [loadingMap, setLoadingMap] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Household Sizing inputs (PM Surya Ghar)
  const [monthlyUsage, setMonthlyUsage] = useState(250);
  const [roofArea, setRoofArea] = useState(60);
  const [irradiance, setIrradiance] = useState(4.8);
  const [roiResults, setRoiResults] = useState(null);

  // Appliance Disaggregation Inputs (NPP BTM Gap)
  const [airConditioners, setAirConditioners] = useState(1);
  const [evCharger, setEvCharger] = useState("No");
  const [familyMembers, setFamilyMembers] = useState(4);
  const [waterHeaters, setWaterHeaters] = useState(1);
  const [mlAdoptionResult, setMlAdoptionResult] = useState(null);

  // Theme colors
  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const textColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const subBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  // Fetch state solar summary data from API
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/solar-analytics/state/${selectedState}`);
        if (res.ok) {
          const data = await res.json();
          setStateSummary(data);
        }
      } catch (err) {
        console.error("Failed fetching state summary:", err);
      }
    }
    fetchSummary();
  }, [selectedState]);

  // Load GeoJSON and calculate center
  useEffect(() => {
    setLoadingMap(true);
    setGeoJsonData(null);
    const filename = stateGeoJSONFiles[selectedState];
    if (!filename) {
      setLoadingMap(false);
      return;
    }

    fetch(`/states/geojson/${filename}.geojson`)
      .then(res => res.json())
      .then(data => {
        setGeoJsonData(data);
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        let count = 0;
        data.features.forEach(feat => {
          if (!feat.geometry) return;
          const processCoords = (pts) => {
            pts.forEach(pt => {
              if (Array.isArray(pt[0])) {
                processCoords(pt);
              } else {
                const [lng, lat] = pt;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                count++;
              }
            });
          };
          processCoords(feat.geometry.coordinates);
        });

        if (count > 0) {
          const centerLng = (minLng + maxLng) / 2;
          const centerLat = (minLat + maxLat) / 2;
          const deltaLng = maxLng - minLng;
          const deltaLat = maxLat - minLat;
          const maxDelta = Math.max(deltaLng, deltaLat);
          const calculatedScale = Math.min(6000, Math.max(1000, 30000 / (maxDelta || 1)));

          setMapConfig({
            center: [centerLng, centerLat],
            scale: calculatedScale
          });
        }
        setLoadingMap(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingMap(false);
      });
  }, [selectedState]);

  // Calculate Sizer & ROI from API
  const calculateROI = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/solar-analytics/optimize-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_grid_consumption_kwh: parseFloat(monthlyUsage) || 250,
          usable_roof_area_sqm: parseFloat(roofArea) || 60,
          ghi_irradiance: parseFloat(irradiance) || 4.8
        })
      });
      if (response.ok) {
        const data = await response.json();
        setRoiResults(data);
      }
    } catch (err) {
      console.error("ROI calculation failed:", err);
    }
  };

  // Predict ML Household Solar Adoption Probability (Part 2 - NPP Appliance Model)
  const predictMLAdoption = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/solar-analytics/predict-household-adoption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          house_area_sqft: (parseFloat(roofArea) || 60) * 10.76, // convert sqm to sqft
          family_members: parseInt(familyMembers) || 4,
          air_conditioners: parseInt(airConditioners) || 1,
          refrigerators: 1,
          washing_machines: 1,
          televisions: 2,
          computers: 1,
          water_heaters: parseInt(waterHeaters) || 1,
          ceiling_fans: 4,
          led_lights: 15,
          ev_charger: evCharger,
          daily_usage_hours: 8.0,
          average_temperature: 32.0,
          season: "Summer",
          occupancy_rate: 75,
          electricity_tariff: 7.5,
          monthly_consumption_kwh: parseFloat(monthlyUsage) || 250
        })
      });
      if (res.ok) {
        const mlData = await res.json();
        setMlAdoptionResult(mlData);
      }
    } catch (err) {
      console.error("ML prediction failed:", err);
    }
  };

  // Recalculate upon parameter updates
  useEffect(() => {
    calculateROI();
    predictMLAdoption();
  }, [monthlyUsage, roofArea, irradiance, airConditioners, evCharger, familyMembers, waterHeaters]);

  // Handle district hover/click
  const districtMap = useMemo(() => {
    if (!stateSummary) return {};
    const dMap = {};
    stateSummary.districts.forEach(d => {
      dMap[d.district_name.toLowerCase().replace(/\s+/g, '')] = d;
    });
    return dMap;
  }, [stateSummary]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      
      {/* Brand Header */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        padding: '14px 20px',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            MINISTRY OF NEW AND RENEWABLE ENERGY (MNRE) • PM SURYA GHAR YOJANA
          </div>
          <h2 style={{ color: textColor, margin: '2px 0 0 0', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sun size={18} color="#D97706" />
            Rooftop Solar Feasibility & Solar Adoption Spatial Analytics
          </h2>
          <p style={{ color: labelColor, fontSize: 10, margin: '3px 0 0 0', fontWeight: 500 }}>
            NITI Aayog ICED & National Power Portal (NPP) Integrated Prosumer Assessment
          </p>
        </div>

        {/* State Filter Selector */}
        <select 
          value={selectedState} 
          onChange={(e) => setSelectedState(e.target.value)}
          style={{
            background: isDarkMode ? '#1E293B' : '#F1F5F9',
            border: `1px solid ${cardBorder}`,
            borderRadius: 6,
            color: textColor,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {Object.keys(stateGeoJSONFiles).map(state => (
            <option key={state} value={state} style={{ color: '#0F172A', fontWeight: 600 }}>{state}</option>
          ))}
        </select>
      </div>

      {/* KPI summary cards */}
      {stateSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: labelColor, fontWeight: 800, textTransform: 'uppercase', tracking: 1 }}>Checked Households</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: textColor, marginTop: 4 }}>{stateSummary.total_households.toLocaleString()}</div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: labelColor, fontWeight: 800, textTransform: 'uppercase', tracking: 1 }}>Active Solar Installs</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: textColor, marginTop: 4 }}>{stateSummary.solar_installed_count.toLocaleString()}</div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: labelColor, fontWeight: 800, textTransform: 'uppercase', tracking: 1 }}>Adopted Capacity</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981', marginTop: 4 }}>{(stateSummary.total_solar_capacity_kw / 1000.0).toFixed(2)} MW</div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: labelColor, fontWeight: 800, textTransform: 'uppercase', tracking: 1 }}>State Adoption Rate</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>{stateSummary.solar_adoption_rate_percentage.toFixed(4)}%</div>
          </div>
        </div>
      )}

      {/* Main split dashboard view */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, alignItems: 'stretch' }}>
        
        {/* Left Side: Dynamic State Map with ICED Comparison Toggle */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', minHeight: 520 }}>
          
          {/* Header with Comparative Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: textColor }}>
              🗺️ {selectedState} Solar Adoption Spatial Map
            </h3>
            
            {/* Toggle Button Group: Macro ICED vs Micro EcoWatt */}
            <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', padding: 3, borderRadius: 8, gap: 4 }}>
              <button
                onClick={() => setViewMode('micro_ecowatt')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === 'micro_ecowatt' ? '#059669' : 'transparent',
                  color: viewMode === 'micro_ecowatt' ? '#fff' : labelColor,
                  transition: 'all 0.15s'
                }}
              >
                Granular Feasibility Model (District-Level)
              </button>
              <button
                onClick={() => setViewMode('macro_iced')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === 'macro_iced' ? '#1E40AF' : 'transparent',
                  color: viewMode === 'macro_iced' ? '#fff' : labelColor,
                  transition: 'all 0.15s'
                }}
              >
                NITI Aayog ICED Baseline
              </button>
            </div>
          </div>

          {/* Research Gap Explanatory Alert Banner */}
          <div style={{
            background: viewMode === 'macro_iced' 
              ? (isDarkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF')
              : (isDarkMode ? 'rgba(16,185,129,0.1)' : '#F0FDF4'),
            borderLeft: `4px solid ${viewMode === 'macro_iced' ? '#3B82F6' : '#10B981'}`,
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 10,
            fontSize: 10,
            color: viewMode === 'macro_iced' ? '#2563EB' : '#059669',
            fontWeight: 600
          }}>
            {viewMode === 'macro_iced' ? (
              <span>
                <strong>🏛️ NITI Aayog ICED Baseline:</strong> Displays single flat state-wide aggregate. Intra-state district variations (solar radiation, income proxy, urban ratio) and Behind-The-Meter rooftop prosumer data are completely invisible.
              </span>
            ) : (
              <span>
                <strong>✨ EcoWatt AI Granular Model:</strong> Resolves 743 Indian districts with XGBoost ML Regression (<strong>R² = 0.8957</strong>), estimating rooftop capacity and prosumer adoption density.
              </span>
            )}
          </div>
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? 'rgba(0,0,0,0.1)' : '#F8FAFC', borderRadius: 8, overflow: 'hidden' }}>
            {loadingMap ? (
              <div style={{ fontSize: 11, color: labelColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                Loading geometries...
              </div>
            ) : geoJsonData ? (
              <ComposableMap 
                projection="geoMercator" 
                projectionConfig={{ scale: mapConfig.scale, center: mapConfig.center }}
                style={{ width: '100%', height: 350 }}
              >
                <Geographies geography={geoJsonData}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const distName = geo.properties.district || geo.properties.district_name || "";
                      const key = distName.toLowerCase().replace(/\s+/g, '');
                      const record = districtMap[key];
                      
                      // Map color scheme
                      let fillVal = isDarkMode ? '#1e293b' : '#E2E8F0';
                      if (viewMode === 'macro_iced') {
                        // Flat state-wide single color in ICED mode
                        fillVal = '#3B82F6';
                      } else if (record) {
                        // Granular heat spectrum in EcoWatt AI mode
                        const adRate = record.adoption_rate || 0;
                        if (adRate > 2.0) fillVal = '#064e3b';
                        else if (adRate > 1.0) fillVal = '#047857';
                        else if (adRate > 0.5) fillVal = '#10b981';
                        else if (adRate > 0.1) fillVal = '#6ee7b7';
                        else fillVal = '#d1fae5';
                      }

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillVal}
                          stroke={isDarkMode ? '#0f172a' : '#fff'}
                          strokeWidth={0.8}
                          onClick={() => setSelectedDistrict(record)}
                          style={{
                            default: { outline: 'none' },
                            hover: { fill: '#F59E0B', outline: 'none', cursor: 'pointer' },
                            pressed: { fill: '#D97706', outline: 'none' }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            ) : (
              <div style={{ fontSize: 11, color: labelColor }}>District boundaries mapping unavailable</div>
            )}
          </div>

          {/* Map details selected row */}
          {selectedDistrict && (
            <div style={{ marginTop: 12, padding: 10, background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 8, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: textColor, borderBottom: `1px solid ${cardBorder}`, paddingBottom: 4 }}>
                <span>📍 {selectedDistrict.district_name}</span>
                <button onClick={() => setSelectedDistrict(null)} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}>Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: 6 }}>
                <div>Adoption Rate: <b>{selectedDistrict.adoption_rate}%</b></div>
                <div>Predicted Adoption (XGBoost): <b>{selectedDistrict.predicted_adoption_rate || 'N/A'}/1k</b></div>
                <div>Total Households: <b>{selectedDistrict.total_households?.toLocaleString()}</b></div>
                <div>Active Installs: <b>{selectedDistrict.solar_installed_count?.toLocaleString()}</b></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: ROI Calculator & ML Prosumer Profiler */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sun size={15} color="#D97706" />
            Rooftop Solar Feasibility & Tariff Yield Assessment
          </h3>

          {/* Core Sizing Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 9, fontWeight: 800, color: labelColor, display: 'block', marginBottom: 4 }}>Monthly Usage (kWh)</label>
              <input 
                type="number" 
                value={monthlyUsage}
                onChange={(e) => setMonthlyUsage(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 8, color: textColor, fontSize: 12, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 800, color: labelColor, display: 'block', marginBottom: 4 }}>Usable Roof Area (m²)</label>
              <input 
                type="number" 
                value={roofArea}
                onChange={(e) => setRoofArea(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 8, color: textColor, fontSize: 12, outline: 'none' }}
              />
            </div>
          </div>

          {/* Appliance Disaggregation Selectors (NPP BTM Gap) */}
          <div style={{ padding: '10px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={11} />
              Appliance Load Disaggregation (20k Household ML Model)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 8, fontWeight: 700, color: labelColor }}>Air Conditioners</label>
                <select 
                  value={airConditioners} 
                  onChange={(e) => setAirConditioners(e.target.value)}
                  style={{ width: '100%', padding: '4px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 6, color: textColor, fontSize: 10, outline: 'none' }}
                >
                  <option value="0">0 ACs</option>
                  <option value="1">1 AC</option>
                  <option value="2">2 ACs</option>
                  <option value="3">3+ ACs</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 8, fontWeight: 700, color: labelColor }}>EV Charger</label>
                <select 
                  value={evCharger} 
                  onChange={(e) => setEvCharger(e.target.value)}
                  style={{ width: '100%', padding: '4px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 6, color: textColor, fontSize: 10, outline: 'none' }}
                >
                  <option value="No">No EV</option>
                  <option value="Yes">Yes (EV)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 8, fontWeight: 700, color: labelColor }}>Water Heaters</label>
                <select 
                  value={waterHeaters} 
                  onChange={(e) => setWaterHeaters(e.target.value)}
                  style={{ width: '100%', padding: '4px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 6, color: textColor, fontSize: 10, outline: 'none' }}
                >
                  <option value="0">0</option>
                  <option value="1">1 Geyser</option>
                  <option value="2">2+ Geysers</option>
                </select>
              </div>
            </div>
          </div>

          {/* ML Adoption Likelihood Score Card */}
          {mlAdoptionResult && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.3)' : '#86efac'}`,
              borderRadius: 8,
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: textColor }}>
                  🤖 ML Solar Adoption Likelihood:
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#10B981' }}>
                  {mlAdoptionResult.adoption_probability_percentage}%
                </div>
              </div>
              <div style={{ fontSize: 9, color: '#047857', fontWeight: 700, marginTop: 2 }}>
                Tier: {mlAdoptionResult.feasibility_tier}
              </div>
            </div>
          )}

          {/* PM Surya Ghar Financial Sizing */}
          {roiResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              
              {/* Highlight Recommended */}
              <div style={{ background: isDarkMode ? 'rgba(16,185,129,0.1)' : '#f0fdf4', borderLeft: '4px solid #10b981', padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isDarkMode ? '#10B981' : '#047857' }}>
                  Recommended Solar Capacity: {roiResults.recommended_capacity_kw} kW
                </div>
                <div style={{ fontSize: 8, color: labelColor, marginTop: 2 }}>
                  PM Surya Ghar Central Subsidy: <strong>Rs. {roiResults.pm_surya_ghar_subsidy_inr?.toLocaleString()}</strong>
                </div>
              </div>

              {/* Grid Financials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ padding: 6, background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={14} color="#10B981" />
                  <div>
                    <div style={{ fontSize: 7, color: labelColor, fontWeight: 700 }}>Net Investment</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: textColor }}>Rs. {roiResults.net_investment_inr?.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ padding: 6, background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color="#3B82F6" />
                  <div>
                    <div style={{ fontSize: 7, color: labelColor, fontWeight: 700 }}>Payback Period</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: textColor }}>{roiResults.payback_years} Years</div>
                  </div>
                </div>
                <div style={{ padding: 6, background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} color="#F59E0B" />
                  <div>
                    <div style={{ fontSize: 7, color: labelColor, fontWeight: 700 }}>Monthly Savings</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: textColor }}>Rs. {roiResults.monthly_savings_inr?.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ padding: 6, background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Leaf size={14} color="#10B981" />
                  <div>
                    <div style={{ fontSize: 7, color: labelColor, fontWeight: 700 }}>Avoided Carbon</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: textColor }}>{roiResults.avoided_co2_kg_monthly} kg CO₂/mo</div>
                  </div>
                </div>
              </div>

              {/* Demand-Side Optimization advice */}
              <div>
                <h4 style={{ margin: '6px 0 4px 0', fontSize: 9, fontWeight: 800, color: textColor, textTransform: 'uppercase' }}>
                  💡 Custom Demand-Side Conservation Tips
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {roiResults.non_solar_strategies?.slice(0, 3).map((strat, idx) => (
                    <div key={idx} style={{ padding: '4px 8px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 5, fontSize: 9, lineHeight: 1.2 }}>
                      <strong>{strat.title}</strong>: {strat.recommendation} <span style={{ color: '#10B981', fontWeight: 800 }}>(Saves {strat.estimated_bill_reduction_percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Bottom telemetry district grid list */}
      {stateSummary && (
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 800, color: textColor }}>
            📋 District Telemetry & Prediction Logs (743 Indian Districts)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${cardBorder}`, color: labelColor, fontWeight: 800 }}>
                  <th style={{ padding: 8 }}>District</th>
                  <th style={{ padding: 8 }}>Total Households</th>
                  <th style={{ padding: 8 }}>Solar Installations</th>
                  <th style={{ padding: 8 }}>Capacity (kW)</th>
                  <th style={{ padding: 8 }}>Adoption Rate</th>
                  <th style={{ padding: 8 }}>XGBoost Predicted</th>
                  <th style={{ padding: 8 }}>Irradiance</th>
                  <th style={{ padding: 8 }}>Electrification</th>
                </tr>
              </thead>
              <tbody>
                {stateSummary.districts.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${cardBorder}`, color: textColor }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{d.district_name}</td>
                    <td style={{ padding: 8 }}>{d.total_households?.toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{d.solar_installed_count?.toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{d.total_solar_capacity_kw?.toFixed(1)} kW</td>
                    <td style={{ padding: 8 }}>{(d.adoption_rate)?.toFixed(3)}%</td>
                    <td style={{ padding: 8, color: '#10B981', fontWeight: 700 }}>{d.predicted_adoption_rate || 'N/A'}/1k</td>
                    <td style={{ padding: 8 }}>{d.solar_irradiance || '4.5'}</td>
                    <td style={{ padding: 8 }}>{d.electrification_rate || '98.0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
