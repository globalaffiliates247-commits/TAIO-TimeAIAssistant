'use client';

import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { AppShell } from '../ui-kit/app-shell';
import { Navbar } from '../components/Navbar';
import { NowTab } from '../components/NowTab';
import { PlanTab } from '../components/PlanTab';
import { AchievementsTab } from '../components/AchievementsTab';
import { GoalsTab } from '../components/GoalsTab';
import { AdminPortal } from '../components/AdminPortal';
import { OnboardingModal } from '../components/OnboardingModal';
import { InterruptionModal } from '../components/InterruptionModal';
import { CheckInModal } from '../components/CheckInModal';
import { CloseDayModal } from '../components/CloseDayModal';
import { SocialAuditModal } from '../components/SocialAuditModal';
import { DrilldownSheet } from '../components/DrilldownSheet';
import { ActionNudgeBanner } from '../components/ActionNudgeBanner';
import { AppearanceModal } from '../components/AppearanceModal';
import { AmbientProgressEdge } from '../components/AmbientProgressEdge';
import { InboxModal } from '../components/InboxModal';
import { StickyBoard } from '../features/sticky';
import { MethodLibraryModal } from '../components/MethodLibraryModal';
import { CoachCardOverlay } from '../components/CoachCardOverlay';
import { ExportDataModal } from '../components/ExportDataModal';
import { ListsModal } from '../components/ListsModal';
import { ProfileModal } from '../components/ProfileModal';
import { SwipeReviewModal } from '../components/SwipeReviewModal';
import { ReminderQuestionsModal } from '../components/ReminderQuestionsModal';
import { ActiveCaptureModal } from '../components/ActiveCaptureModal';
import { Sparkles, X, Smartphone, AlertCircle } from 'lucide-react';

const OrientationHint: React.FC = () => {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div className="md:hidden mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-1.5">
        <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0 rotate-90" />
        <span>Xoay ngang hoặc mở trên máy tính để xem đầy đủ hơn.</span>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const {
    currentTab,
    celebrationMsg,
    setCelebrationMsg,
    deviceLook,
    palette,
    toastMsg,
    toastType,
    toastUndoAction,
    dismissToast,
    isOnboarded,
    hasServerBackupToRestore,
    resolveServerBackupChoice
  } = useApp();
  const isCool = palette === 'cool';
  const touchStartYRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleToastTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    if (endY - touchStartYRef.current < -18) {
      dismissToast();
    }
    touchStartYRef.current = null;
  };

  const handleCelebrationTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    if (endY - touchStartYRef.current < -18) {
      setCelebrationMsg(null);
    }
    touchStartYRef.current = null;
  };

  const topBanners = (
    <>
      {/* B14 v0.3.17: Top messages sit below the header (never covering tab bar or header buttons), support swipe-up & close button */}
      {toastMsg && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleToastTouchEnd}
          className={`w-full border-b px-4 py-2.5 transition-all duration-200 ${
            toastType === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="max-w-xl mx-auto flex items-center justify-between gap-2.5 text-xs font-semibold">
            <div className="flex items-center gap-2 min-w-0">
              {toastType === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="leading-snug">{toastMsg}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {toastUndoAction && (
                <button
                  onClick={() => {
                    toastUndoAction();
                    dismissToast();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#E0401F] text-white font-bold text-[11px] shrink-0"
                >
                  Hoàn tác
                </button>
              )}
              <button
                onClick={dismissToast}
                aria-label="Đóng thông báo"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {celebrationMsg && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleCelebrationTouchEnd}
          className="w-full bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-slate-800 transition-all duration-200"
        >
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-snug">{celebrationMsg}</p>
            </div>
            <button
              onClick={() => setCelebrationMsg(null)}
              aria-label="Đóng thông báo"
              className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* B27 v0.3.12: If server copy was kept after reset, ask once after onboarding: Restore or Start fresh */}
      {isOnboarded && hasServerBackupToRestore && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-slate-800">
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <p className="font-bold text-slate-900">Phát hiện bản sao dữ liệu cũ trên máy chủ</p>
              <p className="text-[11px] text-slate-600">
                Bạn muốn khôi phục dữ liệu cũ hay bắt đầu mới? (Nếu bắt đầu mới, bản sao cũ được lưu trữ 30 ngày rồi xóa hẳn).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => resolveServerBackupChoice('restore')}
                className="px-3 py-1.5 rounded-xl bg-[#E0401F] text-white font-bold text-xs shadow-xs"
              >
                Khôi phục dữ liệu cũ
              </button>
              <button
                onClick={() => resolveServerBackupChoice('fresh')}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs"
              >
                Bắt đầu mới
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const overlays = (
    <>
      <AppearanceModal />
      <OnboardingModal />
      <InterruptionModal />
      <CheckInModal />
      <CloseDayModal />
      <SocialAuditModal />
      <DrilldownSheet />
      <InboxModal />
      <StickyBoard />
      <MethodLibraryModal />
      <CoachCardOverlay />
      <ExportDataModal />
      <ListsModal />
      <ProfileModal />
      <SwipeReviewModal />
      <ReminderQuestionsModal />
      <ActiveCaptureModal />
    </>
  );

  return (
    <AppShell
      topEdge={<AmbientProgressEdge />}
      header={<Navbar />}
      nudge={<ActionNudgeBanner />}
      banners={topBanners}
      hasBottomTabBar={deviceLook === 'phone'}
      mainMaxWidthClass={currentTab === 'now' || currentTab === 'plan' ? 'max-w-xl' : 'max-w-6xl'}
      footer="TAIO Time App • Quản trị thời gian kết hợp AI • TAIO.CLUB"
      overlays={overlays}
    >
      {/* Orientation Hint on portrait mobile for management screens (PRD D5) */}
      {(currentTab === 'achievements' || (currentTab as any) === 'efficiency' || currentTab === 'goals') && (
        <OrientationHint />
      )}

      {currentTab === 'now' && <NowTab />}
      {currentTab === 'plan' && <PlanTab />}
      {(currentTab === 'achievements' || (currentTab as any) === 'efficiency') && <AchievementsTab />}
      {currentTab === 'goals' && <GoalsTab />}
      {currentTab === 'admin' && <AdminPortal />}
    </AppShell>
  );
};

export default function Page() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
