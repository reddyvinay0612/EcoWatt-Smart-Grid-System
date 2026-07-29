import React, { useState, useEffect } from 'react';
import { Lightbulb, Bell, ChevronDown, User as UserIcon } from 'lucide-react';
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

  const formatTime = (d) => {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m}:${s} ${ampm}`;
  };

  return (
    <header className="h-14 bg-[#0d1219] border-b border-white/5 flex items-center justify-between px-5 shrink-0 z-30">
      {/* Center: page title */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
        </div>
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-[0.12em] leading-none">
            EcoWatt AI National Analytics Center
          </p>
          <p className="text-[9px] text-slate-500 leading-none mt-0.5 font-medium">
            Powering India's Sustainable Future
          </p>
        </div>
      </div>

      {/* Right: status + clock + bell + user */}
      <div className="flex items-center space-x-4">
        {/* Live status pill */}
        <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wide">Live Monitoring</span>
        </div>

        {/* Clock */}
        <span className="text-[11px] font-mono font-semibold text-slate-400 tabular-nums min-w-[90px]">
          {formatTime(time)}
        </span>

        {/* Notification Bell */}
        <button className="relative p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-accentBlue rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User pill */}
        <button
          onClick={onProfileClick}
          className="flex items-center space-x-2 hover:bg-white/5 px-2 py-1.5 rounded-xl transition-all"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accentBlue to-blue-700 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
            {avatar
              ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              : <span className="text-[9px] font-black text-white">
                  {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                </span>
            }
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-200 leading-none max-w-[80px] truncate">
              {currentUser?.displayName || 'Operator'}
            </p>
            <p className="text-[9px] text-slate-500 leading-none mt-0.5">Administrator</p>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>
      </div>
    </header>
  );
}

export default Header;
