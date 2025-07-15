"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
type Lang = typeof SUPPORTED_LANGUAGES[number];

const LangContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: 'ko', setLang: () => {} });

interface LangProviderProps {
  children: ReactNode;
}

export function LangProvider({ children }: LangProviderProps) {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lang');
      if (stored && SUPPORTED_LANGUAGES.includes(stored as Lang)) {
        setLangState(stored as Lang);
      } else {
        const browser = navigator.language.startsWith('en') ? 'en' : 'ko';
        setLangState(browser as Lang);
      }
    } catch (error) {
      // localStorage 접근 실패 시 기본값 사용
      setLangState('ko');
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch (error) {
      // localStorage 접근 실패 시 무시
      console.warn('localStorage 접근 실패:', error);
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

const localeCache: Record<Lang, any> = { ko: null, en: null };
function loadLocale(lang: Lang): Promise<any> {
  if (localeCache[lang]) return Promise.resolve(localeCache[lang]);
  let data;
  if (lang === 'ko') {
    data = require('../locales/ko.json');
  } else {
    data = require('../locales/en.json');
  }
  localeCache[lang] = data;
  return Promise.resolve(data);
}

export function useTranslation() {
  const { lang, setLang } = useContext(LangContext);
  const [dict, setDict] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLocale(lang).then(setDict);
  }, [lang]);

  function t(key: string): string {
    return dict[key] || key;
  }

  return { t, lang, setLang };
} 