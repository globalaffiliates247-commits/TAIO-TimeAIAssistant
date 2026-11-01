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
  const { currentTab, celebrationMsg, setCelebrationMsg, deviceLook, themeMode } = useApp();

  const isLight = themeMode === 'light';
  const containerClasses = `min-h-screen flex flex-col transition-colors duration-200 ${
    isLight ? 'bg-[#f8f9fa] text-[#1a1f2c]' : 'bg-[#090b10] text-[#f3f4f6]'
  } ${deviceLook === 'phone' ? 'pb-20' : ''}`;

  return (
    <div className={containerClasses}>
      {/* Ambient Progress Edge (PRD D3: 4px peripheral awareness line at the top) */}
      <AmbientProgressEdge />

      <Navbar />
      <ActionNudgeBanner />

      {/* Floating Celebration Toast */}
      {celebrationMsg && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-red-950/90 border border-[#E0401F]/50 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{celebrationMsg}</p>
          </div>
          <button 
            onClick={() => setCelebrationMsg(null)}
            className="text-red-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {currentTab === 'now' && <NowTab />}
        {currentTab === 'plan' && <PlanTab />}
        {currentTab === 'achievements' && <AchievementsTab />}
        {currentTab === 'goals' && <GoalsTab />}
        {currentTab === 'admin' && <AdminPortal />}
      </main>

      {/* Bottom Footer info */}
      <footer className="border-t border-gray-900 py-4 text-center text-xs text-gray-500">
        TAIO Time App • Bản thử nghiệm MVP v0.16 • Thương hiệu TAIO (TAIO.CLUB)
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
