import React from 'react';

const R = 22, C = 2 * Math.PI * R;

const SOURCES = [
  { label: 'Solar',   pct: 28.4, gw: 35.4, color: '#F59E0B', track: '#78350f' },
  { label: 'Wind',    pct: 18.7, gw: 23.3, color: '#06B6D4', track: '#164e63' },
  { label: 'Hydro',   pct: 24.6, gw: 30.6, color: '#3B82F6', track: '#1e3a5f' },
  { label: 'Nuclear', pct: 9.8,  gw: 12.2, color: '#A855F7', track: '#3b0764' },
  { label: 'Thermal', pct: 18.5, gw: 23.1, color: '#F97316', track: '#7c2d12' },
];

export default function EnergySourceRings() {
  return (
    <div style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Energy Source Distribution</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
        {SOURCES.map(s => {
          const dash = (s.pct / 100) * C;
          return (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ position: 'relative', width: 64, height: 64 }}>
                <svg viewBox="0 0 56 56" width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="28" cy="28" r={R} fill="none" stroke={s.track} strokeWidth="5" />
                  <circle cx="28" cy="28" r={R} fill="none" stroke={s.color} strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${C}`}
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{s.pct}%</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{s.gw} GW</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
