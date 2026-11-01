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
  ShieldCheck
} from 'lucide-react';

export const CloseDayModal: React.FC = () => {
  const { 
    closeDayModalOpen, 
    setCloseDayModalOpen, 
    blocks, 
    goals, 
    handleCloseDay,
    profile 
  } = useApp();

  const [tomorrowTask, setTomorrowTask] = useState<string>('Thực hiện đợt thử nghiệm Founder 14 ngày & thu thập phản hồi');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');

  if (!closeDayModalOpen) return null;

  const completedBlocks = blocks.filter(b => b.status === 'done');

  const onConfirmClose = () => {
    if (!tomorrowTask.trim()) {
      alert('Vui lòng chọn việc quan trọng số 1 cho ngày mai!');
      return;
    }
    handleCloseDay(tomorrowTask);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Đóng ngày làm việc (Close the Day)</h3>
              <p className="text-xs text-gray-400">Quy trình 2 phút • Khóa tổng kết ngày • Chuẩn bị ngày mai</p>
            </div>
          </div>
          <button 
            onClick={() => setCloseDayModalOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Quick Summary Card */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Kết quả hôm nay của bạn:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-lg bg-gray-800/80">
                <span className="text-gray-400">Nhiệm vụ hoàn thành:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">{completedBlocks.length} khối</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-800/80">
                <span className="text-gray-400">Tập trung chất lượng:</span>
                <p className="font-bold text-indigo-400 text-sm mt-0.5">150 phút</p>
              </div>
            </div>
          </div>

          {/* Tomorrow's Top Task (PRD B10) */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-3">
            <div>
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Việc quan trọng số 1 của ngày mai (Tomorrow's Top Task):</span>
              </label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Chọn đúng 1 điều bạn sẽ làm đầu tiên vào sáng mai để tạo đà chiến thắng.
              </p>
            </div>

            <input
              type="text"
              value={tomorrowTask}
              onChange={e => setTomorrowTask(e.target.value)}
              placeholder="Nhập nhiệm vụ hàng đầu của ngày mai..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none focus:border-indigo-500"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Gắn với mục tiêu:</label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none"
              >
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lock Reminder */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Sau khi khóa ngày, hệ thống sẽ bảo vệ giấc ngủ và nhắc nhở đúng giờ nghỉ ngơi ({profile.personalAnchors.windDownTime}).
            </span>
          </div>

          {/* Action */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setCloseDayModalOpen(false)}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs"
            >
              Để sau
            </button>
            <button
              onClick={onConfirmClose}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Khóa ngày & Hoàn tất</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
