// TAIO Time App — i18n Configuration (PRD v0.3.34 Part C3)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viCommon from './vi/common.json';
import viNow from './vi/now.json';
import viJournal from './vi/journal.json';
import viClock from './vi/clock.json';
import viGoals from './vi/goals.json';
import viDayclose from './vi/dayclose.json';
import viAccount from './vi/account.json';
import viSettings from './vi/settings.json';

import enCommon from './en/common.json';
import enNow from './en/now.json';
import enJournal from './en/journal.json';
import enClock from './en/clock.json';
import enGoals from './en/goals.json';
import enDayclose from './en/dayclose.json';
import enAccount from './en/account.json';
import enSettings from './en/settings.json';

const viMerged = {
  ...viCommon,
  ...viNow,
  ...viJournal,
  ...viClock,
  ...viGoals,
  ...viDayclose,
  ...viAccount,
  ...viSettings,
};

const enMerged = {
  ...enCommon,
  ...enNow,
  ...enJournal,
  ...enClock,
  ...enGoals,
  ...enDayclose,
  ...enAccount,
  ...enSettings,
};

const resources = {
  vi: {
    common: viMerged,
    now: viNow,
    journal: viJournal,
    clock: viClock,
    goals: viGoals,
    dayclose: viDayclose,
    account: viAccount,
    settings: viSettings,
  },
  en: {
    common: enMerged,
    now: enNow,
    journal: enJournal,
    clock: enClock,
    goals: enGoals,
    dayclose: enDayclose,
    account: enAccount,
    settings: enSettings,
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'vi',
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'now', 'journal', 'clock', 'goals', 'dayclose', 'account', 'settings'],
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
      missingKeyHandler: (lngs, ns, key) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n missing key] lng=${lngs} ns=${ns} key=${key}`);
        }
      },
    });
}

export default i18n;
export const t = i18n.t.bind(i18n);
