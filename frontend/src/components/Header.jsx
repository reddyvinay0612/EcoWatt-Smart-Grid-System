import React, { useState, useEffect } from 'react';
import { Zap, Bell, ChevronDown, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Header({ onProfileClick, notificationCount = 3 }) {
  const { currentUser } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const avatar = (() => {
    try {
      const key = `profile_meta_${currentUser?.email || currentUser?.uid}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.avatar) return parsed.avatar;
      }
    } catch (_) {}
    return null;
  })();

  return (
    <header className="h-14 bg-[#0d1117] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-30">
      {/* Left: Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-accentBlue/20 p-1.5 rounded-lg border border-accentBlue/30">
          <Zap className="h-4 w-4 text-accentBlue" />
        </div>
        <div>
          <p className="text-xs font-black text-white leading-none tracking-wide">EcoWatt AI</p>
          <p className="text-[9px] text-slate-500 leading-none mt-0.5 font-semibold tracking-widest uppercase">SEMS Optimization</p>
        </div>
      </div>

      {/* Center: title */}
      <div className="hidden lg:flex items-center space-x-2.5">
        <Activity className="h-4 w-4 text-accentBlue" />
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-[0.15em] leading-none">EcoWatt AI National Analytics Center</p>
          <p className="text-[9px] text-slate-500 leading-none mt-0.5 font-medium">Powering India's Sustainable Future</p>
        </div>
      </div>

      {/* Right: status + clock + bells + user */}
      <div className="flex items-center space-x-4">
        {/* Live status */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-accentGreen/10 border border-accentGreen/20 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentGreen opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accentGreen"></span>
          </span>
          <span className="text-[10px] font-bold text-accentGreen tracking-wide">Live Monitoring</span>
        </div>

        {/* Clock */}
        <span className="hidden md:block text-[11px] font-mono font-semibold text-slate-400 tabular-nums">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        {/* Notification Bell */}
        <button className="relative p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-accentRed rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User pill */}
        <button
          onClick={onProfileClick}
          className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
        >
          <div className="h-6 w-6 rounded-full bg-slate-700 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
            {avatar
              ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              : <span className="text-[9px] font-bold text-slate-300">
                  {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                </span>
            }
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[10px] font-bold text-slate-200 leading-none">{currentUser?.displayName || 'Operator'}</p>
            <p className="text-[9px] text-slate-500 leading-none mt-0.5">Administrator</p>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>
      </div>
    </header>
  );
}

export default Header;
