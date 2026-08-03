import React, { useState, useEffect } from 'react';
import { Zap, Lightbulb, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function Header({ onProfileClick, selectedHouseholdId }) {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = d => {
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0'), s = String(d.getSeconds()).padStart(2, '0');
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

  const bg = isDarkMode ? '#0d1219' : '#FFFFFF';
  const border = isDarkMode ? 'rgba(255,255,255,0.07)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subtitleColor = isDarkMode ? '#A0AEC0' : '#475569';

  return (
    <header style={{
      height: 56,
      background: bg,
      borderBottom: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      zIndex: 30,
      transition: 'background 0.2s, border-color 0.2s',
    }}>

      {/* Left: Logo + App Name + Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: isDarkMode ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)', border: isDarkMode ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: 6, flexShrink: 0 }}>
          <Zap size={16} color="#3B82F6" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: titleColor, lineHeight: 1 }}>EcoWatt AI</div>
          <div style={{ fontSize: 8, color: subtitleColor, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>SEMS Optimization</div>
        </div>
      </div>

      {/* Center-left: Page Icon + Title + Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: isDarkMode ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.1)', border: isDarkMode ? '1px solid rgba(234,179,8,0.25)' : '1px solid rgba(234,179,8,0.3)', borderRadius: 10, padding: 7 }}>
          <Lightbulb size={15} color="#EAB308" />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: titleColor, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
            ECOWATT AI RESIDENTIAL MONITORING CENTER
          </div>
          <div style={{ fontSize: 9, color: subtitleColor, marginTop: 2, fontWeight: 600 }}>
            Powering Sustainable Smart Homes
          </div>
        </div>
      </div>

      {/* Right side: Theme Toggle + Status Pill + Clock + Bell + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Theme Toggle Button (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : '#CBD5E1'}`,
            borderRadius: 999,
            padding: '5px 12px',
            cursor: 'pointer',
            color: isDarkMode ? '#F59E0B' : '#0F172A',
            fontSize: 10,
            fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >
          {isDarkMode ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="#3B82F6" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Live Monitoring status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 999, padding: '5px 12px' }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10B981', opacity: 0.7, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}></span>
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#10B981', letterSpacing: '0.05em' }}>Live Monitoring</span>
        </div>

        {/* Live clock */}
        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: isDarkMode ? '#CBD5E1' : '#334155', minWidth: 90 }}>
          {fmt(time)}
        </span>

        {/* Notification bell icon with badge count dropdown */}
        <NotificationBell selectedHouseholdId={selectedHouseholdId} />

        {/* User avatar */}
        <button onClick={onProfileClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', border: `1px solid ${border}`, borderRadius: 10, padding: '5px 10px', cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#1d4ed8)', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{name[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: titleColor, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 9, color: subtitleColor, fontWeight: 600 }}>Administrator</div>
          </div>
          <ChevronDown size={12} color={subtitleColor} />
        </button>
      </div>

      <style>{`@keyframes ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </header>
  );
}
