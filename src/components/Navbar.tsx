'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { PROFILES } from '../data/mockData';
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
  Inbox,
  HelpCircle,
  Activity,
  UploadCloud,
  FolderKanban,
  Wine,
  Sun,
  Moon
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
    currentPaletteColors
  } = useApp();

  const isCool = palette === 'cool';

  const togglePalette = () => {
    setPalette(isCool ? 'warm' : 'cool');
  };

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b backdrop-blur-xl ${
      isCool 
        ? 'bg-white/95 border-slate-200 shadow-sm' 
        : 'bg-white/95 border-stone-200 shadow-sm'
    }`}>
      
      {/* Platform Window Controls (PRD D3: macOS Traffic lights / Windows Titlebar) */}
      {deviceLook === 'macos' && (
        <div className={`px-4 py-1.5 flex items-center justify-between border-b text-[11px] select-none ${
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

      {deviceLook === 'windows' && (
        <div className={`px-3 py-1 flex items-center justify-between border-b text-[11px] select-none ${
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
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                  isCool 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-red-50 text-[#E0401F] border-red-200'
                }`}>
                  v0.3.9 Approved
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5">TAIO.CLUB Time App</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          
          {/* Quick Palette Toggle Button (Tông Lạnh Cool vs Tông Nóng Warm) */}
          <button
            onClick={togglePalette}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all border shadow-xs ${
              isCool
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-red-50 hover:bg-red-100 text-[#E0401F] border-red-200'
            }`}
            title="Bấm để chuyển nhanh giữa Tông màu Lạnh (Xanh) và Tông màu Nóng (Đỏ)"
          >
            <span>{isCool ? '❄️ Tông Lạnh' : '🔥 Tông Nóng'}</span>
          </button>

          {/* Data Export for AI Assistant Button (PRD B24) */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Xuất dữ liệu Markdown cho AI Assistant (B24)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Xuất AI</span>
          </button>

          {/* Inbox Mini App Button (PRD B20) */}
          <button
            onClick={() => setInboxModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold relative"
            title="Rổ công việc (Inbox - GTD B20)"
          >
            <Inbox className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span className="hidden sm:inline">Rổ việc</span>
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
            title="Danh sách Ý tưởng, Dự án, Checklist (B26)"
          >
            <FolderKanban className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>

          {/* Swipe Review Backlog Button (PRD B28 Thẻ nhắc việc) */}
          <button
            onClick={() => setIsSwipeModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-200 transition-all font-semibold"
            title="Thẻ nhắc việc: Lướt rổ tồn đọng (B28)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Lướt rổ</span>
          </button>

          {/* Active Capture & Backfill (PRD B30) */}
          <button
            onClick={() => setIsActiveCaptureOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Thu thập chủ động & Ghi bù (B30)"
          >
            <Clock className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span className="hidden sm:inline">Ghi bù</span>
          </button>

          {/* Tone of Voice Selector (PRD B13) */}
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
            title="Cài đặt giao diện & nền tảng (macOS, Windows, Phone, Bảng màu)"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline font-medium">Giao diện</span>
          </button>

          {/* Profile & Community Button (PRD B27 "Cá nhân / Me") */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white font-semibold transition-all shadow-xs ${
              isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
            }`}
            title="Hồ sơ, Cá nhân hóa & Kết nối TAIO (B27)"
          >
            <div className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[9px] font-black">
              {userProfileDetail.displayName.charAt(0) || 'U'}
            </div>
            <span>Cá nhân</span>
          </button>
        </div>
      </div>

      {/* 4 Core Tabs Bar with Native App Store Style */}
      <nav className={`max-w-6xl mx-auto px-4 sm:px-6 flex border-t ${
        isCool ? 'border-slate-200 bg-slate-50/70' : 'border-stone-200 bg-stone-50/70'
      } ${deviceLook === 'phone' ? 'fixed bottom-0 left-0 right-0 z-50 shadow-2xl py-1' : ''}`}>
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
    </header>
  );
};
