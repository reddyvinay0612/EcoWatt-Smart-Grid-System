import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Shield, Sparkles, Activity, Leaf, Zap, HelpCircle } from 'lucide-react';

// ── Theme copied exactly from reference screenshot ─────────────────────────
const T = {
  bg:          '#F5F7FA',   // main page background
  cardBg:      '#FFFFFF',   // white cards
  cardBorder:  '#E8EDF2',   // subtle card border
  cardShadow:  '0 1px 4px rgba(0,0,0,0.07)',
  title:       '#0D1B17',   // dark text
  label:       '#64748B',   // secondary text / axis ticks
  grid:        '#E8EDF2',   // chart grid lines
  primary:     '#10B981',   // teal/emerald – brand primary
  blue:        '#3B82F6',
  red:         '#EF4444',
  amber:       '#F59E0B',
  btnHoverBg:  '#F0FDF4',   // soft green hover on preset buttons
  btnHoverBdr: '#10B981',
};

export default function MetricsDashboard({ onPresetClick }) {

  // 1. Telemetry Area Chart
  const consumptionData = [
    { time: '00:00', 'Data Center': 850,  'Factory Unit': 1450 },
    { time: '04:00', 'Data Center': 920,  'Factory Unit': 1520 },
    { time: '08:00', 'Data Center': 780,  'Factory Unit': 1380 },
    { time: '12:00', 'Data Center': 1250, 'Factory Unit': 1850 },
    { time: '16:00', 'Data Center': 1100, 'Factory Unit': 1600 },
    { time: '20:00', 'Data Center': 980,  'Factory Unit': 1550 },
  ];

  // 2. Carbon Bar Chart
  const carbonLoadData = [
    { time: '00:00', Grid: 1717, Wind: 0 },
    { time: '04:00', Grid: 1812, Wind: 0 },
    { time: '08:00', Grid: 1120, Wind: 966 },
    { time: '12:00', Grid: 1250, Wind: 1295 },
    { time: '16:00', Grid: 1740, Wind: 0 },
    { time: '20:00', Grid: 1864, Wind: 0 },
  ];

  // 3. Power Source Donut
  const powerSourceData = [
    { name: 'HVAC',          value: 35, color: T.primary },
    { name: 'Lighting',      value: 25, color: '#8B5CF6' },
    { name: 'Machinery',     value: 20, color: '#F59E0B' },
    { name: 'IT & Elec.',    value: 10, color: T.blue },
    { name: 'Others',        value: 10, color: '#94A3B8' },
  ];

  const presets = [
    {
      icon: <Activity size={14} color={T.primary} />,
      text: "Which facility had the highest carbon emissions today?",
      desc: "Analyze structures using Cortex Analyst text-to-SQL",
    },
    {
      icon: <Shield size={14} color={T.blue} />,
      text: "How can we optimize HVAC settings during peak hours?",
      desc: "Search sustainability policies using Cortex Search RAG",
    },
    {
      icon: <Leaf size={14} color={T.amber} />,
      text: "Calculate projected 30-day savings if solar usage increases by 20%.",
      desc: "Execute complex computations inside Cortex Python sandbox",
    },
  ];

  // Shared card style
  const card = (extra = {}) => ({
    background: T.cardBg,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14,
    boxShadow: T.cardShadow,
    ...extra,
  });

  const tooltipStyle = {
    backgroundColor: T.cardBg,
    borderColor: T.cardBorder,
    borderRadius: 8,
    fontSize: 10,
    color: T.title,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Total Energy Consumed',    val: '20,011.5 kWh',    change: '+3.2%',  up: true,  icon: <Zap     size={15} color={T.primary} /> },
          { label: 'Carbon Emissions Logged',  val: '19,456.9 kg CO₂', change: '-5.8%',  up: false, icon: <Leaf    size={15} color={T.primary} /> },
          { label: 'Renewable Power Share',    val: '42.9%',           change: '+12.4%', up: true,  icon: <Sparkles size={15} color={T.amber} /> },
        ].map((k, idx) => (
          <div key={idx} style={{ ...card({ padding: '16px 18px' }), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: T.label, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.label}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: T.title, lineHeight: 1.1 }}>{k.val}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: k.up ? '#10B981' : '#EF4444' }}>
                {k.change} vs baseline
              </span>
            </div>
            <div style={{ padding: 10, background: '#F0FDF4', borderRadius: 10, border: '1px solid #D1FAE5' }}>
              {k.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Area Chart – Facility Consumption */}
        <div style={{ ...card({ padding: '16px 16px 10px' }), display: 'flex', flexDirection: 'column', height: 270 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: T.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Facility Consumption (Past 24h)
          </span>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.primary} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={T.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.blue}    stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={T.blue}    stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false} />
                <XAxis dataKey="time"  stroke={T.label} fontSize={8} tickLine={false} />
                <YAxis stroke={T.label} fontSize={8} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area name="Data Center"  type="monotone" dataKey="Data Center"  stroke={T.primary} fill="url(#dcGrad)" strokeWidth={2} dot={false} />
                <Area name="Factory Unit" type="monotone" dataKey="Factory Unit" stroke={T.blue}    fill="url(#fuGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart – Carbon Emissions */}
        <div style={{ ...card({ padding: '16px 16px 10px' }), display: 'flex', flexDirection: 'column', height: 270 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: T.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Carbon Emissions by Source (kg CO₂)
          </span>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carbonLoadData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false} />
                <XAxis dataKey="time"  stroke={T.label} fontSize={8} tickLine={false} />
                <YAxis stroke={T.label} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar name="Grid"  dataKey="Grid" fill={T.primary}  stackId="a" radius={[3, 3, 0, 0]} />
                <Bar name="Wind"  dataKey="Wind" fill={T.blue}     stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Donut + Presets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>

        {/* Donut */}
        <div style={{ ...card({ padding: '16px' }), display: 'flex', flexDirection: 'column', height: 270 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: T.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Consumption by Category
          </span>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={powerSourceData} cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {powerSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                <Legend iconSize={7} wrapperStyle={{ fontSize: 9, color: T.label }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Preset Shortcuts */}
        <div style={{ ...card({ padding: '16px' }), display: 'flex', flexDirection: 'column', height: 270 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: T.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={12} color={T.primary} /> Energy Saving Recommendations
          </span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onPresetClick(p.text)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${T.cardBorder}`,
                  background: '#FAFBFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.btnHoverBg; e.currentTarget.style.borderColor = T.btnHoverBdr; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.borderColor = T.cardBorder; }}
              >
                <div style={{ padding: 8, background: '#F0FDF4', borderRadius: 8, border: '1px solid #D1FAE5', flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.title, lineHeight: 1.35 }}>{p.text}</div>
                  <div style={{ fontSize: 9, color: T.label, marginTop: 2 }}>{p.desc}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: T.primary, whiteSpace: 'nowrap' }}>→</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
