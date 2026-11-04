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
  const { currentTab, celebrationMsg, setCelebrationMsg, deviceLook, palette, toastMsg } = useApp();
  const isCool = palette === 'cool';

  return (
    <div className={`min-h-screen flex flex-col bg-white text-slate-900 ${deviceLook === 'phone' ? 'pb-24' : ''}`}>
      {/* Ambient Progress Edge (4px peripheral awareness line) */}
      <AmbientProgressEdge />

      <Navbar />
      <ActionNudgeBanner />

      {/* Floating Toast Notification (PRD v0.3.9 B5: "Đã cho vào Rổ công việc" 3s Toast) */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-slate-900/90 text-white backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-300 border border-slate-700/60">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-center">{toastMsg}</span>
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
      <footer className="border-t border-slate-200/80 py-5 text-center text-xs text-slate-500">
        TAIO Time App v0.3.9 Approved • Quản trị thời gian kết hợp AI • Thương hiệu TAIO (TAIO.CLUB)
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
