import React from 'react';
import {
  LayoutDashboard, Map, BarChart3, Leaf, BrainCircuit,
  Wind, Network, FileText, BellRing, Settings,
  LogOut, User as UserIcon, Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { id: 'overview',     label: 'Dashboard',         Icon: LayoutDashboard },
  { id: 'national-map', label: 'National Map',       Icon: Map             },
  { id: 'forecasting',  label: 'Energy Analytics',   Icon: BarChart3       },
  { id: 'carbon',       label: 'Carbon Audit',       Icon: Leaf            },
  { id: 'forecasting',  label: 'AI Predictions',     Icon: BrainCircuit    },
  { id: 'optimization', label: 'Renewable Sources',  Icon: Wind            },
  { id: 'optimization', label: 'Grid Status',        Icon: Network         },
  { id: 'reports',      label: 'Reports',            Icon: FileText        },
  { id: 'anomalies',    label: 'Alerts Center',      Icon: BellRing        },
  { id: 'profile',      label: 'Settings',           Icon: Settings        },
];

export default function Sidebar({ activePage, setActivePage, activeAnomalyCount, pendingOptCount, onLogout }) {
  const { currentUser } = useAuth();
  const avatar = (() => {
    try { const p = JSON.parse(localStorage.getItem(`profile_meta_${currentUser?.email || currentUser?.uid}`) || '{}'); return p.avatar || null; }
    catch { return null; }
  })();
  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operator';
  const email = currentUser?.email || '';

  return (
    <aside style={{ width: 200, background: '#0b0f19', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

      {/* Vertical Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {NAV.map((item, idx) => {
          const active = activePage === item.id;
          const isBell = item.id === 'anomalies' && activeAnomalyCount > 0;
          return (
            <button
              key={`${item.label}-${idx}`}
              onClick={() => setActivePage(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 10px 9px 9px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', border: 'none',
                borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: active ? '#3B82F6' : '#64748b',
                fontSize: 11, fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#cbd5e1'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b'; } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <item.Icon size={15} />
                <span>{item.label}</span>
              </div>
              {isBell && (
                <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 999 }}>
                  {activeAnomalyCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom of sidebar: small branding card "EcoWatt AI — Empowering a Greener Tomorrow" */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Branding card */}
        <div style={{ background: 'linear-gradient(135deg,#0f2340 0%,#0a1a10 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: 7, padding: 5 }}>
              <Globe size={12} color="#10B981" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>EcoWatt AI</span>
          </div>
          <p style={{ fontSize: 8, color: '#64748b', lineHeight: 1.5, margin: 0 }}>Empowering a Greener Tomorrow</p>
        </div>

        {/* Profile row */}
        <button onClick={() => setActivePage('profile')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, marginBottom: 6 }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatar ? <img src={avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={13} color="#94a3b8" />}
          </div>
          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 8, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
        </button>

        {/* Sign out */}
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 0', fontSize: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.35)'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='none'; e.currentTarget.style.color='#64748b'; }}>
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
