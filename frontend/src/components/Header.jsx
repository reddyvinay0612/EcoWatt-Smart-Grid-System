import React, { useState, useEffect } from 'react';
import { Lightbulb, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onProfileClick, notificationCount = 0 }) {
  const { currentUser } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = d => {
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2,'0'), s = String(d.getSeconds()).padStart(2,'0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m}:${s} ${ap}`;
  };

  const avatar = (() => {
    try {
      const k = `profile_meta_${currentUser?.email || currentUser?.uid}`;
      const p = JSON.parse(localStorage.getItem(k) || '{}');
      return p.avatar || null;
    } catch { return null; }
  })();

  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operator';

  return (
    <header style={{ height: 56, background: '#0d1219', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 30 }}>

      {/* Center: title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 10, padding: 7 }}>
          <Lightbulb size={15} color="#EAB308" />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
            EcoWatt AI National Analytics Center
          </div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, fontWeight: 500 }}>
            Powering India's Sustainable Future
          </div>
        </div>
      </div>

      {/* Right: pill + clock + bell + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

        {/* Live pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 999, padding: '5px 12px' }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10B981', opacity: 0.7, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}></span>
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', letterSpacing: '0.05em' }}>Live Monitoring</span>
        </div>

        {/* Clock */}
        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#94a3b8', minWidth: 90 }}>
          {fmt(time)}
        </span>

        {/* Bell */}
        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
          <Bell size={16} />
          {notificationCount > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, background: '#3B82F6', borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notificationCount}
            </span>
          )}
        </button>

        {/* User */}
        <button onClick={onProfileClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '5px 10px', cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#1d4ed8)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{name[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Administrator</div>
          </div>
          <ChevronDown size={12} color="#64748b" />
        </button>
      </div>

      <style>{`@keyframes ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </header>
  );
}
