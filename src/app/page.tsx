'use client';

import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
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
import { MethodLibraryModal } from '../components/MethodLibraryModal';
import { CoachCardOverlay } from '../components/CoachCardOverlay';
import { ExportDataModal } from '../components/ExportDataModal';
import { ListsModal } from '../components/ListsModal';
import { ProfileModal } from '../components/ProfileModal';
import { SwipeReviewModal } from '../components/SwipeReviewModal';
import { ReminderQuestionsModal } from '../components/ReminderQuestionsModal';
import { ActiveCaptureModal } from '../components/ActiveCaptureModal';
import { Sparkles, X, Smartphone } from 'lucide-react';

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
    toastUndoAction,
    isOnboarded,
    hasServerBackupToRestore,
    resolveServerBackupChoice
  } = useApp();
  const isCool = palette === 'cool';

  return (
    <div style={{ overflowX: 'clip' }} className={`min-h-screen flex flex-col bg-white text-slate-900 w-full max-w-full ${deviceLook === 'phone' ? 'pb-24' : ''}`}>
      {/* Ambient Progress Edge (4px peripheral awareness line) */}
      <AmbientProgressEdge />

      <Navbar />
      <ActionNudgeBanner />

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

      {/* Floating Toast Notification (with optional 3s Undo button) */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-white/95 text-slate-800 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-300 border border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{toastMsg}</span>
          </div>
          {toastUndoAction && (
            <button
              onClick={() => {
                toastUndoAction();
              }}
              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#E0401F] border border-red-200 font-bold text-[11px] shrink-0"
            >
              Hoàn tác
            </button>
          )}
        </div>
      )}

      {/* Floating Celebration Toast */}
      {celebrationMsg && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-white border border-slate-200 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 text-slate-800 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${
              isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
            }`}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">{celebrationMsg}</p>
          </div>
          <button 
            onClick={() => setCelebrationMsg(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container - D5 Mobile First: Everyday tabs constrained to mobile-width column; Management tabs responsive */}
      <main className={`flex-1 w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 transition-all duration-300 ${
        currentTab === 'now' || currentTab === 'plan' 
          ? 'max-w-xl' 
          : 'max-w-6xl'
      }`}>
        {/* Orientation Hint on portrait mobile for management screens (PRD D5) */}
        {(currentTab === 'achievements' || (currentTab as any) === 'efficiency' || currentTab === 'goals') && (
          <OrientationHint />
        )}

        {currentTab === 'now' && <NowTab />}
        {currentTab === 'plan' && <PlanTab />}
        {(currentTab === 'achievements' || (currentTab as any) === 'efficiency') && <AchievementsTab />}
        {currentTab === 'goals' && <GoalsTab />}
        {currentTab === 'admin' && <AdminPortal />}
      </main>

      {/* Bottom Footer info */}
      <footer style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} className="border-t border-slate-200/80 pt-4 px-4 text-center text-xs text-slate-500">
        TAIO Time App • Quản trị thời gian kết hợp AI • TAIO.CLUB
      </footer>

      {/* Modals & Overlays */}
      <AppearanceModal />
      <OnboardingModal />
      <InterruptionModal />
      <CheckInModal />
      <CloseDayModal />
      <SocialAuditModal />
      <DrilldownSheet />
      <InboxModal />
      <MethodLibraryModal />
      <CoachCardOverlay />
      <ExportDataModal />
      <ListsModal />
      <ProfileModal />
      <SwipeReviewModal />
      <ReminderQuestionsModal />
      <ActiveCaptureModal />
    </div>
  );
};

export default function Page() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
