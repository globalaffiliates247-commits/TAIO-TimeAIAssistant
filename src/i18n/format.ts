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
 * Format duration in minutes to localized string:
 * - >= 60 mins: '3g22p' (vi) or '3h22m' (en). If remM === 0: '2g' (vi) or '2h' (en).
 * - < 60 mins: '45p' (vi) or '45m' (en).
 * (PRD v0.3.36 Part C2.1)
 */
export function formatDuration(
  minutes: number,
  lang: string = 'vi',
  format: 'short' | 'long' = 'short'
): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const remM = m % 60;
  const isVi = lang.startsWith('vi');

  if (format === 'long') {
    if (isVi) {
      if (h === 0) return `${remM} phút`;
      if (remM === 0) return `${h} giờ`;
      return `${h} giờ ${remM} phút`;
    } else {
      if (h === 0) return `${remM} min`;
      if (remM === 0) return `${h} hr`;
      return `${h} hr ${remM} min`;
    }
  }

  // Short format (PRD v0.3.36 Part C2.1 & C3.1)
  if (isVi) {
    if (h === 0) return `${remM}p`;
    if (remM === 0) return `${h}g`;
    return `${h}g${remM}p`;
  } else {
    if (h === 0) return `${remM}m`;
    if (remM === 0) return `${h}h`;
    return `${h}h${remM}m`;
  }
}

/**
 * Format duration in seconds for clock displays:
 * - >= 3600 secs (>= 60 mins): 'H:MM:SS' (e.g. '3:22:56')
 * - < 3600 secs (< 60 mins): 'MM:SS' (e.g. '22:56')
 * (PRD v0.3.36 Part C2.1 & C3.2)
 */
export function formatDurationClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const remS = s % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(remS).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(remS).padStart(2, '0')}`;
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
