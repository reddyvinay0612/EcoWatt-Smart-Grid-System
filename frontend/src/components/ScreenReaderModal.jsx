import React, { useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  X, 
  Keyboard, 
  Monitor, 
  CheckCircle2, 
  Eye, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function ScreenReaderModal({ activePageTitle = 'Home' }) {
  const { 
    isScreenReaderModalOpen, 
    setIsScreenReaderModalOpen, 
    isSpeaking, 
    speakPage, 
    stopSpeaking,
    fontSizeLevel,
    setFontSizeLevel
  } = useAccessibility();

  const { language, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isScreenReaderModalOpen) {
        setIsScreenReaderModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScreenReaderModalOpen, setIsScreenReaderModalOpen]);

  if (!isScreenReaderModalOpen) return null;

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakPage(activePageTitle, language);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={() => setIsScreenReaderModalOpen(false)}
    >
      <div 
        style={{
          maxWidth: 640,
          width: '100%',
          background: isDarkMode ? '#131D2E' : '#FFFFFF',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          border: `1.5px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sr-modal-title"
      >
        {/* Header Bar */}
        <div style={{
          background: '#0B296B',
          color: '#FFFFFF',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #F97316'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Volume2 size={18} />
            </div>
            <div>
              <h2 id="sr-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em' }}>
                {t('sr_modal_title')}
              </h2>
              <div style={{ fontSize: 10, color: '#E0F2FE', opacity: 0.9 }}>
                GIGW 3.0 & W3C WCAG 2.1 AA Compliance Standard
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeaking();
              setIsScreenReaderModalOpen(false);
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={t('sr_close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
          
          <p style={{ margin: 0, fontSize: 11.5, color: isDarkMode ? '#94A3B8' : '#475569', lineHeight: 1.5 }}>
            {t('sr_modal_desc')}
          </p>

          {/* 1. Interactive Audio Speech Assist Player */}
          <div style={{
            background: isDarkMode ? '#1E293B' : '#F1F5F9',
            border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
            borderRadius: 8,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isSpeaking ? '#10B981' : '#94A3B8',
                boxShadow: isSpeaking ? '0 0 10px #10B981' : 'none',
                transition: 'all 0.2s'
              }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>
                  {isSpeaking ? t('sr_speech_status_reading') : t('sr_speech_status_idle')}
                </div>
                <div style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  Language: {language === 'kn' ? 'ಕನ್ನಡ (Kannada)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English (India)'}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleSpeak}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isSpeaking ? '#DC2626' : '#0B296B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isSpeaking ? t('sr_stop_btn') : t('sr_listen_btn')}</span>
            </button>
          </div>

          {/* 2. Text Size Controls in Modal */}
          <div style={{
            background: isDarkMode ? '#1E293B' : '#F8FAFC',
            border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>
                {t('sr_font_controls_title')}
              </div>
              <div style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                {t('sr_font_controls_desc')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setFontSizeLevel(-1)}
                style={{
                  background: fontSizeLevel === -1 ? '#F97316' : isDarkMode ? '#0F172A' : '#E2E8F0',
                  color: fontSizeLevel === -1 ? '#FFFFFF' : isDarkMode ? '#E2E8F0' : '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                A- (90%)
              </button>
              <button
                onClick={() => setFontSizeLevel(0)}
                style={{
                  background: fontSizeLevel === 0 ? '#0284C7' : isDarkMode ? '#0F172A' : '#E2E8F0',
                  color: fontSizeLevel === 0 ? '#FFFFFF' : isDarkMode ? '#E2E8F0' : '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                A (100%)
              </button>
              <button
                onClick={() => setFontSizeLevel(1)}
                style={{
                  background: fontSizeLevel === 1 ? '#F97316' : isDarkMode ? '#0F172A' : '#E2E8F0',
                  color: fontSizeLevel === 1 ? '#FFFFFF' : isDarkMode ? '#E2E8F0' : '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                A+ (112%)
              </button>
            </div>
          </div>

          {/* 3. Screen Reader Shortcuts Guide */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: isDarkMode ? '#38BDF8' : '#0B296B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Keyboard size={14} />
              <span>{t('sr_shortcuts_title')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              
              {/* Windows Narrator */}
              <div style={{
                background: isDarkMode ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                borderRadius: 6,
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', marginBottom: 2 }}>
                  {t('sr_narrator_title')}
                </div>
                <div style={{ fontSize: 10.5, color: isDarkMode ? '#CBD5E1' : '#475569' }}>
                  {t('sr_narrator_desc')}
                </div>
              </div>

              {/* NVDA */}
              <div style={{
                background: isDarkMode ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                borderRadius: 6,
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', marginBottom: 2 }}>
                  {t('sr_nvda_title')}
                </div>
                <div style={{ fontSize: 10.5, color: isDarkMode ? '#CBD5E1' : '#475569' }}>
                  {t('sr_nvda_desc')}
                </div>
              </div>

              {/* JAWS */}
              <div style={{
                background: isDarkMode ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                borderRadius: 6,
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', marginBottom: 2 }}>
                  {t('sr_jaws_title')}
                </div>
                <div style={{ fontSize: 10.5, color: isDarkMode ? '#CBD5E1' : '#475569' }}>
                  {t('sr_jaws_desc')}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          background: isDarkMode ? '#0F172A' : '#F8FAFC',
          borderTop: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: '#64748B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#16A34A', fontWeight: 700 }}>
            <ShieldCheck size={13} />
            <span>GIGW Certified Accessibility Subsystem</span>
          </div>

          <button
            onClick={() => {
              stopSpeaking();
              setIsScreenReaderModalOpen(false);
            }}
            style={{
              background: '#0B296B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 5,
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {t('sr_close')}
          </button>
        </div>

      </div>
    </div>
  );
}
