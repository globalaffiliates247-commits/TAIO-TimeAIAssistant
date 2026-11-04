'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Inbox, 
  Plus, 
  Sparkles, 
  Clock, 
  Zap, 
  Calendar, 
  UserCheck, 
  Archive, 
  CheckCircle2, 
  Target,
  X 
} from 'lucide-react';

export const InboxModal: React.FC = () => {
  const { 
    inboxModalOpen, 
    setInboxModalOpen, 
    inbox, 
    addInboxItem, 
    processInboxItem,
    goals 
  } = useApp();

  const [title, setTitle] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'capture' | 'list'>('capture');

  if (!inboxModalOpen) return null;

  const handleCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addInboxItem({
      title: title.trim(),
      nextAction: nextAction.trim() || title.trim(),
      estimatedMinutes,
      linkedGoalId: selectedGoalId || undefined,
      source: 'quick',
    });

    setTitle('');
    setNextAction('');
    setSelectedGoalId('');
    setActiveTab('list');
  };

  const pendingItems = inbox.filter(i => i.status === 'inbox');
  const processedItems = inbox.filter(i => i.status !== 'inbox');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50/95 border border-slate-100 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl p-5 sm:p-6 text-slate-900 border-t border-orange-500/30 sm:border">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-950/80 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Rổ công việc (Inbox - GTD)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800/40">
                  {pendingItems.length} việc chờ
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Thu nhận dưới 5s • Định nghĩa sẵn sàng (DoR) • Dọn rổ cuối ngày</p>
            </div>
          </div>
          <button 
            onClick={() => setInboxModalOpen(false)}
            className="text-slate-500 hover:text-slate-900 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 my-3 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 shrink-0">
          <button
            onClick={() => setActiveTab('capture')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'capture' 
                ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-slate-900 shadow-md' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thu nhận nhanh (&lt; 5s)</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list' 
                ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-slate-900 shadow-md' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Dọn rổ việc ({pendingItems.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === 'capture' ? (
            <form onSubmit={handleCaptureSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Ý nghĩ / Việc vừa nảy ra trong đầu:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Cần gửi file phân tích hợp đồng cho anh Tuấn..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              {/* Definition of Ready (DoR - Scrum & GTD) */}
              <div className="p-3.5 rounded-2xl bg-slate-100/50 border border-slate-200/60 space-y-3">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Định nghĩa sẵn sàng (Definition of Ready - DoR):</span>
                </span>

                <div>
                  <label className="text-[11px] text-slate-700 block mb-1">
                    Hành động cụ thể kế tiếp (Next Action):
                  </label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    placeholder="VD: Mở Google Drive, xuất file PDF và soạn email"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1">
                      Ước tính thời gian:
                    </label>
                    <div className="flex gap-1.5">
                      {[2, 15, 30, 60].map(mins => (
                        <button
                          type="button"
                          key={mins}
                          onClick={() => setEstimatedMinutes(mins)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                            estimatedMinutes === mins
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {mins === 2 ? '<2p' : `${mins}p`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1">
                      Phục vụ mục tiêu:
                    </label>
                    <select
                      value={selectedGoalId}
                      onChange={e => setSelectedGoalId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">(Ngoài mục tiêu chính)</option>
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#c93517] hover:to-orange-600 text-slate-900 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm vào Rổ việc & Giải phóng đầu óc</span>
              </button>
            </form>
          ) : (
            /* List of Pending Items */
            <div className="space-y-3">
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-200">Rổ việc trống tinh tươm (Zero Inbox)!</p>
                  <p className="text-xs text-slate-500">Bạn đã xử lý hết mọi việc chờ. Tâm trí hoàn toàn thanh thản.</p>
                </div>
              ) : (
                pendingItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200/70 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                        {item.nextAction && item.nextAction !== item.title && (
                          <p className="text-xs text-slate-700 mt-0.5">
                            Bước tiếp: <span className="text-orange-300 font-medium">{item.nextAction}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {item.estimatedMinutes} phút
                          </span>
                          {item.linkedGoalName && (
                            <span className="text-orange-400 truncate max-w-[180px]">
                              • {item.linkedGoalName}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-700">
                        {item.createdAt}
                      </span>
                    </div>

                    {/* Action buttons per GTD */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/50">
                      {item.estimatedMinutes && item.estimatedMinutes <= 2 ? (
                        <button
                          onClick={() => processInboxItem(item.id, 'done_2min')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-[11px] font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Làm ngay (&lt;2p)</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => processInboxItem(item.id, 'schedule', { quadrant: 2 })}
                        className="px-2.5 py-1 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-slate-900 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Lên lịch (Ô 2)</span>
                      </button>

                      <button
                        onClick={() => processInboxItem(item.id, 'delegate')}
                        className="px-2.5 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-700 text-[11px] flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Ủy quyền</span>
                      </button>

                      <button
                        onClick={() => processInboxItem(item.id, 'drop')}
                        className="px-2.5 py-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-500 hover:text-slate-900 text-[11px] flex items-center gap-1"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Lưu/Bỏ</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
