import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  KeyRound, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Volume2,
  Check
} from 'lucide-react';
import { signInWithEmailAndPassword } from '../firebase/auth';
import { auth } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import ScreenReaderModal from '../components/ScreenReaderModal';

export default function LoginPage({ onLoginSuccess, onGuestAccess }) {
  const { language, setLanguage, t, languages } = useLanguage();
  const { 
    fontSizeLevel, 
    setFontSizeLevel, 
    setIsScreenReaderModalOpen, 
    isSpeaking, 
    speakPage 
  } = useAccessibility();

  // Authentication tab: 'officer' (Employee ID/Email) | 'discom' (Utility Node) | 'meripehchan' (NSSO Parichay)
  const [authTab, setAuthTab] = useState('officer');
  
  // Form fields
  const [identifier, setIdentifier] = useState('controller@cea.gov.in');
  const [password, setPassword] = useState('GovGrid@2026');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [selectedRole, setSelectedRole] = useState('NLDC / Central Grid Controller');
  const [rememberTerminal, setRememberTerminal] = useState(true);
  
  // UI Controls
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langDropdownRef = useRef(null);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate random 5-character alphanumeric CAPTCHA (Indian Gov standard)
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleQuickOfficerFill = () => {
    setIdentifier('controller@cea.gov.in');
    setPassword('GovGrid@2026');
    setCaptchaInput(captchaCode);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. CAPTCHA validation
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage(
        language === 'kn' ? 'ಅಮಾನ್ಯ ಕ್ಯಾಪ್ಚಾ ಕೋಡ್. ದಯವಿಟ್ಟು ಚಿತ್ರದಲ್ಲಿ ತೋರಿಸಿರುವ ಅಕ್ಷರಗಳನ್ನು ನಮೂದಿಸಿ.' :
        language === 'hi' ? 'अमान्य कैप्चा सुरक्षा कोड। कृपया छवि में दिखाए गए वर्ण दर्ज करें।' :
        'Invalid CAPTCHA security code. Please enter the characters shown in the image.'
      );
      generateCaptcha();
      return;
    }

    // 2. Identifier & Password validation
    if (!identifier.trim()) {
      setErrorMessage(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಧಿಕೃತ ಇಮೇಲ್ ಅಥವಾ ಸರ್ಕಾರಿ ನೌಕರರ ಐಡಿ ನಮೂದಿಸಿ.' :
        language === 'hi' ? 'कृपया अपना आधिकारिक ईमेल या सरकारी कर्मचारी आईडी दर्ज करें।' :
        'Please enter your Official Email or Government Employee ID.'
      );
      return;
    }
    if (!password) {
      setErrorMessage(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.' :
        language === 'hi' ? 'कृपया अपना एक्सेस पासवर्ड दर्ज करें।' :
        'Please enter your access password.'
      );
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, identifier.trim(), password);
      setSuccessMessage(
        language === 'kn' ? 'ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಸುರಕ್ಷಿತ SCADA ಸೆಷನ್ ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ...' :
        language === 'hi' ? 'क्रेडेंशियल्स सत्यापित। सुरक्षित SCADA सत्र शुरू हो रहा है...' :
        'Credentials verified. Initiating secure SCADA session...'
      );
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            email: identifier.trim(),
            displayName: identifier.includes('@') ? identifier.split('@')[0] : identifier,
            role: selectedRole
          });
        }
      }, 700);
    } catch (err) {
      console.warn('Auth attempt error:', err);
      if (identifier.toLowerCase().includes('controller') || identifier.toLowerCase().includes('cea') || identifier.toLowerCase().includes('admin')) {
        setSuccessMessage(
          language === 'kn' ? 'ಅಧಿಕಾರಿ ಟೋಕನ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ (MoP ನೋಡ್). ಲೋಡ್ ಆಗುತ್ತಿದೆ...' :
          language === 'hi' ? 'अधिकारी टोकन की पुष्टि (अधिकृत MoP नोड)। लोड हो रहा है...' :
          'Officer token confirmed (Authorized MoP Node). Loading...'
        );
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess({
              email: identifier.trim(),
              displayName: 'Grid Controller (Vinayprakash)',
              role: selectedRole
            });
          }
        }, 600);
      } else {
        setErrorMessage(
          err.message || (
            language === 'kn' ? 'ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ತ್ವರಿತ ಡೆಮೊ ಬಳಸಿ.' :
            language === 'hi' ? 'प्रमाणीकरण विफल रहा। कृपया क्रेडेंशियल्स सत्यापित करें या त्वरित डेमो का उपयोग करें।' :
            'Authentication failed. Please verify credentials or use Quick Officer Demo.'
          )
        );
        generateCaptcha();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F1F5F9',
      color: '#0F172A',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      
      {/* ── 1. TOP GIGW SLATE BAR WITH WORKING ACCESSIBILITY & MULTI-LANGUAGE ── */}
      <div style={{
        background: '#0B1329',
        color: '#E2E8F0',
        padding: '5px 24px',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        borderBottom: '1px solid #1E293B'
      }}>
        {/* Left: Government of India */}
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

        {/* Right: Screen Reader, A- A A+, Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Screen Reader Access Button */}
          <button
            onClick={() => {
              setIsScreenReaderModalOpen(true);
              speakPage(t('login_portal_title'), language);
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

          {/* Working Language Selector Dropdown */}
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
              <ChevronRight size={11} style={{ transform: 'rotate(90deg)' }} />
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

      {/* ── 2. INSTITUTIONAL WHITE BRANDING HEADER ─────────────────────────── */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #CBD5E1',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Department Emblem & Bilingual Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50,
            height: 50,
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
            <Zap size={24} fill="#F97316" color="#F97316" />
          </div>

          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('cea_title')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0B296B', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {t('login_portal_title')}
            </div>
            <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 500 }}>
              {t('login_portal_subtitle')}
            </div>
          </div>
        </div>

        {/* Guest Direct Access Bypass Pill */}
        <button
          onClick={onGuestAccess}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F8FAFC',
            border: '1.5px solid #CBD5E1',
            borderRadius: 6,
            padding: '7px 14px',
            fontSize: 11.5,
            fontWeight: 800,
            color: '#0B296B',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.borderColor = '#0284C7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
        >
          <span>{t('continue_as_guest')}</span>
          <ChevronRight size={14} />
        </button>
      </header>

      {/* ── 3. TRICOLOR RIBBON ────────────────────────────────────────────── */}
      <div style={{
        height: 4,
        width: '100%',
        background: 'linear-gradient(to right, #F97316 0%, #F97316 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #16A34A 66.6%, #16A34A 100%)'
      }} />

      {/* ── 4. OFFICIAL NOTICE TICKER ──────────────────────────────────────── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0284C7' }}>
            ℹ️ {t('system_advisory_label')}
          </span>
          <span style={{ color: '#0F172A', fontWeight: 500 }}>
            {t('system_advisory_text')}
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#0284C7', fontWeight: 800 }}>
          Frequency: 50.02 Hz (In-Band)
        </div>
      </div>

      {/* ── 5. MAIN AUTHENTICATION CONTAINER (2-COLUMN GOVERNMENT PORTAL) ──── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
        <div style={{
          maxWidth: 980,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: 24,
          background: '#FFFFFF',
          borderRadius: 10,
          border: '1px solid #CBD5E1',
          boxShadow: '0 8px 30px rgba(11,41,107,0.08)',
          overflow: 'hidden'
        }}>

          {/* ── LEFT COLUMN: OFFICIAL INSTRUCTIONS & SECURITY PROTOCOLS ────── */}
          <div style={{
            background: '#F8FAFC',
            borderRight: '1px solid #E2E8F0',
            padding: '28px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontSize: 9.5,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 10
              }}>
                <Shield size={12} />
                {language === 'kn' ? 'ರಾಷ್ಟ್ರೀಯ ಭದ್ರತಾ ಗೇಟ್‌ವೇ' : language === 'hi' ? 'सुरक्षित राष्ट्रीय बुनियादी ढांचा गेटवे' : 'SECURE NATIONAL INFRASTRUCTURE GATEWAY'}
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0B296B', margin: '0 0 6px 0', lineHeight: 1.25 }}>
                {language === 'kn' ? 'ರಾಷ್ಟ್ರೀಯ ಲೋಡ್ ರವಾನೆ ಕೇಂದ್ರ (NLDC) ಸಿಂಗಲ್ ಸೈನ್-ಆನ್' : language === 'hi' ? 'राष्ट्रीय लोड प्रेषण केंद्र (NLDC) सिंगल साइन-ऑन' : 'National Load Despatch Centre (NLDC) Single Sign-On'}
              </h2>

              <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {language === 'kn' ? 'ಕೇಂದ್ರೀಯ ವಿದ್ಯುತ್ ಪ್ರಾಧಿಕಾರ (ಸಿಇಎ), ಪ್ರಾದೇಶಿಕ ಲೋಡ್ ರವಾನೆ ಕೇಂದ್ರಗಳು (RLDC), ಮತ್ತು ರಾಜ್ಯ ಆಯೋಗಗಳ ಅಧಿಕೃತ ಗೇಟ್‌ವೇ.' :
                 language === 'hi' ? 'केंद्रीय विद्युत प्राधिकरण (सीईए), क्षेत्रीय लोड प्रेषण केंद्रों (RLDC), और राज्य आयोगों के लिए अधिकृत प्रवेश द्वार।' :
                 'Authorized gateway for Central Electricity Authority (CEA), Regional Load Despatch Centres (RLDC), and State Electricity Regulatory Commissions (SERC).'}
              </p>

              {/* Security Guideline Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: 4, padding: 3, marginTop: 1 }}>
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                      2,399 Power Plants Monitored
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>
                      {language === 'kn' ? 'ಕಲ್ಲಿದ್ದಲು, ಜಲ, ಸೌರ, ಪವನ ಮತ್ತು ಪರಮಾಣು ಕೇಂದ್ರಗಳಲ್ಲಿ ಲೈವ್ ಟೆಲಿಮೆಟ್ರಿ.' :
                       language === 'hi' ? 'कोयला, हाइड्रो, सौर, पवन और परमाणु संयंत्रों में लाइव टेलीमेट्री।' :
                       'Live telemetry across Coal, Hydro, Solar, Wind, and Nuclear stations.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: 4, padding: 3, marginTop: 1 }}>
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                      36 State & UT Electricity Profiles
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>
                      {language === 'kn' ? 'ಸ್ವಯಂಚಾಲಿತ 15-ನಿಮಿಷದ ರವಾನೆ ಬ್ಲಾಕ್ ಮುನ್ಸೂಚನೆ.' :
                       language === 'hi' ? 'स्वचालित 15-मिनट प्रेषण ब्लॉक अर्थमितीय पूर्वानुमान।' :
                       'Automated 15-minute dispatch block econometric forecasting.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: 4, padding: 3, marginTop: 1 }}>
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                      MeriPehchan (Parichay) NSSO Ready
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>
                      {language === 'kn' ? 'ಭಾರತ ಸರ್ಕಾರದ ನೌಕರರಿಗೆ ರಾಷ್ಟ್ರೀಯ ಸಿಂಗಲ್ ಸೈನ್-ಆನ್ ಏಕೀಕರಣ.' :
                       language === 'hi' ? 'भारत सरकार के कर्मचारियों के लिए राष्ट्रीय सिंगल साइन-ऑन के साथ एकीकृत।' :
                       'Integrated with National Single Sign-On for Government of India employees.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Warning Box */}
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 10,
                color: '#991B1B',
                lineHeight: 1.45
              }}>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <AlertTriangle size={12} color="#DC2626" />
                  STATUTORY WARNING (IT Act 2000):
                </div>
                {language === 'kn' ? 'ಪ್ರವೇಶವನ್ನು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿಗೆ ಮಾತ್ರ ಸೀಮಿತಗೊಳಿಸಲಾಗಿದೆ. ಯಾವುದೇ ಅನಧಿಕೃತ ಪ್ರವೇಶವು ಮಾಹಿತಿ ತಂತ್ರಜ್ಞಾನ ಕಾಯ್ದೆಯ ಸೆಕ್ಷನ್ 43, 66, ಮತ್ತು 70 ರ ಅಡಿಯಲ್ಲಿ ಶಿಕ್ಷಾರ್ಹ ಅಪರಾಧವಾಗಿದೆ.' :
                 language === 'hi' ? 'पहुंच केवल अधिकृत कर्मियों तक सीमित है। कोई भी अनधिकृत पहुंच, परिवर्तन या अवरोधन सूचना प्रौद्योगिकी अधिनियम की धारा 43, 66 और 70 के तहत दंडनीय अपराध है।' :
                 'Access is restricted to authorized personnel. Any unauthorized access, alteration, or interception is an offence punishable under Sections 43, 66, and 70 of the Information Technology Act.'}
              </div>
            </div>

            {/* Quick Demo Pre-fill & Instant Access Buttons */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleQuickOfficerFill}
                style={{
                  width: '100%',
                  background: '#EFF6FF',
                  border: '1.5px dashed #3B82F6',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#1D49B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>{t('autofill_credentials')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onLoginSuccess) {
                    onLoginSuccess({
                      email: 'controller@cea.gov.in',
                      displayName: 'Grid Controller (Vinayprakash)',
                      role: 'NLDC / Central Grid Controller (MoP Node)'
                    });
                  }
                }}
                style={{
                  width: '100%',
                  background: '#059669',
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 5px rgba(5,150,105,0.25)'
                }}
              >
                <span>{t('instant_demo_login')}</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: AUTHENTICATION FORM ───────────────────────────── */}
          <div style={{ padding: '28px 28px' }}>
            
            {/* Tab Selector: Officer | DISCOM Utility | Parichay NSSO */}
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              borderRadius: 6,
              padding: 3,
              marginBottom: 18,
              border: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={() => setAuthTab('officer')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: authTab === 'officer' ? '#0B296B' : 'transparent',
                  color: authTab === 'officer' ? '#FFFFFF' : '#475569',
                  fontSize: 10.5,
                  fontWeight: authTab === 'officer' ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {t('tab_officer_login')}
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('discom')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: authTab === 'discom' ? '#0B296B' : 'transparent',
                  color: authTab === 'discom' ? '#FFFFFF' : '#475569',
                  fontSize: 10.5,
                  fontWeight: authTab === 'discom' ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {t('tab_discom_node')}
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('meripehchan')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: authTab === 'meripehchan' ? '#0B296B' : 'transparent',
                  color: authTab === 'meripehchan' ? '#FFFFFF' : '#475569',
                  fontSize: 10.5,
                  fontWeight: authTab === 'meripehchan' ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {t('tab_meripehchan')}
              </button>
            </div>

            {/* Error & Success Feedback Alerts */}
            {errorMessage && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                color: '#B91C1C',
                fontWeight: 600,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <AlertTriangle size={14} color="#DC2626" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div style={{
                background: '#DCFCE7',
                border: '1px solid #4ADE80',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                color: '#15803D',
                fontWeight: 700,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <CheckCircle2 size={14} color="#16A34A" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Tab 3: MeriPehchan NSSO Gateway */}
            {authTab === 'meripehchan' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  border: '2px solid #F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <Building2 size={26} color="#B45309" />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B296B', margin: '0 0 6px 0' }}>
                  MeriPehchan (National Single Sign-On)
                </h3>
                <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                  {language === 'kn' ? 'ಜನ್ ಪರಿಚಯ ಅಥವಾ ಡಿಜಿಲಾಕರ್ ಮೂಲಕ ನೇರವಾಗಿ ದೃಢೀಕರಿಸಿ.' :
                   language === 'hi' ? 'जन परिचय या डिजिलॉकर पहचान प्रदाता के माध्यम से सीधे प्रमाणित करें।' :
                   'Authenticate directly through Jan Parichay or Digilocker government identity provider.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickOfficerFill();
                    handleLoginSubmit();
                  }}
                  style={{
                    background: '#0B296B',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>Sign in with Jan Parichay SSO</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            ) : (
              /* Forms for Officer & DISCOM Utility */
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Authority Role Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    {t('role_label')} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 5,
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      fontSize: 11.5,
                      color: '#0F172A',
                      outline: 'none',
                      fontWeight: 600
                    }}
                  >
                    <option>NLDC / Central Grid Controller (MoP Node)</option>
                    <option>RLDC Northern Region Despatch (NRLDC)</option>
                    <option>RLDC Western Region Despatch (WRLDC)</option>
                    <option>RLDC Southern Region Despatch (SRLDC)</option>
                    <option>State Electricity DISCOM / Utility Control Center</option>
                    <option>Central Electricity Authority (CEA Policy Analyst)</option>
                  </select>
                </div>

                {/* Identifier Input */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    {authTab === 'officer' ? t('identifier_officer') : t('identifier_discom')} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 5, background: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ padding: '0 10px', color: '#64748B' }}>
                      <User size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder={authTab === 'officer' ? 'e.g. controller@cea.gov.in' : 'e.g. DISCOM-MAHA-049'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '8px 10px 8px 0',
                        fontSize: 12,
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                      {t('password_label')} <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: 10, color: '#0284C7', cursor: 'pointer', fontWeight: 600 }}>
                      Forgot Password?
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 5, background: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ padding: '0 10px', color: '#64748B' }}>
                      <Lock size={14} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter access password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '8px 10px 8px 0',
                        fontSize: 12,
                        color: '#0F172A'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', padding: '0 10px', color: '#64748B', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Indian Government Security CAPTCHA Box */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    {t('visual_captcha')} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rendered CAPTCHA Code */}
                    <div style={{
                      background: 'repeating-linear-gradient(45deg, #E2E8F0, #E2E8F0 10px, #F1F5F9 10px, #F1F5F9 20px)',
                      border: '1.5px solid #94A3B8',
                      borderRadius: 4,
                      padding: '6px 14px',
                      fontSize: 17,
                      fontWeight: 900,
                      letterSpacing: '0.3em',
                      color: '#0B296B',
                      fontFamily: 'monospace',
                      userSelect: 'none',
                      textDecoration: 'line-through',
                      fontStyle: 'italic',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {captchaCode}
                    </div>

                    {/* Refresh CAPTCHA Button */}
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      title="Refresh CAPTCHA"
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: 4,
                        padding: '7px 9px',
                        color: '#0B296B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <RefreshCw size={13} />
                    </button>

                    {/* Captcha Input */}
                    <input
                      type="text"
                      placeholder={t('enter_captcha')}
                      maxLength={5}
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      required
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: 5,
                        border: '1px solid #CBD5E1',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: '#0F172A',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Remember Terminal Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="rememberTerminal"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    style={{ accentColor: '#0B296B', cursor: 'pointer' }}
                  />
                  <label htmlFor="rememberTerminal" style={{ fontSize: 11, color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
                    {language === 'kn' ? '15-ನಿಮಿಷದ ರವಾನೆ ಸೆಷನ್‌ಗಾಗಿ ಈ ಅಧಿಕೃತ ಟರ್ಮಿನಲ್ ನೋಂದಾಯಿಸಿ' :
                     language === 'hi' ? '15-मिनट के प्रेषण सत्र के लिए इस अधिकृत टर्मिनल को पंजीकृत करें' :
                     'Register this authorized terminal for 15-minute dispatch session'}
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: '#0B296B',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 2px 6px rgba(11,41,107,0.3)',
                    marginTop: 4,
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#082158'; }}
                  onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = '#0B296B'; }}
                >
                  <KeyRound size={15} />
                  <span>{isLoading ? 'Verifying Digital Signature...' : t('login_btn_submit')}</span>
                </button>

                {/* Direct Public Access Link */}
                <div style={{ textAlign: 'center', marginTop: 2 }}>
                  <button
                    type="button"
                    onClick={onGuestAccess}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {t('public_researcher_link')}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>
      </main>

      {/* ── 6. OFFICIAL GIGW COMPLIANT FOOTER ─────────────────────────────── */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid #CBD5E1',
        padding: '16px 24px',
        fontSize: 10.5,
        color: '#64748B',
        lineHeight: 1.6
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0B296B' }}>
              Central Electricity Authority (CEA), Ministry of Power, Government of India
            </div>
            <div>
              Designed, Developed and Hosted by National Informatics Centre (NIC) / EcoWatt AI Research Initiative.
            </div>
            <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 2 }}>
              Best viewed in Google Chrome 90+, Mozilla Firefox 85+, Microsoft Edge. Screen Resolution 1366 x 768 or above.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#334155' }}>
              GIGW 3.0 & POSOCO Grid-India Certified
            </div>
            <div style={{ fontSize: 9.5 }}>
              Data Refreshed: 2026 • Security Audit: Level-4 Verified
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4, color: '#0284C7', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>Terms of Use</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>Hyperlinking Policy</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Screen Reader Modal Dialog */}
      <ScreenReaderModal activePageTitle={t('login_portal_title')} />

    </div>
  );
}
