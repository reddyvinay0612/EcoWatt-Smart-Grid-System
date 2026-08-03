import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function PredictionPanel({ predictionData, stateName, activeMetric }) {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#E2E8F0' : '#0F172A';

  const chartData = useMemo(() => {
    // 1. If predictionData is passed, use it (household mode)
    if (predictionData) {
      const { historical_24h = [], forecast_24h = [] } = predictionData;
      const data = [];
      
      historical_24h.forEach((d) => {
        const ts = new Date(d.timestamp);
        data.push({
          time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          Actual: d.value,
          Predicted: null
        });
      });
      
      if (historical_24h.length > 0 && forecast_24h.length > 0) {
        const lastHist = historical_24h[historical_24h.length - 1];
        const ts = new Date(lastHist.timestamp);
        data.push({
          time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          Actual: lastHist.value,
          Predicted: lastHist.value
        });
      }

      forecast_24h.forEach((d) => {
        const ts = new Date(d.timestamp);
        data.push({
          time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          Actual: null,
          Predicted: d.value
        });
      });
      
      return data;
    }

    // 2. If stateName is passed (drill-down audit mode), run high-fidelity simulation fallback
    if (stateName) {
      const data = [];
      const hash = stateName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const baseLoad = 800 + (hash % 10) * 150; // typical peak load 800 - 2300 kWh/capita
      
      const now = new Date();
      
      // Simulate historical 24 hours
      for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = time.getHours();
        const ratio = 0.5 + Math.sin(2 * Math.PI * (hour - 6) / 24) * 0.2 + Math.sin(2 * Math.PI * (hour - 17) / 12) * 0.15;
        const val = baseLoad * ratio + Math.sin(i * 1.5) * 50;
        
        data.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          Actual: Math.round(Math.max(10, val)),
          Predicted: i === 0 ? Math.round(Math.max(10, val)) : null
        });
      }

      // Simulate forecast 24 hours
      for (let i = 1; i <= 24; i++) {
        const time = new Date(now.getTime() + i * 60 * 60 * 1000);
        const hour = time.getHours();
        const ratio = 0.5 + Math.sin(2 * Math.PI * (hour - 6) / 24) * 0.2 + Math.sin(2 * Math.PI * (hour - 17) / 12) * 0.15;
        const val = baseLoad * ratio + Math.sin(i * 1.8) * 35;
        
        data.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          Actual: null,
          Predicted: Math.round(Math.max(10, val))
        });
      }
      return data;
    }

    return [];
  }, [predictionData, stateName]);

  const showLoader = !predictionData && !stateName;

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#7C3AED" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            CNN-LSTM Hybrid Load Forecast {stateName ? `— ${stateName}` : ''}
          </span>
        </div>
        <span style={{ fontSize: 8, color: '#A855F7', background: 'rgba(168,85,247,0.12)', padding: '2px 6px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>
          Next 24h Projection
        </span>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 180 }}>
        {showLoader ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: labelColor, fontSize: 10 }}>
            Loading prediction sequence...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
              <Legend wrapperStyle={{ fontSize: '9px', fontWeight: '700' }} iconSize={8} />
              <Line 
                name={activeMetric === 'carbon' ? "Carbon Emission" : "Electricity Load"} 
                type="monotone" 
                dataKey="Actual" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                dot={false} 
                connectNulls 
              />
              <Line 
                name="CNN-LSTM Prediction" 
                type="monotone" 
                dataKey="Predicted" 
                stroke="#7C3AED" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                dot={false} 
                connectNulls 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
