'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import { getDeviceCalendarDate, getTodayLabelWithWeekday } from '@/core/clock';
import { StartDayCard } from '@/features/motivation';
import { MotionPermissionCard, isMotionPermissionCardDismissed } from '@/features/motion';
import { 
  getMotionCapability, 
  isMotionTrackingEnabled, 
  queryPedometer 
} from '@/features/motion';
import { 
  NowCurrentCard, 
  NowActions, 
  NowNextList, 
  NowTodayLine 
} from '@/features/now';
import { AlertTriangle, Clock } from 'lucide-react';

export const NowTab: React.FC = () => {
  const { 
    palette,
    language,
    isNativePlatform,
    isOffPlan,
    toggleOffPlan,
    offPlanMinutes,
    backToPlan,
    dailyCardItems
  } = useApp();

  const { t } = useT();
  const [stepsToday, setStepsToday] = useState<number>(0);

  // Steps tracking
  useEffect(() => {
    if (!isNativePlatform || !isMotionTrackingEnabled()) return;

    getMotionCapability().then(async cap => {
      if (cap.authorizationStatus === 'authorized') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const fromSec = Math.floor(startOfDay.getTime() / 1000);
        const toSec = Math.floor(now.getTime() / 1000);
        try {
          const pedo = await queryPedometer(fromSec, toSec);
          setStepsToday(pedo.steps);
        } catch {}
      }
    });
  }, [isNativePlatform, dailyCardItems]);

  const dateLabel = getTodayLabelWithWeekday(new Date(), language as 'vi' | 'en');

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* 1. Hàng tiêu đề: "Lúc này", ngày giờ */}
      <div className="flex items-center justify-between pb-1 select-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('nav.now', 'Lúc này')}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {dateLabel}
          </p>
        </div>
      </div>

      {/* 2. Thẻ chỉ hiện khi cần */}
      {/* Thẻ Bắt đầu ngày */}
      <StartDayCard />

      {/* Thẻ mời quyền chuyển động */}
      <MotionPermissionCard />

      {/* Cảnh báo lệch kế hoạch */}
      {isOffPlan && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">
              {language === 'en'
                ? `Off-plan for ${offPlanMinutes} minutes`
                : `Đang lệch kế hoạch ${offPlanMinutes} phút`}
            </span>
          </div>
          <button
            type="button"
            onClick={backToPlan}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
          >
            {language === 'en' ? 'Back to Plan' : 'Trở lại kế hoạch'}
          </button>
        </div>
      )}

      {/* 3. Thẻ "Đang làm" (gộp ba khối cũ: Bạn đang làm gì, mục tiêu, đồng hồ) */}
      <NowCurrentCard />

      {/* 4. Hai ô: "Ghi nhanh" và "Bấm giờ riêng" */}
      <NowActions />

      {/* 5. Danh sách "Tiếp theo": 3 dòng kế tiếp từ Nhật ký hôm nay */}
      <NowNextList />

      {/* 6. Dòng tổng kết: Hôm nay: X/Y việc · Xg tập trung · X bước */}
      <NowTodayLine stepsToday={stepsToday} />
    </div>
  );
};
