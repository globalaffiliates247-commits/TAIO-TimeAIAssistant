// TAIO Time App — Spoken English Normalization (PRD v0.3.52 Part A5)
// Converts conversational English speech numbers, times, and durations into structured format.

const EN_WORD_TO_NUM: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50
};

export function parseEnNumberWords(str: string): number | null {
  const clean = str.trim().toLowerCase();
  if (!clean) return null;
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);
  if (clean in EN_WORD_TO_NUM) return EN_WORD_TO_NUM[clean];

  const words = clean.split(/[-\s]+/);
  if (words.length === 2 && words[0] in EN_WORD_TO_NUM && words[1] in EN_WORD_TO_NUM) {
    return EN_WORD_TO_NUM[words[0]] + EN_WORD_TO_NUM[words[1]];
  }

  return null;
}

export function normalizeSpokenEn(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let text = input.trim();

  // Durations: "half an hour" -> "30m", "one and a half hours" -> "1h30"
  text = text.replace(/\bhalf\s+an\s+hour\b/gi, '30m');
  text = text.replace(/\b(one|1)\s+and\s+a\s+half\s+hours\b/gi, '1h30');
  text = text.replace(/\b(two|2)\s+and\s+a\s+half\s+hours\b/gi, '2h30');

  // "quarter past X" -> "X:15", "quarter to X" -> "(X-1):45"
  text = text.replace(/\bquarter\s+past\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d{1,2})\b/gi, (_, h) => {
    const hn = parseEnNumberWords(h);
    return hn !== null ? `${hn}:15` : _;
  });
  text = text.replace(/\bquarter\s+to\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d{1,2})\b/gi, (_, h) => {
    const hn = parseEnNumberWords(h);
    if (hn !== null) {
      const prevH = hn === 1 ? 12 : hn - 1;
      return `${prevH}:45`;
    }
    return _;
  });

  // Minutes: "X minutes"
  text = text.replace(/\b(five|ten|fifteen|twenty|twenty-five|thirty|forty-five)\s+minutes\b/gi, (match, word) => {
    const n = parseEnNumberWords(word);
    return n ? `${n}m` : match;
  });

  // Hours: "seven pm" -> "19:00", "seven am" -> "7:00"
  const amPmRegex = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d{1,2})(?:\s*(thirty|fifteen|forty-five|\d{1,2}))?\s*(am|pm)\b/gi;
  text = text.replace(amPmRegex, (match, hWord, mWord, period) => {
    let hour = parseEnNumberWords(hWord);
    if (hour === null) return match;

    const p = period.toLowerCase();
    if (p === 'pm' && hour < 12) hour += 12;
    if (p === 'am' && hour === 12) hour = 0;

    let minStr = '00';
    if (mWord) {
      const mw = mWord.toLowerCase().trim();
      if (mw === 'thirty') minStr = '30';
      else if (mw === 'fifteen') minStr = '15';
      else if (mw === 'forty-five') minStr = '45';
      else {
        const mNum = parseEnNumberWords(mw);
        if (mNum !== null) minStr = mNum.toString().padStart(2, '0');
      }
    }

    return `${hour}:${minStr}`;
  });

  // Simple times: "eight thirty" -> "8:30"
  text = text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(thirty|fifteen|forty-five)\b/gi, (_, h, m) => {
    const hn = parseEnNumberWords(h);
    const mn = m === 'thirty' ? '30' : m === 'fifteen' ? '15' : '45';
    return hn !== null ? `${hn}:${mn}` : _;
  });

  return text;
}
