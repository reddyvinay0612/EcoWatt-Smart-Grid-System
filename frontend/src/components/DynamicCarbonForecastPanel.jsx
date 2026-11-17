import React, { useState, useEffect } from 'react';
import { Leaf, Clock, Zap, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DynamicCarbonForecastPanel({ consumerId }) {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const subBg = isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC';

  useEffect(() => {
    const fetchCarbon = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/carbon/dynamic-hourly/${consumerId || 'HH_001'}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed fetching dynamic carbon:", err);
      }
    };
    fetchCarbon();
    const timer = setInterval(fetchCarbon, 30000);
    return () => clearInterval(timer);
  }, [consumerId]);

  if (!data) return null;

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }}>
      {/* Title Header with Research Gap Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={18} color="#10B981" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            24h Dynamic Grid Carbon Intensity & Green Windows
          </h3>
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: '#10B981',
          background: isDarkMode ? 'rgba(16,185,129,0.12)' : '#F0FDF4',
          border: '1px solid rgba(16,185,129,0.25)',
          padding: '3px 8px',
          borderRadius: 6
        }}>
          🌿 ICED/NPP Dynamic Carbon Solution
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Live Grid Intensity</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: data.current_carbon_intensity_g_per_kwh < 500 ? '#10B981' : '#EF4444', marginTop: 4 }}>
            {data.current_carbon_intensity_g_per_kwh} <span style={{ fontSize: 9, fontWeight: 600, color: labelColor }}>g CO₂/kWh</span>
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>Optimal Green Window</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {data.recommended_green_charging_window}
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: '#EF4444', fontWeight: 800, textTransform: 'uppercase' }}>Peak Thermal Window</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>
            {data.peak_carbon_window}
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Avoided CO₂ Potential</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {data.potential_co2_avoided_kg_monthly} <span style={{ fontSize: 9, fontWeight: 600, color: labelColor }}>kg/mo</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Carbon Heat Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: labelColor }}>
          <span>24-HOUR MARGINAL GRID EMISSIONS TIMELINE</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#10B981' }}>● Clean (&lt;480g)</span>
            <span style={{ color: '#F59E0B' }}>● Moderate</span>
            <span style={{ color: '#EF4444' }}>● High Thermal (&gt;750g)</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, height: 48, alignItems: 'end' }}>
          {data.hourly_curve.map((h) => {
            const heightPct = Math.max(20, (h.carbon_intensity_g_per_kwh / 1000.0) * 100);
            return (
              <div 
                key={h.hour}
                title={`${h.time_label}: ${h.carbon_intensity_g_per_kwh} g CO2/kWh (${h.status})`}
                style={{
                  height: `${heightPct}%`,
                  background: h.color,
                  borderRadius: 3,
                  position: 'relative',
                  border: h.is_current ? '2px solid #FFFFFF' : 'none',
                  boxShadow: h.is_current ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
                  cursor: 'pointer',
                  transition: 'height 0.3s, transform 0.15s'
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: labelColor, fontWeight: 700 }}>
          <span>00:00</span>
          <span>06:00</span>
          <span style={{ color: '#10B981', fontWeight: 900 }}>12:00 (Solar Peak)</span>
          <span style={{ color: '#EF4444', fontWeight: 900 }}>18:00 (Peak Thermal)</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Smart Load Shifting Recommendation Banner */}
      <div style={{
        background: isDarkMode ? 'rgba(16,185,129,0.08)' : '#F0FDF4',
        borderLeft: '4px solid #10B981',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 10,
        color: isDarkMode ? '#34D399' : '#047857',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <CheckCircle2 size={13} color="#10B981" />
        <span>
          <strong>Green Window Action:</strong> Schedule EV charging and water heating between <strong>{data.recommended_green_charging_window}</strong> to utilize maximum rooftop solar and reduce marginal carbon intensity by up to <strong>55%</strong>.
        </span>
      </div>
    </div>
  );
}
