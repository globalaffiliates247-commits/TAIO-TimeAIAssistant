'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { openStickyBoard } from '../features/sticky';
import { getDeviceCalendarDate } from '../core/clock';
import { PROFILES } from '../data/mockData';
import { VERSION_LABEL } from '../core/buildInfo';
import { 
  Clock, 
  Sparkles, 
  User, 
  Volume2, 
  Globe, 
  Calendar, 
  Target,
  Settings,
  Minus,
  Square,
  X as CloseIcon,
  Menu,
  Inbox,
  HelpCircle,
  Activity,
  UploadCloud,
  FolderKanban,
  Wine,
  Sun,
  Moon,
  Bell,
  StickyNote
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    profile, 
    setProfile, 
    currentTab, 
    setCurrentTab, 
    language, 
    setLanguage, 
    toneLevel, 
    setToneLevel,
    deviceLook,
    setSettingsModalOpen,
    inbox,
    setInboxModalOpen,
    setMethodLibraryOpen,
    setExportModalOpen,
    setIsListsModalOpen,
    setIsProfileModalOpen,
    userProfileDetail,
    setIsSwipeModalOpen,
    setIsActiveCaptureOpen,
    palette,
    setPalette,
    currentPaletteColors,
    notifications,
    markAllNotificationsRead,
    triggerNotificationAction,
    isNativePlatform
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isCool = palette === 'cool';
  const isPhoneLook = isNativePlatform || deviceLook === 'phone' || deviceLook === 'auto';

  const toggleBell = () => {
    const next = !bellOpen;
    setBellOpen(next);
    if (next) {
      markAllNotificationsRead();
    }
  };

  const togglePalette = () => {
    setPalette(isCool ? 'warm' : 'cool');
  };

  const renderCoreTabsNav = (isFixedBottom: boolean) => (
    <nav
      style={
        isFixedBottom
          ? { bottom: 0, paddingBottom: 'max(var(--sab, 0px), 8px)' }
          : undefined
      }
      className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center border-t border-slate-200 bg-white ${
        isFixedBottom ? 'fixed left-0 right-0 z-40 shadow-2xl py-1' : ''
      }`}
    >
      {/* PRD FIX v0.3.28 B3.2: Quick Note and Clock fixed at start of desktop navigation */}
      {!isFixedBottom && (
        <div className="flex items-center gap-1.5 mr-3 pr-3 border-r border-slate-200">
          <button
            type="button"
            onClick={() => openStickyBoard(getDeviceCalendarDate())}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF6C2] hover:bg-[#FCEB8E] text-[#6B5E2A] border border-[#F0E3A2] font-bold text-xs shadow-xs transition-all active:scale-95"
            title={language === 'vi' ? 'Ghi nhanh (tờ ghi chú)' : 'Quick Notes'}
          >
            <StickyNote className="w-4 h-4" />
            <span>{language === 'vi' ? 'Ghi nhanh' : 'Quick Note'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).taioAPI?.openClockWindow) {
                (window as any).taioAPI.openClockWindow();
              } else {
                openStickyBoard(getDeviceCalendarDate());
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-xs shadow-xs transition-all active:scale-95 ${
              isCool
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-red-50 hover:bg-red-100 text-[#E0401F] border-red-200'
            }`}
            title={language === 'vi' ? 'Mở đồng hồ nổi (⌥⌘T)' : 'Open Clock (⌥⌘T)'}
          >
            <Clock className="w-4 h-4" />
            <span>{language === 'vi' ? 'Đồng hồ' : 'Clock'}</span>
          </button>
        </div>
      )}

      {/* Tab 1: Now */}
      <button
        onClick={() => setCurrentTab('now')}
        title={language === 'vi' ? 'Đang làm gì, vì mục tiêu nào, việc kế tiếp' : "What I'm doing, for which goal, what's next"}
        className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-bold text-xs sm:text-sm transition-all ${
          currentTab === 'now'
            ? isCool 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
              : 'border-[#E0401F] text-[#E0401F] bg-red-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>{language === 'vi' ? 'Bây giờ (Now)' : 'Now'}</span>
      </button>

      {/* Tab 2: Plan */}
      <button
        onClick={() => setCurrentTab('plan')}
        title={language === 'vi' ? 'Lịch ngày và ma trận ưu tiên' : 'Day timeline and priority matrix'}
        className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-bold text-xs sm:text-sm transition-all ${
          currentTab === 'plan'
            ? isCool 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
              : 'border-[#E0401F] text-[#E0401F] bg-red-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>{language === 'vi' ? 'Kế hoạch (Plan)' : 'Plan'}</span>
      </button>

      {/* PRD FIX v0.3.28 B2: Floating center button on iPhone bottom tab bar */}
      {isFixedBottom && (
        <div className="flex items-center justify-center px-1.5 shrink-0">
          <button
            type="button"
            onClick={() => openStickyBoard(getDeviceCalendarDate())}
            title={language === 'vi' ? 'Ghi nhanh công việc' : 'Quick task note'}
            aria-label="Ghi nhanh"
            className={`w-12 h-12 -mt-5 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white active:scale-90 hover:scale-105 transition-all ${
              isCool ? 'bg-blue-600 shadow-blue-500/30' : 'bg-[#E0401F] shadow-red-500/30'
            }`}
          >
            <StickyNote className="w-5 h-5 fill-white/20" />
          </button>
        </div>
      )}

      {/* Tab 3: Efficiency */}
      <button
        onClick={() => setCurrentTab('achievements')}
        title={language === 'vi' ? 'Thời gian đã đi đâu, việc đã xong, tiến độ dự án' : 'Where your time went, what you finished, project progress'}
        className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-bold text-xs sm:text-sm transition-all ${
          currentTab === 'achievements' || (currentTab as any) === 'efficiency'
            ? isCool 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
              : 'border-[#E0401F] text-[#E0401F] bg-red-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
        }`}
      >
        <Activity className="w-4 h-4" />
        <span>{language === 'vi' ? 'Hiệu quả (Efficiency)' : 'Efficiency'}</span>
      </button>

      {/* Tab 4: Goals / Roadmap */}
      <button
        onClick={() => setCurrentTab('goals')}
        title={language === 'vi' ? 'Mục tiêu lớn và lộ trình đến đích' : 'Big goals and the roadmap to reach them'}
        className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-bold text-xs sm:text-sm transition-all ${
          currentTab === 'goals'
            ? isCool 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
              : 'border-[#E0401F] text-[#E0401F] bg-red-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
        }`}
      >
        <Target className="w-4 h-4" />
        <span>{language === 'vi' ? 'Mục tiêu (Goals)' : 'Goals'}</span>
      </button>
    </nav>
  );

  return (
    <>
    <header 
      style={{ top: 'var(--sat, 0px)', overflowX: 'clip' }}
      className="sticky z-40 transition-colors duration-200 border-b border-slate-200 bg-white shadow-xs w-full max-w-full"
    >
      
      {/* Platform Window Controls (PRD D3 & D5 v0.3.17: Never shown on phone / native shell) */}
      {!isNativePlatform && deviceLook === 'macos' && (
        <div className={`hidden md:flex px-4 py-1.5 items-center justify-between border-b text-[11px] select-none ${
          isCool ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-stone-50 border-stone-200 text-stone-500'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
          </div>
          <span className="font-semibold tracking-wide">TAIO Time App — macOS</span>
          <div className="w-12" />
        </div>
      )}

      {!isNativePlatform && deviceLook === 'windows' && (
        <div className={`hidden md:flex px-3 py-1 items-center justify-between border-b text-[11px] select-none ${
          isCool ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-stone-50 border-stone-200 text-stone-500'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded text-[9px] font-bold text-white flex items-center justify-center ${
              isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
            }`}>T</div>
            <span className="font-medium">TAIO Time App (Windows)</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 hover:text-slate-800 cursor-pointer" />
            <Square className="w-2.5 h-2.5 hover:text-slate-800 cursor-pointer" />
            <CloseIcon className="w-3 h-3 hover:text-red-500 cursor-pointer" />
          </div>
        </div>
      )}

      {/* Top Banner / Brand & Tools */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('now')}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-white shadow-sm transition-all ${
              isCool 
                ? 'bg-blue-600 shadow-blue-500/20' 
                : 'bg-[#E0401F] shadow-red-500/20'
            }`}>
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-slate-900 text-base">TAIO</span>
              </div>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <p className="text-[11px] text-slate-500">TAIO.CLUB Time App</p>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200" title={`Phiên bản ứng dụng: ${VERSION_LABEL}`}>
                  {VERSION_LABEL}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Controls (< md): Quick Palette + Bell + Clean Menu Hamburger */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="px-2 py-1.5 rounded-xl font-bold text-xs border border-slate-200 bg-slate-50 text-slate-700 shadow-xs"
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <span>{language.toUpperCase()}</span>
          </button>

          <button
            onClick={togglePalette}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs border shadow-xs transition-all ${
              isCool
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-red-50 text-[#E0401F] border-red-200'
            }`}
            title="Đổi tông màu Lạnh / Nóng"
          >
            <span>{isCool ? '❄️ Lạnh' : '🔥 Nóng'}</span>
          </button>

          {/* B14 v0.3.11: Bell icon with badge (5 latest notifications) */}
          <button
            onClick={toggleBell}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 relative transition-all"
            aria-label="Thông báo gần đây"
            title="5 thông báo gần nhất"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 relative transition-all"
            aria-label="Mở công cụ"
          >
            {mobileMenuOpen ? <CloseIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {inbox.filter(i => i.status === 'inbox').length > 0 && (
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isCool ? 'bg-blue-600' : 'bg-[#E0401F]'}`} />
            )}
          </button>
        </div>

        {/* Desktop / Tablet Action Controls (>= md): Full Toolbar */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs flex-wrap justify-end">
          {/* Language Switcher (PRD E6 / v0.3.27) */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-xs"
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <span>🌐 {language.toUpperCase()}</span>
          </button>

          {/* Quick Palette Toggle Button */}
          <button
            onClick={togglePalette}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all border shadow-xs ${
              isCool
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-red-50 hover:bg-red-100 text-[#E0401F] border-red-200'
            }`}
            title="Bấm để chuyển nhanh giữa Tông màu Lạnh (Xanh) và Tông màu Nóng (Đỏ)"
          >
            <span>{isCool ? '❄️ Tông Lạnh' : '🔥 Tông Nóng'}</span>
          </button>

          {/* B14 v0.3.11: Bell icon with unread badge */}
          <button
            onClick={toggleBell}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold relative"
            title="5 thông báo gần nhất"
          >
            <Bell className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Data Export for AI Assistant Button (PRD B24) */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Xuất dữ liệu Markdown cho AI Assistant"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất AI</span>
          </button>

          {/* v0.3.26 B34: Sticky quick capture */}
          <button
            onClick={() => openStickyBoard(getDeviceCalendarDate())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF6C2] hover:bg-[#FCEB8E] text-[#6B5E2A] border border-[#F0E3A2] transition-all font-semibold"
            title="Ghi nhanh (tờ ghi chú)"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Ghi nhanh</span>
          </button>

          {/* Inbox Mini App Button (PRD B20) */}
          <button
            onClick={() => setInboxModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold relative"
            title="Rổ công việc (Inbox)"
          >
            <Inbox className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span>Rổ việc</span>
            {inbox.filter(i => i.status === 'inbox').length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}>
                {inbox.filter(i => i.status === 'inbox').length}
              </span>
            )}
          </button>

          {/* Lists Mini App Button (PRD B26) */}
          <button
            onClick={() => setIsListsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Danh sách Ý tưởng, Dự án, Checklist"
          >
            <FolderKanban className="w-3.5 h-3.5 text-sky-600" />
            <span>Danh sách</span>
          </button>

          {/* Swipe Review Backlog Button (PRD B28) */}
          <button
            onClick={() => setIsSwipeModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-200 transition-all font-semibold"
            title="Quẹt thẻ nhiệm vụ"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quẹt thẻ nhiệm vụ</span>
          </button>

          {/* Active Capture & Backfill (PRD B30) */}
          <button
            onClick={() => setIsActiveCaptureOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Thu thập chủ động & Ghi bù"
          >
            <Clock className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span>Ghi bù</span>
          </button>

          {/* Tone of Voice Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={toneLevel}
              onChange={(e) => setToneLevel(e.target.value === 'auto' ? 'auto' : Number(e.target.value) as any)}
              className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value={1}>Giọng: Nhẹ nhàng (Lv1)</option>
              <option value={2}>Giọng: Rõ ràng (Lv2)</option>
              <option value={3}>Giọng: Dứt khoát (Lv3)</option>
              <option value="auto">Giọng: Tự thích ứng (AI)</option>
            </select>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1">
            <User className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <select
              value={profile.type}
              onChange={(e) => {
                const targetKey = e.target.value;
                if (PROFILES[targetKey]) {
                  setProfile(PROFILES[targetKey]);
                }
              }}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer max-w-[110px] truncate"
            >
              {Object.values(PROFILES).map((p) => (
                <option key={p.type} value={p.type}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Appearance Settings Gear Icon (PRD B17) */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            title="Cài đặt giao diện & nền tảng"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Giao diện</span>
          </button>

          {/* Profile & Community Button (PRD B27) */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white font-semibold transition-all shadow-xs ${
              isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
            }`}
            title="Hồ sơ cá nhân"
          >
            <div className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[9px] font-black">
              {userProfileDetail.displayName.charAt(0) || 'U'}
            </div>
            <span>Cá nhân</span>
          </button>
        </div>
      </div>

      {/* B14 v0.3.11: Bell Dropdown — 5 Most Recent Notifications (closes with × or tap outside) */}
      {bellOpen && (
        <>
          <div
            onClick={() => setBellOpen(false)}
            style={{ top: 'var(--sat, 0px)', bottom: 'var(--sab, 0px)' }}
            className="fixed left-0 right-0 z-40 bg-transparent"
            aria-hidden="true"
          />
          <div className="relative z-50 max-w-6xl mx-auto px-3 sm:px-6">
            <div className="mt-1 ml-auto w-full sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                  <span className="text-xs font-bold text-slate-900">5 thông báo gần nhất</span>
                </div>
                <button
                  onClick={() => setBellOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Đóng thông báo"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto overscroll-contain">
                {notifications.slice(0, 5).map((notif) => (
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
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Slide-down Tools Drawer (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <button
              onClick={() => { openStickyBoard(getDeviceCalendarDate()); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFF6C2] border border-[#F0E3A2] font-semibold text-[#6B5E2A]"
            >
              <StickyNote className="w-4 h-4" />
              <span>Ghi nhanh</span>
            </button>
            <button
              onClick={() => { setInboxModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2">
                <Inbox className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                <span>Rổ việc</span>
              </div>
              {inbox.filter(i => i.status === 'inbox').length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${isCool ? 'bg-blue-600' : 'bg-[#E0401F]'}`}>
                  {inbox.filter(i => i.status === 'inbox').length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setIsActiveCaptureOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <Clock className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
              <span>Ghi bù thời gian</span>
            </button>

            <button
              onClick={() => { setIsListsModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <FolderKanban className="w-4 h-4 text-sky-600" />
              <span>Danh sách</span>
            </button>

            <button
              onClick={() => { setIsSwipeModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-amber-700"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quẹt thẻ nhiệm vụ</span>
            </button>

            <button
              onClick={() => { setExportModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Xuất dữ liệu AI</span>
            </button>

            <button
              onClick={() => { setSettingsModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Giao diện & Nền tảng</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {/* Profile Switcher */}
            <div className="flex items-center gap-1.5 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <User className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
              <select
                value={profile.type}
                onChange={(e) => {
                  const targetKey = e.target.value;
                  if (PROFILES[targetKey]) setProfile(PROFILES[targetKey]);
                }}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none w-full"
              >
                {Object.values(PROFILES).map((p) => (
                  <option key={p.type} value={p.type}>{p.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { setIsProfileModalOpen(true); setMobileMenuOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-semibold text-xs shadow-xs ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[9px] font-black">
                {userProfileDetail.displayName.charAt(0) || 'U'}
              </div>
              <span>Cá nhân</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Core Tabs Bar in Header when not in phone bottom-tab mode */}
      {deviceLook !== 'phone' && renderCoreTabsNav(false)}
    </header>
    {deviceLook === 'phone' && renderCoreTabsNav(true)}
    </>
  );
};
