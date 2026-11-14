// TAIO Time App — Highlight Settings & Live Preview Component (PRD v0.3.35 Part C2 & C3)
'use client';

import React, { useRef } from 'react';
import { useHighlight } from './useHighlight';
import { saveHighlightPrefs } from './userPrefsStore';
import { useApp } from '@/context/AppContext';
import { Sparkles, Palette, Check } from 'lucide-react';

export const HIGHLIGHT_PRESETS = [
  { id: 'blue', label: 'Xanh dương', labelEn: 'Blue', hex: '#1E90FF' },
  { id: 'red', label: 'Đỏ', labelEn: 'Red', hex: '#E53935' },
  { id: 'green', label: 'Xanh lá', labelEn: 'Green', hex: '#43A047' },
  { id: 'orange', label: 'Vàng cam', labelEn: 'Amber Orange', hex: '#FB8C00' },
  { id: 'purple', label: 'Tím', labelEn: 'Purple', hex: '#8E24AA' },
  { id: 'pink', label: 'Hồng', labelEn: 'Pink', hex: '#E91E63' },
];

export const HighlightSettings: React.FC = () => {
  const { color, bold, highlightStyle } = useHighlight();
  const { language, palette } = useApp();
  const isEn = language === 'en';
  const isCool = palette === 'cool';
  const customInputRef = useRef<HTMLInputElement>(null);

  const handleSelectColor = (newColor: string | null) => {
    saveHighlightPrefs({ color: newColor });
  };

  const handleToggleBold = () => {
    saveHighlightPrefs({ bold: !bold });
  };

  return (
    <div className="space-y-3.5 pt-3 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
            <Sparkles className={`w-3.5 h-3.5 ${isCool ? 'text-blue-500' : 'text-[#E0401F]'}`} />
            <span>{isEn ? 'Highlight Text' : 'Chữ nổi bật'}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isEn
              ? 'High contrast color and bold styling for clock, task name, and key status'
              : 'Đặt màu nổi và in đậm cho đồng hồ, tên việc và nhãn trạng thái chính'}
          </p>
        </div>
      </div>

      {/* Preset Swatches + Default + Custom */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-slate-700">
          {isEn ? 'Highlight Color' : 'Màu nổi bật'}
        </label>
        <div className="flex items-center flex-wrap gap-2">
          {/* Default / No Color */}
          <button
            type="button"
            onClick={() => handleSelectColor(null)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              color === null
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {color === null && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{isEn ? 'Default' : 'Mặc định'}</span>
          </button>

          {/* 6 Presets */}
          {HIGHLIGHT_PRESETS.map(p => {
            const isSelected = color?.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectColor(p.hex)}
                style={{ backgroundColor: p.hex }}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105 cursor-pointer ring-2 ${
                  isSelected ? 'ring-slate-900 scale-110' : 'ring-transparent opacity-90 hover:opacity-100'
                }`}
                title={isEn ? p.labelEn : p.label}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] drop-shadow-sm" />}
              </button>
            );
          })}

          {/* Custom OS Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => customInputRef.current?.click()}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                color && !HIGHLIGHT_PRESETS.some(p => p.hex.toLowerCase() === color.toLowerCase())
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isEn ? 'Custom' : 'Tùy chỉnh'}</span>
            </button>
            <input
              ref={customInputRef}
              type="color"
              value={color || '#1E90FF'}
              onChange={e => handleSelectColor(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      {/* Bold Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-slate-800">
            {isEn ? 'Bold text' : 'In đậm chữ nổi bật'}
          </div>
          <div className="text-[10.5px] text-slate-500">
            {isEn ? 'Thicker font weight for readability' : 'Nét chữ dày hơn, hỗ trợ đọc dễ dàng'}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={bold}
          onClick={handleToggleBold}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none ${
            bold ? (isCool ? 'bg-blue-600' : 'bg-[#E0401F]') : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
              bold ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Interactive Live Preview Card (PRD v0.3.35 Part C3) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {isEn ? 'Live Preview' : 'Xem trước thực tế'}
        </span>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span style={highlightStyle} className="font-mono">
              [Giờ: 14:35]
            </span>
            <span style={highlightStyle}>
              Viết báo cáo tuần
            </span>
            <span style={highlightStyle} className="font-mono">
              còn lại 00:22
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span style={highlightStyle}>
              Mục tiêu: Công việc Q4
            </span>
            <span style={highlightStyle} className="flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Hết giờ phải xong</span>
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] italic" style={highlightStyle}>
            "Đừng đếm ngày tháng, hãy làm cho ngày tháng có ý nghĩa." — Muhammad Ali
          </div>
        </div>
      </div>
    </div>
  );
};
