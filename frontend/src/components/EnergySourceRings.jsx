import React from 'react';
import { motion } from 'framer-motion';

const SOURCES = [
  { label: 'Solar', pct: 28.4, gw: 35.4, color: '#F59E0B', track: '#78350F' },
  { label: 'Wind', pct: 18.7, gw: 23.3, color: '#06B6D4', track: '#164E63' },
  { label: 'Hydro', pct: 24.6, gw: 30.6, color: '#3B82F6', track: '#1E3A5F' },
  { label: 'Nuclear', pct: 9.8, gw: 12.2, color: '#A855F7', track: '#3B0764' },
  { label: 'Thermal', pct: 18.5, gw: 23.1, color: '#F97316', track: '#7C2D12' },
];

const RADIUS = 22;
const CIRC = 2 * Math.PI * RADIUS;

function Ring({ pct, color, track }) {
  const dash = (pct / 100) * CIRC;
  return (
    <svg viewBox="0 0 56 56" className="w-16 h-16 -rotate-90">
      <circle cx="28" cy="28" r={RADIUS} fill="none" stroke={track} strokeWidth="5" />
      <circle
        cx="28" cy="28" r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRC}`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

function EnergySourceRings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-[#131824] border border-white/5 rounded-xl p-4"
    >
      <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] mb-3">Energy Source Distribution</p>
      <div className="flex items-center justify-around flex-wrap gap-3">
        {SOURCES.map((src, i) => (
          <motion.div
            key={src.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="flex flex-col items-center space-y-1.5"
          >
            <div className="relative">
              <Ring pct={src.pct} color={src.color} track={src.track} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">{src.pct}%</span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{src.label}</p>
            <p className="text-[9px] font-semibold text-slate-500">{src.gw} GW</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default EnergySourceRings;
