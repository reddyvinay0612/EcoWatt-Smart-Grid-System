import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ModelComparisonPanel({ comparisonData }) {
  const { isDarkMode } = useTheme();
  const [activeMetric, setActiveMetric] = useState('MAE'); // 'MAE' | 'RMSE' | 'MAPE' | 'R2'

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const valueColor = isDarkMode ? '#E2E8F0' : '#0F172A';

  const defaultData = {
    "CNN-LSTM": { "RMSE": 0.157, "MAE": 0.119, "MAPE": 31.0, "R2": 0.716 },
    "Plain LSTM": { "RMSE": 0.157, "MAE": 0.123, "MAPE": 36.1, "R2": 0.715 },
    "Plain ANN": { "RMSE": 0.135, "MAE": 0.106, "MAPE": 30.5, "R2": 0.791 }
  };

  const data = comparisonData || defaultData;

  // Prepare chart data based on active metric
  const chartData = [
    { name: 'Plain ANN', Value: data['Plain ANN'][activeMetric], color: '#10B981' },
    { name: 'Plain LSTM', Value: data['Plain LSTM'][activeMetric], color: '#3B82F6' },
    { name: 'CNN-LSTM Hybrid', Value: data['CNN-LSTM'][activeMetric], color: '#8B5CF6' }
  ];

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      
      {/* Title & Metric selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color="#8B5CF6" />
          <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Model Accuracy Proving Ground
          </span>
        </div>
        
        {/* Metric selection pills */}
        <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9', border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 2 }}>
          {['MAE', 'RMSE', 'MAPE', 'R2'].map(m => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeMetric === m ? '#8B5CF6' : 'transparent',
                color: activeMetric === m ? '#fff' : labelColor,
                transition: 'all 0.15s'
              }}
            >
              {m === 'R2' ? 'R² Score' : m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, alignItems: 'center' }}>
        
        {/* Left side: Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <th style={{ padding: '6px 8px', color: labelColor, fontWeight: 800 }}>Model Engine</th>
                <th style={{ padding: '6px 8px', color: labelColor, fontWeight: 800 }}>MAE</th>
                <th style={{ padding: '6px 8px', color: labelColor, fontWeight: 800 }}>RMSE</th>
                <th style={{ padding: '6px 8px', color: labelColor, fontWeight: 800 }}>MAPE</th>
                <th style={{ padding: '6px 8px', color: labelColor, fontWeight: 800 }}>R² Score</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([modelName, metrics]) => (
                <tr key={modelName} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td style={{ padding: '8px 8px', fontWeight: 800, color: valueColor }}>{modelName}</td>
                  <td style={{ padding: '8px 8px', color: valueColor, fontWeight: 600 }}>{metrics.MAE.toFixed(3)}</td>
                  <td style={{ padding: '8px 8px', color: valueColor, fontWeight: 600 }}>{metrics.RMSE.toFixed(3)}</td>
                  <td style={{ padding: '8px 8px', color: valueColor, fontWeight: 600 }}>{metrics.MAPE.toFixed(1)}%</td>
                  <td style={{ padding: '8px 8px', color: valueColor, fontWeight: 600 }}>{metrics.R2.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right side: Chart */}
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={8} tickLine={false} />
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
              <Bar name={activeMetric === 'R2' ? 'R² Score' : activeMetric} dataKey="Value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}
