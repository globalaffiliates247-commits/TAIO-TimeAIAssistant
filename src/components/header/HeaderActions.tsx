'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { openStickyBoard } from '@/features/sticky';
import { getDeviceCalendarDate } from '@/core/clock';
import { LiveClockStrip } from '@/features/quick-entry/LiveClockStrip';
import { useSyncState } from '@/features/sync/syncStore';
import { useT } from '@/i18n/useT';
import { 
  StickyNote, 
  Bell, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Check, 
  AlertCircle,
  X as CloseIcon 
} from 'lucide-react';

export const HeaderActions: React.FC = () => {
  const { 
    palette, 
    notifications, 
    markAllNotificationsRead, 
    triggerNotificationAction,
    setIsProfileModalOpen,
    userProfileDetail
  } = useApp();
  const { status: syncStatus } = useSyncState();
  const { t } = useT();

  const [bellOpen, setBellOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isCool = palette === 'cool';

  const toggleBell = () => {
    const next = !bellOpen;
    setBellOpen(next);
    if (next) {
      markAllNotificationsRead();
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* 1. Nút Ghi nhanh */}
      <button
        type="button"
        onClick={() => openStickyBoard(getDeviceCalendarDate())}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FFF6C2] hover:bg-[#FCEB8E] text-[#6B5E2A] border border-[#F0E3A2] font-semibold text-xs transition-all active:scale-95 shadow-xs"
        title={t('terms.quickNote', 'Ghi nhanh')}
      >
        <StickyNote className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('terms.quickNote', 'Ghi nhanh')}</span>
      </button>

      {/* 2. Đồng hồ đang chạy */}
      <div className="hidden lg:block max-w-[200px] xl:max-w-[280px]">
        <LiveClockStrip compact={true} />
      </div>

      {/* 3. Dấu đồng bộ */}
      <button
        type="button"
        onClick={() => setIsProfileModalOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all shadow-xs"
        title={
          syncStatus.state === 'syncing'
            ? t('sync.syncing', 'Đang đồng bộ...')
            : syncStatus.state === 'idle'
            ? t('sync.idle', 'Đã đồng bộ')
            : syncStatus.state === 'error'
            ? t('sync.error', 'Lỗi đồng bộ')
            : t('sync.off', 'Đồng bộ thiết bị')
        }
      >
        {syncStatus.state === 'syncing' ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
        ) : syncStatus.state === 'idle' ? (
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
        ) : syncStatus.state === 'error' ? (
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <CloudOff className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* 4. Chuông thông báo */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleBell}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all shadow-xs relative"
          title="Thông báo"
        >
          <Bell className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 px-1 rounded-full text-[9px] font-bold text-white ${
              isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
            }`}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Bell dropdown */}
        {bellOpen && (
          <>
            <div
              onClick={() => setBellOpen(false)}
              className="fixed inset-0 z-40 bg-transparent"
              aria-hidden="true"
            />
            <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                  <span className="text-xs font-bold text-slate-900">Thông báo gần nhất</span>
                </div>
                <button
                  onClick={() => setBellOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label={t('common.close', 'Đóng')}
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto overscroll-contain">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Không có thông báo mới</p>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-2.5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{notif.title}</p>
                        <span className="text-[10px] text-slate-500">{notif.time}</span>
                      </div>
                      <button
                        onClick={() => {
                          triggerNotificationAction(notif);
                          setBellOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white shrink-0 shadow-xs transition-colors ${
                          isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
                        }`}
                      >
                        {notif.ctaLabel}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Cá nhân */}
      <button
        type="button"
        onClick={() => setIsProfileModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white font-semibold text-xs transition-all shadow-xs ${
          isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
        }`}
        title={t('terms.profile', 'Cá nhân')}
      >
        <div className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[9px] font-black">
          {userProfileDetail.displayName.charAt(0) || 'U'}
        </div>
        <span className="hidden sm:inline">{t('terms.profile', 'Cá nhân')}</span>
      </button>
    </div>
  );
};
