'use client';
// PRD B34 v0.3.26: "Hôm nay" in Rổ công việc — the same items as the day sticky, as a list.
import React from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate } from '@/core/clock';
import { openStickyBoard } from '../sticky';

export const TodaySection: React.FC<{ part: 'timed' | 'flex' }> = ({ part }) => {
  const { dailyCardItems, toggleDailyCardItem } = useApp();
  const today = getDeviceCalendarDate();
  const items = dailyCardItems
    .filter(i => i.date === today && i.status !== 'dropped' && i.status !== 'carried' && (part === 'timed' ? !!i.start : !i.start))
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-[#2B2A26]">{part === 'timed' ? 'Hôm nay · Có giờ' : 'Hôm nay · Linh động'}</h3>
          <p className="text-[13px] text-[#6B6658]">{part === 'timed' ? 'Việc đã có khung giờ hôm nay' : 'Việc định làm hôm nay, làm lúc nào thấy hứng'}</p>
        </div>
        <button onClick={() => openStickyBoard(today)} className="h-10 px-4 rounded-xl border border-[#E8E3D6] bg-white text-sm font-semibold text-[#2B2A26]">Mở tờ Hôm nay</button>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E3D6] overflow-hidden">
        {items.length === 0 && <p className="text-sm text-[#8E897A] py-6 text-center">Chưa có việc nào.</p>}
        {items.map((it, idx) => (
          <button key={it.id} onClick={() => toggleDailyCardItem(it.id)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 ${idx < items.length - 1 ? 'border-b border-[#F0ECE2]' : ''}`}>
            {it.start && <span className="font-semibold tabular-nums text-[#2B2A26]">{it.start}</span>}
            <span className={`flex-1 text-[15px] ${it.status === 'done' ? 'line-through text-[#A39E8E]' : 'text-[#2B2A26]'}`}>{it.text}</span>
            {it.goalName && <span className="text-xs text-[#A39E8E]">{it.goalName}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
