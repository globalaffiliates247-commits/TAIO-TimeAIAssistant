// TAIO Time App — useT Hook Wrapper (PRD E6 / v0.3.34 Part C3)
'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import i18n from './index';
import { resolveEffectiveLanguage } from './languages';

export function useT(ns = 'common') {
  const { t, i18n: i18nInstance } = useTranslation(ns);

  const changeLanguage = (lang: 'system' | 'vi' | 'en') => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taio_language_preference', lang);
      } catch (_) {}
    }
    const eff = resolveEffectiveLanguage(lang);
    i18nInstance.changeLanguage(eff);
  };

  return {
    t,
    i18n: i18nInstance,
    currentLang: (i18nInstance.language?.slice(0, 2) || 'vi') as 'vi' | 'en',
    changeLanguage,
  };
}

export default useT;
