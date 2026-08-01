import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import GlowCard from './GlowCard';

export default function PredictionPanel({ predictionData }) {
  const { isDarkMode } = useTheme();

  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';

  const chartData = useMemo(() => {
    if (!predictionData) return [];
    
    const { historical_24h = [], forecast_24h = [] } = predictionData;
    
    const data = [];
    
    // Add historical actuals
    historical_24h.forEach((d) => {
      const ts = new Date(d.timestamp);
      data.push({
        time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Actual: d.value,
        Predicted: null
      });
    });
    
    // Connect historical and predicted by adding the last actual point as the first predict start point
    if (historical_24h.length > 0 && forecast_24h.length > 0) {
      const lastHist = historical_24h[historical_24h.length - 1];
      const ts = new Date(lastHist.timestamp);
      data.push({
        time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Actual: lastHist.value,
        Predicted: lastHist.value
      });
    }

    // Add future forecasts
    forecast_24h.forEach((d) => {
      const ts = new Date(d.timestamp);
      data.push({
        time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Actual: null,
        Predicted: d.value
      });
    });
    
    return data;
  }, [predictionData]);

  return (
    <GlowCard glowColor="purple" customSize={true} className="w-full flex flex-col gap-4">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#7C3AED" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            CNN-LSTM Hybrid Load Forecast
          </span>
        </div>
        <span style={{ fontSize: 8, color: '#A855F7', background: 'rgba(168,85,247,0.12)', padding: '2px 6px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>
          Next 24h Projection
        </span>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 180 }}>
        {!predictionData ? (
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
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                  borderColor: cardBorder, 
                  borderRadius: '8px',
                  fontSize: '9px',
                  color: titleColor
                }}
              />
              <Legend wrapperStyle={{ fontSize: '9px', fontWeight: '700' }} iconSize={8} />
              <Line 
                name="Actual Load (kWh)" 
                type="monotone" 
                dataKey="Actual" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                dot={false} 
                connectNulls 
              />
              <Line 
                name="CNN-LSTM Prediction (kWh)" 
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

    </GlowCard>
  );
}
