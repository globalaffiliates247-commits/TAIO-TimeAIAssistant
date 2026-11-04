'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Compass, 
  ExternalLink, 
  ArrowRight,
  Layers,
  X 
} from 'lucide-react';
import { MethodConcept } from '../types';

export const MethodLibraryModal: React.FC = () => {
  const { 
    methodLibraryOpen, 
    setMethodLibraryOpen, 
    methodConcepts,
    setCurrentTab,
    setInboxModalOpen,
    setInterruptionModalOpen
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'all' | 'plan' | 'do' | 'recover' | 'review'>('all');
  const [selectedConcept, setSelectedConcept] = useState<MethodConcept | null>(null);

  if (!methodLibraryOpen) return null;

  const filtered = activeCategory === 'all' 
    ? methodConcepts 
    : methodConcepts.filter(c => c.category === activeCategory);

  const handleTryNow = (conceptId: string) => {
    setMethodLibraryOpen(false);
    if (conceptId === 'mc-timebox') {
      setCurrentTab('plan');
    } else if (conceptId === 'mc-eisenhower') {
      setCurrentTab('plan');
    } else if (conceptId === 'mc-inbox' || conceptId === 'mc-2min') {
      setInboxModalOpen(true);
    } else if (conceptId === 'mc-zeigarnik') {
      setInterruptionModalOpen(true);
    } else if (conceptId === 'mc-flow' || conceptId === 'mc-drucker') {
      setCurrentTab('efficiency');
    } else if (conceptId === 'mc-dod') {
      setCurrentTab('now');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 border border-slate-200 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl p-5 sm:p-6 text-slate-900 border-t border-orange-200 sm:border">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Thư viện phương pháp (Method Library)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Nền tảng khoa học & Nguyên lý quản lý thời gian đằng sau từng tính năng</p>
            </div>
          </div>
          <button 
            onClick={() => setMethodLibraryOpen(false)}
            className="text-slate-500 hover:text-slate-900 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 my-3 overflow-x-auto pb-1 shrink-0 text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'plan', label: '1. Lập kế hoạch (Plan)' },
            { id: 'do', label: '2. Thực thi (Do)' },
            { id: 'recover', label: '3. Phục hồi gián đoạn (Recover)' },
            { id: 'review', label: '4. Đánh giá (Review)' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all border ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white border-transparent shadow-sm'
                  : 'bg-slate-100/80 border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List of Concepts */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3.5">
          {filtered.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-400 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>{item.nameVi}</span>
                </h4>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono self-start sm:self-auto">
                  {item.sourceAuthor} ({item.year})
                </span>
              </div>

              {/* Core Idea */}
              <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs text-orange-700">
                <strong>Ý cốt lõi: </strong>
                <span>{item.oneSentenceVi}</span>
              </div>

              {/* How TAIO applies it */}
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Ứng dụng trong TAIO: </strong>
                {item.appApplicationVi}
              </p>

              {/* Try Today Action */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-500 italic">
                  💡 Thử hôm nay: {item.tryTodayVi}
                </span>
                <button
                  onClick={() => handleTryNow(item.id)}
                  className="px-3 py-1 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-700 border border-orange-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all"
                >
                  <span>Mở thử ngay</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
