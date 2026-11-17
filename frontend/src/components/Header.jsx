import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Search, LogOut, ChevronDown, Home, Shield, Eye, Volume2, 
  Pause, Play, ExternalLink, HelpCircle, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import ScreenReaderModal from './ScreenReaderModal';
import NotificationBell from './NotificationBell';

export default function Header({ 
  activePage, 
  setActivePage, 
  onLogout, 
  onProfileClick, 
  selectedHouseholdId 
}) {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t, languages } = useLanguage();
  const { 
    fontSizeLevel, 
    setFontSizeLevel, 
    setIsScreenReaderModalOpen, 
    isSpeaking, 
    speakPage 
  } = useAccessibility();

  const [noticePaused, setNoticePaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langDropdownRef = useRef(null);

  const displayName = (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Vinayprakash').trim() || 'Vinayprakash';
  const initial = displayName.charAt(0).toUpperCase() || 'V';

  // Click outside detection for Language selector dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Items with active multi-language translations
  const navTabs = [
    { id: 'national',      label: t('nav_home') },
    { id: 'generation',    label: t('nav_plants'), badge: t('nav_plants_badge') },
    { id: 'solar',         label: t('nav_solar') },
    { id: 'state-reports', label: t('nav_state_reports') },
    { id: 'overview',      label: t('nav_scada') },
    { id: 'evaluation',    label: t('nav_model_compare') },
    { id: 'profile',       label: t('nav_node_settings') },
    { id: 'login',         label: t('nav_officer_login'), badge: 'SSO' },
    { id: 'faqs',          label: t('nav_faqs') }
  ];

  const getPageTitle = (id) => {
    switch (id) {
      case 'national': return t('national_grid_analytics');
      case 'generation': return t('power_plants_title');
      case 'solar': return t('solar_mission_title');
      case 'state-reports': return t('state_reports_title');
      case 'overview': return t('scada_telemetry_title');
      case 'evaluation': return t('model_eval_title');
      case 'profile': return t('node_settings_title');
      case 'login': return t('officer_sso_title');
      case 'faqs': return t('faqs_title');
      default: return t('national_grid_analytics');
    }
  };

  const handleNavClick = (tabId) => {
    if (tabId === 'faqs') {
      const faqText = language === 'kn'
        ? "ಕೇಂದ್ರೀಯ ವಿದ್ಯುತ್ ಪ್ರಾಧಿಕಾರ (ಸಿಇಎ) ಪ್ರಶ್ನೋತ್ತರಗಳು:\n\n1. ರಾಷ್ಟ್ರೀಯ ಗ್ರಿಡ್ ಆವರ್ತನ ಪ್ರಮಾಣಿತ ಎಷ್ಟು?\nಉತ್ತರ: CERC ನಿಗದಿಪಡಿಸಿದ 49.90 Hz - 50.05 Hz ಶಾಸನಬದ್ಧ ಬ್ಯಾಂಡ್.\n\n2. ಎಷ್ಟು ಉತ್ಪಾದನಾ ಘಟಕಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗಿದೆ?\nಉತ್ತರ: 36 ರಾಜ್ಯಗಳು ಮತ್ತು ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳಲ್ಲಿ 2,399 ಉತ್ಪಾದನಾ ಕೇಂದ್ರಗಳು (548,856 MW).\n\n3. ಡೇಟಾ ರಿಫ್ರೆಶ್ ದರ ಎಷ್ಟು?\nಉತ್ತರ: 15-ನಿಮಿಷದ SCADA ಪ್ರಾದೇಶಿಕ ರವಾನೆ ಬ್ಲಾಕ್."
        : language === 'hi'
        ? "केंद्रीय विद्युत प्राधिकरण (सीईए) सामान्य प्रश्न:\n\n1. राष्ट्रीय ग्रिड आवृत्ति मानक क्या है?\nउत्तर: सीईआरसी द्वारा परिभाषित 49.90 Hz - 50.05 Hz वैधानिक बैंड।\n\n2. कितने उत्पादन संयंत्र ट्रैक किए गए हैं?\nउत्तर: सभी 36 राज्यों और केंद्र शासित प्रदेशों में 2,399 उत्पादन स्टेशन (548,856 MW)।\n\n3. डेटा रिफ्रेश दर क्या है?\nउत्तर: 15-मिनट SCADA क्षेत्रीय प्रेषण ब्लॉक।"
        : "Central Electricity Authority (CEA) FAQs:\n\n1. What is the National Grid Frequency standard?\nAns: 49.90 Hz - 50.05 Hz statutory band defined by CERC.\n\n2. How many generating units are tracked?\nAns: 2,399 generating stations across all 36 States & UTs (548,856 MW).\n\n3. What is the data refresh rate?\nAns: 15-Minute SCADA Regional Despatch Block.";
      alert(faqText);
      return;
    }
    setActivePage(tabId);
  };

  return (
    <header style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 40, fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* ── 1. TOP GIGW BAR (DARK SLATE) ─────────────────────────────────── */}
      <div style={{
        background: '#0B1329',
        color: '#E2E8F0',
        padding: '4px 24px',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        letterSpacing: '0.01em'
      }}>
        {/* Left: Government of India (Demo Service) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#F97316', fontSize: 13 }}>●</span>
          <span style={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
            {t('gov_india')}
          </span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ color: '#94A3B8', fontWeight: 500 }}>
            {t('portal_subtitle')}
          </span>
        </div>

        {/* Right: Accessibility Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Officer Login Quick Link */}
          <button
            onClick={() => setActivePage('login')}
            style={{
              background: '#EA580C',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 3,
              padding: '2px 9px',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>{t('officer_login_btn')}</span>
          </button>

          {/* Screen Reader Access Button */}
          <button
            onClick={() => {
              setIsScreenReaderModalOpen(true);
              speakPage(getPageTitle(activePage), language);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: isSpeaking ? '#DC2626' : 'transparent',
              color: isSpeaking ? '#FFFFFF' : '#F97316',
              border: 'none',
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 10.5,
              transition: 'all 0.15s'
            }}
            title={t('screen_reader')}
          >
            <Volume2 size={13} />
            <span>{t('screen_reader')}</span>
            {isSpeaking && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF' }} />
            )}
          </button>

          {/* Font Resizer [A-] [A] [A+] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => setFontSizeLevel(-1)}
              title="Decrease Font Size (90%)"
              style={{
                background: fontSizeLevel === -1 ? '#F97316' : '#1E293B',
                color: '#FFFFFF',
                border: fontSizeLevel === -1 ? '1px solid #F97316' : '1px solid #334155',
                borderRadius: 3,
                padding: '1px 6px',
                fontSize: 9,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: fontSizeLevel === -1 ? '0 0 6px rgba(249,115,22,0.6)' : 'none'
              }}
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeLevel(0)}
              title="Reset Font Size (100%)"
              style={{
                background: fontSizeLevel === 0 ? '#0284C7' : '#1E293B',
                color: '#FFFFFF',
                border: fontSizeLevel === 0 ? '1px solid #0284C7' : '1px solid #334155',
                borderRadius: 3,
                padding: '1px 6px',
                fontSize: 9,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: fontSizeLevel === 0 ? '0 0 6px rgba(2,132,199,0.6)' : 'none'
              }}
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel(1)}
              title="Increase Font Size (112%)"
              style={{
                background: fontSizeLevel === 1 ? '#F97316' : '#1E293B',
                color: '#FFFFFF',
                border: fontSizeLevel === 1 ? '1px solid #F97316' : '1px solid #334155',
                borderRadius: 3,
                padding: '1px 6px',
                fontSize: 9,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: fontSizeLevel === 1 ? '0 0 6px rgba(249,115,22,0.6)' : 'none'
              }}
            >
              A+
            </button>
          </div>

          {/* High Contrast / Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: '#E2E8F0',
              cursor: 'pointer',
              fontSize: 10.5,
              fontWeight: 600
            }}
          >
            <Eye size={12} color="#F97316" />
            <span>{isDarkMode ? t('standard_light') : t('high_contrast')}</span>
          </button>

          {/* ── Working Language Selector Dropdown (English, Hindi, Kannada) ── */}
          <div ref={langDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: langMenuOpen ? '#1E293B' : 'rgba(255,255,255,0.06)',
                border: '1px solid #334155',
                borderRadius: 4,
                padding: '2px 8px',
                color: '#E2E8F0',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>🌐 {language === 'kn' ? 'ಕನ್ನಡ' : language === 'hi' ? 'हिन्दी' : 'English'}</span>
              <ChevronDown size={11} />
            </button>

            {langMenuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 4,
                background: '#0B1329',
                border: '1px solid #334155',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                padding: 4,
                zIndex: 100,
                minWidth: 155,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: language === l.code ? '#0284C7' : 'transparent',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: language === l.code ? 800 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s'
                    }}
                    onMouseEnter={(e) => {
                      if (language !== l.code) e.currentTarget.style.background = '#1E293B';
                    }}
                    onMouseLeave={(e) => {
                      if (language !== l.code) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{l.native} ({l.label})</span>
                    {language === l.code && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 2. INSTITUTIONAL BRANDING HEADER (PURE WHITE) ────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Left: Official Circular Seal + Bilingual Department Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Round Seal Badge */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#0B296B',
            border: '2px solid #0B296B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 2px 6px rgba(11,41,107,0.25)',
            flexShrink: 0
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0B296B'
            }}>
              <Zap size={22} fill="#F97316" color="#F97316" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2 }}>
              {t('cea_title')}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0B296B', marginTop: 1 }}>
              {t('cea_bilingual')}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#0B296B', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {t('portal_main_title')}
            </div>
            <div style={{ fontSize: 9, color: '#64748B', fontWeight: 500, marginTop: 1 }}>
              {t('portal_tagline')}
            </div>
          </div>
        </div>

        {/* Right: Search Bar + User Profile Pill + Status Sub-badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            
            {/* Search Input Box with Navy Button */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 4, overflow: 'hidden', background: '#F8FAFC' }}>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  padding: '6px 12px',
                  fontSize: 11,
                  width: 250,
                  background: 'transparent',
                  color: '#0F172A'
                }}
              />
              <button
                style={{
                  background: '#0B296B',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Search size={13} />
              </button>
            </div>

            {/* User Profile Pill with Avatar & Sign-out */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '4px 8px',
              background: '#FFFFFF'
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#0B296B',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {initial}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{displayName}</span>
              <button
                onClick={onLogout}
                title={t('sign_out')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2
                }}
              >
                <LogOut size={13} />
              </button>
            </div>

          </div>

          {/* Sub-badge: CEA Data Aligned • Open Econometric Architecture */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: '#16A34A', paddingRight: 4 }}>
            <Shield size={11} />
            <span>{t('cea_aligned')}</span>
          </div>
        </div>

      </div>

      {/* ── 3. TRICOLOR DIVIDER STRIP ────────────────────────────────────── */}
      <div style={{
        height: 4,
        width: '100%',
        background: 'linear-gradient(to right, #F97316 0%, #F97316 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #16A34A 66.6%, #16A34A 100%)'
      }} />

      {/* ── 4. FULL-WIDTH HORIZONTAL GOVERNMENT NAV BAR (DEEP NAVY BLUE) ─── */}
      <nav style={{
        background: '#0B296B',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        overflowX: 'auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {navTabs.map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '11px 16px',
                background: isActive ? '#051E4F' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #F97316' : '3px solid transparent',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, border-color 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#0E3585';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  background: '#F97316',
                  color: '#FFFFFF',
                  fontSize: 8,
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── 5. OFFICIAL NOTICE / TICKER MARQUEE BAR ──────────────────────── */}
      <div style={{
        background: '#E0F2FE',
        borderBottom: '1px solid #BAE6FD',
        color: '#0369A1',
        padding: '5px 24px',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284C7', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>ⓘ</span> {t('official_notice')}
          </span>
          <span style={{ color: '#0F172A', fontWeight: 500 }}>
            {t('notice_text')}
          </span>
        </div>

        <button
          onClick={() => setNoticePaused(!noticePaused)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#FFFFFF',
            border: '1px solid #BAE6FD',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: '#0369A1',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {noticePaused ? <Play size={10} /> : <Pause size={10} />}
          <span>{noticePaused ? t('resume') : t('pause')}</span>
        </button>
      </div>

      {/* ── 6. BREADCRUMBS BAR ───────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '6px 24px',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: '#64748B'
      }}>
        <button
          onClick={() => setActivePage('national')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: '#0B296B',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            padding: 0
          }}
        >
          <Home size={12} />
          <span>{t('breadcrumb_home')}</span>
        </button>
        <span>&gt;</span>
        <span style={{ fontWeight: 800, color: '#0F172A' }}>
          {getPageTitle(activePage)}
        </span>
      </div>

      {/* Screen Reader Modal Dialog */}
      <ScreenReaderModal activePageTitle={getPageTitle(activePage)} />

    </header>
  );
}
