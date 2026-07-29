import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Leaf,
  BrainCircuit,
  Wind,
  Network,
  FileText,
  BellRing,
  Settings,
  Zap,
  LogOut,
  User as UserIcon,
  TrendingUp,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'national', label: 'National Map', icon: Map, group: 'main' },
  { id: 'forecasting', label: 'Energy Analytics', icon: BarChart3, group: 'main' },
  { id: 'carbon', label: 'Carbon Audit', icon: Leaf, group: 'main' },
  { id: 'forecasting', label: 'AI Predictions', icon: BrainCircuit, group: 'tools' },
  { id: 'optimization', label: 'Renewable Sources', icon: Wind, group: 'tools' },
  { id: 'optimization', label: 'Grid Status', icon: Network, group: 'tools' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'tools' },
  { id: 'anomalies', label: 'Alerts Center', icon: BellRing, group: 'tools' },
  { id: 'profile', label: 'Settings', icon: Settings, group: 'tools' },
];

function Sidebar({ activePage, setActivePage, activeAnomalyCount, pendingOptCount, onLogout }) {
  const { currentUser } = useAuth();

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

  const getBadge = (id) => {
    if (id === 'anomalies' && activeAnomalyCount > 0) return activeAnomalyCount;
    if (id === 'optimization' && pendingOptCount > 0) return pendingOptCount;
    return null;
  };

  return (
    <aside className="w-56 bg-[#0d1117] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badge = getBadge(item.id);

          return (
            <motion.button
              key={`${item.id}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-accentBlue/10 text-accentBlue border-l-2 border-accentBlue'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accentBlue' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {badge !== null && (
                <span className={`px-1.5 py-0.5 text-[8px] rounded-full font-bold ${
                  item.id === 'anomalies' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom branding card */}
      <div className="px-2 pb-2">
        <div className="bg-gradient-to-br from-accentBlue/10 via-accentGreen/5 to-transparent border border-white/5 rounded-xl p-3 mb-2">
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="bg-accentGreen/20 p-1.5 rounded-lg">
              <Zap className="h-3.5 w-3.5 text-accentGreen" />
            </div>
            <p className="text-[9px] font-black text-white">EcoWatt AI</p>
          </div>
          <p className="text-[8px] text-slate-500 leading-relaxed">Empowering a Greener Tomorrow through intelligent energy optimization.</p>
        </div>

        {/* Profile row */}
        <button
          onClick={() => setActivePage('profile')}
          className="w-full flex items-center space-x-2 hover:bg-white/5 rounded-xl px-2 py-2 transition-all mb-1"
        >
          <div className="h-7 w-7 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {avatar
              ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              : <UserIcon className="h-3.5 w-3.5 text-slate-400" />
            }
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-200 truncate">{currentUser?.displayName || 'Operator'}</p>
            <p className="text-[8px] text-slate-500 truncate">{currentUser?.email || ''}</p>
          </div>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-slate-500 text-[10px] font-semibold transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
