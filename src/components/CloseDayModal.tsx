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
    setExportModalOpen,
    palette
  } = useApp();

  const isCool = palette === 'cool';

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
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl p-5 sm:p-7 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
              isCool 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-red-50 border-red-200 text-[#E0401F]'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Đóng ngày làm việc (Close the Day)</h3>
              </div>
              <p className="text-xs text-slate-500">Quy trình 2 phút • Dời việc có chủ đích • Chuẩn bị ngày mai</p>
            </div>
          </div>
          <button 
            onClick={() => setCloseDayModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Quick Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Kết quả hôm nay của bạn:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[11px] block">Nhiệm vụ hoàn thành:</span>
                <p className="font-extrabold text-emerald-600 text-sm mt-0.5">{completedBlocks.length} khối việc</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[11px] block">Tập trung chất lượng:</span>
                <p className={`font-extrabold text-sm mt-0.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
                  150 phút việc sâu
                </p>
              </div>
            </div>
          </div>

          {/* Unplanned on goal trade-off notice (PRD .2) */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ghi nhận thời gian ngoài kế hoạch (.2):</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90 pl-5">
              Hôm nay có 45 phút việc mục tiêu ngoài kế hoạch; Kênh nội dung AI bị đẩy lùi 45 phút. Đã cân bằng lại kế hoạch.
            </p>
          </div>

          {/* Carry-over (Migration) for uncompleted Daily Card items (PRD .3) */}
          {pendingCardItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dời việc còn lại sang ngày mai (Bullet Journal Migration):</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">{pendingCardItems.length} việc chưa gạch</span>
              </div>

              <div className="space-y-2">
                {pendingCardItems.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs shadow-xs">
                    <span className="text-slate-800 font-medium truncate flex-1">{item.text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => carryOverItem(item.id, 'tomorrow')}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold text-[10px] transition-colors"
                        title="Dời sang thẻ ngày mai"
                      >
                        Ngày mai
                      </button>
                      <button
                        onClick={() => carryOverItem(item.id, 'leave')}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] transition-colors"
                        title="Để lại thẻ hôm nay"
                      >
                        Để lại
                      </button>
                      <button
                        onClick={() => carryOverItem(item.id, 'drop')}
                        className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-[10px] transition-colors"
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
                <Target className="w-4 h-4 shrink-0" />
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-xs placeholder:text-slate-400"
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gắn với mục tiêu:</label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none shadow-xs cursor-pointer"
              >
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lock Reminder */}
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sau khi khóa ngày, hệ thống sẽ bảo vệ giấc ngủ và nhắc nhở đúng giờ nghỉ ngơi ({profile.personalAnchors.windDownTime}).
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setCloseDayModalOpen(false);
                setExportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              title="Xuất snapshot Markdown cho trợ lý AI"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Xuất AI</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCloseDayModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Để sau
              </button>
              <button
                onClick={onConfirmClose}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                  isCool
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-[#E0401F] hover:bg-[#c93517] shadow-red-500/20'
                }`}
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
