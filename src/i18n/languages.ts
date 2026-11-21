// TAIO Time App — Supported Languages Configuration (PRD v0.3.34 Part C3 & v0.3.49 Part A2)

export interface LanguageConfig {
  code: string;
  label: string; // Tên hiển thị bằng chính ngôn ngữ đó
  status: 'active' | 'hidden';
  ready: boolean; // PRD v0.3.50 Part H1: Sẵn sàng bật dịch hay chưa
  fallbackLang: string;
  hasCustomParser?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'vi', label: 'Tiếng Việt', status: 'active', ready: true, fallbackLang: 'en', hasCustomParser: true },
  { code: 'en', label: 'English', status: 'active', ready: true, fallbackLang: 'en', hasCustomParser: true },
  { code: 'zh', label: '中文', status: 'hidden', ready: false, fallbackLang: 'en', hasCustomParser: false },
  { code: 'th', label: 'ไทย', status: 'hidden', ready: false, fallbackLang: 'en', hasCustomParser: false },
];

export type LanguageCode = 'vi' | 'en' | 'zh' | 'th' | (string & {});

/**
 * Resolves effective language from preference:
 * - Ready languages (vi, en): directly matched from system
 * - Non-ready languages (zh, th): allowed only if explicitly selected by user for dev testing
 * - 'system' -> detects device locale, matching ONLY ready languages; defaults to 'en' otherwise (PRD v0.3.50 Part H2)
 */
export function resolveEffectiveLanguage(preference: string): 'vi' | 'en' | 'zh' | 'th' | string {
  // If user explicitly chose a specific language code
  if (preference === 'vi' || preference === 'en' || preference === 'zh' || preference === 'th') {
    return preference;
  }

  if (typeof navigator !== 'undefined') {
    const sys = navigator.language?.toLowerCase() || '';
    for (const l of SUPPORTED_LANGUAGES) {
      if (l.ready && sys.startsWith(l.code)) {
        return l.code;
      }
    }
  }
  return 'en';
}
