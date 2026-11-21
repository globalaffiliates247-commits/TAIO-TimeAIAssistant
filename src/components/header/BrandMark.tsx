'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export const BrandMark: React.FC = () => {
  const { setCurrentTab, palette } = useApp();
  const isCool = palette === 'cool';

  return (
    <div 
      className="flex items-center gap-2 cursor-pointer select-none shrink-0" 
      onClick={() => setCurrentTab('now')}
      title="TAIO Time"
    >
      <div 
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black shadow-xs transition-all ${
          isCool
            ? 'bg-blue-600 text-white shadow-blue-500/20'
            : 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)] shadow-red-500/20'
        }`}
      >
        T
      </div>
      <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base leading-none">
        TAIO Time
      </span>
    </div>
  );
};
