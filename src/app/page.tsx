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
import { Sparkles, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentTab, celebrationMsg, setCelebrationMsg, deviceLook } = useApp();

  return (
    <div className={`min-h-screen flex flex-col bg-[#0f172a] text-[#f8fafc] ${deviceLook === 'phone' ? 'pb-24' : ''}`}>
      {/* Ambient Progress Edge (4px peripheral awareness line) */}
      <AmbientProgressEdge />

      <Navbar />
      <ActionNudgeBanner />

      {/* Floating Celebration Toast */}
      {celebrationMsg && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900/95 border border-[#E0401F]/60 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-red-950/50 flex items-center justify-between gap-3 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E0401F] to-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100">{celebrationMsg}</p>
          </div>
          <button 
            onClick={() => setCelebrationMsg(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'now' && <NowTab />}
        {currentTab === 'plan' && <PlanTab />}
        {currentTab === 'achievements' && <AchievementsTab />}
        {currentTab === 'goals' && <GoalsTab />}
        {currentTab === 'admin' && <AdminPortal />}
      </main>

      {/* Bottom Footer info */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        TAIO Time App • Thương hiệu TAIO (TAIO.CLUB) • Thiết kế chuẩn Glassmorphism
      </footer>

      {/* Modals & Overlays */}
      <AppearanceModal />
      <OnboardingModal />
      <InterruptionModal />
      <CheckInModal />
      <CloseDayModal />
      <SocialAuditModal />
      <DrilldownSheet />
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
