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
  AlertTriangle,
  Clock,
  Footprints,
  Briefcase,
  Code,
  TrendingUp,
  Compass,
  Target,
  Calendar,
  Hourglass,
  Zap,
  Droplets,
  Minimize2,
  Inbox,
  Smile,
  Camera
} from 'lucide-react';
import { useT } from '@/i18n/useT';
import { MASCOTS, MascotIcon } from '@/features/profile';
import { isIOSCalendarConnected, setIOSCalendarConnected, requestIOSCalendarAccess } from '@/features/events/service/calendarSync';
import { isGoalSuggestionInlineChipEnabled, setGoalSuggestionInlineChipEnabled, getAreaDefinitionForRole } from '@/features/goals';
import { startNativeLiveActivity, stopNativeLiveActivity, openNativeAppSettings } from '../features/native';
import { isMotionTrackingEnabled, setMotionTrackingEnabled, getMotionCapability } from '@/features/motion';
import { PROFILES } from '../data/mockData';
import { DeviceLook, ThemeMode, ColorPalette, ToneLevel, isCoolPalette } from '../types';
import { DataSettingsPanel } from '../features/profile/DataSettingsPanel';
import { AlarmSettingsSection } from '../features/alarm';
import { MotivationSettingsSection } from '@/features/motivation';
import { HighlightSettings } from '@/features/prefs';
import { VersionLabel } from '@/components/header/VersionLabel';
import { getAppUsageSettings, setAppUsageSettings, clearAllAppUsage, type AppUsageSettings } from '@/features/app-usage';
import { ScreenTimeSettingsSection } from '@/features/screentime';

