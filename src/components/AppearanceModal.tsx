'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DeviceLook, ThemeMode, ColorPalette } from '../types';
import { PALETTES } from '../data/mockData';
import { 
  X, 
  Sliders, 
  Laptop, 
  Monitor, 
  Smartphone, 
  Sun, 
  Moon, 
  Sparkles,
  Palette,
  Check,
  Globe,
  RotateCw,
  Hourglass,
  Zap,
  Droplets
} from 'lucide-react';
import { useT } from '../i18n/useT';
import { TemplateScheduleModal } from '@/features/schedule-template';

export const AppearanceModal: React.FC = () => {
  const { 
    settingsModalOpen, 
    setSettingsModalOpen, 
    deviceLook, 
    setDeviceLook, 
    themeMode, 
    setThemeMode, 
    palette, 
    setPalette,
    language,
    setLanguage 
  } = useApp();
  const { t } = useT();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  if (!settingsModalOpen) return null;

  const devices: { id: DeviceLook; label: string; desc: string; icon: React.ReactNode }[] = [
    { 
      id: 'auto', 
      label: 'Tự động theo thiết bị', 
      desc: 'Nhận diện tự động theo thiết bị bạn đang dùng', 
      icon: <Sparkles className="w-4 h-4 text-amber-400" /> 
    },
    { 
      id: 'macos', 
      label: 'Máy tính macOS', 
      desc: 'Thanh tiêu đề trung tâm, bo góc 12px', 
      icon: <Laptop className="w-4 h-4 text-red-400" /> 
    },
    { 
      id: 'windows', 
      label: 'Máy tính Windows', 
      desc: 'Thanh tiêu đề trái, nút điều khiển góc phải, bo góc 8px', 
      icon: <Monitor className="w-4 h-4 text-blue-400" /> 
    },
    { 
      id: 'phone', 
      label: 'Điện thoại', 
      desc: 'Thanh điều hướng dưới đáy, nút bấm lớn dễ chạm', 
      icon: <Smartphone className="w-4 h-4 text-emerald-400" /> 
    },
  ];

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: 'Theo hệ thống', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'dark', label: 'Giao diện Tối', icon: <Moon className="w-4 h-4" /> },
    { id: 'light', label: 'Giao diện Sáng', icon: <Sun className="w-4 h-4" /> },
  ];

  const palettesList: { id: ColorPalette; label: string; desc: string; icon: React.ReactNode; colorHex: string }[] = [
    { 
      id: 'red', 
      label: language === 'en' ? 'TAIO Red' : 'Đỏ TAIO', 
      desc: language === 'en' ? 'Deep crimson brand red (WCAG AA 4.75 contrast)' : 'Màu son nhận diện đặc trưng TAIO, tương phản 4.75 chuẩn WCAG AA',
      icon: <Hourglass className="w-4 h-4 text-white stroke-[1.75]" />,
      colorHex: '#E11D2E',
    },
    { 
      id: 'bright-blue', 
      label: language === 'en' ? 'Bright Blue' : 'Xanh sáng', 
      desc: language === 'en' ? 'High-contrast bright blue (WCAG AA 4.75 contrast)' : 'Tông xanh sáng nổi bật, rõ nét, tương phản 4.75 chuẩn WCAG AA',
      icon: <Zap className="w-4 h-4 text-white stroke-[1.75]" />,
      colorHex: '#0068FF',
    },
    { 
      id: 'calm-blue', 
      label: language === 'en' ? 'Calm Blue' : 'Xanh dịu', 
      desc: language === 'en' ? 'Refined calm blue with cyan accents (WCAG AA 4.67)' : 'Tông xanh dịu nhã nhặn, tương phản 4.67 chuẩn WCAG AA',
      icon: <Droplets className="w-4 h-4 text-white stroke-[1.75]" />,
      colorHex: '#1C78C0',
    },
  ];

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-md flex items-center justify-center">
      <div className="bg-slate-50/95 border border-slate-100 backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cài đặt Giao diện & Nền tảng</h3>
              <p className="text-[11px] text-slate-500">Áp dụng tức thì, tự động lưu vào tài khoản</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto overscroll-contain">
          {/* Setting 1: Device */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Nền tảng hiển thị
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {devices.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDeviceLook(d.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    deviceLook === d.id
                      ? 'border-[var(--taio-brand)] bg-red-50 text-slate-900'
                      : 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5">{d.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{d.label}</span>
                      {deviceLook === d.id && <Check className="w-3.5 h-3.5 text-[var(--taio-brand)]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{d.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Setting 2: Theme Light / Dark */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Chế độ Sáng / Tối
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeMode(t.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    themeMode === t.id
                      ? 'border-[var(--taio-brand)] bg-[var(--taio-brand-soft)] text-slate-900'
                      : 'border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {t.icon}
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Setting 3: Color Palette (PRD v0.3.47 Part A1 & A4) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {language === 'en' ? 'Brand Color Palette' : 'Bảng màu nhận diện'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {palettesList.map(p => {
                const isSelected = palette === p.id || (p.id === 'red' && palette === 'warm') || (p.id === 'bright-blue' && palette === 'cool');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'border-[var(--taio-brand)] bg-[var(--taio-brand-soft)] text-slate-900 shadow-xs'
                        : 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: p.colorHex }}
                      >
                        {p.icon}
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[var(--taio-brand)] text-[var(--taio-on-brand)] flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{p.label}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Language (PRD E6 / v0.3.27) */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{t('common.language')}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  language === 'vi'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{t('common.vietnamese')}</div>
                  <div className="text-[10px] text-slate-500">Mặc định tiếng Việt</div>
                </div>
                {language === 'vi' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  language === 'en'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{t('common.english')}</div>
                  <div className="text-[10px] text-slate-500">English locale</div>
                </div>
                {language === 'en' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Lịch ngày mẫu (PRD v0.3.33 E3.6) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-[var(--taio-brand)]" />
                <span>{language === 'vi' ? 'Lịch ngày mẫu' : 'Daily Template Schedule'}</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  window.dispatchEvent(new CustomEvent('taio:navigate', { detail: { tab: 'plan', view: 'events', filter: 'routine' } }));
                }}
                className="text-xs text-[var(--taio-brand)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'vi' ? 'Quản lý lịch mẫu ↗' : 'Manage Templates ↗'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'vi' 
                ? 'Xem và chỉnh sửa các khung lặp lại cố định như giờ ăn, giờ ngủ, dọn dẹp hòm thư và khép ngày.'
                : 'Review and customize recurring template slots like meals, sleep, inbox cleanup, and day-close ritual.'}
            </p>
          </div>
        </div>

        <TemplateScheduleModal isOpen={templateModalOpen} onClose={() => setTemplateModalOpen(false)} />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white/50 flex justify-end">
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2 rounded-xl text-[var(--taio-on-brand)] text-xs font-bold shadow-md transition-all bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] taio-btn-primary"
          >
            {language === 'en' ? 'Apply and Close' : 'Áp dụng và Đóng'}
          </button>
        </div>

      </div>
    </div>
  );
};
