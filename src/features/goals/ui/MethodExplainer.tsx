// TAIO Time App — Backward Planning Method Explainer (PRD v0.3.54 Part O)
'use client';

import React, { useState } from 'react';
import { HelpCircle, X, BookOpen, ExternalLink, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface MethodExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodExplainer: React.FC<MethodExplainerProps> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const isVi = language === 'vi';
  const [showInAppArticle, setShowInAppArticle] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Non-blocking overlay / floating pop-up card */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-2xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-slate-800 dark:text-slate-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isVi ? 'Phương pháp Lập kế hoạch ngược' : 'Backward Planning Method'}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {isVi ? 'Kỹ thuật chia chặng từ hạn chót' : 'Reverse milestone calculation'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Concise under 90 words */}
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              {isVi
                ? 'Lập kế hoạch ngược (backward planning) xuất phát từ hạn chót để tính lùi các mốc cần hoàn thành. Nghiên cứu thực nghiệm cho thấy cách tính lùi giúp giảm xu hướng đánh giá thấp thời gian và nhìn rõ các trở ngại trước mắt.'
                : 'Backward planning starts from your final deadline and calculates milestone dates in reverse. Research in project management demonstrates that reverse scheduling significantly reduces planning fallacy and helps identify potential bottlenecks early.'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              {isVi
                ? '* Ba giai đoạn được TAIO gợi ý là khung sườn khởi đầu, bạn có thể tự do chỉnh sửa ngày và tên chặng cho phù hợp thực tế.'
                : '* The 3 stages provided are a starter template by TAIO; you can freely adjust names, deadlines, and milestones anytime.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowInAppArticle(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--taio-brand)] hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isVi ? 'Tìm hiểu thêm' : 'Read full article'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs"
            >
              {isVi ? 'Đã hiểu' : 'Got it'}
            </button>
          </div>
        </div>
      </div>

      {/* In-app detailed article modal */}
      {showInAppArticle && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowInAppArticle(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-slate-800 dark:text-slate-100 text-xs leading-relaxed"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isVi ? 'Lập kế hoạch ngược (Backward Planning) là gì?' : 'Understanding Backward Planning'}
              </h3>
              <button
                type="button"
                onClick={() => setShowInAppArticle(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p>
                {isVi
                  ? 'Khi bắt đầu một dự án hoặc mục tiêu mới, con người thường mắc bẫy thiên kiến lạc quan (Planning Fallacy) — chúng ta ước lượng mọi việc diễn ra hoàn hảo và thời gian thực tế thường dài gấp đôi hoặc gấp ba.'
                  : 'When initiating projects, individuals often succumb to the planning fallacy—assuming optimal conditions and severely underestimating required duration.'}
              </p>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 pt-1">
                {isVi ? 'Cơ sở nghiên cứu khoa học' : 'Scientific Research'}
              </h4>
              <p>
                {isVi
                  ? 'Nghiên cứu được công bố trên tạp chí Judgment and Decision Making (2016) chỉ ra rằng khi người tham gia lập kế hoạch ngược từ thời điểm đích, họ tự nhiên chú ý nhiều hơn đến các khó khăn, sự gián đoạn và việc phát sinh ngoài dự kiến. Kết quả là kế hoạch thực tế hơn rất nhiều.'
                  : 'A 2016 study published in Judgment and Decision Making demonstrated that thinking backward from a future event leads people to construct more realistic plans and anticipate potential delays and competing commitments.'}
              </p>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 pt-1">
                {isVi ? 'Khung gợi ý 3 chặng của TAIO' : 'The 3-Stage Framework in TAIO'}
              </h4>
              <p>
                {isVi
                  ? 'Để giúp bạn không bị choáng ngợp trước một hạn chót xa xôi, TAIO tự động tính toán 3 chặng cơ bản: Chuẩn bị & Bản nháp (1/3 thời gian), Triển khai lõi & Đánh giá (2/3 thời gian), và Hoàn thiện kết quả đo lường. Đây là khung ban đầu giúp bạn có định hướng làm việc ngay từ ngày đầu tiên.'
                  : 'To prevent deadline anxiety, TAIO divides your project horizon into 3 sequential phases: Preparation & Draft (1/3), Core Deployment & Review (2/3), and Final Delivery. You are always in control to adapt milestone names and dates as work evolves.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInAppArticle(false)}
                className="px-4 py-2 rounded-xl bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] font-bold text-xs shadow-xs taio-btn-primary"
              >
                {isVi ? 'Đóng bài viết' : 'Close Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
