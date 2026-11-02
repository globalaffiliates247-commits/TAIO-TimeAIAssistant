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
  Trophy, 
  Target,
  BarChart3,
  Wine,
  Settings,
  Minus,
  Square,
  X as CloseIcon,
  Inbox,
  HelpCircle,
  Activity
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
    setIsOnboarded,
    setSocialAuditModalOpen,
    deviceLook,
    setSettingsModalOpen,
    inbox,
    setInboxModalOpen,
    setMethodLibraryOpen
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      
      {/* Platform Window Controls (PRD D3: macOS Traffic lights / Windows Titlebar) */}
      {deviceLook === 'macos' && (
        <div className="bg-slate-950/90 px-4 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
          </div>
          <span className="font-semibold text-slate-300 tracking-wide">TAIO Time App — macOS</span>
          <div className="w-12" />
        </div>
      )}

      {deviceLook === 'windows' && (
        <div className="bg-slate-950/90 px-3 py-1 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#E0401F] text-[9px] font-bold text-white flex items-center justify-center">T</div>
            <span className="font-medium text-slate-300">TAIO Time App (Windows)</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 hover:text-white cursor-pointer" />
            <Square className="w-2.5 h-2.5 hover:text-white cursor-pointer" />
            <CloseIcon className="w-3 h-3 hover:text-red-400 cursor-pointer" />
          </div>
        </div>
      )}

      {/* Top Banner / Brand & Tools */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('now')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E0401F] to-orange-500 flex items-center justify-center font-extrabold text-white shadow-md shadow-red-500/30">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">TAIO</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  v0.22.0 Approved
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">TAIO.CLUB Time App</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
          
          {/* Inbox Mini App Button (PRD B20) */}
          <button
            onClick={() => setInboxModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all font-semibold relative"
            title="Rổ công việc (Inbox - GTD B20)"
          >
            <Inbox className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Rổ việc</span>
            {inbox.filter(i => i.status === 'inbox').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E0401F] text-white">
                {inbox.filter(i => i.status === 'inbox').length}
              </span>
            )}
          </button>

          {/* Method Library Button (PRD B22) */}
          <button
            onClick={() => setMethodLibraryOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all font-medium"
            title="Thư viện phương pháp khoa học (B22)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Phương pháp</span>
          </button>

          {/* Social Outing Cost Audit Button (PRD B12) */}
          <button
            onClick={() => setSocialAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-medium"
            title="Kiểm toán chi phí giao lưu & ảnh hưởng ngày hôm sau"
          >
            <Wine className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Giao lưu</span>
          </button>

          {/* Tone of Voice Selector (PRD B13) */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2 py-1">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={toneLevel}
              onChange={(e) => setToneLevel(e.target.value === 'auto' ? 'auto' : Number(e.target.value) as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value={1} className="bg-slate-900 text-slate-200">Giọng: Nhẹ nhàng (Lv1)</option>
              <option value={2} className="bg-slate-900 text-slate-200">Giọng: Rõ ràng (Lv2)</option>
              <option value={3} className="bg-slate-900 text-slate-200">Giọng: Dứt khoát (Lv3)</option>
              <option value="auto" className="bg-slate-900 text-slate-200">Giọng: Tự thích ứng (AI)</option>
            </select>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2 py-1">
            <User className="w-3.5 h-3.5 text-red-400" />
            <select
              value={profile.type}
              onChange={(e) => {
                const targetKey = e.target.value;
                if (PROFILES[targetKey]) {
                  setProfile(PROFILES[targetKey]);
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              {Object.values(PROFILES).map((p) => (
                <option key={p.type} value={p.type} className="bg-slate-900 text-slate-200">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Appearance Settings Gear Icon (PRD B17) */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60"
            title="Cài đặt giao diện & nền tảng (macOS, Windows, Phone, Bảng màu)"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline font-medium">Giao diện</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700/60"
            title="Đổi ngôn ngữ (VI / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Admin Back-end Switcher */}
          <button
            onClick={() => setCurrentTab(currentTab === 'admin' ? 'now' : 'admin')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
              currentTab === 'admin'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/25'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
            title="Trang quản trị dành cho Founder / Quản trị viên"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* 4 Core Tabs Bar with Bilingual Tooltips */}
      <nav className={`max-w-6xl mx-auto px-4 sm:px-6 flex border-t border-slate-800/80 ${deviceLook === 'phone' ? 'fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 shadow-2xl py-1.5' : 'bg-slate-950/60'}`}>
        {/* Tab 1: Now */}
        <button
          onClick={() => setCurrentTab('now')}
          title={language === 'vi' ? 'Đang làm gì, vì mục tiêu nào, việc kế tiếp' : "What I'm doing, for which goal, what's next"}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-semibold text-xs sm:text-sm transition-all group ${
            currentTab === 'now'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === 'vi' ? 'Bây giờ (Now)' : 'Now'}</span>
        </button>

        {/* Tab 2: Plan */}
        <button
          onClick={() => setCurrentTab('plan')}
          title={language === 'vi' ? 'Lịch ngày và ma trận ưu tiên' : 'Day timeline and priority matrix'}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-semibold text-xs sm:text-sm transition-all group ${
            currentTab === 'plan'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'vi' ? 'Kế hoạch (Plan)' : 'Plan'}</span>
        </button>

        {/* Tab 3: Efficiency */}
        <button
          onClick={() => setCurrentTab('achievements')}
          title={language === 'vi' ? 'Thời gian đã đi đâu, việc đã xong, tiến độ dự án' : 'Where your time went, what you finished, project progress'}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-semibold text-xs sm:text-sm transition-all group ${
            currentTab === 'achievements' || (currentTab as any) === 'efficiency'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{language === 'vi' ? 'Hiệu quả (Efficiency)' : 'Efficiency'}</span>
        </button>

        {/* Tab 4: Goals / Roadmap */}
        <button
          onClick={() => setCurrentTab('goals')}
          title={language === 'vi' ? 'Mục tiêu lớn và lộ trình đến đích' : 'Big goals and the roadmap to reach them'}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-semibold text-xs sm:text-sm transition-all group ${
            currentTab === 'goals'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{language === 'vi' ? 'Mục tiêu (Goals / Lộ trình)' : 'Goals / Roadmap'}</span>
        </button>
      </nav>
    </header>
  );
};
