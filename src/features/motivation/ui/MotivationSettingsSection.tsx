// TAIO Time App — Motivation Settings Section (PRD FEATURE v0.3.31 Part B Settings)
'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import {
  MotivationSettings,
  DEFAULT_MOTIVATION_SETTINGS,
  MotivationQuote,
  UserMotivationState,
} from '../model/types';
import {
  loadMotivationSettings,
  saveMotivationSettings,
  loadUserMotivationState,
  saveUserMotivationState,
  loadServerQuotesCache,
  getAllQuotes,
} from '../model/motivationStore';
import { Sparkles, Quote, Check, Heart, Pin, Trash2 } from 'lucide-react';

export const MotivationSettingsSection: React.FC = () => {
  const { palette, showToast, language } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';
  const isEn = language === 'en';

  const [settings, setSettings] = useState<MotivationSettings>(() => loadMotivationSettings());
  const [userState, setUserState] = useState<UserMotivationState>(() => loadUserMotivationState());
  const [serverQuotes] = useState(() => loadServerQuotesCache());

  const allQuotes = useMemo(() => {
    return getAllQuotes(serverQuotes, userState.customQuotes);
  }, [serverQuotes, userState.customQuotes]);

  const favoriteQuotes = useMemo(() => {
    return userState.favorites
      .map(id => allQuotes.find(q => q.id === id))
      .filter((q): q is MotivationQuote => Boolean(q));
  }, [userState.favorites, allQuotes]);

  const handleTogglePinQuote = (quoteId: string) => {
    const isCurrentlyPinned = userState.pinnedQuoteId === quoteId;
    const nextPinned = isCurrentlyPinned ? undefined : quoteId;
    const updated: UserMotivationState = {
      ...userState,
      pinnedQuoteId: nextPinned,
    };
    setUserState(updated);
    saveUserMotivationState(updated);
    showToast(
      nextPinned
        ? (isEn ? 'Pinned as My Daily Quote (shows in Start Day)' : 'Đã ghim làm "câu của tôi" (hiện ở thẻ Bắt đầu ngày)')
        : (isEn ? 'Unpinned daily quote' : 'Đã bỏ ghim câu của tôi')
    );
  };

  const handleRemoveFavorite = (quoteId: string) => {
    const updatedFavs = userState.favorites.filter(id => id !== quoteId);
    const updated: UserMotivationState = {
      ...userState,
      favorites: updatedFavs,
      pinnedQuoteId: userState.pinnedQuoteId === quoteId ? undefined : userState.pinnedQuoteId,
    };
    setUserState(updated);
    saveUserMotivationState(updated);
    showToast(isEn ? 'Removed from My Quotes' : 'Đã bỏ khỏi Kho của tôi');
  };

  const handleToggleMaster = () => {
    const next: MotivationSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    setSettings(next);
    saveMotivationSettings(next);
    showToast(next.enabled ? t('motivation.enabledToast', 'Đã bật câu truyền động lực') : t('motivation.disabledToast', 'Đã tắt câu truyền động lực'));
  };

  const handleToggleSlot = (slotKey: keyof MotivationSettings['slots']) => {
    const next: MotivationSettings = {
      ...settings,
      slots: {
        ...settings.slots,
        [slotKey]: !settings.slots[slotKey],
      },
    };
    setSettings(next);
    saveMotivationSettings(next);
  };

  const slotLabels: { key: keyof MotivationSettings['slots']; label: string; desc: string }[] = [
    {
      key: 'clock_idle',
      label: t('motivation.slot_clock_idle', 'Trên đồng hồ'),
      desc: t('motivation.slot_clock_idle_desc', 'Hiện 1 dòng câu động lực trên đồng hồ mini và đồng hồ lúc trống'),
    },
    {
      key: 'free_sheet',
      label: t('motivation.slot_free_sheet', 'Trên thẻ Đang làm'),
      desc: t('motivation.slot_free_sheet_desc', 'Hiện 1 dòng câu động lực dưới thẻ việc đang làm ở màn Lúc này'),
    },
    {
      key: 'start_day_sheet',
      label: t('motivation.slot_start_day_sheet', 'Đầu tờ Ghi nhanh "Hôm nay"'),
      desc: t('motivation.slot_start_day_sheet_desc', 'Dán nhãn câu động lực ở đầu tờ ghi chú hôm nay'),
    },
    {
      key: 'close_day',
      label: t('motivation.slot_close_day', 'Thẻ tổng kết khi Chốt ngày'),
      desc: t('motivation.slot_close_day_desc', 'Hiện thẻ câu truyền cảm hứng khi kết thúc ngày'),
    },
    {
      key: 'goals_tab',
      label: t('motivation.slot_goals_tab', 'Tab Mục tiêu & Lộ trình'),
      desc: t('motivation.slot_goals_tab_desc', 'Hiện thẻ câu động lực đầu danh sách mục tiêu'),
    },
    {
      key: 'task_done',
      label: t('motivation.slot_task_done', 'Thẻ hết giờ khi bấm Xong'),
      desc: t('motivation.slot_task_done_desc', 'Một câu ghi nhận ngắn khi hoàn thành việc'),
    },
    {
      key: 'alarm_start',
      label: t('motivation.slot_alarm_start', 'Màn hình chuông báo đầu khung'),
      desc: t('motivation.slot_alarm_start_desc', 'Hiện dòng nhắc nhở dưới tên việc khi chuông reo'),
    },
    {
      key: 'widget',
      label: t('motivation.slot_widget', 'Widget & Màn hình khóa iPhone'),
      desc: t('motivation.slot_widget_desc', 'Hiện câu khi không có việc đang đếm ngược'),
    },
  ];

  return (
    <div className="pt-2 border-t border-slate-200/80 space-y-3">
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isCool ? 'text-blue-500' : 'text-[#E0401F]'}`} />
            <h4 className="text-xs font-bold text-slate-900">
              {t('motivation.masterTitle', 'Câu truyền động lực')}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t('motivation.masterDesc', 'Nhắc nhở và tiếp năng lượng vào đúng nơi bạn nhìn thấy mỗi ngày')}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={handleToggleMaster}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none ${
            settings.enabled ? (isCool ? 'bg-[#007AFF]' : 'bg-[#E0401F]') : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
              settings.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Granular Sub-toggles */}
      {settings.enabled && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5 animate-in fade-in duration-200">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {t('motivation.slotsTitle', 'Vị trí hiển thị')}
          </div>

          <div className="space-y-2 divide-y divide-slate-100">
            {slotLabels.map(item => {
              const isOn = Boolean(settings.slots[item.key]);
              return (
                <div key={item.key} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800">
                      {item.label}
                    </div>
                    <div className="text-[10.5px] text-slate-500 truncate">
                      {item.desc}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    onClick={() => handleToggleSlot(item.key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none ${
                      isOn ? (isCool ? 'bg-[#007AFF]' : 'bg-[#E0401F]') : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                        isOn ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRD v0.3.35 B3.1: "Kho của tôi" (My Quotes / Favorites) */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-rose-500 fill-rose-500" />
            <h5 className="text-xs font-bold text-slate-800">
              {isEn ? 'My Quotes Bank' : 'Kho của tôi'}
            </h5>
            <span className="text-[11px] font-semibold text-slate-400">
              ({favoriteQuotes.length})
            </span>
          </div>
          <span className="text-[10.5px] text-slate-400">
            {isEn ? '3x display frequency' : 'Tần suất hiện gấp 3 lần'}
          </span>
        </div>

        {favoriteQuotes.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
            {isEn
              ? 'No saved quotes yet. Click ♥ on any quote in the app to save it here.'
              : 'Chưa có câu nào trong Kho của bạn. Bấm ♥ ở bất kỳ câu nào trong app để lưu vào đây.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {favoriteQuotes.map(q => {
              const isPinned = userState.pinnedQuoteId === q.id;

              return (
                <div
                  key={q.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                    isPinned
                      ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-800 italic leading-relaxed font-normal">
                      "{q.text}"
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePinQuote(q.id)}
                        className={`p-1 rounded-lg border transition-all cursor-pointer ${
                          isPinned
                            ? 'bg-amber-200 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title={
                          isPinned
                            ? (isEn ? 'Unpin from Start Day' : 'Bỏ ghim câu của tôi')
                            : (isEn ? 'Pin as My Quote (Start Day)' : 'Ghim làm câu của tôi (hiện ở Bắt đầu ngày)')
                        }
                      >
                        <Pin size={12} className={isPinned ? 'fill-amber-900' : ''} />
                      </button>

                      {/* Remove from favorites */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(q.id)}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isEn ? 'Remove from favorites' : 'Bỏ tim khỏi Kho của tôi'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500 font-medium">
                      {q.author ? `— ${q.author}` : ''}
                    </span>
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                        <Pin size={10} className="fill-current" />
                        <span>{isEn ? 'My Daily Quote' : 'Câu của tôi (Bắt đầu ngày)'}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
