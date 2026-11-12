// TAIO Time App — useT Hook Wrapper (PRD E6 / v0.3.27)
'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import i18n from './index';

export function useT(ns = 'common') {
  const { t, i18n: i18nInstance } = useTranslation(ns);

  const changeLanguage = (lang: 'vi' | 'en') => {
    i18nInstance.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taio_language', lang);
      } catch (_) {}
    }
  };

  return {
    t,
    i18n: i18nInstance,
    currentLang: (i18nInstance.language?.slice(0, 2) || 'vi') as 'vi' | 'en',
    changeLanguage,
  };
}

export default useT;
