// TAIO Time App — Vietnamese Goal Sentence Parser (PRD B35.2 / v0.3.27)
// Parses natural Vietnamese sentences into goal metadata:
//   - "Làm 30 clip cho kênh AI trước Tết" → key_result, target=30, unit=clip, deadline=trước Tết
//   - "Chạy bộ 30 phút mỗi ngày" → time_commitment, duration=30, unit=phút/ngày
//   - "Ra mắt trang giới thiệu TAIO" → tasks (no number, no time pattern)

export interface ParsedGoal {
  type: 'key_result' | 'time_commitment' | 'tasks';
  target?: number;
  unit?: string;
  duration?: number;       // minutes per period (for time_commitment)
  period?: string;         // "ngày", "tuần"
  deadlineRaw?: string;    // raw deadline text
  title: string;           // cleaned goal title
}

const TIME_PATTERNS = [
  // "30 phút mỗi ngày", "1 giờ mỗi tuần"
  /(\d+)\s*(phút|giờ|tiếng)\s*(mỗi|một|\/)\s*(ngày|tuần|tháng)/i,
  // "mỗi ngày 30 phút"
  /(mỗi|một)\s*(ngày|tuần|tháng)\s*(\d+)\s*(phút|giờ|tiếng)/i,
];

const QUANTITY_PATTERN = /(\d+)\s+(clip|video|bài|bài viết|trang|dòng|cuốn|quyển|km|cây số|lần|buổi|cái|chiếc|sản phẩm|đơn|đơn hàng|khách|người|triệu|tỷ|%)/i;

const DEADLINE_PATTERNS = [
  // "trước Tết", "trước 31/12", "trước ngày 15"
  /(trước\s+.+)$/i,
  // "trong 30 ngày", "trong tháng 12"
  /(trong\s+\d+\s*(ngày|tuần|tháng).*)$/i,
  /(trong\s+tháng\s*\d+)$/i,
  // "đến hết tháng 12", "đến cuối năm"
  /(đến\s+(hết|cuối)\s+.+)$/i,
  // "hạn 31/12"
  /(hạn\s+.+)$/i,
];

export function parseViGoal(input: string): ParsedGoal {
  const trimmed = input.trim();

  // 1. Try time commitment pattern first
  for (const pat of TIME_PATTERNS) {
    const m = trimmed.match(pat);
    if (m) {
      let duration: number;
      let period: string;

      if (/^\d/.test(m[1])) {
        // Pattern: "30 phút mỗi ngày"
        duration = parseInt(m[1], 10);
        const timeUnit = m[2].toLowerCase();
        if (timeUnit === 'giờ' || timeUnit === 'tiếng') duration *= 60;
        period = m[4];
      } else {
        // Pattern: "mỗi ngày 30 phút"
        duration = parseInt(m[3], 10);
        const timeUnit = m[4].toLowerCase();
        if (timeUnit === 'giờ' || timeUnit === 'tiếng') duration *= 60;
        period = m[2];
      }

      return {
        type: 'time_commitment',
        duration,
        period,
        title: trimmed,
      };
    }
  }

  // 2. Try quantity / key_result pattern
  const qm = trimmed.match(QUANTITY_PATTERN);
  if (qm) {
    const target = parseInt(qm[1], 10);
    const unit = qm[2];

    // Extract deadline if present
    let deadlineRaw: string | undefined;
    for (const dp of DEADLINE_PATTERNS) {
      const dm = trimmed.match(dp);
      if (dm) {
        deadlineRaw = dm[1].trim();
        break;
      }
    }

    return {
      type: 'key_result',
      target,
      unit,
      deadlineRaw,
      title: trimmed,
    };
  }

  // 3. Check for deadline even without quantity (still tasks type)
  let deadlineRaw: string | undefined;
  for (const dp of DEADLINE_PATTERNS) {
    const dm = trimmed.match(dp);
    if (dm) {
      deadlineRaw = dm[1].trim();
      break;
    }
  }

  // 4. Default: task completion type
  return {
    type: 'tasks',
    deadlineRaw,
    title: trimmed,
  };
}
