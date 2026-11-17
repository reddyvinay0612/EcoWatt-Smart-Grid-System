import React, { useState } from 'react';
import { 
  ShieldAlert, TrendingUp, Sun, Shield, Zap, Download, 
  FileText, CheckCircle2, AlertTriangle, Clock, ExternalLink, X 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const GRID_ADVISORIES = [
  { 
    code: 'ADV-SR-04',
    type: 'DEMAND SURGE',
    badgeColor: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.1)',
    badgeBorder: '#D97706',
    title: 'Southern Region (Karnataka Node)',
    text: 'Peak evening demand projected to increase by 8.2% in Bengaluru/Hubballi industrial corridors based on regional temperature variance. Thermal spinning reserve activated.',
    source: 'SRLDC Dispatch Directive'
  },
  { 
    code: 'ADV-WR-09',
    type: 'RE RAMP-UP',
    badgeColor: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.1)',
    badgeBorder: '#059669',
    title: 'Western Region (Gujarat/Rajasthan RE Corridor)',
    text: 'Inter-state transmission corridor (ISTS) operating at 94.8% capacity. Western regional pool routing 4,200 MW surplus solar/wind generation toward Northern Grid.',
    source: 'WRLDC Transmission Advisory'
  },
  { 
    code: 'ADV-ER-02',
    type: 'IN-BAND NORMAL',
    badgeColor: '#1E40AF',
    badgeBg: 'rgba(30, 64, 175, 0.1)',
    badgeBorder: '#1E40AF',
    title: 'Eastern Grid Frequency Balance',
    text: 'National grid frequency operating strictly within statutory CERC band (49.90 Hz – 50.05 Hz). Hydro peaking assets on standby across Sikkim/Bhutan interties.',
    source: 'NLDC National Frequency Log'
  },
  { 
    code: 'ADV-NR-07',
    type: 'LOAD SHIFTING',
    badgeColor: '#475569',
    badgeBg: 'rgba(71, 85, 105, 0.1)',
    badgeBorder: '#475569',
    title: 'Northern Region Time-of-Day (ToD) Optimization',
    text: 'Agricultural pumping feeder shift initiated across Punjab and Haryana nodes to absorb afternoon solar generation peak (11:30 to 14:30 hrs).',
    source: 'NRLDC Load Management'
  },
];

export default function AiInsightsPanel() {
  const { isDarkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0A2540';
  const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
  const textColor = isDarkMode ? '#CBD5E1' : '#334155';
  const itemBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      const content = `GOVERNMENT OF INDIA • MINISTRY OF POWER
NATIONAL LOAD DESPATCH CENTRE (NLDC) & POSOCO
OPERATIONAL INTELLIGENCE & GRID ADVISORIES BULLETIN
Date of Generation: ${new Date().toLocaleString('en-IN')}

================================================================================
GRID OPERATIONS & DISPATCH DIRECTIVES:
================================================================================
${GRID_ADVISORIES.map((adv) => `[${adv.code}] ${adv.type} - ${adv.title}
Directive: ${adv.text}
Issuing Agency: ${adv.source}
--------------------------------------------------------------------------------`).join('\n')}

Data Standard: Guidelines for Indian Government Websites (GIGW)
Frequency: 15-Minute SCADA Regional Despatch Block
Authority: Central Electricity Authority (CEA) / NLDC Grid Operation`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `NLDC_Grid_Advisory_Bulletin_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
    }, 600);
  };

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            background: isDarkMode ? '#1E293B' : '#0A2540',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF9933',
            flexShrink: 0
          }}>
            <Shield size={16} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>
              Operational Intelligence & Grid Advisories
            </div>
            <div style={{ fontSize: 9, color: labelColor, marginTop: 2, fontWeight: 600 }}>
              National Load Despatch Centre (NLDC / RLDC) • SCADA Block
            </div>
          </div>
        </div>

        {/* Live Frequency Badge */}
        <span style={{
          fontSize: 8,
          fontWeight: 800,
          color: '#059669',
          background: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#DCFCE7',
          border: '1px solid rgba(5, 150, 105, 0.3)',
          padding: '3px 7px',
          borderRadius: 4
        }}>
          ● 50.02 Hz
        </span>
      </div>

      {/* Advisories List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {GRID_ADVISORIES.map((adv) => (
          <div 
            key={adv.code} 
            style={{
              background: itemBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 6,
              padding: '9px 11px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 8,
                  fontWeight: 900,
                  color: adv.badgeColor,
                  background: adv.badgeBg,
                  border: `1px solid ${adv.badgeBorder}`,
                  padding: '1px 5px',
                  borderRadius: 3,
                  letterSpacing: '0.04em'
                }}>
                  {adv.type}
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, color: titleColor }}>
                  {adv.title}
                </span>
              </div>
              <span style={{ fontSize: 8, color: labelColor, fontFamily: 'monospace' }}>
                {adv.code}
              </span>
            </div>

            <p style={{ fontSize: 10, color: textColor, lineHeight: 1.45, margin: 0, fontWeight: 500 }}>
              {adv.text}
            </p>

            <div style={{ fontSize: 8, color: labelColor, fontWeight: 600, marginTop: 2 }}>
              Issuing Authority: <span style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}>{adv.source}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Official Citation & Export Action */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 8, color: labelColor, fontWeight: 500, lineHeight: 1.3 }}>
          Source: Central Electricity Authority (CEA) & POSOCO • 15-min SCADA block
        </div>

        <button 
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: isDarkMode ? '#1E293B' : '#0A2540',
            border: `1px solid ${cardBorder}`,
            borderRadius: 5,
            padding: '6px 12px',
            fontSize: 9,
            fontWeight: 800,
            color: '#FFFFFF',
            cursor: downloading ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s'
          }}
        >
          <Download size={11} />
          {downloading ? 'Exporting...' : 'Export Bulletin'}
        </button>
      </div>

    </div>
  );
}
