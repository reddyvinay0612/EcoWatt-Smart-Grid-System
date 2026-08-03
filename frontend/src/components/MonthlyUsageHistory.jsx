import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MonthlyUsageHistory({ selectedHouseholdId }) {
  const { isDarkMode } = useTheme();
  const [readings, setReadings] = useState([]);
  const [settings, setSettings] = useState({ threshold_percent: 20 });
  const [viewMode, setViewMode] = useState('units'); // 'units' | 'cost'
  const [loading, setLoading] = useState(false);

  const RATE_PER_UNIT = 7.5; // ₹7.50 per kWh/unit

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#E2E8F0' : '#0F172A';

  const fetchData = async () => {
    if (!selectedHouseholdId) return;
    setLoading(true);
    try {
      const [readingsRes, settingsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/monthly-usage/${selectedHouseholdId}`),
        fetch(`http://localhost:8000/api/v1/settings/${selectedHouseholdId}`)
      ]);

      if (readingsRes.ok && settingsRes.ok) {
        const readingsData = await readingsRes.json();
        const settingsData = await settingsRes.json();
        setReadings(readingsData);
        setSettings(settingsData);
      }
    } catch (e) {
      console.error("Error loading monthly data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedHouseholdId]);

  // Compute anomaly parameters for the current (latest) month
  const anomalyInfo = useMemo(() => {
    if (readings.length < 4) return { isAnomaly: false, percentChange: 0, baselineAvg: 0 };

    const threshold = settings.threshold_percent || 20;
    const count = readings.length;
    const currentVal = readings[count - 1].units;

    // Baseline excludes current month (last 6 months or all preceding months if < 6)
    const baselineReadings = count >= 7 
      ? readings.slice(count - 7, count - 1)
      : readings.slice(0, count - 1);

    const baselineSum = baselineReadings.reduce((sum, r) => sum + r.units, 0);
    const baselineAvg = baselineSum / baselineReadings.length;

    const percentChange = ((currentVal - baselineAvg) / baselineAvg) * 100;
    const isAnomaly = percentChange > threshold;

    return {
      isAnomaly,
      percentChange: Math.round(percentChange),
      baselineAvg: Math.round(baselineAvg),
      currentMonthUnits: currentVal
    };
  }, [readings, settings]);

  // Format Recharts data based on viewMode (units vs cost)
  const chartData = useMemo(() => {
    return readings.map((r, idx) => {
      const isCurrent = idx === readings.length - 1;
      const value = viewMode === 'units' ? r.units : r.units * RATE_PER_UNIT;
      return {
        month: r.month,
        value: Math.round(value),
        rawUnits: r.units,
        isCurrent,
        isAnomaly: isCurrent && anomalyInfo.isAnomaly
      };
    });
  }, [readings, viewMode, anomalyInfo]);

  const displayedBaseline = viewMode === 'units' 
    ? anomalyInfo.baselineAvg 
    : Math.round(anomalyInfo.baselineAvg * RATE_PER_UNIT);

  const displayedCurrent = viewMode === 'units'
    ? anomalyInfo.currentMonthUnits
    : Math.round(anomalyInfo.currentMonthUnits * RATE_PER_UNIT);

  const unitLabel = viewMode === 'units' ? 'kWh' : '₹';

  if (loading) {
    return (
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 24, textAlign: 'center', color: labelColor }}>
        Recalculating monthly usage grids...
      </div>
    );
  }

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      
      {/* Title & View Mode Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color="#10B981" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Monthly Usage & Anomaly Analyzer
          </span>
        </div>

        {/* Units / Cost Toggle */}
        <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9', border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 2 }}>
          {[
            { id: 'units', label: 'Units (kWh)' },
            { id: 'cost', label: 'Cost (₹)' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setViewMode(opt.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === opt.id ? '#10B981' : 'transparent',
                color: viewMode === opt.id ? '#fff' : labelColor,
                transition: 'all 0.15s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 16, alignItems: 'stretch' }}>
        
        {/* Left Side: Bar Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={8} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => [`${value} ${unitLabel}`, viewMode === 'units' ? 'Consumption' : 'Estimated Cost']}
                  contentStyle={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    borderRadius: '8px',
                    fontSize: '9px'
                  }}
                  itemStyle={{ color: valueColor, fontWeight: 700 }}
                  labelStyle={{ color: titleColor, fontWeight: 800 }}
                />
                
                {/* Horizontal Baseline Avg Line */}
                {anomalyInfo.baselineAvg > 0 && (
                  <ReferenceLine 
                    y={displayedBaseline} 
                    stroke="#EF4444" 
                    strokeWidth={1}
                    strokeDasharray="3 3" 
                  />
                )}

                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, index) => {
                    let fill = '#10B981'; // normal green
                    if (entry.isAnomaly) {
                      fill = '#EF4444'; // critical red spike
                    } else if (entry.isCurrent) {
                      fill = '#3B82F6'; // current month (no anomaly)
                    }
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: labelColor, padding: '0 4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#10B981' }}></span> Historical Months
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#3B82F6' }}></span> Current Month (Normal)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#EF4444' }}></span> Anomaly Spike (&gt;{settings.threshold_percent}%)
            </span>
          </div>
        </div>

        {/* Right Side: Summary Card & Disclaimers */}
        <div style={{ display: 'flex', flexDirection: 'column', justifycontent: 'space-between', gap: 10 }}>
          
          {/* Status Panel Card */}
          <div style={{
            background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
            border: `1px solid ${cardBorder}`,
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            justifyContent: 'center'
          }}>
            {anomalyInfo.baselineAvg === 0 ? (
              <div style={{ fontSize: 9, color: labelColor, textAlign: 'center' }}>
                Collecting historical readings for baseline calculations...
              </div>
            ) : anomalyInfo.isAnomaly ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontWeight: 800, fontSize: 10 }}>
                  <AlertTriangle size={14} /> Usage Spike Flagged
                </div>
                <div style={{ fontSize: 9, color: valueColor, fontWeight: 600, lineHeight: 1.3 }}>
                  This month: <strong>{displayedCurrent} {unitLabel}</strong>
                  <br />
                  <span style={{ color: '#EF4444' }}>+{anomalyInfo.percentChange}%</span> higher than your 6-month average of {displayedBaseline} {unitLabel}.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontWeight: 800, fontSize: 10 }}>
                  <CheckCircle size={14} /> Usage Nominal
                </div>
                <div style={{ fontSize: 9, color: valueColor, fontWeight: 600, lineHeight: 1.3 }}>
                  This month: <strong>{displayedCurrent} {unitLabel}</strong>
                  <br />
                  <span style={{ color: anomalyInfo.percentChange >= 0 ? '#F59E0B' : '#10B981' }}>
                    {anomalyInfo.percentChange >= 0 ? '+' : ''}{anomalyInfo.percentChange}%
                  </span> deviation vs your 6-month baseline of {displayedBaseline} {unitLabel}.
                </div>
              </div>
            )}
          </div>

          {/* Footnotes & Sim Disclaimer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 7.5, color: labelColor, lineHeight: 1.25 }}>
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
              <Info size={9} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Monthly readings are simulated for demonstration. Connect a real smart meter feed for live monitoring.</span>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
