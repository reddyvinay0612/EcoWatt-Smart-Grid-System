import React from 'react';
import {
  Settings, LogOut, User as UserIcon, Globe,
  Zap, Sun, FileText, Home, Shield, CheckCircle2, ChevronRight
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
    try { 
      const p = JSON.parse(localStorage.getItem(`profile_meta_${currentUser?.email || currentUser?.uid}`) || '{}'); 
      return p.avatar || null; 
    } catch { return null; }
  })();
  
  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Node Officer';
  const email = currentUser?.email || 'mop.grid.node@nic.in';

  const bg = isDarkMode ? '#0F172A' : '#FFFFFF';
  const border = isDarkMode ? '#1E293B' : '#E2E8F0';
  const textInactive = isDarkMode ? '#94A3B8' : '#475569';
  const hoverBg = isDarkMode ? '#1E293B' : '#F1F5F9';
  const hoverText = isDarkMode ? '#FFFFFF' : '#0F172A';

  const navItems = [
    { id: 'national',      label: 'National Grid Analytics',      code: 'NLDC', Icon: Globe    },
    { id: 'generation',    label: 'CEA Power Plant Registry',    code: 'PLTS', Icon: Zap      },
    { id: 'solar',         label: 'Solar Mission (PM Surya Ghar)', code: 'MNRE', Icon: Sun      },
    { id: 'state-reports', label: 'State Electricity Reports',   code: 'NITI', Icon: FileText },
    { id: 'overview',      label: 'SCADA Telemetry (BTM)',        code: 'SEMS', Icon: Home     },
    { id: 'profile',       label: 'Node Configuration',          code: 'CONF', Icon: Settings },
  ];

  return (
    <aside style={{
      width: 220,
      background: bg,
      borderRight: `1px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'background 0.2s, border-color 0.2s',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>

      {/* Official Government Portal Branding */}
      <div style={{ padding: '14px 14px', borderBottom: `1px solid ${border}`, background: isDarkMode ? '#0B1120' : '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 5,
            background: '#0A2540',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF9933',
            flexShrink: 0
          }}>
            <Shield size={16} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0A2540', letterSpacing: '0.04em', display: 'block', lineHeight: 1.1 }}>
              POWER GRID PORTAL
            </span>
            <span style={{ fontSize: 8, color: '#D97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ministry of Power, GoI
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Label */}
      <div style={{ padding: '10px 14px 4px 14px' }}>
        <span style={{ fontSize: 8, fontWeight: 900, color: isDarkMode ? '#64748B' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          National Portals & Feeds
        </span>
      </div>

      {/* Vertical Navigation Links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {navItems.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 6,
                marginBottom: 3,
                cursor: 'pointer',
                border: active 
                  ? `1px solid ${isDarkMode ? '#3B82F6' : '#2563EB'}` 
                  : '1px solid transparent',
                background: active
                  ? (isDarkMode ? '#1E293B' : '#EFF6FF')
                  : 'transparent',
                color: active 
                  ? (isDarkMode ? '#60A5FA' : '#1D4ED8') 
                  : textInactive,
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                transition: 'all 0.15s',
                textAlign: 'left'
              }}
              onMouseEnter={e => { 
                if (!active) { 
                  e.currentTarget.style.background = hoverBg; 
                  e.currentTarget.style.color = hoverText; 
                } 
              }}
              onMouseLeave={e => { 
                if (!active) { 
                  e.currentTarget.style.background = 'transparent'; 
                  e.currentTarget.style.color = textInactive; 
                } 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <item.Icon size={14} color={active ? (isDarkMode ? '#60A5FA' : '#1D4ED8') : textInactive} />
                <span style={{ lineHeight: 1.2 }}>{item.label}</span>
              </div>
              <span style={{
                fontSize: 8,
                fontWeight: 800,
                color: active ? (isDarkMode ? '#93C5FD' : '#2563EB') : (isDarkMode ? '#475569' : '#94A3B8'),
                background: active ? (isDarkMode ? 'rgba(59,130,246,0.15)' : '#DBEAFE') : (isDarkMode ? '#1E293B' : '#F1F5F9'),
                padding: '1px 4px',
                borderRadius: 3
              }}>
                {item.code}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: GIGW Standards / Official Certification */}
      <div style={{ padding: '10px 10px 12px 10px', borderTop: `1px solid ${border}`, background: isDarkMode ? '#0B1120' : '#F8FAFC' }}>
        
        {/* Compliance Card */}
        <div style={{
          background: isDarkMode ? '#131D2E' : '#FFFFFF',
          border: `1px solid ${border}`,
          borderRadius: 6,
          padding: '8px 10px',
          marginBottom: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <CheckCircle2 size={12} color="#059669" />
            <span style={{ fontSize: 9, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : '#0F172A' }}>
              NIC Certified Node
            </span>
          </div>
          <p style={{ fontSize: 8, color: isDarkMode ? '#94A3B8' : '#64748B', lineHeight: 1.4, margin: 0 }}>
            CEA & NITI Aayog Data Standards • GIGW Compliant
          </p>
        </div>

        {/* User Mini Profile */}
        <button 
          onClick={() => setActivePage('profile')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px 6px',
            borderRadius: 6,
            marginBottom: 6
          }}
          onMouseEnter={e => e.currentTarget.style.background = hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: isDarkMode ? '#1E293B' : '#E2E8F0',
            border: `1px solid ${border}`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {avatar 
              ? <img src={avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
              : <UserIcon size={12} color={isDarkMode ? '#94A3B8' : '#475569'} />
            }
          </div>
          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: 8, color: '#D97706', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Authorized Operator
            </div>
          </div>
        </button>

        {/* Official Sign Out Button */}
        <button 
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            background: isDarkMode ? '#1E293B' : '#FFFFFF',
            border: `1px solid ${border}`,
            borderRadius: 5,
            padding: '5px 0',
            fontSize: 9,
            fontWeight: 700,
            color: isDarkMode ? '#94A3B8' : '#475569',
            cursor: 'pointer'
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.borderColor = '#EF4444'; 
            e.currentTarget.style.color = '#EF4444'; 
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.borderColor = border; 
            e.currentTarget.style.color = isDarkMode ? '#94A3B8' : '#475569'; 
          }}
        >
          <LogOut size={11} />
          Exit Portal Session
        </button>

      </div>
    </aside>
  );
}
