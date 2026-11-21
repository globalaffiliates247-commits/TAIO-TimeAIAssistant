// TAIO Time App — Spoken Vietnamese Normalization (PRD v0.3.52 Part A5)
// Converts conversational Vietnamese speech numbers, times, and durations into structured format.

const VI_WORD_TO_NUM: Record<string, number> = {
  'không': 0, 'một': 1, 'mốt': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'tư': 4,
  'năm': 5, 'lăm': 5, 'sáu': 6, 'bảy': 7, 'bẩy': 7, 'tám': 8, 'chín': 9,
  'mười': 10, 'mươi': 10, 'chục': 10
};

export function parseViNumberWords(str: string): number | null {
  const clean = str.trim().toLowerCase();
  if (!clean) return null;
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);

  const words = clean.split(/\s+/);
  if (words.length === 1) {
    if (words[0] in VI_WORD_TO_NUM) return VI_WORD_TO_NUM[words[0]];
    return null;
  }

  // Two or three words: e.g. "mười lăm" (15), "hai mươi" (20), "hai mươi lăm" (25), "ba mươi" (30), "bốn mươi lăm" (45)
  if (words[0] === 'mười' || words[0] === 'chục') {
    if (words.length === 2 && words[1] in VI_WORD_TO_NUM) {
      return 10 + VI_WORD_TO_NUM[words[1]];
    }
  }

  if (words.length === 2 && words[1] === 'mươi') {
    if (words[0] in VI_WORD_TO_NUM) {
      return VI_WORD_TO_NUM[words[0]] * 10;
    }
  }

  if (words.length === 3 && words[1] === 'mươi') {
    if (words[0] in VI_WORD_TO_NUM && words[2] in VI_WORD_TO_NUM) {
      return VI_WORD_TO_NUM[words[0]] * 10 + VI_WORD_TO_NUM[words[2]];
    }
  }

  return null;
}

/**
 * Normalizes spoken Vietnamese numbers, times, and durations.
 */
