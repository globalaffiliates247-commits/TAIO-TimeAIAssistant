'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  Sparkles, 
  Volume2, 
  Compass, 
  X 
} from 'lucide-react';

export const CheckInModal: React.FC = () => {
  const { 
    checkInModalOpen, 
    setCheckInModalOpen, 
    checkInBlock, 
    handleCheckInAnswer, 
    toneLevel 
  } = useApp();

  const [returnPointInput, setReturnPointInput] = useState<string>('');
  const [selectedExtraMins, setSelectedExtraMins] = useState<number>(15);
  const [showStopSubsheet, setShowStopSubsheet] = useState<boolean>(false);

  if (!checkInModalOpen || !checkInBlock) return null;

  // Question wording based on Tone Level (PRD B13)
  const getQuestionText = () => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const blockTitle = checkInBlock.title;
    const goalName = checkInBlock.goalName ? `, Mục tiêu: ${checkInBlock.goalName}` : '';

    if (toneLevel === 1) {
      // Gentle
      return `Đã đến ${timeNow}. Khối làm việc "${blockTitle}" vừa kết thúc, tiến độ diễn ra êm đẹp chứ?`;
    } else if (toneLevel === 2) {
      // Clear
      return `Hiện là ${timeNow}. Bạn đã hoàn thành nhiệm vụ "${blockTitle}" (60 phút${goalName}) chưa?`;
    } else if (toneLevel === 3) {
      // Firm
      return `Đã qua ${timeNow}. Khối "${blockTitle}" cần xác nhận ngay để không ảnh hưởng mốc tiếp theo.`;
    }
    // Auto
    return `Hiện là ${timeNow}. Bạn đã hoàn thành nhiệm vụ "${blockTitle}" chưa?`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#121620] border border-gray-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white border-t border-indigo-500/30 sm:border">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
              Điểm kiểm tra tự động (Automatic Check-in)
            </h3>
          </div>
          <button 
            onClick={() => setCheckInModalOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Question */}
        <div className="mb-6">
          <p className="text-base sm:text-lg font-bold text-gray-100 leading-snug">
            {getQuestionText()}
          </p>
          {checkInBlock.goalName && (
            <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
              Thuộc: {checkInBlock.goalName}
            </span>
          )}
        </div>

        {!showStopSubsheet ? (
          <div className="space-y-3">
            {/* Answer 1: Done */}
            <button
              onClick={() => handleCheckInAnswer('done')}
              className="w-full p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>Đã xong! (Done)</span>
              </div>
              <span className="text-xs bg-emerald-700/60 px-2.5 py-1 rounded-md font-medium">
                Ghi nhận tiến độ + chúc mừng
              </span>
            </button>

            {/* Answer 2: Need more time */}
            <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Cần thêm thời gian:</span>
                </span>
                <span className="text-gray-400">Gia hạn và tiếp tục</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => handleCheckInAnswer('more_time', mins)}
                    className="py-2 rounded-lg bg-gray-800 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-300 border border-gray-700 text-xs font-bold transition-all text-gray-200"
                  >
                    +{mins} phút
                  </button>
                ))}
              </div>
            </div>

            {/* Answer 3: Stop here */}
            <button
              onClick={() => setShowStopSubsheet(true)}
              className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <PauseCircle className="w-4 h-4 text-gray-400" />
              <span>Dừng tại đây (Chưa xong hết / Lưu điểm quay lại)</span>
            </button>
          </div>
        ) : (
          /* Subsheet for Stopping */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
              <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>Lưu điểm quay lại (để khi tiếp tục biết ngay làm gì):</span>
              </label>
              <input
                type="text"
                value={returnPointInput}
                onChange={e => setReturnPointInput(e.target.value)}
                placeholder="Ví dụ: Đã viết xong mục 1, 2; còn mục 3..."
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowStopSubsheet(false)}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs"
              >
                Quay lại
              </button>
              <button
                onClick={() => handleCheckInAnswer('stop_here')}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md"
              >
                Xác nhận dừng & lưu
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
