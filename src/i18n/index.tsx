import type React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { type Language, type Translations, translations } from './translations';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const STORAGE_KEY = 'story-weaver:lang';

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') return stored;
  } catch {
    // ignore
  }
  // Auto-detect: default to PT if browser language starts with 'pt', else EN
  return navigator.language.startsWith('pt') ? 'pt' : 'en';
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLang?: Language;
}> = ({ children, initialLang }) => {
  const [lang, setLangState] = useState<Language>(
    initialLang ?? getInitialLang,
  );

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error('useTranslation must be used inside <LanguageProvider>');
  return ctx;
}

export type { Language, Translations };
