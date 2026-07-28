import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { BarChart2 } from 'lucide-react';

function ComparisonChart({ itemA, itemB, averageValue = 1390, averageLabel = 'National Average', isDarkMode }) {
  const chartData = [
    { 
      name: itemA?.name || 'Region A', 
      Consumption: itemA?.value || 0, 
      fill: itemA?.tier === 'High' ? '#EF4444' : itemA?.tier === 'Medium' ? '#F59E0B' : '#10B981' 
    },
    { 
      name: itemB?.name || 'Region B', 
      Consumption: itemB?.value || 0, 
      fill: itemB?.tier === 'High' ? '#EF4444' : itemB?.tier === 'Medium' ? '#F59E0B' : '#10B981' 
    },
    { 
      name: averageLabel, 
      Consumption: averageValue, 
      fill: '#3B82F6' // Base Blue
    }
  ];

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all ${
      isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
        <BarChart2 className="h-5 w-5 text-blue-500" />
        <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Side-by-Side Comparison (kWh)
        </h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} unit=" kWh" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#151D30' : '#FFFFFF', 
                borderColor: isDarkMode ? '#1E293B' : '#E5E7EB', 
                borderRadius: '12px' 
              }}
              labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
            />
            <Bar dataKey="Consumption" radius={[6, 6, 0, 0]} maxBarSize={45}>
              {chartData.map((entry, index) => (
                <Bar key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ComparisonChart;
