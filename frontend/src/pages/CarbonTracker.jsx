import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Leaf, Info, Globe, ShieldAlert, Award } from 'lucide-react';

import { carbonService } from '../services/api';

function CarbonTracker({ consumerId, activeConsumer }) {
  const [period, setPeriod] = useState('daily');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!consumerId) return;
    setIsLoading(true);
    try {
      const data = await carbonService.getSummary(consumerId, period);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load carbon stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Refresh on live ticks
    window.addEventListener('grid-tick', loadData);
    return () => {
      window.removeEventListener('grid-tick', loadData);
    };
  }, [consumerId, period]);

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-sm pulse-soft">Loading carbon metrics...</div>
      </div>
    );
  }

  // Define data for the penetration radial/pie chart
  const penetrationRate = summary?.renewable_penetration_rate || 0.0;
  const pieData = [
    { name: 'Renewable', value: penetrationRate },
    { name: 'Grid Utility', value: Math.max(0, 100 - penetrationRate) }
  ];
  
  const PIE_COLORS = ['#10B981', '#1E293B'];

  // Bar chart data comparing counterfactual (Gross) vs Actual (Net) vs Savings (Avoided)
  const barData = [
    {
      name: 'Carbon Impact',
      'Gross Baseline': summary?.gross_emissions_kg || 0,
      'Net Footprint': summary?.net_emissions_kg || 0,
      'Avoided CO₂': summary?.avoided_emissions_kg || 0
    }
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Carbon Footprint Tracker</h2>
          <p className="text-slate-400 text-sm mt-1">
            CO₂e emission analysis and renewable energy offset audits for <span className="text-slate-200 font-semibold">{activeConsumer?.name}</span>
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-[#0F1626] border border-darkBorder p-1 rounded-xl">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                period === p 
                  ? 'bg-accentBlue text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'daily' ? 'Today' : p === 'weekly' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Carbon Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder/40">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Gross Footprint</span>
              <span className="text-3xl font-bold text-white">
                {(summary?.gross_emissions_kg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-slate-400 text-xs font-medium">kg CO₂e</span>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-slate-400">
              <Globe className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal mt-4">
            Hypothetical emission footprint if all loads were drawn directly from the grid utility baseline (no solar/wind offsets).
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-accentGreen/15">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Carbon Offset</span>
              <span className="text-3xl font-bold text-accentGreen">
                {(summary?.avoided_emissions_kg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-slate-400 text-xs font-medium block">kg CO₂e avoided</span>
            </div>
            <div className="bg-accentGreen/10 p-2.5 rounded-xl border border-accentGreen/25 text-accentGreen">
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal mt-4">
            Emissions actively mitigated by self-consuming local rooftop solar photovoltaic cells and micro-wind energy arrays.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-accentBlue/15 font-semibold">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Net Carbon Audited</span>
              <span className="text-3xl font-bold text-slate-100">
                {(summary?.net_emissions_kg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-slate-400 text-xs font-medium block">kg CO₂e actual</span>
            </div>
            <div className="bg-accentBlue/10 p-2.5 rounded-xl border border-accentBlue/25 text-accentBlue">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal mt-4 text-accentBlue">
            Your final certified carbon intensity footprint submitted for environmental compliance audits.
          </p>
        </div>
      </div>

      {/* Audit Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison Bar */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="font-bold text-white text-base">Carbon Footprint Counterfactual Audit</h3>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} unit=" kg" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151D30', borderColor: '#1E293B', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Gross Baseline" fill="#475569" radius={[8, 8, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Avoided CO₂" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Net Footprint" fill="#3B82F6" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Penetration Ratio */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="font-bold text-white text-base">Renewable Penetration</h3>
            <p className="text-xs text-slate-400">Proportion of net load served by clean energy</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-white">{penetrationRate.toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Clean Energy</span>
            </div>
          </div>

          <div className="w-full bg-[#0F1626] border border-darkBorder p-3 rounded-xl text-left text-xs leading-relaxed space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-accentGreen rounded-full mr-2"></span>Clean Consumption:</span>
              <span className="font-semibold text-white">{(summary?.total_renewable_kwh ?? 0).toFixed(1)} kWh</span>
            </div>
            <div className="flex justify-between border-t border-darkBorder/40 pt-1.5 mt-1.5">
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-slate-700 rounded-full mr-2"></span>Total Energy Audited:</span>
              <span className="font-semibold text-white">{(summary?.total_energy_kwh ?? 0).toFixed(1)} kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarbonTracker;
