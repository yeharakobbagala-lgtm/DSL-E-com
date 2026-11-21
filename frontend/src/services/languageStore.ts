'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LanguageCode, LANGUAGES, LanguageInfo, translations, TranslationKey } from '@/translations';

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang: LanguageCode) => {
        if (typeof document !== 'undefined') {
          // Set cookie for potential server-side inspection
          document.cookie = `dsl_locale=${lang};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
          // Set HTML lang attribute
          document.documentElement.lang = lang;
        }
        set({ language: lang });
      },
    }),
    {
      name: 'dsl_preferred_language',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as any))),
    }
  )
);

/**
 * Convenient React hook for components to access translation helper `t`
 * and language toggle functionality.
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = (key: TranslationKey | string, defaultText?: string, vars?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || defaultText || key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  };

  const currentLanguageInfo = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return {
    t,
    language,
    setLanguage,
    languages: LANGUAGES,
    currentLanguageInfo,
  };
}
