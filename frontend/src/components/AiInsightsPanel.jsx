import React, { useState } from 'react';
import { BrainCircuit, TrendingUp, Sun, Shield, Zap, Sparkles, X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const INSIGHTS = [
  { Icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', text: 'Energy demand in Karnataka likely to increase by 8% tomorrow based on weather patterns.' },
  { Icon: Sun,        color: '#10B981', bg: 'rgba(16,185,129,0.12)', text: 'Solar generation efficiency at peak performance (95%) — optimal output window active.' },
  { Icon: Shield,     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', text: 'Grid stability is optimal across 80% of states — no critical anomalies detected.' },
  { Icon: Zap,        color: '#A855F7', bg: 'rgba(168,85,247,0.12)', text: 'Rajasthan wind farms operating at 112% rated capacity — excess routed to national grid.' },
];

export default function AiInsightsPanel() {
  const { isDarkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const textColor = isDarkMode ? '#94A3B8' : '#334155';
  const itemBg = isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC';

  const modalBg = isDarkMode ? '#0F1626' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDarkMode ? '#94A3B8' : '#475569';

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      // Mock pdf file download
      const content = `ECOWATT AI SYSTEM EXECUTIVE REPORT\nGenerated on: ${new Date().toLocaleString()}\n\nInsights Summary:\n${INSIGHTS.map((in_, i) => `- ${in_.text}`).join('\n')}\n\nRecommendations:\n1. Limit dispatch threshold of thermal nodes in Gujarat.\n2. Scale load-shed margins of Karnataka residential centers between 18:00 - 20:00.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ecowatt_ai_insights_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
    }, 1000);
  };

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}>
            <BrainCircuit size={18} color="#fff" />
          </div>
          <span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, background: '#10B981', borderRadius: '50%', border: `2px solid ${cardBg}`, animation: 'pulse 2s infinite' }}></span>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.12em', lineHeight: 1 }}>AI Powered Insights</div>
          <div style={{ fontSize: 9, color: labelColor, marginTop: 2, fontWeight: 600 }}>ML predictions · Updated 2m ago</div>
        </div>
      </div>

      {/* Insights List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {INSIGHTS.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: itemBg, border: `1px solid ${cardBorder}`, borderRadius: 9, padding: '8px 10px' }}>
            <div style={{ background: item.bg, borderRadius: 7, padding: 5, flexShrink: 0 }}>
              <item.Icon size={11} color={item.color} />
            </div>
            <p style={{ fontSize: 10, color: textColor, lineHeight: 1.5, margin: 0, fontWeight: 600 }}>{item.text}</p>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button 
        onClick={() => setShowModal(true)}
        style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(90deg,#7c3aed,#3B82F6)', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', transition: 'opacity 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}
      >
        <Sparkles size={12} />
        Generate AI Report
      </button>

      {/* Modal Dialog */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11,15,25,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: modalBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 16,
            maxWidth: 500,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BrainCircuit size={18} color="#7c3aed" />
                <span style={{ fontSize: 12, fontWeight: 900, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Grid Optimization Report
                </span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60vh', overflowY: 'auto' }}>
              
              <div style={{ background: isDarkMode ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)', borderLeft: '4px solid #3B82F6', borderRadius: 8, padding: 12 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 11, fontWeight: 800, color: textPrimary }}>Executive Summary</h4>
                <p style={{ margin: 0, fontSize: 10, color: textSecondary, lineHeight: 1.5, fontWeight: 500 }}>
                  Real-time machine learning audits of local nodes identify grid dispatch efficiencies. Decarbonization projections show an optimization factor of <strong>84.2%</strong> across the southern grids.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: 10, fontWeight: 900, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Anomalies & Predictive Warnings
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {INSIGHTS.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 10, color: textSecondary }}>
                      <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontWeight: 600 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: 14 }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: 10, fontWeight: 900, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Smart Grid Operational Directives
                </h5>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: textSecondary, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 600 }}>
                  <li>Route excess solar capacity in Rajasthan to central state battery grids to prevent peak thermal dispatch.</li>
                  <li>Schedule load shedding optimization algorithms in high deviation zones (+12% baseline states).</li>
                  <li>Perform preventive health checkups at substation nodes experiencing peak summer loads.</li>
                </ul>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: `1px solid ${cardBorder}`, background: isDarkMode ? '#0d121f' : '#f8fafc' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 800, color: textSecondary, cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={handleDownload}
                disabled={downloading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3B82F6', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
              >
                <Download size={12} />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
