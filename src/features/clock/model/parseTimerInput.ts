// PRD FIX v0.3.30 Part E2: parseTimerInput pure parser
// Handles:
// - "25p", "1g30", "90s" -> countdown
// - "25p pha trà", "10m rửa chén" -> countdown with title
// - "15:30 gọi anh Minh" -> at_time target reminder
// - "" or "pha trà" + stopwatch button -> stopwatch (count-up)

export interface ParsedTimerInput {
  mode: 'countdown' | 'at_time' | 'stopwatch';
  title: string;
  durationSeconds?: number;
  targetTime?: string; // "15:30"
  targetTimestamp?: number; // epoch ms
}

export function parseTimerInput(rawText: string, now = new Date()): ParsedTimerInput {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return {
      mode: 'stopwatch',
      title: 'Bấm giờ',
    };
  }

  // 1. Check for specific time reminder: e.g. "15:30 gọi anh Minh", "8:00 họp team"
  const atTimeMatch = trimmed.match(/^(\d{1,2})[:h](\d{2})\s*(.*)$/i);
  if (atTimeMatch) {
    const hours = parseInt(atTimeMatch[1], 10);
    const minutes = parseInt(atTimeMatch[2], 10);
    const label = atTimeMatch[3]?.trim() || 'Nhắc việc đúng giờ';

    const targetDate = new Date(now);
    targetDate.setHours(hours, minutes, 0, 0);

    // If target is earlier than now, assume tomorrow
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const durationSeconds = Math.max(1, Math.round((targetDate.getTime() - now.getTime()) / 1000));
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
      mode: 'at_time',
      title: label,
      targetTime: timeFormatted,
      targetTimestamp: targetDate.getTime(),
      durationSeconds,
    };
  }

  // 2. Check for compound countdown: e.g. "1g30 pha trà", "1h30m tập yoga"
  const compoundMatch = trimmed.match(/^(\d+)(?:g|h|hr|giờ)\s*(\d+)?(?:p|m|min|phút)?\s*(.*)$/i);
  if (compoundMatch) {
    const h = parseInt(compoundMatch[1], 10);
    const m = compoundMatch[2] ? parseInt(compoundMatch[2], 10) : 0;
    const label = compoundMatch[3]?.trim() || 'Đếm ngược';
    const totalSec = (h * 60 + m) * 60;
    return {
      mode: 'countdown',
      title: label,
      durationSeconds: totalSec,
      targetTimestamp: now.getTime() + totalSec * 1000,
    };
  }

  // 3. Check for minutes countdown: e.g. "25p pha trà", "10m", "45 phút thiền"
  const minsMatch = trimmed.match(/^(\d+)\s*(?:p|m|min|phút)\s*(.*)$/i);
  if (minsMatch) {
    const m = parseInt(minsMatch[1], 10);
    const label = minsMatch[2]?.trim() || 'Đếm ngược';
    const totalSec = m * 60;
    return {
      mode: 'countdown',
      title: label,
      durationSeconds: totalSec,
      targetTimestamp: now.getTime() + totalSec * 1000,
    };
  }

  // 4. Check for seconds countdown: e.g. "90s nghỉ mắt", "30s plank"
  const secMatch = trimmed.match(/^(\d+)\s*(?:s|sec|giây)\s*(.*)$/i);
  if (secMatch) {
    const s = parseInt(secMatch[1], 10);
    const label = secMatch[2]?.trim() || 'Đếm ngược';
    return {
      mode: 'countdown',
      title: label,
      durationSeconds: s,
      targetTimestamp: now.getTime() + s * 1000,
    };
  }

  // 5. Pure number without unit (default to minutes): e.g. "25", "10 pha trà"
  const numOnlyMatch = trimmed.match(/^(\d+)\s*(.*)$/);
  if (numOnlyMatch) {
    const m = parseInt(numOnlyMatch[1], 10);
    const label = numOnlyMatch[2]?.trim() || 'Đếm ngược';
    const totalSec = m * 60;
    return {
      mode: 'countdown',
      title: label,
      durationSeconds: totalSec,
      targetTimestamp: now.getTime() + totalSec * 1000,
    };
  }

  // 6. Non-numeric text: treat as stopwatch with custom title
  return {
    mode: 'stopwatch',
    title: trimmed,
  };
}
