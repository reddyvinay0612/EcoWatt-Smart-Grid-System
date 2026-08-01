import React from 'react';
import {
  Home, BarChart3, Settings,
  LogOut, User as UserIcon, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  onLogout 
}) {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();

  const avatar = (() => {
    try { const p = JSON.parse(localStorage.getItem(`profile_meta_${currentUser?.email || currentUser?.uid}`) || '{}'); return p.avatar || null; }
    catch { return null; }
  })();
  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operator';
  const email = currentUser?.email || '';

  const bg = isDarkMode ? '#0b0f19' : '#FFFFFF';
  const border = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const textInactive = isDarkMode ? '#94A3B8' : '#475569';
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const hoverText = isDarkMode ? '#F8FAFC' : '#0F172A';

  const navItems = [
    { id: 'national',   label: 'National Analytics',  Icon: Globe        },
    { id: 'overview',   label: 'Residential Monitor',  Icon: Home         },
    { id: 'evaluation', label: 'Model Evaluation',    Icon: BarChart3    },
    { id: 'profile',    label: 'Settings',            Icon: Settings     },
  ];

  return (
    <aside style={{
      width: 200,
      background: bg,
      borderRight: `1px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'background 0.2s, border-color 0.2s',
    }}>

      {/* Branding Header */}
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} color="#3B82F6" />
          <span style={{ fontSize: 13, fontWeight: 900, color: isDarkMode ? '#fff' : '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            EcoWatt AI
          </span>
        </div>
        <span style={{ fontSize: 8, color: textInactive, display: 'block', marginTop: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Smart Energy Grid
        </span>
      </div>

      {/* Vertical Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navItems.map((item, idx) => {
          const active = activePage === item.id;
          return (
            <button
              key={`${item.label}-${idx}`}
              onClick={() => setActivePage(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '9px 10px 9px 9px',
                borderRadius: 8,
                marginBottom: 4,
                cursor: 'pointer',
                border: 'none',
                borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
                background: active
                  ? (isDarkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.12)')
                  : 'transparent',
                color: active ? '#3B82F6' : textInactive,
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverText; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textInactive; } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <item.Icon size={15} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom profile and sign-out */}
      <div style={{ padding: '8px', borderTop: `1px solid ${border}` }}>
        {/* Profile row */}
        <button onClick={() => setActivePage('profile')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, marginBottom: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDarkMode ? '#1e293b' : '#CBD5E1', border: `1px solid ${border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0 }}>
            {avatar ? <img src={avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={13} color={isDarkMode ? '#94a3b8' : '#475569'} />}
          </div>
          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: isDarkMode ? '#e2e8f0' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 8, color: isDarkMode ? '#94a3b8' : '#64748B', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
        </button>

        {/* Sign out */}
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '6px 0', fontSize: 10, fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#475569', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.35)'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=border; e.currentTarget.style.background='none'; e.currentTarget.style.color=isDarkMode ? '#94A3B8' : '#475569'; }}>
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