export const ProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    setIsProfileModalOpen,
    userProfileDetail,
    updateUserProfileDetail,
    profile,
    setProfile,
    language,
    setLanguage,
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
    isNativePlatform,
    showToast,
    scheduleBlocks,
    goals,
    remainingSampleGoals,
    deleteGoal,
    clearSeededSampleData,
    hasSeededData,
    customAreaNames,
    updateCustomAreaNames,
    resetCustomAreaNames,
  } = useApp();

  const { t } = useT('settings');
  const isCool = isCoolPalette(palette);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [lockScreenClockEnabled, setLockScreenClockEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('taio_lockscreen_clock_enabled');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [motionTrackingState, setMotionTrackingState] = useState<boolean>(() => isMotionTrackingEnabled());
  const [motionAuthStatus, setMotionAuthStatus] = useState<string>('unknown');
  const [iosCalConnected, setIosCalConnected] = useState<boolean>(() => isIOSCalendarConnected());
  const [appUsageSettings, setAppUsageSettingsState] = useState<AppUsageSettings>(() => getAppUsageSettings());

  const handleToggleAppUsage = () => {
    const next = !appUsageSettings.enabled;
    setAppUsageSettings({ enabled: next });
    setAppUsageSettingsState(prev => ({ ...prev, enabled: next }));
  };

  const handleClearAppUsage = () => {
    if (confirm(t('settings.clearTelemetryConfirm', 'Xoá toàn bộ dữ liệu đo lường ứng dụng đã ghi trên máy này?'))) {
      clearAllAppUsage();
      showToast(t('settings.clearTelemetrySuccess', 'Đã xoá toàn bộ dữ liệu máy đo'));
    }
  };

  const handleToggleIOSCalendar = async () => {
    if (iosCalConnected) {
      setIOSCalendarConnected(false);
      setIosCalConnected(false);
      showToast(t('settings.calendarDisconnected', 'Đã ngắt kết nối lịch iPhone'));
    } else {
      const res = await requestIOSCalendarAccess();
      if (res.granted) {
        setIosCalConnected(true);
        showToast(t('settings.calendarConnectedSuccess', 'Đã kết nối lịch iPhone thành công'));
      } else {
        alert(res.error || t('settings.calendarPermissionDenied', 'Chưa được cấp quyền truy cập Lịch'));
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 512);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateUserProfileDetail({ avatarType: 'photo', customPhotoUrl: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateUserProfileDetail({ avatarType: 'initials', customPhotoUrl: '' });
  };

  React.useEffect(() => {
    if (isNativePlatform) {
      getMotionCapability().then(cap => {
        setMotionAuthStatus(cap.authorizationStatus);
      });
    }
  }, [isNativePlatform]);

  const handleToggleLockScreenClock = async () => {
    const next = !lockScreenClockEnabled;
    if (!next) {
      setLockScreenClockEnabled(false);
      try { window.localStorage.setItem('taio_lockscreen_clock_enabled', 'false'); } catch {}
      await stopNativeLiveActivity();
      showToast('Đã tắt đồng hồ trên màn hình khóa');
      return;
    }

    try { window.localStorage.setItem('taio_lockscreen_clock_enabled', 'true'); } catch {}
    setLockScreenClockEnabled(true);

    if (isNativePlatform) {
      const inProgress = scheduleBlocks.find(b => b.status === 'in_progress');
      if (inProgress) {
        const linkedGoal = goals.find(g => g.id === inProgress.goalId);
        const res = await startNativeLiveActivity({
          blockId: inProgress.id,
          taskTitle: inProgress.title,
          goalName: linkedGoal?.name || inProgress.goalName || 'Mục tiêu chính',
          isCountDown: true,
          totalMinutes: inProgress.estimatedMinutes || 60,
          remainingMinutes: 30,
        });
        if (!res.ok) {
          // Reflect real result, not intention (spec D2.5)
          setLockScreenClockEnabled(false);
          try { window.localStorage.setItem('taio_lockscreen_clock_enabled', 'false'); } catch {}
          if (res.error === 'live_activity_disabled_by_user') {
            showToast(
              'Hoạt động trực tiếp đã bị tắt trong Cài đặt iPhone',
              () => { openNativeAppSettings(); },
              'error',
              'Mở Cài đặt'
            );
          } else {
            showToast(res.message || res.error || 'Không thể bật đồng hồ màn hình khóa', undefined, 'error');
          }
          return;
        }
      }
      showToast('Đồng hồ màn hình khóa đã được bật');
    }
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'community'>('profile');
  const [inlineGoalSuggestionEnabled, setInlineGoalSuggestionEnabled] = useState(isGoalSuggestionInlineChipEnabled);
  const [autoMinimizeOnClock, setAutoMinimizeOnClock] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = window.localStorage.getItem('taio_auto_minimize_clock');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleAutoMinimizeOnClock = () => {
    const next = !autoMinimizeOnClock;
    setAutoMinimizeOnClock(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('taio_auto_minimize_clock', String(next));
        (window as any).taioAPI?.setAutoMinimizeClock(next);
      } catch {}
    }
  };

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
  const activeAvatarBg = illustratedAvatars.find(a => a.id === userProfileDetail.avatarPreset)?.bg || 'from-[var(--taio-brand)] to-amber-500';

  return (
    <div className="fixed app-overlay-safe z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${activeAvatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/80 overflow-hidden shrink-0`}>
              {userProfileDetail.customPhotoUrl ? (
                <img src={userProfileDetail.customPhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : userProfileDetail.avatarMascot ? (
                <MascotIcon id={userProfileDetail.avatarMascot} size={18} />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {t('settings.profileTitle', 'Cá nhân & Cài đặt')}
              </h2>
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
                ? 'border-[var(--taio-brand)] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('settings.tabProfile', 'Hồ sơ')}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'border-[var(--taio-brand)] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t('settings.tabSettings', 'Cá nhân hóa')}</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'community'
                ? 'border-[var(--taio-brand)] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('settings.tabCommunity', 'Kết nối TAIO')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: HỒ SƠ (PROFILE) */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Avatar Selector (PRD v0.3.54 Part J: Photo upload & 5 Mascots, no 5-color dot picker) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t('settings.avatarLabel', 'Ảnh đại diện')}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${activeAvatarBg} flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-slate-100 shrink-0 overflow-hidden`}>
                    {userProfileDetail.customPhotoUrl ? (
                      <img src={userProfileDetail.customPhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : userProfileDetail.avatarMascot ? (
                      <MascotIcon id={userProfileDetail.avatarMascot} size={32} />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={13} />
                        <span>{t('settings.avatarUpload', 'Tải ảnh')}</span>
                      </button>
                      {userProfileDetail.customPhotoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {t('settings.avatarRemove', 'Gỡ ảnh')}
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {t('settings.avatarPrivacy', 'Ảnh chỉ lưu trên máy này')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500">
                        {t('settings.avatarMascots', 'Bộ linh vật')}:
                      </p>
                      <div className="flex items-center gap-2">
                        {MASCOTS.map(m => {
                          const isSelected = userProfileDetail.avatarType === 'mascot' && userProfileDetail.avatarMascot === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => updateUserProfileDetail({ avatarType: 'mascot', avatarMascot: m.id, customPhotoUrl: '' })}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)] ring-2 ring-[var(--taio-brand)] ring-offset-2 ring-offset-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                              title={t(m.i18nKey, m.nameVi)}
                            >
                              <MascotIcon id={m.id} size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Salutation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('settings.salutation', 'Xưng hô')}
                  </label>
                  <select
                    value={userProfileDetail.salutation}
                    onChange={(e) => updateUserProfileDetail({ salutation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--taio-brand)]"
                  >
                    <option value="Anh">Anh</option>
                    <option value="Chị">Chị</option>
                    <option value="Bạn">Bạn</option>
                    <option value="Em">Em</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('settings.displayName', 'Tên hiển thị')}
                  </label>
                  <input
                    type="text"
                    value={userProfileDetail.displayName}
                    onChange={(e) => updateUserProfileDetail({ displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--taio-brand)]"
                  />
                </div>
              </div>

              {/* Profile Group Selector (Part G3: 3x2 grid of 6 clean icon tiles) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t('settings.productivityProfile', 'Nhóm hồ sơ năng suất')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'owner', key: 'settings.profileOwner', fallback: 'Chủ DN', icon: Briefcase },
                    { id: 'manager', key: 'settings.profileManager', fallback: 'Quản lý', icon: Users },
                    { id: 'technical', key: 'settings.profileTechnical', fallback: 'Kỹ thuật', icon: Code },
                    { id: 'admin', key: 'settings.profileAdmin', fallback: 'Văn phòng', icon: FileText },
                    { id: 'trade', key: 'settings.profileTrade', fallback: 'Bán hàng', icon: TrendingUp },
                    { id: 'freelancer', key: 'settings.profileFreelancer', fallback: 'Tự do', icon: Compass },
                  ].map(tile => {
                    const p = PROFILES[tile.id];
                    const isSelected = profile?.id === p?.id || profile?.id === tile.id;
                    const IconComponent = tile.icon;
                    return (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => p && setProfile(p)}
                        className={`aspect-square p-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 border-2 border-slate-700 text-slate-900 shadow-xs'
                            : 'bg-slate-50/70 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`} strokeWidth={1.75} />
                        <span className="text-[11px] font-bold text-center leading-tight truncate w-full">
                          {t(tile.key, tile.fallback)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* 1-line description below grid for selected profile */}
                {profile && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 animate-in fade-in">
                    <span className="font-bold text-slate-800">{profile.title}:</span>{' '}
                    <span>{profile.description}</span>
                  </div>
                )}
              </div>

              {/* Account Section (PRD v0.3.39 Part D: Bỏ lời nhắc xác thực, chỉ có nút tự bấm) */}
              <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t('settings.account', 'Tài khoản')}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('settings.accountDesc', 'Tài khoản trên thiết bị này. Chưa xác thực thì dữ liệu lưu cục bộ.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert(t('settings.accountNotice', 'Tính năng xác thực tài khoản sẽ sẵn sàng trong đợt cập nhật tiếp theo.'));
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200/80 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    {t('settings.verifyAccount', 'Xác thực tài khoản')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CÁ NHÂN HÓA (SETTINGS) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Default Home Screen */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t('settings.startScreen', 'Màn hình mở đầu mặc định')}
                </label>
                <div className="bg-slate-100/90 p-1 rounded-2xl flex flex-col sm:flex-row gap-1">
                  {[
                    { id: 'inbox', label: t('settings.startScreenInbox', 'Rổ công việc'), desc: t('settings.startScreenInboxDesc', 'Ghi nhanh & việc chờ'), icon: Inbox },
                    { id: 'daycard', label: t('settings.startScreenDaycard', 'Thẻ ngày'), desc: t('settings.startScreenDaycardDesc', 'Danh sách việc hôm nay'), icon: Calendar },
                    { id: 'now', label: t('settings.startScreenNow', 'Bây giờ'), desc: t('settings.startScreenNowDesc', 'Đồng hồ nhiệm vụ'), icon: Clock },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = userProfileDetail.defaultHomeScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateUserProfileDetail({ defaultHomeScreen: item.id as any })}
                        className={`flex-1 p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-medium'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)]' 
                            : 'bg-slate-200/70 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{item.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appearance: Device & Theme & Palette */}
              <div className="space-y-4">
                {/* Device style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t('settings.deviceLook', 'Giao diện thiết bị')}
                  </label>
                  <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1">
                    {[
                      { id: 'auto', label: t('settings.deviceAuto', 'Tự động'), icon: Sparkles },
                      { id: 'macos', label: 'macOS', icon: Laptop },
                      { id: 'windows', label: 'Windows', icon: Monitor },
                      { id: 'phone', label: t('settings.devicePhone', 'Điện thoại'), icon: Smartphone },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = deviceLook === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDeviceLook(item.id as DeviceLook)}
                          className={`flex-1 py-2 px-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all ${
                            isSelected
                              ? 'bg-white text-[var(--taio-brand)] shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-medium'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Light / Dark Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t('settings.displayMode', 'Chế độ hiển thị')}
                  </label>
                  <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1">
                    {[
                      { id: 'light', label: t('settings.modeLight', 'Sáng'), icon: Sun },
                      { id: 'dark', label: t('settings.modeDark', 'Tối'), icon: Moon },
                      { id: 'system', label: t('settings.modeSystem', 'Hệ thống'), icon: Monitor },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = themeMode === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setThemeMode(item.id as ThemeMode)}
                          className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all ${
                            isSelected
                              ? 'bg-white text-[var(--taio-brand)] shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-medium'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Palette */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t('settings.colorPalette', 'Tông màu chủ đạo')}
                  </label>
                  <div className="bg-slate-100/90 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-1">
                    {[
                      { id: 'red', label: t('settings.paletteRed', 'Đỏ TAIO'), color: '#E11D2E', textColor: '#ffffff', icon: Hourglass },
                      { id: 'gold', label: t('settings.paletteGold', 'Vàng TAIO'), color: '#F7C531', textColor: '#14161A', icon: Sparkles },
                      { id: 'bright-blue', label: t('settings.paletteBrightBlue', 'Xanh sáng'), color: '#0068FF', textColor: '#ffffff', icon: Zap },
                      { id: 'calm-blue', label: t('settings.paletteCalmBlue', 'Xanh dịu'), color: '#1C78C0', textColor: '#ffffff', icon: Droplets },
                    ].map((p) => {
                      const Icon = p.icon;
                      const isSelected = palette === p.id || (p.id === 'red' && palette === 'warm') || (p.id === 'bright-blue' && palette === 'cool');
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPalette(p.id as ColorPalette)}
                          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all ${
                            isSelected
                              ? 'bg-white text-slate-900 shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium'
                          }`}
                        >
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: p.color, color: p.textColor }}
                          >
                            <Icon className="w-3 h-3 stroke-[2.2]" />
                          </div>
                          <span className="truncate">{p.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--taio-brand)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t('settings.language', 'Ngôn ngữ hiển thị')}
                  </label>
                  <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1">
                    {[
                      { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
                      { id: 'en', label: 'English', flag: '🇬🇧' },
                    ].map((l) => {
                      const isSelected = language === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setLanguage(l.id as any)}
                          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all ${
                            isSelected
                              ? 'bg-white text-[var(--taio-brand)] shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-medium'
                          }`}
                        >
                          <span className="text-sm">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PRD v0.3.35 Part C: Highlight Settings & Preview */}
                <HighlightSettings />
              </div>

              {/* Tone of Voice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t('settings.reminderTone', 'Tông giọng nhắc nhở')}
                </label>
                <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1">
                  {[
                    { lvl: 1, label: t('settings.toneGentle', 'Dịu dàng'), icon: Smile },
                    { lvl: 2, label: t('settings.toneClear', 'Rõ ràng'), icon: Bell },
                    { lvl: 3, label: t('settings.toneFirm', 'Quyết liệt'), icon: Zap },
                  ].map((tItem) => {
                    const Icon = tItem.icon;
                    const isSelected = toneLevel === tItem.lvl;
                    return (
                      <button
                        key={tItem.lvl}
                        type="button"
                        onClick={() => setToneLevel(tItem.lvl as ToneLevel)}
                        className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-white text-[var(--taio-brand)] shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-medium'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{tItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRD v0.3.22 B32: Block-Start Alarm Settings */}
              <div className="pt-2 border-t border-slate-200/80">
                <AlarmSettingsSection
                  settings={alarmSettings}
                  onSettingsChange={setAlarmSettings}
                />
              </div>

              {/* PRD FIX v0.3.30 Part E1: Cá nhân -> Ghim đồng hồ & Hướng dẫn Widget */}
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <h4 className="text-xs font-bold text-slate-900">Ghim đồng hồ (Màn hình khóa & Live Activity)</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Luôn hiển thị đồng hồ nền theo 3 trạng thái: có việc, khoảng trống, hoặc giờ hiện tại
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={lockScreenClockEnabled}
                    onClick={handleToggleLockScreenClock}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer ${
                      lockScreenClockEnabled ? 'bg-[var(--taio-brand)]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                        lockScreenClockEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* PRD v0.3.48 Part C2: Tự thu nhỏ màn hình chính khi mở đồng hồ nổi */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Minimize2 className="w-4 h-4 text-[var(--taio-brand)]" />
                      <h4 className="text-xs font-bold text-slate-900">
                        {t('settings.autoMinimizeFloatClock', 'Tự thu nhỏ màn hình chính khi mở đồng hồ nổi')}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {t('settings.autoMinimizeFloatClockDesc', 'Giữ không gian làm việc gọn gàng khi đồng hồ nổi xuất hiện')}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoMinimizeOnClock}
                    onClick={handleToggleAutoMinimizeOnClock}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer ${
                      autoMinimizeOnClock ? 'bg-[var(--taio-brand)]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                        autoMinimizeOnClock ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3-step Widget Guide (spec E1.6) */}
                <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/60 text-xs text-slate-800 space-y-2">
                  <p className="font-bold text-orange-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                    <span>Cách thêm Widget ra màn hình iPhone:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
                    <li>Chạm và giữ vùng trống trên Màn hình chính hoặc Màn hình khóa cho tới khi ứng dụng rung.</li>
                    <li>Chạm nút <strong>+</strong> ở góc trên bên trái, tìm và chọn <strong>TAIO Time</strong>.</li>
                    <li>Chọn kiểu Widget mong muốn và bấm <strong>Thêm tiện ích (Add Widget)</strong>.</li>
                  </ol>
                </div>

                {/* PRD FIX v0.3.30 Part B4: Tự ghi nhận bằng chuyển động */}
                {isNativePlatform && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Footprints className="w-4 h-4 text-orange-500" />
                          <h4 className="text-xs font-bold text-slate-900">Tự ghi nhận bằng chuyển động</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Đếm bước chân và tự động nhận ra các đoạn đi bộ / di chuyển mà bạn quên ghi
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={motionTrackingState}
                        onClick={() => {
                          const next = !motionTrackingState;
                          setMotionTrackingEnabled(next);
                          setMotionTrackingState(next);
                          showToast(next ? 'Đã bật tự ghi nhận chuyển động' : 'Đã tắt và xóa dữ liệu chuyển động thô trên máy');
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none ${
                          motionTrackingState ? 'bg-[var(--taio-brand)]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                            motionTrackingState ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {motionAuthStatus === 'denied' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs">
                        <span className="text-amber-800 text-[11px]">
                          Quyền chuyển động đã bị từ chối trong Cài đặt iPhone.
                        </span>
                        <button
                          type="button"
                          onClick={() => openNativeAppSettings()}
                          className="px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold text-[11px] shrink-0"
                        >
                          Mở Cài đặt
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* PRD FEATURE v0.3.31: Câu truyền động lực */}
                <MotivationSettingsSection />

                {/* PRD v0.3.37 Part C5: Hiện gợi ý mục tiêu ngay trên dòng việc */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-500" />
                        <h4 className="text-xs font-bold text-slate-900">
                          {t('settings.showGoalHints', 'Hiện gợi ý mục tiêu ngay trên dòng việc')}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {t('settings.showGoalHintsDesc', 'Tự động phát hiện và gợi ý gắn mục tiêu khi bạn thêm công việc mới')}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inlineGoalSuggestionEnabled}
                      onClick={() => {
                        const next = !inlineGoalSuggestionEnabled;
                        setGoalSuggestionInlineChipEnabled(next);
                        setInlineGoalSuggestionEnabled(next);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer ${
                        inlineGoalSuggestionEnabled ? 'bg-[var(--taio-brand)]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                          inlineGoalSuggestionEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* PRD v0.3.53 Part B: Family Controls / ScreenTime Module */}
                <ScreenTimeSettingsSection language={language} />

                {/* PRD v0.3.53 Part A6: Đo thời gian thật trên máy (Mac App Telemetry) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {t('settings.macTelemetry', 'Đo lường ứng dụng trên máy')}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {t('settings.macTelemetryDesc', 'Tự động đo thời gian khi bạn chuyển sang ứng dụng khác để đối chiếu kế hoạch.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={appUsageSettings.enabled}
                      onClick={handleToggleAppUsage}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer ${
                        appUsageSettings.enabled ? 'bg-[var(--taio-brand)]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                          appUsageSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {appUsageSettings.enabled && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">
                        {t('settings.localTelemetryData', 'Dữ liệu đo lường cục bộ:')}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAppUsage}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors"
                      >
                        {t('settings.clearTelemetry', 'Xoá toàn bộ dữ liệu máy đo')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Export & Privacy */}
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t('settings.exportAI', 'Xuất dữ liệu cho Trợ lý AI')}</h4>
                    <p className="text-[11px] text-slate-600">{t('settings.exportAIDesc', 'Tạo bản snapshot định dạng văn bản cho các mô hình AI')}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileModalOpen(false); setExportModalOpen(true); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200:bg-slate-600 text-slate-900 text-xs font-semibold transition-colors"
                  >
                    {t('settings.openExportAI', 'Mở trung tâm Xuất AI')}
                  </button>
                </div>

                {/* Opt-out of analytics */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{t('settings.optOutAnalytics', 'Từ chối ghi nhận thống kê ẩn danh')}</h4>
                    <p className="text-[11px] text-slate-600">{t('settings.optOutAnalyticsDesc', 'Tắt theo dõi thời gian dừng màn hình')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userProfileDetail.analyticsOptOut}
                    onChange={(e) => updateUserProfileDetail({ analyticsOptOut: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--taio-brand)] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* PRD Part P4.4: Custom Area Folder Renaming */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">
                      {t('settings.areaFoldersTitle', 'Tên 4 thư mục mục tiêu')}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t('settings.areaFoldersDesc', 'Tự đặt tên cho 4 nhóm. Tên tự đặt sẽ được giữ nguyên khi đổi nghề.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetCustomAreaNames();
                      showToast(t('settings.areaFoldersResetToast', 'Đã khôi phục tên nhóm mặc định theo nghề!'));
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    {t('settings.areaFoldersResetBtn', 'Khôi phục mặc định')}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['Product', 'Business', 'Operations', 'Personal'] as const).map(areaKey => {
                    const defaultDef = getAreaDefinitionForRole(profile?.type);
                    const langKey = (language as 'en' | 'vi') || 'vi';
                    const roleDefault = defaultDef.labels[langKey]?.[areaKey] || defaultDef.labels.vi?.[areaKey] || areaKey;
                    const customVal = customAreaNames[areaKey] || '';
                    const isCustomized = Boolean(customAreaNames[areaKey]?.trim());

                    return (
                      <div key={areaKey} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-400">{areaKey}</span>
                          {isCustomized ? (
                            <span className="text-[10px] text-amber-600 font-medium">
                              {t('settings.areaCustomBadge', 'Tự đặt')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {t('settings.areaDefaultBadge', 'Mặc định nghề')}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={customVal}
                          placeholder={roleDefault}
                          onChange={e => {
                            updateCustomAreaNames({ [areaKey]: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KẾT NỐI TAIO (COMMUNITY & REMOTE CONFIG) */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              
              {/* Talk to Advisor (CTA Zalo / Telegram) */}
              {communityConfig.advisor.visible && (
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-[var(--taio-brand)]/15 via-white to-white border border-[var(--taio-brand)]/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--taio-brand)] flex items-center justify-center text-[var(--taio-on-brand)] font-bold shrink-0 shadow-md taio-btn-primary">
                      <Sparkles className="w-5 h-5 text-[var(--taio-on-brand)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{communityConfig.advisor.name}</h4>
                      <p className="text-xs font-semibold text-[var(--taio-brand)]">{communityConfig.advisor.title}</p>
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
                      style={{ color: 'var(--taio-on-brand)' }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] shadow-sm font-bold text-xs flex items-center justify-center gap-1.5 transition-all taio-btn-primary"
                    >
                      <span style={{ color: 'var(--taio-on-brand)' }}>Nhắn qua Zalo</span>
                      <ExternalLink className="w-3 h-3 opacity-80" style={{ color: 'var(--taio-on-brand)' }} />
                    </a>
                    <a
                      href={communityConfig.advisor.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--taio-on-brand)' }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] shadow-sm font-bold text-xs flex items-center justify-center gap-1.5 transition-all taio-btn-primary"
                    >
                      <span style={{ color: 'var(--taio-on-brand)' }}>Nhắn qua Telegram</span>
                      <ExternalLink className="w-3 h-3 opacity-80" style={{ color: 'var(--taio-on-brand)' }} />
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
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{grp.membersCount.replace(/\s*thành viên/gi, '').trim()}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{grp.description}</p>
                      </div>
                      <a
                        href={grp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[var(--taio-brand)] hover:text-slate-900 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
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
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[var(--taio-brand)] shrink-0">
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

              {/* PRD v0.3.45 Part D2: Kết nối lịch iPhone (EventKit) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[var(--taio-brand)] shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{t('settings.iphoneCalendar', 'Kết nối Lịch iPhone')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          iosCalConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {iosCalConnected ? t('settings.calendarConnected', 'Đã kết nối') : t('settings.calendarNotConnected', 'Chưa kết nối')}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {t('settings.iphoneCalendarDesc', 'Đọc sự kiện từ Apple Calendar để hiển thị trong Lịch sự kiện và phiếu ngày')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleIOSCalendar}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 ${
                      iosCalConnected
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] taio-btn-primary'
                    }`}
                  >
                    {iosCalConnected 
                      ? t('settings.calendarDisconnect', 'Ngắt kết nối') 
                      : t('settings.calendarConnect', 'Kết nối lịch iPhone')}
                  </button>
                </div>
              </div>

              {/* PRD v0.3.37 Part G1: Modular DataSettingsPanel hosted exclusively under Kết nối TAIO */}
              <DataSettingsPanel
                importTaioData={importTaioData}
                exportTaioJsonV1={exportTaioJsonV1}
                remainingSampleGoals={remainingSampleGoals}
                deleteGoal={deleteGoal}
                resetAllUserData={resetAllUserData}
                setIsProfileModalOpen={setIsProfileModalOpen}
                setExportModalOpen={setExportModalOpen}
                language={language}
                clearSeededSampleData={clearSeededSampleData}
                hasSeededData={hasSeededData}
              />
            </div>
          )}

          {/* Version label at bottom of modal */}
          <div className="pt-6 border-t border-slate-100">
            <VersionLabel placement="inline" />
          </div>
        </div>
      </div>
    </div>
  );
};
