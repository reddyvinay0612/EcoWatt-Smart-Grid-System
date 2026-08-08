import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ConsumptionTrendChart({ historicalData = [], baseAvg = 250 }) {
  const { isDarkMode } = useTheme();
  const [range, setRange] = useState('Day');

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#E2E8F0' : '#0F172A';
  const selectBg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const selectBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1';
  const selectText = isDarkMode ? '#CBD5E1' : '#0F172A';

  // Compute dataset based on selected range
  const chartData = useMemo(() => {
    let dataToUse = historicalData;
    
    // Generate high-fidelity simulated telemetry history if not provided
    if (!dataToUse || dataToUse.length === 0) {
      const now = new Date();
      const simData = [];
      const hourlyAvg = baseAvg / 720; // convert monthly baseline to average hourly kW draw
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = time.getHours();
        
        // Diurnal load cycle: peak in evening, minimum in early morning
        const sinePart = Math.sin((hour - 6) * Math.PI / 12) * (hourlyAvg * 0.3);
        const peakPart = (hour >= 18 && hour <= 22) ? (hourlyAvg * 0.25) : 0;
        const randomNoise = (Math.sin(i * 1.7) * (hourlyAvg * 0.05)) + (Math.cos(i * 0.9) * (hourlyAvg * 0.03));
        const value = Math.max(0.1, round(hourlyAvg + sinePart + peakPart + randomNoise, 3));
        
        simData.push({
          timestamp: time.toISOString(),
          value: value
        });
      }
      dataToUse = simData;
    }

    if (range === 'Day') {
      return dataToUse.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Load: d.value
      }));
    } else if (range === 'Week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day, idx) => {
        const val = dataToUse.reduce((acc, curr) => acc + curr.value, 0) / (dataToUse.length || 1);
        const dayFactor = idx >= 5 ? 1.25 : 0.95;
        return {
          time: day,
          Load: round(val * 24 * dayFactor, 2)
        };
      });
    } else {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weeks.map((week, idx) => {
        const val = dataToUse.reduce((acc, curr) => acc + curr.value, 0) / (dataToUse.length || 1);
        const weekFactor = 1.0 + Math.sin(idx * 1.5) * 0.1;
        return {
          time: week,
          Load: round(val * 24 * 7 * weekFactor, 1)
        };
      });
    }
  }, [historicalData, baseAvg, range]);

  function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarRange size={16} color="#10B981" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Historical Trend Analysis
          </span>
        </div>
        
        {/* Dropdown Selector */}
        <div style={{ position: 'relative' }}>
          <select 
            value={range} 
            onChange={e => setRange(e.target.value)}
            style={{
              appearance: 'none',
              background: selectBg,
              border: `1px solid ${selectBorder}`,
              borderRadius: 8,
              padding: '4px 24px 4px 10px',
              fontSize: 9,
              fontWeight: 700,
              color: selectText,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="Day">Past 24 Hours</option>
            <option value="Week">Past Week</option>
            <option value="Month">Past Month</option>
          </select>
          <ChevronDown size={9} color={labelColor} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 180 }}>
        {chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: labelColor, fontSize: 10 }}>
            No historical trend data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={8} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={8} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: cardBg, 
                  borderColor: cardBorder, 
                  borderRadius: '8px',
                  fontSize: '9px'
                }}
                itemStyle={{ color: valueColor, fontWeight: 700 }}
                labelStyle={{ color: titleColor, fontWeight: 800 }}
              />
              <Area 
                name="Load" 
                type="monotone" 
                dataKey="Load" 
                stroke="#10B981" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#loadGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
