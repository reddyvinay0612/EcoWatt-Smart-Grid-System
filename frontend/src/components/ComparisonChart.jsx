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
import { BarChart2 } from 'lucide-react';

function ComparisonChart({ 
  itemA, 
  itemB, 
  averageValueElec = 1390, 
  averageValueCarbon = 1140, 
  averageLabel = 'National Average', 
  isDarkMode 
}) {
  const chartData = [
    { 
      name: itemA?.name || 'Region A', 
      Electricity: itemA?.electricityConsumption || 0,
      Carbon: itemA?.carbonEmission || 0
    },
    { 
      name: itemB?.name || 'Region B', 
      Electricity: itemB?.electricityConsumption || 0,
      Carbon: itemB?.carbonEmission || 0
    },
    { 
      name: averageLabel, 
      Electricity: averageValueElec,
      Carbon: averageValueCarbon
    }
  ];

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all ${
      isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-205 bg-white shadow-sm'
    }`}>
      <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
        <BarChart2 className="h-5 w-5 text-accentBlue" />
        <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Grouped Metric Auditing (kWh & kg CO2)
        </h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#151D30' : '#FFFFFF', 
                borderColor: isDarkMode ? '#1E293B' : '#E5E7EB', 
                borderRadius: '12px' 
              }}
              labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px', fontWeight: '600', paddingTop: '10px' }}
              iconSize={8}
            />
            <Bar 
              name="Electricity (kWh)" 
              dataKey="Electricity" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={30} 
            />
            <Bar 
              name="Carbon (kg CO2)" 
              dataKey="Carbon" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={30} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ComparisonChart;
