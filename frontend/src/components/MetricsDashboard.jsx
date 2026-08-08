import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Shield, Sparkles, Activity, Leaf, Zap, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MetricsDashboard({ onPresetClick }) {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const gridStroke = isDarkMode ? '#1E293B' : '#E2E8F0';

  // 1. Telemetry Area Chart Data (Consumption in kWh across facilities)
  const consumptionData = [
    { time: '00:00', 'Data Center': 850, 'Solar Farm': 50, 'Factory Unit': 1450 },
    { time: '04:00', 'Data Center': 920, 'Solar Farm': 45, 'Factory Unit': 1520 },
    { time: '08:00', 'Data Center': 780, 'Solar Farm': 450, 'Factory Unit': 1380 },
    { time: '12:00', 'Data Center': 1250, 'Solar Farm': 850, 'Factory Unit': 1850 },
    { time: '16:00', 'Data Center': 1100, 'Solar Farm': 600, 'Factory Unit': 1600 },
    { time: '20:00', 'Data Center': 980, 'Solar Farm': 120, 'Factory Unit': 1550 }
  ];

  // 2. Telemetry Bar Chart Data (Peak Carbon Load Times)
  const carbonLoadData = [
    { time: '00:00', Grid: 1717, Solar: 0, Wind: 0 },
    { time: '04:00', Grid: 1812, Solar: 0, Wind: 0 },
    { time: '08:00', Grid: 1120, Solar: 0, Wind: 966 },
    { time: '12:00', Grid: 1250, Solar: 0, Wind: 1295 },
    { time: '16:00', Grid: 1740, Solar: 0, Wind: 0 },
    { time: '20:00', Grid: 1864, Solar: 0, Wind: 0 }
  ];

  // 3. Power Source Donut Chart Data
  const powerSourceData = [
    { name: 'Coal Grid', value: 11110.7, color: '#EF4444' },
    { name: 'Solar Rooftop', value: 3965.2, color: '#10B981' },
    { name: 'Wind Farms', value: 4381.0, color: '#3B82F6' }
  ];

  const presets = [
    {
      icon: <Activity size={13} className="text-emerald-400" />,
      text: "Which facility had the highest carbon emissions today?",
      desc: "Analyze structures using Cortex Analyst text-to-SQL"
    },
    {
      icon: <Shield size={13} className="text-blue-400" />,
      text: "How can we optimize HVAC settings during peak hours?",
      desc: "Search sustainability policies using Cortex Search RAG"
    },
    {
      icon: <Leaf size={13} className="text-amber-400" />,
      text: "Calculate projected 30-day savings if solar usage increases by 20%.",
      desc: "Execute complex computations inside Cortex Python sandbox"
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      
      {/* Overview KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Energy Consumed', val: '20,011.5 kWh', change: '+3.2%', icon: <Zap size={14} className="text-blue-500" /> },
          { label: 'Carbon Emissions Logged', val: '19,456.9 kg CO2', change: '-5.8%', icon: <Leaf size={14} className="text-emerald-500" /> },
          { label: 'Renewable Power Share', val: '42.9%', change: '+12.4%', icon: <Sparkles size={14} className="text-amber-500" /> }
        ].map((k, idx) => (
          <div 
            key={idx} 
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12 }} 
            className="p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</span>
              <div className="text-lg font-black text-white">{k.val}</div>
              <span className={`text-[10px] font-bold ${k.change.startsWith('+') && idx !== 1 ? 'text-emerald-500' : 'text-emerald-500'}`}>{k.change} vs baseline</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              {k.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Graphs Layout Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Daily Energy Consumption Chart */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16 }} className="p-4 flex flex-col h-[280px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Facility Consumption (Past 24h)</span>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/></linearGradient>
                  <linearGradient id="fuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="time" stroke={labelColor} fontSize={8} tickLine={false} />
                <YAxis stroke={labelColor} fontSize={8} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: cardBorder, borderRadius: 8, fontSize: 10 }} />
                <Area name="Data Center" type="monotone" dataKey="Data Center" stroke="#3B82F6" fill="url(#dcGrad)" strokeWidth={2} />
                <Area name="Factory Unit" type="monotone" dataKey="Factory Unit" stroke="#EF4444" fill="url(#fuGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Carbon Load Time */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16 }} className="p-4 flex flex-col h-[280px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Carbon Emissions by Source (kg CO2)</span>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carbonLoadData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="time" stroke={labelColor} fontSize={8} tickLine={false} />
                <YAxis stroke={labelColor} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: cardBorder, borderRadius: 8, fontSize: 10 }} />
                <Bar name="Grid Carbon" dataKey="Grid" fill="#EF4444" stackId="a" radius={[2, 2, 0, 0]} />
                <Bar name="Wind Carbon" dataKey="Wind" fill="#3B82F6" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Donut and Preset shortcuts Grid */}
      <div className="grid grid-cols-3 gap-4">
        
        {/* Donut Power Mix */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16 }} className="col-span-1 p-4 flex flex-col h-[280px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Telemetry Power Source Mix</span>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={powerSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {powerSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: cardBorder, borderRadius: 8, fontSize: 10 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Preset Shortcuts */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16 }} className="col-span-2 p-4 flex flex-col h-[280px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><HelpCircle size={12} className="text-blue-500" /> Preset Action Shortcuts</span>
          
          <div className="flex-1 flex flex-col justify-center gap-3">
            {presets.map((p, idx) => (
              <button 
                key={idx} 
                onClick={() => onPresetClick(p.text)}
                style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', border: `1px solid ${cardBorder}` }}
                className="w-full text-left p-3 rounded-xl flex items-center gap-3 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all group"
              >
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg group-hover:border-blue-500/35">
                  {p.icon}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="text-[11px] font-extrabold text-white group-hover:text-blue-400 transition-colors leading-tight">{p.text}</div>
                  <div className="text-[9px] font-semibold text-slate-400 leading-tight">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
