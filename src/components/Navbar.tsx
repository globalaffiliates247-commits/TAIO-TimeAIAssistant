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
  X as CloseIcon
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
    setSettingsModalOpen
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur border-b border-gray-800">
      
      {/* Platform Window Controls (PRD D3: macOS Traffic lights / Windows Titlebar) */}
      {deviceLook === 'macos' && (
        <div className="bg-[#090b10] px-4 py-1.5 flex items-center justify-between border-b border-gray-800/80 text-[11px] text-gray-400 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
          </div>
          <span className="font-semibold text-gray-300">TAIO Time App — macOS</span>
          <div className="w-12" />
        </div>
      )}

      {deviceLook === 'windows' && (
        <div className="bg-[#090b10] px-3 py-1 flex items-center justify-between border-b border-gray-800 text-[11px] text-gray-400 select-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#E0401F] text-[9px] font-bold text-white flex items-center justify-center">T</div>
            <span className="font-medium text-gray-300">TAIO Time App (Windows)</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 hover:text-white cursor-pointer" />
            <Square className="w-2.5 h-2.5 hover:text-white cursor-pointer" />
            <CloseIcon className="w-3 h-3 hover:text-red-400 cursor-pointer" />
          </div>
        </div>
      )}

      {/* Top Banner / Brand & Tools */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('now')}>
            <div className="w-8 h-8 rounded-lg bg-[#E0401F] flex items-center justify-center font-bold text-white shadow-md shadow-red-950/40">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">TAIO</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/40">
                  MVP v0.16
                </span>
              </div>
              <p className="text-[11px] text-gray-400 -mt-0.5">TAIO.CLUB Time App</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          
          {/* Social Outing Cost Audit Button (PRD B12) */}
          <button
            onClick={() => setSocialAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            title="Kiểm toán chi phí giao lưu & ảnh hưởng ngày hôm sau"
          >
            <Wine className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-medium">Chi phí giao lưu</span>
          </button>

          {/* Tone of Voice Selector (PRD B13) */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            <Volume2 className="w-3.5 h-3.5 text-gray-400 ml-1" />
            <select
              value={toneLevel}
              onChange={(e) => setToneLevel(e.target.value === 'auto' ? 'auto' : Number(e.target.value) as any)}
              className="bg-transparent text-gray-300 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value={1} className="bg-gray-900">Giọng: Nhẹ nhàng (Lv1)</option>
              <option value={2} className="bg-gray-900">Giọng: Rõ ràng (Lv2)</option>
              <option value={3} className="bg-gray-900">Giọng: Dứt khoát (Lv3)</option>
              <option value="auto" className="bg-gray-900">Giọng: Tự thích ứng (AI)</option>
            </select>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            <User className="w-3.5 h-3.5 text-[#E0401F] ml-1" />
            <select
              value={profile.type}
              onChange={(e) => {
                const targetKey = e.target.value;
                if (PROFILES[targetKey]) {
                  setProfile(PROFILES[targetKey]);
                }
              }}
              className="bg-transparent text-gray-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              {Object.values(PROFILES).map((p) => (
                <option key={p.type} value={p.type} className="bg-gray-900 text-gray-200">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Appearance Settings Gear Icon (PRD B17) */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700/60"
            title="Cài đặt giao diện & nền tảng (macOS, Windows, Phone, Bảng màu)"
          >
            <Settings className="w-3.5 h-3.5 text-gray-300" />
            <span className="hidden sm:inline font-medium">Giao diện</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
            title="Đổi ngôn ngữ (VI / EN)"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Admin Back-end Switcher */}
          <button
            onClick={() => setCurrentTab(currentTab === 'admin' ? 'now' : 'admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              currentTab === 'admin'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title="Trang quản trị dành cho Founder / Quản trị viên"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* 4 Core Tabs Bar with Bilingual Tooltips (PRD v0.15 B4) */}
      <nav className={`max-w-6xl mx-auto px-4 flex border-t border-gray-800/80 ${deviceLook === 'phone' ? 'fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-gray-800 shadow-2xl py-1' : 'bg-gray-950/60'}`}>
        {/* Tab 1: Now */}
        <button
          onClick={() => setCurrentTab('now')}
          title={language === 'vi' ? 'Đang làm gì, vì mục tiêu nào, việc kế tiếp' : "What I'm doing, for which goal, what's next"}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-medium text-xs sm:text-sm transition-all group ${
            currentTab === 'now'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-950/20'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === 'vi' ? 'Bây giờ (Now)' : 'Now'}</span>
        </button>

        {/* Tab 2: Plan */}
        <button
          onClick={() => setCurrentTab('plan')}
          title={language === 'vi' ? 'Lịch ngày và ma trận ưu tiên' : 'Day timeline and priority matrix'}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-medium text-xs sm:text-sm transition-all group ${
            currentTab === 'plan'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-950/20'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'vi' ? 'Kế hoạch (Plan)' : 'Plan'}</span>
        </button>

        {/* Tab 3: Achievements */}
        <button
          onClick={() => setCurrentTab('achievements')}
          title={language === 'vi' ? 'Việc đã xong hôm nay và thói quen của bạn' : 'What you finished today and your habits'}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-medium text-xs sm:text-sm transition-all group ${
            currentTab === 'achievements'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-950/20'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>{language === 'vi' ? 'Thành tựu (Achievements)' : 'Achievements'}</span>
        </button>

        {/* Tab 4: Goals / Roadmap */}
        <button
          onClick={() => setCurrentTab('goals')}
          title={language === 'vi' ? 'Mục tiêu lớn và lộ trình đến đích' : 'Big goals and the roadmap to reach them'}
          className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-b-2 font-medium text-xs sm:text-sm transition-all group ${
            currentTab === 'goals'
              ? 'border-[#E0401F] text-[#E0401F] bg-red-950/20'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{language === 'vi' ? 'Mục tiêu (Goals / Lộ trình)' : 'Goals / Roadmap'}</span>
        </button>
      </nav>
    </header>
  );
};
