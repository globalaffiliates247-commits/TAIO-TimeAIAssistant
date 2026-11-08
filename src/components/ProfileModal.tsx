'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  User, 
  Settings, 
  MessageSquare, 
  Users, 
  Wand2, 
  Shield, 
  ExternalLink, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  Volume2, 
  FileText, 
  Sparkles,
  Check,
  Smartphone,
  Laptop,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PROFILES } from '../data/mockData';
import { DeviceLook, ThemeMode, ColorPalette, ToneLevel } from '../types';
import { DataImportSection } from '../features/data-transfer';
import { AlarmSettingsSection } from '../features/alarm';

export const ProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    setIsProfileModalOpen,
    userProfileDetail,
    updateUserProfileDetail,
    profile,
    setProfile,
    deviceLook,
    setDeviceLook,
    themeMode,
    setThemeMode,
    palette,
    setPalette,
    toneLevel,
    setToneLevel,
    communityConfig,
    setExportModalOpen,
    resetAllUserData,
    importTaioData,
    exportTaioJsonV1,
    alarmSettings,
    setAlarmSettings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'community'>('profile');
  // B27 v0.3.12: Delete all data confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteServerCopy, setDeleteServerCopy] = useState(false);

  if (!isProfileModalOpen) return null;

  const initials = userProfileDetail.displayName
    ? userProfileDetail.displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  const illustratedAvatars = [
    { id: 'avatar-1', label: 'Doanh nhân', bg: 'from-amber-500 to-red-500' },
    { id: 'avatar-2', label: 'Sáng tạo', bg: 'from-purple-500 to-indigo-500' },
    { id: 'avatar-3', label: 'Kỹ thuật', bg: 'from-sky-500 to-teal-500' },
    { id: 'avatar-4', label: 'Năng động', bg: 'from-emerald-500 to-lime-500' },
  ];

  return (
    <div className="fixed app-overlay-safe z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E0401F] to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-red-500/25">
              {initials}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Cá nhân & Cài đặt</h2>
              <p className="text-xs text-slate-500">
                {userProfileDetail.salutation} {userProfileDetail.displayName} • {profile.title}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(false)}
            className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Hồ sơ | Cá nhân hóa | Kết nối TAIO */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'profile'
                ? 'border-[#E0401F] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ sơ</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'border-[#E0401F] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cá nhân hóa</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'community'
                ? 'border-[#E0401F] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kết nối TAIO</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: HỒ SƠ (PROFILE) */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Ảnh đại diện (Avatar)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E0401F] to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/20 ring-4 ring-slate-800 shrink-0">
                    {initials}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-500">Chọn phong cách đại diện:</p>
                    <div className="flex items-center gap-2">
                      {illustratedAvatars.map(av => (
                        <button
                          key={av.id}
                          onClick={() => updateUserProfileDetail({ avatarPreset: av.id, avatarType: 'preset' })}
                          className={`w-7 h-7 rounded-full bg-gradient-to-tr ${av.bg} transition-all ring-2 ${
                            userProfileDetail.avatarPreset === av.id ? 'ring-white scale-110' : 'ring-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={av.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Salutation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Xưng hô</label>
                  <select
                    value={userProfileDetail.salutation}
                    onChange={(e) => updateUserProfileDetail({ salutation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#E0401F]"
                  >
                    <option value="Anh">Anh</option>
                    <option value="Chị">Chị</option>
                    <option value="Bạn">Bạn</option>
                    <option value="Em">Em</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên hiển thị</label>
                  <input
                    type="text"
                    value={userProfileDetail.displayName}
                    onChange={(e) => updateUserProfileDetail({ displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#E0401F]"
                  />
                </div>
              </div>

              {/* Profile Group Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Nhóm hồ sơ năng suất (Onboarding Profile)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(PROFILES).map(p => {
                    const isSelected = profile.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setProfile(p)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#E0401F]/15 border-[#E0401F] text-slate-900 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:border-slate-200 hover:text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-800">{p.title}</h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#ff7556]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CÁ NHÂN HÓA (SETTINGS) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Default Home Screen */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Màn hình mở đầu mặc định</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateUserProfileDetail({ defaultHomeScreen: 'inbox' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      userProfileDetail.defaultHomeScreen === 'inbox'
                        ? 'bg-[#E0401F]/15 border-[#E0401F] text-slate-900'
                        : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800">Rổ công việc</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ghi nhanh và xử lý việc chờ</p>
                  </button>
                  <button
                    onClick={() => updateUserProfileDetail({ defaultHomeScreen: 'daycard' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      userProfileDetail.defaultHomeScreen === 'daycard'
                        ? 'bg-[#E0401F]/15 border-[#E0401F] text-slate-900'
                        : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800">Thẻ ngày</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Danh sách việc cần làm hôm nay</p>
                  </button>
                  <button
                    onClick={() => updateUserProfileDetail({ defaultHomeScreen: 'now' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      userProfileDetail.defaultHomeScreen === 'now'
                        ? 'bg-[#E0401F]/15 border-[#E0401F] text-slate-900'
                        : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800">Bây giờ</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Đồng hồ nhiệm vụ hiện tại</p>
                  </button>
                </div>
              </div>

              {/* Appearance: Device & Theme & Palette */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Giao diện thiết bị & Màu sắc</label>
                
                {/* Device style */}
                <div className="grid grid-cols-4 gap-2">
                  {(['auto', 'macos', 'windows', 'phone'] as DeviceLook[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDeviceLook(d)}
                      className={`p-2 rounded-xl border text-center text-xs font-medium transition-all ${
                        deviceLook === d
                          ? 'bg-[#E0401F]/20 border-[#E0401F] text-slate-900'
                          : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {d === 'auto' ? 'Tự động' : d === 'macos' ? 'macOS' : d === 'windows' ? 'Windows' : 'Điện thoại'}
                    </button>
                  ))}
                </div>

                {/* Light / Dark Mode */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      themeMode === 'light' ? 'bg-[#E0401F]/20 border-[#E0401F] text-slate-900' : 'bg-slate-50/60 border-slate-200 text-slate-500'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Sáng (Light)</span>
                  </button>
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      themeMode === 'dark' ? 'bg-[#E0401F]/20 border-[#E0401F] text-slate-900' : 'bg-slate-50/60 border-slate-200 text-slate-500'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Tối (Dark)</span>
                  </button>
                  <button
                    onClick={() => setThemeMode('system')}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      themeMode === 'system' ? 'bg-[#E0401F]/20 border-[#E0401F] text-slate-900' : 'bg-slate-50/60 border-slate-200 text-slate-500'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Hệ thống</span>
                  </button>
                </div>

                {/* Palette */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPalette('warm')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                      palette === 'warm' ? 'bg-[#E0401F]/20 border-[#E0401F] text-slate-900' : 'bg-slate-50/60 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>Gam màu Ấm (Warm Red #E0401F)</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#E0401F]" />
                  </button>
                  <button
                    onClick={() => setPalette('cool')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                      palette === 'cool' ? 'bg-sky-500/20 border-sky-500 text-slate-900' : 'bg-slate-50/60 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>Gam màu Mát (Cool Blue #007aff)</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#007aff]" />
                  </button>
                </div>
              </div>

              {/* Tone of Voice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Tông giọng nhắc nhở (Adaptive Tone)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { lvl: 1, label: 'Dịu dàng (Gentle)' },
                    { lvl: 2, label: 'Rõ ràng (Clear)' },
                    { lvl: 3, label: 'Quyết liệt (Firm)' },
                  ].map(t => (
                    <button
                      key={t.lvl}
                      onClick={() => setToneLevel(t.lvl as ToneLevel)}
                      className={`p-2 rounded-xl border text-center text-xs font-medium transition-all ${
                        toneLevel === t.lvl
                          ? 'bg-[#E0401F]/20 border-[#E0401F] text-slate-900'
                          : 'bg-slate-50/60 border-slate-200 text-slate-500'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRD v0.3.22 B32: Block-Start Alarm Settings */}
              <div className="pt-2 border-t border-slate-200/80">
                <AlarmSettingsSection
                  settings={alarmSettings}
                  onSettingsChange={setAlarmSettings}
                />
              </div>

              {/* Data Export & Privacy */}
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Xuất dữ liệu cho Trợ lý AI</h4>
                    <p className="text-[11px] text-slate-500">Tạo bản snapshot Markdown cho Claude, ChatGPT</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileModalOpen(false); setExportModalOpen(true); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-colors"
                  >
                    Mở trung tâm Xuất AI
                  </button>
                </div>

                {/* Opt-out of analytics */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">Từ chối ghi nhận thống kê ẩn danh</h4>
                    <p className="text-[11px] text-slate-500">Tắt theo dõi thời gian dừng màn hình (Screen Dwell)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userProfileDetail.analyticsOptOut}
                    onChange={(e) => updateUserProfileDetail({ analyticsOptOut: e.target.checked })}
                    className="w-4 h-4 rounded text-[#E0401F] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KẾT NỐI TAIO (COMMUNITY & REMOTE CONFIG) */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              
              {/* Talk to Advisor (CTA Zalo / Telegram) */}
              {communityConfig.advisor.visible && (
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#E0401F]/15 via-white to-white border border-[#E0401F]/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E0401F] flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{communityConfig.advisor.name}</h4>
                      <p className="text-xs font-medium text-[#ff7556]">{communityConfig.advisor.title}</p>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {communityConfig.advisor.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={communityConfig.advisor.zaloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                    >
                      <span>Nhắn qua Zalo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={communityConfig.advisor.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/20"
                    >
                      <span>Nhắn qua Telegram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Join Community Groups */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Tham gia cộng đồng TAIO
                </h4>
                <div className="space-y-2">
                  {communityConfig.communityGroups.filter(g => g.visible).map(grp => (
                    <div
                      key={grp.id}
                      className="p-3.5 rounded-xl border bg-slate-50/60 border-slate-200 flex items-center justify-between gap-3 hover:border-slate-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">{grp.name}</h5>
                          {grp.membersCount && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              {grp.membersCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{grp.description}</p>
                      </div>
                      <a
                        href={grp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#ff7556] hover:text-slate-900 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <span>Tham gia</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free AI Tools */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Công cụ AI miễn phí của TAIO
                </h4>
                <div className="space-y-2">
                  {communityConfig.freeTools.filter(t => t.visible).map(tool => (
                    <div
                      key={tool.id}
                      className="p-3 rounded-xl border bg-slate-50/40 border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#ff7556] shrink-0">
                          <Wand2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{tool.name}</h5>
                          <p className="text-[11px] text-slate-500 truncate">{tool.oneLineUse}</p>
                        </div>
                      </div>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors shrink-0"
                        title="Mở công cụ"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B24 v0.3.20 & B27 v0.3.12: Section "Dữ liệu" — "Nhập dữ liệu", followed by "Xóa toàn bộ dữ liệu…" as the last item */}
          <div className="pt-5 mt-6 border-t border-slate-200 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dữ liệu
            </h4>

            <DataImportSection
              onImport={importTaioData}
              onExportJson={exportTaioJsonV1}
            />

            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50/60 border border-red-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">Xóa dữ liệu cá nhân & Đặt lại từ đầu</p>
                  <p className="text-[11px] text-slate-600">
                    Xóa toàn bộ dữ liệu trên thiết bị này và quay lại màn hình thiết lập hồ sơ ban đầu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setDeleteConfirmText('');
                    setDeleteServerCopy(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-300 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa toàn bộ dữ liệu…</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-300 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                      Xác nhận xóa toàn bộ dữ liệu cá nhân
                    </h5>
                    <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                      Các dữ liệu sẽ bị xóa trên thiết bị này: lịch ngày và kết quả công việc, việc chen ngang, Rổ công việc, Danh sách, Ma trận ưu tiên, Thói quen, Thông báo và Cài đặt giao diện. Không thể hoàn tác sau bước này.
                    </p>
                  </div>
                </div>

                {/* Offer Export first */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-700">
                    Bạn có muốn lưu bản sao Markdown trước khi xóa?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setExportModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-bold"
                  >
                    Xuất dữ liệu trước
                  </button>
                </div>

                {/* Optional server deletion checkbox */}
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteServerCopy}
                    onChange={(e) => setDeleteServerCopy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-0"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900">Xóa luôn bản sao trên máy chủ</span>{' '}
                    <span className="text-red-600 font-semibold">(không khôi phục được)</span>
                    <p className="text-slate-500 mt-0.5">
                      Xóa hoàn toàn dữ liệu tài khoản trên máy chủ và bản sao lưu trong vòng 30 ngày.
                    </p>
                  </div>
                </label>

                {/* Type XÓA to enable */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nhập chữ <span className="font-mono font-black text-red-600">XÓA</span> để mở khóa nút xác nhận:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Gõ XÓA tại đây..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'XÓA'}
                    onClick={() => {
                      resetAllUserData(deleteServerCopy);
                      setShowDeleteConfirm(false);
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all ${
                      deleteConfirmText.trim().toUpperCase() === 'XÓA'
                        ? 'bg-red-600 hover:bg-red-700 shadow-sm cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Xác nhận xóa vĩnh viễn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
