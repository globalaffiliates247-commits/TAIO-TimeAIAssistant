'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, X, BookOpen } from 'lucide-react';

export const CoachCardOverlay: React.FC = () => {
  const { 
    activeCoachCard, 
    dismissCoachCard, 
    setMethodLibraryOpen,
    deviceLook
  } = useApp();

  if (!activeCoachCard) return null;

  const handleLearnMore = () => {
    dismissCoachCard();
    setMethodLibraryOpen(true);
  };

  return (
    <div
      style={{
        bottom: deviceLook === 'phone' ? 'calc(var(--sab, 0px) + 68px)' : 'calc(var(--sab, 0px) + 16px)',
      }}
      className="fixed right-4 left-4 sm:left-auto sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white border border-orange-500/40 rounded-2xl p-4 shadow-2xl text-slate-800 space-y-2.5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>{activeCoachCard.conceptLineVi}</span>
          </div>
          <button 
            onClick={dismissCoachCard}
            className="text-slate-500 hover:text-slate-900 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-800 leading-snug">
          {activeCoachCard.meaningVi} <strong>{activeCoachCard.actionDoneVi}</strong>
        </p>

        <p className="text-[11px] text-emerald-700 font-medium">
          👏 {activeCoachCard.encourageVi}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={dismissCoachCard}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Đã hiểu
          </button>
          <button
            onClick={handleLearnMore}
            className="px-3 py-1 rounded-xl bg-[#E0401F] hover:bg-[#c93517] text-white text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <BookOpen className="w-3 h-3" />
            <span>Tìm hiểu thêm</span>
          </button>
        </div>

      </div>
    </div>
  );
};
