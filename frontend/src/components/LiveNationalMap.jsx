import React, { useState } from 'react';
import { ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import IndiaMap from './IndiaMap';
import { stateData } from '../data/stateData';

const LEGEND = [
  { label: 'Excellent', range: '> 2,000 kWh',      color: '#EF4444' },
  { label: 'Good',      range: '1,000–2,000 kWh',  color: '#F59E0B' },
  { label: 'Moderate',  range: '500–1,000 kWh',    color: '#10B981' },
  { label: 'Critical',  range: '< 500 kWh',        color: '#64748B' },
];

export default function LiveNationalMap({ selectedState, onSelectState, tierFilter }) {
  const [metric, setMetric] = useState('electricity');
  const [scale, setScale]   = useState(1.0);

  return (
    <div style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live National Energy Map</div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Real-time Electricity Consumption Overview</div>
        </div>
        <div style={{ position: 'relative' }}>
          <select value={metric} onChange={e => setMetric(e.target.value)}
            style={{ appearance: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: 9, fontWeight: 700, color: '#cbd5e1', cursor: 'pointer', outline: 'none' }}>
            <option value="electricity">Electricity Consumption (kWh)</option>
            <option value="carbon">Carbon Emission (kg CO₂)</option>
          </select>
          <ChevronDown size={10} color="#64748b" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Map body */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>

        {/* Legend */}
        <div style={{ position: 'absolute', left: 10, top: 10, zIndex: 10, background: 'rgba(11,15,25,0.92)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', backdropFilter: 'blur(8px)' }}>
          {LEGEND.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0, marginTop: 1 }}></span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{l.label}</div>
                <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{l.range}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.2s ease', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IndiaMap
            stateData={stateData}
            selectedState={selectedState}
            onSelectState={onSelectState}
            tierFilter={tierFilter || 'All'}
            isDarkMode={true}
            activeMetric={metric}
          />
        </div>

        {/* Zoom */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ title: '+', fn: () => setScale(s => Math.min(s+0.12,1.7)), Icon: ZoomIn },
            { title: '-', fn: () => setScale(s => Math.max(s-0.12,0.6)), Icon: ZoomOut }].map(({ title, fn, Icon }) => (
            <button key={title} onClick={fn} title={title}
              style={{ width: 28, height: 28, background: 'rgba(11,15,25,0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
