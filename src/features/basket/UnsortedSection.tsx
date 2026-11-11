'use client';
// PRD B34 v0.3.26: "Chưa phân loại". Rows stay quiet (title + one chevron); the next-step choices
// appear only for the selected row, all in one neutral style.
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate } from '@/core/clock';

const chip = 'h-8 px-3 rounded-full bg-white border border-[#DCD6C6] text-[#4A463A] text-[12.5px] font-medium flex items-center gap-1 hover:bg-[#F7F5EF]';

const Chevron = () => (
  <span className="w-7 h-7 shrink-0 rounded-full border border-[#DCD6C6] flex items-center justify-center">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E897A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
  </span>
);

export const UnsortedSection: React.FC = () => {
  const { inbox, addInboxItem, processInboxItem, addDailyCardItem, setIsSwipeModalOpen } = useApp();
  const pending = inbox.filter(i => i.status === 'inbox');
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-extrabold text-[#2B2A26]">Chưa phân loại</h3>
          <p className="text-[13px] text-[#6B6658]">Việc vừa ghi, chưa có ước lượng, hạn chót hoặc mục tiêu</p>
        </div>
        {pending.length > 0 && (
          <button onClick={() => setIsSwipeModalOpen(true)} className="h-10 px-4 rounded-xl bg-[#2B2A26] text-white text-sm font-semibold shrink-0">
            Quẹt thẻ {pending.length} việc
          </button>
        )}
      </div>

      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { addInboxItem({ title: draft.trim(), source: 'quick' }); setDraft(''); } }}
        placeholder="Ghi một việc vừa nghĩ ra, Enter để thêm…"
        className="h-11 rounded-xl bg-white border border-[#E8E3D6] px-3.5 text-[15px] text-[#2B2A26] placeholder:text-[#A39E8E] outline-none focus:border-[#B9B29E]"
      />

      {pending.length === 0 ? (
        <p className="text-sm text-[#8E897A] py-6 text-center">Rổ trống. Ý nghĩ mới cứ ghi vào tờ ghi nhanh hoặc ô bên trên.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E3D6] overflow-hidden">
          {pending.map((it, idx) => {
            const isSel = selected === it.id;
            return (
              <div key={it.id}
                className={`px-4 py-3 flex flex-col gap-2.5 ${idx < pending.length - 1 ? 'border-b border-[#F0ECE2]' : ''} ${isSel ? 'bg-[#FBF9F3] shadow-[inset_3px_0_0_#2B2A26]' : ''}`}>
                <button className="flex items-center gap-3 text-left w-full" onClick={() => setSelected(isSel ? null : it.id)}>
                  <span className="flex-1 min-w-0 text-[15px] text-[#2B2A26]">{it.title}</span>
                  {it.linkedGoalName && <span className="hidden sm:inline text-xs text-[#A39E8E] truncate max-w-[40%]">{it.linkedGoalName}</span>}
                  {!isSel && <Chevron />}
                </button>
                {isSel && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-[#8E897A] mr-1">Bước tiếp theo:</span>
                    {(it.estimatedMinutes ?? 99) <= 2 && <button className={chip} onClick={() => processInboxItem(it.id, 'done_2min')}>Làm luôn (2 phút)</button>}
                    <button className={chip} onClick={() => { addDailyCardItem({ text: it.title, date: getDeviceCalendarDate() }); processInboxItem(it.id, 'schedule', { quadrant: 2 }); }}>Đưa vào hôm nay</button>
                    <button className={chip} onClick={() => processInboxItem(it.id, 'schedule', { quadrant: 2 })}>Lên lịch</button>
                    <button className={chip} onClick={() => processInboxItem(it.id, 'delegate')}>Giao người khác</button>
                    <button className={chip} onClick={() => processInboxItem(it.id, 'drop')}>Bỏ</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[12.5px] text-[#6B6658] flex items-center gap-2"><Chevron /> Chạm một việc để xem bước tiếp theo.</p>
    </div>
  );
};
