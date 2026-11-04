'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Clock, 
  MapPin, 
  Bot, 
  Check, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Radio, 
  Dumbbell, 
  Briefcase, 
  Car, 
  Coffee,
  AlertCircle
} from 'lucide-react';
import { InterruptionActivityCategory, ItemOrigin, SavedPlace } from '../types';

export const ActiveCaptureModal: React.FC = () => {
  const { 
    isActiveCaptureOpen, 
    setIsActiveCaptureOpen,
    savedPlaces,
    passiveSuggestions,
    acceptPassiveSuggestion,
    ignorePassiveSuggestion,
    backfillTime,
    savePlace,
    togglePlaceLocation,
    goals,
    blocks,
    palette
  } = useApp();

  const isCool = palette === 'cool';

  const [activeTab, setActiveTab] = useState<'backfill' | 'suggestions' | 'places'>('backfill');

  // Backfill Form State
  const [bfStartTime, setBfStartTime] = useState('13:00');
  const [bfEndTime, setBfEndTime] = useState('16:00');
  const [bfCategory, setBfCategory] = useState<InterruptionActivityCategory>('work_came_up');
  const [bfGoalId, setBfGoalId] = useState<string>('');
  const [bfOrigin, setBfOrigin] = useState<ItemOrigin>('unplanned_goal');
  const [bfDisplacedBlock, setBfDisplacedBlock] = useState<string>('Quay video chia sẻ #TAIOCLUB');
  const [bfNote, setBfNote] = useState('Tập trung hoàn thiện các tính năng mới');

  if (!isActiveCaptureOpen) return null;

  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return diff;
    } catch {
      return 60;
    }
  };

  const handleBackfillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = calculateDuration(bfStartTime, bfEndTime);
    backfillTime({
      date: new Date().toISOString().split('T')[0],
      startTime: bfStartTime,
      endTime: bfEndTime,
      durationMins: duration,
      category: bfCategory,
      goalId: bfGoalId || undefined,
      origin: bfOrigin,
      displacedBlockTitle: bfDisplacedBlock || undefined,
      note: bfNote.trim(),
    });
    setIsActiveCaptureOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs border ${
              isCool 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-red-50 border-red-200 text-[#E0401F]'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Thu thập chủ động & Ghi bù</h2>
              </div>
              <p className="text-[11px] text-slate-500">
                Ghi bù thời gian đã qua • Đoạn thời gian AI đoán sẵn • Địa điểm Geofencing
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsActiveCaptureOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Ghi bù | AI đoán sẵn | Địa điểm Geofence */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-5 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('backfill')}
            className={`pb-2.5 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'backfill'
                ? isCool ? 'border-blue-600 text-blue-600' : 'border-[#E0401F] text-[#E0401F]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>1. Ghi bù (Backfill)</span>
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`pb-2.5 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-all relative ${
              activeTab === 'suggestions'
                ? isCool ? 'border-blue-600 text-blue-600' : 'border-[#E0401F] text-[#E0401F]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>2. AI đoán sẵn</span>
            {passiveSuggestions.filter(s => s.status === 'pending').length > 0 && (
              <span className={`w-2 h-2 rounded-full inline-block ${isCool ? 'bg-blue-600' : 'bg-[#E0401F]'}`} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`pb-2.5 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'places'
                ? isCool ? 'border-blue-600 text-blue-600' : 'border-[#E0401F] text-[#E0401F]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>3. Địa điểm Geofence</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 bg-white">
          
          {/* TAB 1: GHI BÙ (BACKFILL) */}
          {activeTab === 'backfill' && (
            <form onSubmit={handleBackfillSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">Nguyên tắc:</strong> Bạn đã làm việc nhưng quên bật app? Hãy ghi bù lại khoảng thời gian thực tế đã qua để giữ trọn vẹn số liệu Sổ cái 24 giờ.
                </span>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Từ giờ (Bắt đầu)</label>
                  <input
                    type="time"
                    value={bfStartTime}
                    onChange={(e) => setBfStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Đến giờ (Kết thúc)</label>
                  <input
                    type="time"
                    value={bfEndTime}
                    onChange={(e) => setBfEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
                    required
                  />
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 font-medium">
                Tổng thời lượng ghi bù: <strong className="text-slate-900 font-bold">{calculateDuration(bfStartTime, bfEndTime)} phút</strong>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nhóm hoạt động</label>
                <select
                  value={bfCategory}
                  onChange={(e) => setBfCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs cursor-pointer"
                >
                  <option value="work_came_up">Công việc phát sinh (Work came up)</option>
                  <option value="research">Nghiên cứu / Đọc tài liệu (Research)</option>
                  <option value="exercise">Tập thể dục / Gym / Thể thao (Exercise)</option>
                  <option value="travel">Di chuyển trên đường (Travel)</option>
                  <option value="calls">Gọi điện & Họp đột xuất (Calls & Meetings)</option>
                  <option value="family">Việc gia đình (Family matter)</option>
                  <option value="eating">Ăn uống (Eating & drinks)</option>
                  <option value="other">Hoạt động khác (Other)</option>
                </select>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nguồn gốc thời gian (Origin)</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setBfOrigin('unplanned_goal')}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      bfOrigin === 'unplanned_goal' 
                        ? isCool ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-red-50 border-red-300 text-red-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-900">Phát sinh vì mục tiêu</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Không có trong KH nhưng phục vụ mục tiêu lớn</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBfOrigin('interruption')}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      bfOrigin === 'interruption' 
                        ? 'bg-amber-50 border-amber-300 text-amber-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-900">Việc gián đoạn ngoài MT</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Trừ vào quỹ dự phòng gián đoạn</p>
                  </button>
                </div>
              </div>

              {/* Goal link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phục vụ mục tiêu nào?</label>
                <select
                  value={bfGoalId}
                  onChange={(e) => setBfGoalId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs cursor-pointer"
                >
                  <option value="">Ngoài các mục tiêu chính</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Displaced item notice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Khoảng thời gian này đã chiếm chỗ của nhiệm vụ nào?</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quay video chia sẻ, Họp tuần..."
                  value={bfDisplacedBlock}
                  onChange={(e) => setBfDisplacedBlock(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs placeholder:text-slate-400"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nội dung chi tiết việc đã làm</label>
                <textarea
                  rows={2}
                  value={bfNote}
                  onChange={(e) => setBfNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                    isCool 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' 
                      : 'bg-[#E0401F] hover:bg-[#c83515] shadow-red-500/20'
                  }`}
                >
                  Xác nhận Ghi bù vào Sổ cái & Thẻ ngày
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: AI ĐOÁN SẴN (PASSIVE SUGGESTIONS) */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">Nguyên tắc:</strong> App tự động tổng hợp các đoạn thời gian từ công cụ AI, Geofence địa điểm và lịch trình. Bạn chỉ cần bấm 1 chạm để xác nhận hoặc bỏ qua.
                </span>
              </div>

              <div className="space-y-3">
                {passiveSuggestions.map(s => {
                  const isPending = s.status === 'pending';
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isPending 
                          ? 'bg-white border-slate-200 shadow-xs' 
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {s.startTime} - {s.endTime} ({s.durationMins} phút)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Nguồn: {s.source === 'ai_tool_timestamp' ? 'AI Assistant Timestamp' : 'Geofence Vị trí'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {s.suggestedActivity}
                          </h4>
                          {s.goalName && (
                            <p className="text-xs text-[#E0401F] mt-0.5 font-medium">
                              → Gắn với: {s.goalName}
                            </p>
                          )}
                        </div>
                      </div>

                      {isPending ? (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => ignorePassiveSuggestion(s.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                          >
                            Bỏ qua
                          </button>
                          <button
                            type="button"
                            onClick={() => acceptPassiveSuggestion(s.id)}
                            className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors ${
                              isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Xác nhận ghi nhận</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          Trạng thái: {s.status === 'accepted' ? 'Đã ghi nhận vào Sổ cái' : 'Đã bỏ qua'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ĐỊA ĐIỂM GEOFENCE (PLACES & IF-THEN RULES) */}
          {activeTab === 'places' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Bảo mật tuyệt đối:</strong> Vị trí chỉ được xử lý cục bộ trên thiết bị (Local on-device). Bán kính tối thiểu 100m – 150m để tiết kiệm pin tối đa.
                </div>
              </div>

              <div className="space-y-3">
                {savedPlaces.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                          {p.isCurrentLocation && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                              Đang ở đây
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.address} • Bán kính {p.radiusMeters}m</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePlaceLocation(p.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          p.isCurrentLocation
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {p.isCurrentLocation ? 'Rời vị trí' : 'Mô phỏng đến đây'}
                      </button>
                    </div>

                    {/* If-then Rules */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500">Quy tắc tự động If-Then:</span>
                      {p.rules.map(r => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                        >
                          <span className={`font-bold shrink-0 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
                            Khi {r.trigger === 'arrive' ? 'ĐẾN' : 'RỜI'}:
                          </span>
                          <span className="flex-1 truncate font-medium">
                            {r.actionType === 'remind_task' ? `Nhắc việc "${r.taskTitle}"` :
                             r.actionType === 'auto_done' ? `Tự động xong "${r.taskTitle}"` :
                             `Mở đoạn thời gian "${r.taskTitle}"`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
