'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Moon, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  X,
  ShieldCheck,
  RotateCw,
  Share2,
  AlertTriangle
} from 'lucide-react';

export const CloseDayModal: React.FC = () => {
  const { 
    closeDayModalOpen, 
    setCloseDayModalOpen, 
    blocks, 
    goals, 
    handleCloseDay,
    profile,
    dailyCardItems,
    carryOverItem,
    setExportModalOpen
  } = useApp();

  const [tomorrowTask, setTomorrowTask] = useState<string>('Thực hiện đợt thử nghiệm Founder 14 ngày & thu thập phản hồi');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');

  if (!closeDayModalOpen) return null;

  const completedBlocks = blocks.filter(b => b.status === 'done');
  const todayDateStr = new Date().toISOString().split('T')[0];
  const pendingCardItems = dailyCardItems.filter(i => i.date === todayDateStr && i.status === 'open');

  const onConfirmClose = () => {
    if (!tomorrowTask.trim()) {
      alert('Vui lòng chọn việc quan trọng số 1 cho ngày mai!');
      return;
    }
    handleCloseDay(tomorrowTask);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50/95 border border-slate-100 backdrop-blur-2xl rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-orange-950/80 border border-orange-500/30 text-orange-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Đóng ngày làm việc (Close the Day)</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800/40">
                  PRD v0.3.1 B25
                </span>
              </div>
              <p className="text-xs text-slate-500">Quy trình 2 phút • Dời việc có chủ đích • Chuẩn bị ngày mai</p>
            </div>
          </div>
          <button 
            onClick={() => setCloseDayModalOpen(false)}
            className="text-slate-500 hover:text-slate-900 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Quick Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-100/60 border border-slate-200/60 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kết quả hôm nay của bạn:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-500 text-[11px]">Nhiệm vụ hoàn thành:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">{completedBlocks.length} khối việc</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-500 text-[11px]">Tập trung chất lượng:</span>
                <p className="font-bold text-orange-400 text-sm mt-0.5">150 phút việc sâu</p>
              </div>
            </div>
          </div>

          {/* Unplanned on goal trade-off notice (PRD B25.2) */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Ghi nhận thời gian ngoài kế hoạch (B25.2):</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Hôm nay có 45 phút việc mục tiêu ngoài kế hoạch; Kênh nội dung AI bị đẩy lùi 45 phút. Đã cân bằng lại kế hoạch.
            </p>
          </div>

          {/* Carry-over (Migration) for uncompleted Daily Card items (PRD B25.3) */}
          {pendingCardItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dời việc còn lại sang ngày mai (Bullet Journal Migration):</span>
                </label>
                <span className="text-[10px] text-slate-500">{pendingCardItems.length} việc chưa gạch</span>
              </div>

              <div className="space-y-2">
                {pendingCardItems.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-200 truncate flex-1">{item.text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => carryOverItem(item.id, 'tomorrow')}
                        className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold text-[10px]"
                        title="Dời sang thẻ ngày mai"
                      >
                        Ngày mai
                      </button>
                      <button
                        onClick={() => carryOverItem(item.id, 'leave')}
                        className="px-2 py-1 rounded bg-slate-100 text-slate-500 hover:text-slate-900 text-[10px]"
                        title="Để lại thẻ hôm nay"
                      >
                        Để lại
                      </button>
                      <button
                        onClick={() => carryOverItem(item.id, 'drop')}
                        className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px]"
                        title="Bỏ qua"
                      >
                        Bỏ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Top Task (PRD B10) */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 space-y-3">
            <div>
              <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>Việc quan trọng số 1 của ngày mai (Tomorrow's Top Task):</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chọn đúng 1 điều bạn sẽ làm đầu tiên vào sáng mai để tạo đà chiến thắng.
              </p>
            </div>

            <input
              type="text"
              value={tomorrowTask}
              onChange={e => setTomorrowTask(e.target.value)}
              placeholder="Nhập nhiệm vụ hàng đầu của ngày mai..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gắn với mục tiêu:</label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-200 text-xs text-slate-900 focus:outline-none"
              >
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lock Reminder */}
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Sau khi khóa ngày, hệ thống sẽ bảo vệ giấc ngủ và nhắc nhở đúng giờ nghỉ ngơi ({profile.personalAnchors.windDownTime}).
            </span>
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setCloseDayModalOpen(false);
                setExportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-700 text-orange-400 text-xs font-semibold border border-slate-200"
              title="Xuất snapshot Markdown cho trợ lý AI (B24)"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Xuất AI (B24)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCloseDayModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
              >
                Để sau
              </button>
              <button
                onClick={onConfirmClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#c83516] hover:to-orange-600 text-slate-900 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Khóa ngày & Hoàn tất</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
