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
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'overview',      label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'national-map',  label: 'National Map',        icon: Map             },
  { id: 'forecasting',   label: 'Energy Analytics',    icon: BarChart3       },
  { id: 'carbon',        label: 'Carbon Audit',        icon: Leaf            },
  { id: 'forecasting',   label: 'AI Predictions',      icon: BrainCircuit    },
  { id: 'optimization',  label: 'Renewable Sources',   icon: Wind            },
  { id: 'optimization',  label: 'Grid Status',         icon: Network         },
  { id: 'reports',       label: 'Reports',             icon: FileText        },
  { id: 'anomalies',     label: 'Alerts Center',       icon: BellRing        },
  { id: 'profile',       label: 'Settings',            icon: Settings        },
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

  return (
    <aside className="w-52 bg-[#0b0f19] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">

      {/* Logo at top */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center space-x-2.5">
        <div className="bg-accentBlue/20 p-1.5 rounded-lg border border-accentBlue/30 shrink-0">
          <Zap className="h-4 w-4 text-accentBlue" />
        </div>
        <div>
          <p className="text-[11px] font-black text-white leading-none">EcoWatt AI</p>
          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest leading-none mt-0.5">SEMS Optimization</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isBellWithBadge = item.id === 'anomalies' && activeAnomalyCount > 0;

          return (
            <motion.button
              key={`${item.label}-${idx}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.035 }}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-all group ${
                isActive
                  ? 'bg-accentBlue/15 text-accentBlue border-l-[3px] border-accentBlue pl-[9px]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border-l-[3px] border-transparent pl-[9px]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`h-[15px] w-[15px] shrink-0 ${isActive ? 'text-accentBlue' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isBellWithBadge && (
                <span className="px-1.5 py-0.5 text-[8px] rounded-full font-bold bg-red-500/20 text-red-400">
                  {activeAnomalyCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom branding card */}
      <div className="px-2 pb-2 space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[#0f2340] via-[#0a1a10] to-[#0d1219] border border-white/5 rounded-xl p-3"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-accentGreen/20 p-1.5 rounded-lg">
              <Globe className="h-3.5 w-3.5 text-accentGreen" />
            </div>
            <p className="text-[9px] font-black text-white leading-none">EcoWatt AI</p>
          </div>
          <p className="text-[8px] text-slate-500 leading-relaxed">
            Empowering a Greener Tomorrow
          </p>
        </motion.div>

        {/* Profile row */}
        <button
          onClick={() => setActivePage('profile')}
          className="w-full flex items-center space-x-2 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-all"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {avatar
              ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              : <UserIcon className="h-3.5 w-3.5 text-slate-400" />
            }
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-200 truncate leading-none">
              {currentUser?.displayName || 'Operator'}
            </p>
            <p className="text-[8px] text-slate-500 truncate mt-0.5">
              {currentUser?.email || ''}
            </p>
          </div>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-slate-600 text-[10px] font-bold transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
