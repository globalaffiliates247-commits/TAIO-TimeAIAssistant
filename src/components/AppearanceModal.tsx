'use client';

import React from 'react';
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
  Globe
} from 'lucide-react';
import { useT } from '../i18n/useT';

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

  const palettesList: { id: ColorPalette; label: string; desc: string; icon: string }[] = [
    { 
      id: 'cool', 
      label: '❄️ Tông màu Lạnh (Xanh & Trắng)', 
      desc: 'Nền không gian làm việc sáng, thẻ trắng, điểm nhấn xanh #007AFF.',
      icon: '❄️'
    },
    { 
      id: 'warm', 
      label: '🔥 Tông màu Nóng (Đỏ cam & Trắng)', 
      desc: 'Nền ấm, thẻ trắng, điểm nhấn đỏ cam thương hiệu #E0401F nổi bật.',
      icon: '🔥'
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
                      ? 'border-[#E0401F] bg-red-50 text-slate-900'
                      : 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5">{d.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{d.label}</span>
                      {deviceLook === d.id && <Check className="w-3.5 h-3.5 text-[#E0401F]" />}
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
                      ? 'border-[#E0401F] bg-red-50 text-slate-900'
                      : 'border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {t.icon}
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Setting 3: Color Palette */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Bảng màu hệ thống
            </label>
            <div className="space-y-2">
              {palettesList.map(p => {
                const palObj = PALETTES[p.id];
                const isSelected = palette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#E0401F] bg-red-50 text-slate-900'
                        : 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E0401F]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                    </div>

                    {/* Color swatches preview */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div 
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm" 
                        style={{ backgroundColor: palObj.deepWork }}
                        title={`Việc sâu: ${palObj.deepWork}`}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm" 
                        style={{ backgroundColor: palObj.interruption }}
                        title={`Gián đoạn: ${palObj.interruption}`}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm" 
                        style={{ backgroundColor: palObj.meeting }}
                        title={`Họp: ${palObj.meeting}`}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm" 
                        style={{ backgroundColor: palObj.personal }}
                        title={`Cá nhân: ${palObj.personal}`}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm" 
                        style={{ backgroundColor: palObj.planning }}
                        title={`Lập kế hoạch: ${palObj.planning}`}
                      />
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white/50 flex justify-end">
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white text-xs font-bold shadow-md transition-all"
          >
            Áp dụng và Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
