import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart2, ChevronDown } from 'lucide-react';

export default function ComparisonChart({ 
  items = [], 
  compareA, 
  setCompareA, 
  compareB, 
  setCompareB, 
  averageValueElec = 1390, 
  averageValueCarbon = 1140, 
  averageLabel = 'Average', 
  isDarkMode = true,
  height = 260
}) {
  // Fallbacks if compareA or compareB are not provided or not in items list
  const itemA = items.find(x => x.name === compareA) || items[0] || { name: 'Region A', electricityConsumption: 1200, carbonEmission: 950 };
  const itemB = items.find(x => x.name === compareB) || items[1] || items[0] || { name: 'Region B', electricityConsumption: 1800, carbonEmission: 1400 };

  const chartData = [
    { 
      name: itemA?.name || 'Region A', 
      Electricity: Math.round(itemA?.electricityConsumption || itemA?.value || 0),
      Carbon: Math.round(itemA?.carbonEmission || 0)
    },
    { 
      name: itemB?.name || 'Region B', 
      Electricity: Math.round(itemB?.electricityConsumption || itemB?.value || 0),
      Carbon: Math.round(itemB?.carbonEmission || 0)
    },
    { 
      name: averageLabel, 
      Electricity: averageValueElec,
      Carbon: averageValueCarbon
    }
  ];

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const valueColor = isDarkMode ? '#E2E8F0' : '#0F172A';
  const selectBg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const selectBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1';
  const selectText = isDarkMode ? '#CBD5E1' : '#0F172A';

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '14px 16px' }}>
      
      {/* Title & Dropdown Selectors Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={16} color="#3B82F6" />
          <h4 style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Comparative Audit ({items.length > 0 && items[0]?.isState === false ? 'Districts' : 'States'})
          </h4>
        </div>

        {/* 2 Region Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <select
              value={itemA?.name}
              onChange={e => setCompareA && setCompareA(e.target.value)}
              style={{
                appearance: 'none',
                background: selectBg,
                border: `1px solid ${selectBorder}`,
                borderRadius: 8,
                padding: '4px 24px 4px 8px',
                fontSize: 9,
                fontWeight: 700,
                color: selectText,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: 130
              }}
            >
              {items.map(it => (
                <option key={`a-${it.name}`} value={it.name}>{it.name}</option>
              ))}
            </select>
            <ChevronDown size={9} color="#64748b" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b' }}>VS</span>

          <div style={{ position: 'relative' }}>
            <select
              value={itemB?.name}
              onChange={e => setCompareB && setCompareB(e.target.value)}
              style={{
                appearance: 'none',
                background: selectBg,
                border: `1px solid ${selectBorder}`,
                borderRadius: 8,
                padding: '4px 24px 4px 8px',
                fontSize: 9,
                fontWeight: 700,
                color: selectText,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: 130
              }}
            >
              {items.map(it => (
                <option key={`b-${it.name}`} value={it.name}>{it.name}</option>
              ))}
            </select>
            <ChevronDown size={9} color="#64748b" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#131824' : '#FFFFFF', 
                borderColor: cardBorder, 
                borderRadius: '10px',
                fontSize: '10px'
              }}
              itemStyle={{ color: valueColor, fontWeight: 700 }}
              labelStyle={{ color: titleColor, fontWeight: 800 }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '700', paddingTop: '6px' }} iconSize={8} />
            <Bar name="Electricity (kWh)" dataKey="Electricity" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar name="Carbon (kg CO2)" dataKey="Carbon" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
