import React, { useState, useEffect } from 'react';
import { Layers, Zap, AlertTriangle, CheckCircle2, TrendingDown, DollarSign, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ApplianceDisaggregationPanel({ consumerId }) {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const subBg = isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC';

  const fetchDisaggregation = async () => {
    if (!consumerId) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/v1/appliance-disaggregation/${consumerId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed fetching disaggregation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisaggregation();
    const interval = setInterval(fetchDisaggregation, 15000); // 15s refresh
    return () => clearInterval(interval);
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
      {/* Title with Research Gap Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#3B82F6" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Appliance Load Disaggregation & NILM Profiler
          </h3>
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: '#3B82F6',
          background: isDarkMode ? 'rgba(59,130,246,0.12)' : '#EFF6FF',
          border: '1px solid rgba(59,130,246,0.25)',
          padding: '3px 8px',
          borderRadius: 6
        }}>
          ⚡ NPP BTM Solution
        </span>
      </div>

      {/* Real-time Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Active Power Draw</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {data.total_instantaneous_power_watts} W
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Top Consumer</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.top_energy_consumer} ({data.top_energy_percentage}%)
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Vampire Standby Leak</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>
            {data.vampire_load_watts} W
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Potential Bill Savings</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
            ₹{data.estimated_monthly_savings_inr}/mo
          </div>
        </div>
      </div>

      {/* Appliance-by-Appliance Load Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.appliances.map((app, idx) => {
          const barColor = 
            app.percentage > 35 ? '#EF4444' :
            app.percentage > 15 ? '#F59E0B' :
            '#10B981';

          return (
            <div key={idx} style={{
              background: subBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: titleColor }}>{app.name}</span>
                  <span style={{
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: app.efficiency_grade.includes('A') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: app.efficiency_grade.includes('A') ? '#10B981' : '#EF4444'
                  }}>
                    Grade {app.efficiency_grade}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, color: titleColor }}>
                  {app.watts} W <span style={{ fontSize: 9, color: labelColor, fontWeight: 600 }}>({app.percentage}%)</span>
                </div>
              </div>

              {/* Progress Track */}
              <div style={{ width: '100%', height: 6, background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, app.percentage)}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
              </div>

              {/* Actionable Appliance Tip */}
              <div style={{ fontSize: 8.5, color: labelColor, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Info size={10} color="#3B82F6" />
                <span>{app.tip}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
