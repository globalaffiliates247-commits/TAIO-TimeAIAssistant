// TAIO Time App — i18n Configuration (PRD E6 / v0.3.27)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viCommon from './vi/common.json';
import enCommon from './en/common.json';

const resources = {
  vi: { common: viCommon },
  en: { common: enCommon },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'vi',
      fallbackLng: 'en',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
export const t = i18n.t.bind(i18n);
