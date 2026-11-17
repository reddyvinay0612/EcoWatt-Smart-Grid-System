import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  // -1: A- (smaller), 0: A (normal), 1: A+ (larger)
  const [fontSizeLevel, setFontSizeLevelState] = useState(() => {
    try {
      const saved = localStorage.getItem('ecowatt_font_scale');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (parsed === -1 || parsed === 0 || parsed === 1) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return 0;
  });

  const [isScreenReaderModalOpen, setIsScreenReaderModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Apply font scaling to document root & body
  const applyFontScale = useCallback((level) => {
    try {
      if (typeof document === 'undefined') return;
      if (level === -1) {
        document.documentElement.style.fontSize = '90%';
        if (document.body) document.body.style.zoom = '0.92';
        document.documentElement.style.setProperty('--portal-font-scale', '0.92');
      } else if (level === 1) {
        document.documentElement.style.fontSize = '112%';
        if (document.body) document.body.style.zoom = '1.08';
        document.documentElement.style.setProperty('--portal-font-scale', '1.08');
      } else {
        document.documentElement.style.fontSize = '100%';
        if (document.body) document.body.style.zoom = '1';
        document.documentElement.style.setProperty('--portal-font-scale', '1');
      }
    } catch (e) {
      console.warn('Font scale apply warning:', e);
    }
  }, []);

  // Update font size level and persist
  const setFontSizeLevel = (level) => {
    const val = level === -1 ? -1 : level === 1 ? 1 : 0;
    setFontSizeLevelState(val);
    applyFontScale(val);
    try {
      localStorage.setItem('ecowatt_font_scale', String(val));
    } catch (e) {
      // ignore
    }
  };

  // Run on mount
  useEffect(() => {
    applyFontScale(fontSizeLevel);
  }, [applyFontScale, fontSizeLevel]);

  // Stop any active speech synthesis
  const stopSpeaking = useCallback(() => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    } catch (e) {
      setIsSpeaking(false);
    }
  }, []);

  // Speak arbitrary text in selected language with fallback
  const speakText = useCallback((text, lang = 'en') => {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        return;
      }

      window.speechSynthesis.cancel(); // Stop prior narration

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Clear government announcement speed
      utterance.pitch = 1.0;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices() || [];
      let targetLangCode = 'en-IN';
      if (lang === 'hi') targetLangCode = 'hi-IN';
      if (lang === 'kn') targetLangCode = 'kn-IN';

      const matchedVoice = voices.find(v => v.lang.toLowerCase().includes(targetLangCode.toLowerCase())) ||
                           voices.find(v => v.lang.toLowerCase().startsWith(lang)) ||
                           voices.find(v => v.lang.toLowerCase().includes('en-in')) ||
                           voices[0];

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.lang = matchedVoice?.lang || (lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-US');

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  }, []);

  // Announce page content aloud
  const speakPage = useCallback((pageTitle = 'Home', lang = 'en') => {
    let announcement = '';
    if (lang === 'hi') {
      announcement = `स्क्रीन रीडर सहायता सक्रिय है। केंद्रीय विद्युत प्राधिकरण, भारत सरकार। वर्तमान अनुभाग: ${pageTitle}। राष्ट्रीय ग्रिड आवृत्ति 50.02 हर्ट्ज़ है।`;
    } else if (lang === 'kn') {
      announcement = `ಸ್ಕ್ರೀನ್ ರೀಡರ್ ಪ್ರವೇಶ ಸಕ್ರಿಯಗೊಂಡಿದೆ. ಕೇಂದ್ರೀಯ ವಿದ್ಯುತ್ ಪ್ರಾಧಿಕಾರ, ಭಾರತ ಸರ್ಕಾರ. ಪ್ರಸ್ತುತ ವಿಭಾಗ: ${pageTitle}. ರಾಷ್ಟ್ರೀಯ ಗ್ರಿಡ್ ಆವರ್ತನ 50.02 ಹರ್ಟ್ಜ್ ಆಗಿದೆ.`;
    } else {
      announcement = `Screen Reader Access enabled. Central Electricity Authority, Government of India. Current section: ${pageTitle}. National grid frequency is 50.02 Hertz.`;
    }
    speakText(announcement, lang);
  }, [speakText]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const value = {
    fontSizeLevel,
    setFontSizeLevel,
    isScreenReaderModalOpen,
    setIsScreenReaderModalOpen,
    isSpeaking,
    speakText,
    stopSpeaking,
    speakPage
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      fontSizeLevel: 0,
      setFontSizeLevel: () => {},
      isScreenReaderModalOpen: false,
      setIsScreenReaderModalOpen: () => {},
      isSpeaking: false,
      speakText: () => {},
      stopSpeaking: () => {},
      speakPage: () => {}
    };
  }
  return context;
}

export default AccessibilityContext;
