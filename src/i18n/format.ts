// TAIO Time App — Format Utilities based on Intl (PRD v0.3.34 Part C4)

/**
 * Format a Date or date string to localized date string
 * e.g., 'Th 7, 14 thg 11' (vi) or 'Sat, Nov 14' (en)
 */
export function formatDate(
  dateInput: Date | string | number,
  lang: string = 'vi',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const locale = lang.startsWith('vi') ? 'vi-VN' : 'en-US';
  const defaultOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat(locale, options || defaultOpts).format(d);
}

/**
 * Format time with respect to device locale / 12h or 24h preference
 */
export function formatTime(
  dateInput: Date | string | number,
  lang: string = 'vi',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const locale = lang.startsWith('vi') ? 'vi-VN' : 'en-US';
  const defaultOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat(locale, options || defaultOpts).format(d);
}

/**
 * Format duration in minutes to localized string
 * e.g. 90m -> '1g30' (vi) or '1h30' (en)
 */
export function formatDuration(
  minutes: number,
  lang: string = 'vi',
  format: 'short' | 'long' = 'short'
): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const remM = m % 60;

  if (lang.startsWith('vi')) {
    if (h === 0) return `${remM}p`;
    if (remM === 0) return `${h}g`;
    return format === 'short' ? `${h}g${remM < 10 ? '0' : ''}${remM}` : `${h} giờ ${remM} phút`;
  } else {
    if (h === 0) return `${remM}m`;
    if (remM === 0) return `${h}h`;
    return format === 'short' ? `${h}h${remM < 10 ? '0' : ''}${remM}` : `${h} hr ${remM} min`;
  }
}

/**
 * Format relative time using Intl.RelativeTimeFormat
 * e.g., 'cách đây 5 phút' (vi) or '5 minutes ago' (en)
 */
export function formatRelativeTime(
  diffMinutes: number,
  lang: string = 'vi'
): string {
  const locale = lang.startsWith('vi') ? 'vi-VN' : 'en-US';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(Math.round(diffMinutes), 'minute');
  }
  const diffHours = diffMinutes / 60;
  if (Math.abs(diffHours) < 24) {
    return rtf.format(Math.round(diffHours), 'hour');
  }
  const diffDays = diffHours / 24;
  return rtf.format(Math.round(diffDays), 'day');
}

/**
 * Format number with localized thousands separator
 */
export function formatNumber(
  num: number,
  lang: string = 'vi',
  options?: Intl.NumberFormatOptions
): string {
  const locale = lang.startsWith('vi') ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format percentage
 */
export function formatPercent(
  val: number, // 0..100
  lang: string = 'vi',
  decimals: number = 0
): string {
  const locale = lang.startsWith('vi') ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val / 100);
}
