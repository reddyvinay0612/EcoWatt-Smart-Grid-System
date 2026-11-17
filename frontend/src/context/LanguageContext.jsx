import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('ecowatt_lang');
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'kn')) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'hi' || lang === 'kn') {
      setLanguageState(lang);
      try {
        localStorage.setItem('ecowatt_lang', lang);
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (e) {
      // ignore
    }
  }, [language]);

  // Translation helper function
  const t = (key, fallback = '') => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const fallbackDict = translations.en;
    if (fallbackDict && fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }
    return fallback || key;
  };

  const value = {
    language,
    setLanguage,
    t,
    languages: [
      { code: 'en', label: 'English', native: 'English' },
      { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
      { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (k, fb = '') => fb || k,
      languages: []
    };
  }
  return context;
}

export default LanguageContext;
