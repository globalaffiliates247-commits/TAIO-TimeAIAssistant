// TAIO Time App — Motivation Quote Bank (PRD B35.3 / v0.3.27)

export interface Quote {
  id: string;
  text: string;
  author?: string;
  lang: 'vi' | 'en';
  isCustom?: boolean;
}

export const BUILTIN_QUOTES: Quote[] = [
  // Vietnamese
  { id: 'q-vi-1', text: 'Điều quan trọng nhất không phải làm nhiều, mà là làm đúng việc vào đúng lúc.', author: 'Peter Drucker', lang: 'vi' },
  { id: 'q-vi-2', text: 'Thói quen nhỏ mỗi ngày tạo nên kết quả lớn theo thời gian.', author: 'James Clear', lang: 'vi' },
  { id: 'q-vi-3', text: 'Đừng đợi cảm hứng. Hãy bắt đầu, rồi cảm hứng sẽ tới.', author: 'Pablo Picasso', lang: 'vi' },
  { id: 'q-vi-4', text: 'Thành công không phải đích đến, mà là hành trình mỗi ngày.', lang: 'vi' },
  { id: 'q-vi-5', text: 'Một ngày có kế hoạch bằng mười ngày không có kế hoạch.', lang: 'vi' },
  { id: 'q-vi-6', text: 'Hãy sống có chủ đích. Thời gian là thứ duy nhất không thể mua lại.', lang: 'vi' },
  { id: 'q-vi-7', text: 'Kỷ luật là cây cầu nối giữa mục tiêu và thành tựu.', author: 'Jim Rohn', lang: 'vi' },
  { id: 'q-vi-8', text: 'Mỗi bước nhỏ đều đưa bạn gần hơn đến đích.', lang: 'vi' },
  { id: 'q-vi-9', text: 'Bạn không cần phải hoàn hảo, bạn chỉ cần bắt đầu.', lang: 'vi' },
  { id: 'q-vi-10', text: 'Tập trung vào tiến trình, không phải sự hoàn hảo.', lang: 'vi' },
  { id: 'q-vi-11', text: 'Người quản trị thời gian giỏi không phải là người bận rộn nhất, mà là người thanh thản nhất.', lang: 'vi' },
  { id: 'q-vi-12', text: 'Hôm nay bạn làm gì sẽ quyết định ngày mai bạn là ai.', lang: 'vi' },

  // English
  { id: 'q-en-1', text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.', author: 'Stephen Covey', lang: 'en' },
  { id: 'q-en-2', text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma', lang: 'en' },
  { id: 'q-en-3', text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar', lang: 'en' },
  { id: 'q-en-4', text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss', lang: 'en' },
  { id: 'q-en-5', text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', lang: 'en' },
  { id: 'q-en-6', text: 'Time is what we want most, but what we use worst.', author: 'William Penn', lang: 'en' },
  { id: 'q-en-7', text: 'Done is better than perfect.', author: 'Sheryl Sandberg', lang: 'en' },
  { id: 'q-en-8', text: 'It\'s not about having time, it\'s about making time.', lang: 'en' },
  { id: 'q-en-9', text: 'Progress, not perfection.', lang: 'en' },
  { id: 'q-en-10', text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki', lang: 'en' },
];
