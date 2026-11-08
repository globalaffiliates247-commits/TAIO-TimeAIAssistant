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
    goals,
    palette
  } = useApp();

  const isCool = palette === 'cool';

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
    <div className="fixed app-bottom-sheet-safe z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl p-5 sm:p-6 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
              isCool 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-red-50 border-red-200 text-[#E0401F]'
            }`}>
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Rổ công việc (Inbox - GTD)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                  {pendingItems.length} việc chờ
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Thu nhận dưới 5s • Định nghĩa sẵn sàng (DoR) • Dọn rổ cuối ngày</p>
            </div>
          </div>
          <button 
            onClick={() => setInboxModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 my-3 p-1 rounded-2xl bg-slate-100 border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('capture')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'capture' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thu nhận nhanh (&lt; 5s)</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Dọn rổ việc ({pendingItems.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain flex-1 pr-1 space-y-4">
          {activeTab === 'capture' ? (
            <form onSubmit={handleCaptureSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Ý nghĩ / Việc vừa nảy ra trong đầu:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Cần gửi file phân tích hợp đồng cho anh Tuấn..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
                  autoFocus
                />
              </div>

              {/* Definition of Ready (DoR - Scrum & GTD) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className={`text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  isCool ? 'text-blue-600' : 'text-[#E0401F]'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Định nghĩa sẵn sàng (Definition of Ready - DoR):</span>
                </span>

                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-medium">
                    Hành động cụ thể kế tiếp (Next Action):
                  </label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    placeholder="VD: Mở Google Drive, xuất file PDF và soạn email"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1 font-medium">
                      Ước tính thời gian:
                    </label>
                    <div className="flex gap-1.5">
                      {[2, 15, 30, 60].map(mins => (
                        <button
                          type="button"
                          key={mins}
                          onClick={() => setEstimatedMinutes(mins)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            estimatedMinutes === mins
                              ? isCool ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-red-50 border-red-300 text-[#E0401F] font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {mins === 2 ? '<2p' : `${mins}p`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1 font-medium">
                      Phục vụ mục tiêu:
                    </label>
                    <select
                      value={selectedGoalId}
                      onChange={e => setSelectedGoalId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none shadow-xs cursor-pointer"
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
                className={`w-full py-3 px-4 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  isCool 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' 
                    : 'bg-[#E0401F] hover:bg-[#c93517] shadow-red-500/20'
                }`}
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
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">Rổ việc trống tinh tươm (Zero Inbox)!</p>
                  <p className="text-xs text-slate-500">Bạn đã xử lý hết mọi việc chờ. Tâm trí hoàn toàn thanh thản.</p>
                </div>
              ) : (
                pendingItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                        {item.nextAction && item.nextAction !== item.title && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            Bước tiếp: <span className="text-slate-900 font-semibold">{item.nextAction}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.estimatedMinutes} phút
                          </span>
                          {item.linkedGoalName && (
                            <span className={`truncate max-w-[180px] font-medium ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
                              • {item.linkedGoalName}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        {item.createdAt}
                      </span>
                    </div>

                    {/* Action buttons per GTD */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                      {item.estimatedMinutes && item.estimatedMinutes <= 2 ? (
                        <button
                          onClick={() => processInboxItem(item.id, 'done_2min')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Làm ngay (&lt;2p)</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => processInboxItem(item.id, 'schedule', { quadrant: 2 })}
                        className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Lên lịch (Ô 2)</span>
                      </button>

                      <button
                        onClick={() => processInboxItem(item.id, 'delegate')}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Ủy quyền</span>
                      </button>

                      <button
                        onClick={() => processInboxItem(item.id, 'drop')}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1 transition-colors"
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