export function normalizeSpokenVi(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let text = input.trim();

  // Helper boundary replacement
  const replaceSafe = (regex: RegExp, replacer: (...args: any[]) => string) => {
    text = text.replace(regex, replacer);
  };

  // 1. Durations with "tiếng" / "giờ"
  // "nửa tiếng" / "nửa giờ" -> "30 phút"
  text = text.replace(/(^|[\s,.;!?])nửa\s+(tiếng|giờ)(?=$|[\s,.;!?])/gi, '$130 phút');

  // "X tiếng rưỡi" -> "Xh30"
  text = text.replace(/(^|[\s,.;!?])(một|1)\s+tiếng\s+rưỡi(?=$|[\s,.;!?])/gi, '$11h30');
  text = text.replace(/(^|[\s,.;!?])(hai|2)\s+tiếng\s+rưỡi(?=$|[\s,.;!?])/gi, '$12h30');
  text = text.replace(/(^|[\s,.;!?])(ba|3)\s+tiếng\s+rưỡi(?=$|[\s,.;!?])/gi, '$13h30');
  text = text.replace(/(^|[\s,.;!?])(bốn|4)\s+tiếng\s+rưỡi(?=$|[\s,.;!?])/gi, '$14h30');

  // "X tiếng" -> "Xh"
  text = text.replace(/(^|[\s,.;!?])(một|1)\s+tiếng(?=$|[\s,.;!?])/gi, '$11h');
  text = text.replace(/(^|[\s,.;!?])(hai|2)\s+tiếng(?=$|[\s,.;!?])/gi, '$12h');
  text = text.replace(/(^|[\s,.;!?])(ba|3)\s+tiếng(?=$|[\s,.;!?])/gi, '$13h');
  text = text.replace(/(^|[\s,.;!?])(bốn|4)\s+tiếng(?=$|[\s,.;!?])/gi, '$14h');
  text = text.replace(/(^|[\s,.;!?])(năm|5)\s+tiếng(?=$|[\s,.;!?])/gi, '$15h');

  // Minutes durations: "mười lăm phút" -> "15 phút", "hai mươi phút" -> "20 phút", etc.
  const minuteWordRegex = /(^|[\s,.;!?])(mười\s+lăm|hai\s+mươi(?:\s+lăm)?|ba\s+mươi(?:\s+lăm)?|bốn\s+mươi(?:\s+lăm)?|năm\s+mươi)\s+phút(?=$|[\s,.;!?])/gi;
  text = text.replace(minuteWordRegex, (_, pre, words) => {
    const n = parseViNumberWords(words);
    return n ? `${pre}${n} phút` : `${pre}${words} phút`;
  });

  // Simple minutes: "X phút" where X is a word
  text = text.replace(/(^|[\s,.;!?])(năm|mười|hai mươi|ba mươi|bốn mươi lăm)\s+phút(?=$|[\s,.;!?])/gi, (_, pre, word) => {
    const n = parseViNumberWords(word);
    return n ? `${pre}${n} phút` : `${pre}${word} phút`;
  });

  // 2. Specific time of day with AM/PM modifiers
  // e.g. "bảy giờ tối" -> 19h, "bảy giờ sáng" -> 7h, "mười hai giờ trưa" -> 12h, "mười hai giờ đêm" -> 0h
  const timePeriodRegex = /(^|[\s,.;!?])(không|một|hai|ba|bốn|tư|năm|sáu|bảy|bẩy|tám|chín|mười(?:\s+một|\s+hai)?|\d{1,2})\s*giờ(?:\s*(rưỡi|ba\s*mươi|mười\s*lăm|bốn\s*mươi\s*lăm|\d{1,2}))?\s*(sáng|trưa|chiều|tối|đêm)(?=$|[\s,.;!?])/gi;
  text = text.replace(timePeriodRegex, (_, pre, hWord, mWord, period) => {
    let hour = parseViNumberWords(hWord);
    if (hour === null) return `${pre}${hWord} giờ`;

    const p = period.toLowerCase();
    if (p === 'chiều') {
      if (hour < 12) hour += 12;
    } else if (p === 'tối') {
      if (hour < 12) hour += 12;
    } else if (p === 'đêm') {
      if (hour === 12) hour = 0;
      else if (hour < 12 && hour >= 6) hour += 12; // 10h đêm -> 22h
    } else if (p === 'trưa') {
      if (hour !== 12 && hour <= 1) hour += 12;
    }

    let minStr = '';
    if (mWord) {
      const mw = mWord.toLowerCase().trim();
      if (mw === 'rưỡi' || mw === 'ba mươi') minStr = '30';
      else if (mw === 'mười lăm') minStr = '15';
      else if (mw === 'bốn mươi lăm') minStr = '45';
      else {
        const mNum = parseViNumberWords(mw);
        if (mNum !== null) minStr = mNum.toString().padStart(2, '0');
      }
    }

    return minStr ? `${pre}${hour}h${minStr}` : `${pre}${hour}h`;
  });

  // 3. Spoken time without period: e.g. "tám giờ rưỡi" -> 8h30, "tám giờ ba mươi" -> 8h30, "tám giờ" -> 8h
  const timeRegex = /(^|[\s,.;!?])(không|một|hai|ba|bốn|tư|năm|sáu|bảy|bẩy|tám|chín|mười(?:\s+một|\s+hai)?|\d{1,2})\s*giờ(?:\s*(rưỡi|ba\s*mươi|mười\s*lăm|bốn\s*mươi\s*lăm|\d{1,2}))?(?=$|[\s,.;!?])/gi;
  text = text.replace(timeRegex, (_, pre, hWord, mWord) => {
    const hour = parseViNumberWords(hWord);
    if (hour === null || hour > 24) return `${pre}${hWord} giờ`;

    let minStr = '';
    if (mWord) {
      const mw = mWord.toLowerCase().trim();
      if (mw === 'rưỡi' || mw === 'ba mươi') minStr = '30';
      else if (mw === 'mười lăm') minStr = '15';
      else if (mw === 'bốn mươi lăm') minStr = '45';
      else {
        const mNum = parseViNumberWords(mw);
        if (mNum !== null) minStr = mNum.toString().padStart(2, '0');
      }
    }

    return minStr ? `${pre}${hour}h${minStr}` : `${pre}${hour}h`;
  });

  return text.trim();
}
