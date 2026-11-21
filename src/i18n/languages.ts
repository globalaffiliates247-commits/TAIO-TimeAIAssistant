// TAIO Time App — Supported Languages Configuration (PRD v0.3.34 Part C3)

export interface LanguageConfig {
  code: string;
  label: string; // Tên hiển thị bằng chính ngôn ngữ đó
  hasCustomParser?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'vi', label: 'Tiếng Việt', hasCustomParser: true },
  { code: 'en', label: 'English', hasCustomParser: true },
  { code: 'zh', label: '中文 (Chinese)', hasCustomParser: false },
  { code: 'th', label: 'ไทย (Thai)', hasCustomParser: false },
];

export type LanguageCode = 'vi' | 'en' | 'zh' | 'th' | (string & {});

/**
 * Resolves effective language from preference:
 * 'system' -> detects device locale (defaulting to 'en' if unsupported)
 */
export function resolveEffectiveLanguage(preference: string): 'vi' | 'en' | 'zh' | 'th' | string {
  if (preference === 'vi' || preference === 'en' || preference === 'zh' || preference === 'th') return preference;
  if (typeof navigator !== 'undefined') {
    const sys = navigator.language?.toLowerCase() || '';
    if (sys.startsWith('vi')) return 'vi';
    if (sys.startsWith('zh')) return 'zh';
    if (sys.startsWith('th')) return 'th';
  }
  return 'en';
}
