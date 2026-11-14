'use client';
// PRD B34 v0.3.26: one "Rổ công việc" for capture and sorting — sticky sheets, Chưa phân loại,
// the four priority folders (moved here from the Plan tab) and today's lists.
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PriorityMatrix } from '@/components/PriorityMatrix';
import { useStickyState } from '../sticky';
import { UnsortedSection } from './UnsortedSection';
import { TodaySection } from './TodaySection';
import { StickySection } from './StickySection';
import { useT } from '@/i18n/useT';

type Section = 'sticky' | 'unsorted' | 'folders' | 'timed' | 'flex';

export const BasketHub: React.FC = () => {
  const { inboxModalOpen, setInboxModalOpen, inbox } = useApp();
  const { notes } = useStickyState();
  const { t } = useT();
  const [section, setSection] = useState<Section>('unsorted');
  if (!inboxModalOpen) return null;
  const pending = inbox.filter(i => i.status === 'inbox').length;

  const groups: { label: string; items: { id: Section; label: string; count?: number; swatch: string }[] }[] = [
    { label: t('basket.sec_notes', 'GHI'), items: [{ id: 'sticky', label: t('basket.sticky_notes', 'Tờ ghi nhanh'), count: notes.length, swatch: '#FCEB8E' }] },
    { label: t('basket.sec_classify', 'PHÂN LOẠI'), items: [
      { id: 'unsorted', label: t('basket.unsorted', 'Chưa phân loại'), count: pending, swatch: '#D8D3C4' },
      { id: 'folders', label: t('basket.priority_folders', 'Ngăn ưu tiên'), swatch: '#CDEFD6' },
    ] },
    { label: t('basket.sec_today', 'HÔM NAY'), items: [
      { id: 'timed', label: t('basket.timed', 'Có giờ'), swatch: '#FDE5D2' },
      { id: 'flex', label: t('basket.flex', 'Linh động'), swatch: '#E2D9F8' },
    ] },
  ];
  const close = () => setInboxModalOpen(false);

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/30 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-6">
      <div className="bg-[#F7F5EF] w-full max-w-6xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-full sm:h-[88vh] text-[#2B2A26]">
        {/* Desktop: left rail. Phone: header + horizontal chips */}
        <aside className="md:w-64 shrink-0 md:border-r border-[#E8E3D6] p-4 md:p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 pb-3">
            <span className="w-9 h-9 rounded-xl bg-[#FCEB8E] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5E2A" strokeWidth="2" strokeLinejoin="round"><path d="M3 13l3-8h12l3 8v6H3z" /><path d="M3 13h5l1 2h6l1-2h5" /></svg>
            </span>
            <span className="flex-1 text-lg font-extrabold">{t('basket.title', 'Rổ công việc')}</span>
            <button aria-label={t('common.close', 'Đóng')} onClick={close} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6658" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1">
            {groups.map(g => (
              <React.Fragment key={g.label}>
                <span className="hidden md:block px-2.5 pt-3 pb-1 text-[11px] font-bold text-[#8E897A]">{g.label}</span>
                {g.items.map(it => (
                  <button key={it.id} onClick={() => setSection(it.id)}
                    className={`shrink-0 h-10 rounded-xl px-2.5 flex items-center gap-2.5 text-sm text-left ${section === it.id ? 'bg-white shadow-[0_0_0_1px_#E8E3D6] font-semibold' : 'hover:bg-white/60'}`}>
                    <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ background: it.swatch }} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {!!it.count && <span className="text-xs text-[#8E897A]">{it.count}</span>}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
          <p className="hidden md:block mt-auto text-[11.5px] leading-relaxed text-[#6B6658] bg-white rounded-xl p-3 shadow-[0_0_0_1px_#E8E3D6]">
            {t('basket.empty', 'Rổ đang trống. Nghĩ ra việc gì cứ thả vào đây.')}
          </p>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-4 md:p-7">
          {section === 'sticky' && <StickySection onOpened={close} />}
          {section === 'unsorted' && <UnsortedSection />}
          {section === 'folders' && <PriorityMatrix />}
          {section === 'timed' && <TodaySection part="timed" />}
          {section === 'flex' && <TodaySection part="flex" />}
        </main>
      </div>
    </div>
  );
};
