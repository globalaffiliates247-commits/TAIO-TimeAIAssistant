'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Trash2, 
  Flame, 
  Zap, 
  Target, 
  ShieldCheck, 
  User, 
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

export const DrilldownSheet: React.FC = () => {
  const { 
    drilldown, 
    closeDrilldown, 
    blocks, 
    goals, 
    interruptions, 
    profile,
    markTaskDone, 
    shiftTaskTime, 
    dropTask 
  } = useApp();

  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);

  if (!drilldown.isOpen) return null;

  // Filter tasks depending on drilldown type
  const renderContent = () => {
    switch (drilldown.type) {
      case 'tasks': {
        return (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 flex items-center justify-between pb-1 border-b border-gray-800">
              <span>Danh sách toàn bộ các việc hôm nay:</span>
              <span className="text-indigo-400 font-semibold">1 chạm: Xong • Dời • Bỏ</span>
            </div>

            {blocks.map((block) => {
              const isDone = block.status === 'done';
              const isInProgress = block.status === 'in_progress';
              const isDropped = block.status === 'dropped';
              const isExtended = block.status === 'extended';

              let statusLabel = 'Chưa đến giờ';
              let statusClass = 'bg-gray-800 text-gray-300 border-gray-700';

              if (isDone) {
                statusLabel = 'Đã xong';
                statusClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
              } else if (isInProgress) {
                statusLabel = 'Đang chạy';
                statusClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse';
              } else if (isExtended) {
                statusLabel = 'Đã dời giờ';
                statusClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
              } else if (isDropped) {
                statusLabel = 'Đã bỏ';
                statusClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
              }

              return (
                <div
                  key={block.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDone 
                      ? 'bg-gray-900/40 border-gray-800 opacity-75' 
                      : isInProgress
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300">
                          {block.startTime} - {block.endTime}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusClass}`}>
                          {statusLabel}
                        </span>
                        {block.type === 'deep' && (
                          <span className="text-[10px] text-indigo-400 font-medium">● Việc sâu</span>
                        )}
                      </div>
                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                        {block.title}
                      </h4>
                      {block.goalName && (
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <Target className="w-3 h-3 text-indigo-400" />
                          <span>{block.goalName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Actions: Xong, Dời, Bỏ */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800/60">
                    <button
                      onClick={() => markTaskDone(block.id)}
                      disabled={isDone}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isDone
                          ? 'bg-emerald-950/30 text-emerald-500/50 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                      title="Đánh dấu hoàn thành ngay (1 chạm)"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isDone ? 'Đã xong' : 'Xong'}</span>
                    </button>

                    <button
                      onClick={() => shiftTaskTime(block.id, 30)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      title="Dời lịch thêm 30 phút (1 chạm)"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Dời (+30p)</span>
                    </button>

                    <button
                      onClick={() => dropTask(block.id)}
                      disabled={isDropped}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                        isDropped
                          ? 'text-gray-600 bg-gray-900 cursor-not-allowed'
                          : 'text-gray-400 hover:text-rose-300 bg-gray-800 hover:bg-rose-950/40 border border-gray-700 hover:border-rose-800/50'
                      }`}
                      title="Bỏ qua nhiệm vụ này (1 chạm)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bỏ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'deep_work': {
        const deepBlocks = blocks.filter(b => b.type === 'deep');
        return (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 flex items-center justify-between pb-1 border-b border-gray-800">
              <span>Danh sách các khối tập trung sâu chất lượng cao:</span>
              <span className="text-indigo-400 font-semibold">{deepBlocks.length} khối</span>
            </div>

            {deepBlocks.map(block => {
              const isDone = block.status === 'done';
              return (
                <div key={block.id} className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        {profile.focusBlockDurationMins} PHÚT
                      </span>
                      <span className="text-xs text-gray-300">{block.startTime} - {block.endTime}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${isDone ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isDone ? '✓ Đã hoàn thành' : 'Đang triển khai'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{block.title}</h4>
                  {block.goalName && (
                    <p className="text-xs text-indigo-300">Mục tiêu: {block.goalName}</p>
                  )}

                  {/* 1-Tap Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => markTaskDone(block.id)}
                      disabled={isDone}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xong</span>
                    </button>
                    <button
                      onClick={() => shiftTaskTime(block.id, 30)}
                      className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sky-300 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Dời</span>
                    </button>
                    <button
                      onClick={() => dropTask(block.id)}
                      className="py-1.5 px-3 rounded-lg bg-gray-800 hover:bg-rose-900/40 text-gray-400 hover:text-rose-300 text-xs flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bỏ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'interruptions': {
        const intUsedMins = interruptions
          .filter(i => i.decision === 'do_now')
          .reduce((acc, curr) => acc + curr.minutes, 0);

        return (
          <div className="space-y-3">
            {/* Header breakdown */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400">Quỹ dự phòng:</span>
                <p className="font-bold text-amber-300 text-sm mt-0.5">
                  Đã dùng {intUsedMins} / {profile.interruptionReserveMins} phút
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Còn lại an toàn:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">
                  {Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-400 pb-1 border-b border-gray-800">
              Nhật ký chen ngang, kèm loại việc và người kéo bạn vào:
            </div>

            {interruptions.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300">
                      {item.timestamp}
                    </span>
                    <span className="text-xs font-bold text-amber-400">{item.minutes} phút</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.decision === 'do_now'
                      ? 'bg-amber-500/20 text-amber-300'
                      : item.decision === 'decline'
                      ? 'bg-rose-500/20 text-rose-300'
                      : item.decision === 'delegate'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {item.decision === 'do_now' ? 'Làm ngay (Trừ quỹ)' : item.decision === 'decline' ? 'Từ chối (Bảo vệ giờ)' : item.decision === 'delegate' ? 'Ủy quyền' : item.decision === 'go_social' ? 'Giao lưu' : 'Lên lịch'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{item.title}</h4>

                {/* Source Person */}
                <div className="p-2 rounded-lg bg-gray-950 border border-gray-800/80 flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Người kéo vào:</span>
                  </span>
                  <span className="text-white font-medium">{item.sourcePerson || 'Đối tác bên ngoài'}</span>
                </div>

                {item.returnPoint && (
                  <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/30">
                    <span className="font-semibold text-indigo-400">Điểm quay lại: </span>
                    {item.returnPoint}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      }

      case 'goal_tasks': {
        const targetGoal = goals.find(g => g.id === drilldown.goalId);
        const goalTasks = blocks.filter(b => b.goalId === drilldown.goalId);

        return (
          <div className="space-y-3">
            {targetGoal && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-bold">{targetGoal.name}</span>
                  <span className="text-white font-bold">{targetGoal.progressPercent}% hoàn thành</span>
                </div>
                <p className="text-xs text-gray-300">{targetGoal.measurableResult}</p>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${targetGoal.progressPercent}%` }} />
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 pb-1 border-b border-gray-800">
              Các việc hôm nay phục vụ mục tiêu này ({goalTasks.length} việc):
            </div>

            {goalTasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">Chưa có nhiệm vụ nào được lên lịch hôm nay cho mục tiêu này.</p>
            ) : (
              goalTasks.map(block => (
                <div key={block.id} className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">{block.startTime} - {block.endTime}</span>
                    <span className={`text-[11px] font-bold ${block.status === 'done' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {block.status === 'done' ? '✓ Đã xong' : 'Đang lên lịch'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{block.title}</h4>

                  {/* 1-Tap Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => markTaskDone(block.id)}
                      disabled={block.status === 'done'}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xong</span>
                    </button>
                    <button
                      onClick={() => shiftTaskTime(block.id, 30)}
                      className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sky-300 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Dời</span>
                    </button>
                    <button
                      onClick={() => dropTask(block.id)}
                      className="py-1.5 px-3 rounded-lg bg-gray-800 hover:bg-rose-900/40 text-gray-400 hover:text-rose-300 text-xs flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bỏ</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      }

      case 'protected_focus': {
        const protectedItems = interruptions.filter(i => i.decision === 'decline' || i.decision === 'delegate');
        const totalProtected = protectedItems.reduce((acc, curr) => acc + curr.minutes, 0);

        return (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-400 font-bold">Tổng thời gian bảo vệ:</span>
                <p className="text-xl font-black text-white mt-0.5">+{totalProtected} phút</p>
              </div>
              <span className="text-emerald-300 text-[11px] bg-emerald-900/50 px-2.5 py-1 rounded-full">
                Từ chối / Ủy quyền thành công
              </span>
            </div>

            <div className="text-xs text-gray-400 pb-1 border-b border-gray-800">
              Chi tiết các yêu cầu chen ngang đã được xử lý để giữ nhịp tập trung:
            </div>

            {protectedItems.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-white">{item.title}</h5>
                  <p className="text-gray-400 mt-0.5">Từ: {item.sourcePerson || 'Liên hệ ngoài'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400">+{item.minutes}p bảo vệ</span>
                  <p className="text-[10px] text-gray-500 uppercase">{item.decision === 'decline' ? 'Đã từ chối' : 'Đã ủy quyền'}</p>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'admin_stat': {
        const adminData = drilldown.adminData;
        if (!adminData) return <p className="text-xs text-gray-400">Không có dữ liệu chi tiết.</p>;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
              <div>
                <span className="text-xs text-gray-400">{adminData.title}</span>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">{adminData.total}</p>
              </div>
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 border border-gray-700"
              >
                {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                <span>{isAnonymous ? 'Chế độ ẩn danh (Bật)' : 'Hiện thông tin đầy đủ'}</span>
              </button>
            </div>

            <div className="text-xs text-gray-400 pb-1 border-b border-gray-800">
              Danh sách dữ liệu gốc ({adminData.items.length} bản ghi):
            </div>

            <div className="space-y-2">
              {adminData.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">
                      {isAnonymous ? `User #${idx + 101} (Ẩn danh)` : item.label}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{item.detail}</div>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={closeDrilldown} />

      {/* Slide-up Bottom Sheet on Mobile, Centered Card on Desktop */}
      <div className="relative bg-[#121620] border border-gray-800 rounded-t-3xl sm:rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl p-5 sm:p-6 text-white border-t border-indigo-500/40 sm:border animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                {drilldown.title}
              </h3>
            </div>
            {drilldown.subtitle && (
              <p className="text-xs text-indigo-300 mt-0.5">{drilldown.subtitle}</p>
            )}
          </div>

          <button
            onClick={closeDrilldown}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Đóng bảng (hoặc bấm ra ngoài)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {renderContent()}
        </div>

        {/* Bottom Close Button */}
        <div className="pt-4 border-t border-gray-800 mt-4 shrink-0 flex justify-end">
          <button
            onClick={closeDrilldown}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-xs transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
