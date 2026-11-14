'use client';

import React from 'react';
import { useApp, AppTab } from '@/context/AppContext';
import { openStickyBoard } from '@/features/sticky';
import { getDeviceCalendarDate } from '@/core/clock';
import { useT } from '@/i18n/useT';
import { BrandMark } from './header/BrandMark';
import { HeaderActions } from './header/HeaderActions';
import { VersionLabel } from './header/VersionLabel';
import { 
  Clock, 
  Calendar, 
  Activity, 
  Target,
  StickyNote
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentTab, 
    setCurrentTab, 
    palette, 
    deviceLook,
    isNativePlatform
  } = useApp();
  const { t } = useT();

  const isCool = palette === 'cool';
  const isPhone = isNativePlatform || deviceLook === 'phone';

  const tabs: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'now', label: t('nav.now', 'Lúc này'), icon: Clock },
    { id: 'plan', label: t('nav.plan', 'Kế hoạch'), icon: Calendar },
    { id: 'achievements', label: t('nav.results', 'Hiệu quả'), icon: Activity },
    { id: 'goals', label: t('nav.goals', 'Mục tiêu'), icon: Target },
  ];

  return (
    <>
      {/* Top Header - Mac strictly 1 row <= 56px (h-14) */}
      <header 
        style={{ top: 'var(--sat, 0px)' }}
        className="sticky z-40 transition-colors duration-200 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs w-full max-w-full h-14 select-none"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand mark */}
          <BrandMark />

          {/* Center on Desktop: Tabs (Order: Brand -> Tabs -> Spacer -> Actions) */}
          {!isPhone && (
            <nav className="flex items-center gap-1 sm:gap-1.5 ml-2 md:ml-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = currentTab === tab.id || (tab.id === 'achievements' && (currentTab as any) === 'efficiency');
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCurrentTab(tab.id)}
                    title={tab.label}
                    className={`h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all ${
                      active
                        ? isCool
                          ? 'bg-blue-50 text-blue-700 shadow-xs'
                          : 'bg-red-50 text-[#E0401F] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {/* C1.6: Below 900pt, tab text collapses into icon with tooltip; stays 1 row */}
                    <span className="hidden min-[900px]:inline whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: Actions */}
          <HeaderActions />
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      {isPhone && (
        <nav
          style={{ bottom: 0, paddingBottom: 'max(var(--sab, 0px), 8px)' }}
          className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-1 flex items-center justify-around px-2"
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id || (tab.id === 'achievements' && (currentTab as any) === 'efficiency');
            return (
              <React.Fragment key={tab.id}>
                {idx === 2 && (
                  /* Floating center Quick Note button on phone */
                  <div className="flex items-center justify-center px-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openStickyBoard(getDeviceCalendarDate())}
                      title={t('terms.quickNote', 'Ghi nhanh')}
                      aria-label="Ghi nhanh"
                      className={`w-11 h-11 -mt-4 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white active:scale-90 transition-all ${
                        isCool ? 'bg-blue-600 shadow-blue-500/30' : 'bg-[#E0401F] shadow-red-500/30'
                      }`}
                    >
                      <StickyNote className="w-5 h-5 fill-white/20" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentTab(tab.id)}
                  title={tab.label}
                  className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-all ${
                    active
                      ? isCool
                        ? 'text-blue-600'
                        : 'text-[#E0401F]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate max-w-[64px]">{tab.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Mac Version Label (Part C1.3: Always visible in bottom-left corner on Mac) */}
      <VersionLabel placement="fixed_mac" />
    </>
  );
};
