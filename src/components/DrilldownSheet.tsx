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
            <div className="text-xs text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
              <span>Danh sách toàn bộ các việc hôm nay:</span>
              <span className="text-blue-600 font-semibold">1 chạm: Xong • Dời • Bỏ</span>
            </div>

            {blocks.map((block) => {
              const isDone = block.status === 'done';
              const isInProgress = block.status === 'in_progress';
              const isDropped = block.status === 'dropped';
              const isExtended = block.status === 'extended';

              let statusLabel = 'Chưa đến giờ';
              let statusClass = 'bg-slate-100 text-slate-700 border-slate-200';

              if (isDone) {
                statusLabel = 'Đã xong';
                statusClass = 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
              } else if (isInProgress) {
                statusLabel = 'Đang chạy';
                statusClass = 'bg-amber-500/20 text-amber-800 border-amber-500/30 animate-pulse';
              } else if (isExtended) {
                statusLabel = 'Đã dời giờ';
                statusClass = 'bg-sky-500/20 text-blue-700 border-sky-500/30';
              } else if (isDropped) {
                statusLabel = 'Đã bỏ';
                statusClass = 'bg-rose-500/20 text-rose-700 border-rose-500/30';
              }

              return (
                <div
                  key={block.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDone 
                      ? 'bg-slate-50 border-slate-200 opacity-75' 
                      : isInProgress
                      ? 'bg-blue-50/50 border-blue-200 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {block.startTime} - {block.endTime}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusClass}`}>
                          {statusLabel}
                        </span>
                        {block.type === 'deep' && (
                          <span className="text-[10px] text-blue-600 font-medium">● Việc sâu</span>
                        )}
                      </div>
                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {block.title}
                      </h4>
                      {block.goalName && (
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Target className="w-3 h-3 text-blue-600" />
                          <span>{block.goalName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Actions: Xong, Dời, Bỏ */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100/60">
                    <button
                      onClick={() => markTaskDone(block.id)}
                      disabled={isDone}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-500/50 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                      title="Đánh dấu hoàn thành ngay (1 chạm)"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isDone ? 'Đã xong' : 'Xong'}</span>
                    </button>

                    <button
                      onClick={() => shiftTaskTime(block.id, 30)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
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
                          ? 'text-gray-600 bg-slate-50 cursor-not-allowed'
                          : 'text-slate-500 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200'
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
            <div className="text-xs text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
              <span>Danh sách các khối tập trung sâu chất lượng cao:</span>
              <span className="text-blue-600 font-semibold">{deepBlocks.length} khối</span>
            </div>

            {deepBlocks.map(block => {
              const isDone = block.status === 'done';
              return (
                <div key={block.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {profile.focusBlockDurationMins} PHÚT
                      </span>
                      <span className="text-xs text-slate-700">{block.startTime} - {block.endTime}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${isDone ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isDone ? '✓ Đã hoàn thành' : 'Đang triển khai'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{block.title}</h4>
                  {block.goalName && (
                    <p className="text-xs text-blue-600 font-medium">Mục tiêu: {block.goalName}</p>
                  )}

                  {/* 1-Tap Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => markTaskDone(block.id)}
                      disabled={isDone}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xong</span>
                    </button>
                    <button
                      onClick={() => shiftTaskTime(block.id, 30)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Dời</span>
                    </button>
                    <button
                      onClick={() => dropTask(block.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-xs flex items-center justify-center gap-1"
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
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Quỹ dự phòng:</span>
                <p className="font-bold text-amber-800 text-sm mt-0.5">
                  Đã dùng {intUsedMins} / {profile.interruptionReserveMins} phút
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Còn lại an toàn:</span>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">
                  {Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 pb-1 border-b border-slate-100">
              Nhật ký chen ngang, kèm loại việc và người kéo bạn vào:
            </div>

            {interruptions.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.timestamp}
                    </span>
                    <span className="text-xs font-bold text-amber-600">{item.minutes} phút</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.decision === 'do_now'
                      ? 'bg-amber-500/20 text-amber-800'
                      : item.decision === 'decline'
                      ? 'bg-rose-500/20 text-rose-700'
                      : item.decision === 'delegate'
                      ? 'bg-purple-500/20 text-purple-700'
                      : 'bg-indigo-500/20 text-blue-600 font-medium'
                  }`}>
                    {item.decision === 'do_now' ? 'Làm ngay (Trừ quỹ)' : item.decision === 'decline' ? 'Từ chối (Bảo vệ giờ)' : item.decision === 'delegate' ? 'Ủy quyền' : item.decision === 'go_social' ? 'Giao lưu' : 'Lên lịch'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>

                {/* Source Person */}
                <div className="p-2 rounded-lg bg-white border border-slate-100/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Người kéo vào:</span>
                  </span>
                  <span className="text-slate-900 font-medium">{item.sourcePerson || 'Đối tác bên ngoài'}</span>
                </div>

                {item.returnPoint && (
                  <p className="text-[11px] text-blue-600 font-medium bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                    <span className="font-semibold text-blue-600">Điểm quay lại: </span>
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
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 font-medium font-bold">{targetGoal.name}</span>
                  <span className="text-slate-900 font-bold">{targetGoal.progressPercent}% hoàn thành</span>
                </div>
                <p className="text-xs text-slate-700">{targetGoal.measurableResult}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${targetGoal.progressPercent}%` }} />
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 pb-1 border-b border-slate-100">
              Các việc hôm nay phục vụ mục tiêu này ({goalTasks.length} việc):
            </div>

            {goalTasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">Chưa có nhiệm vụ nào được lên lịch hôm nay cho mục tiêu này.</p>
            ) : (
              goalTasks.map(block => (
                <div key={block.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700">{block.startTime} - {block.endTime}</span>
                    <span className={`text-[11px] font-bold ${block.status === 'done' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {block.status === 'done' ? '✓ Đã xong' : 'Đang lên lịch'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{block.title}</h4>

                  {/* 1-Tap Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => markTaskDone(block.id)}
                      disabled={block.status === 'done'}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xong</span>
                    </button>
                    <button
                      onClick={() => shiftTaskTime(block.id, 30)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Dời</span>
                    </button>
                    <button
                      onClick={() => dropTask(block.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-xs flex items-center justify-center gap-1"
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
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-600 font-bold">Tổng thời gian bảo vệ:</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">+{totalProtected} phút</p>
              </div>
              <span className="text-emerald-700 text-[11px] bg-emerald-50 px-2.5 py-1 rounded-full">
                Từ chối / Ủy quyền thành công
              </span>
            </div>

            <div className="text-xs text-slate-500 pb-1 border-b border-slate-100">
              Chi tiết các yêu cầu chen ngang đã được xử lý để giữ nhịp tập trung:
            </div>

            {protectedItems.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-slate-900">{item.title}</h5>
                  <p className="text-slate-500 mt-0.5">Từ: {item.sourcePerson || 'Liên hệ ngoài'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">+{item.minutes}p bảo vệ</span>
                  <p className="text-[10px] text-gray-500 uppercase">{item.decision === 'decline' ? 'Đã từ chối' : 'Đã ủy quyền'}</p>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'admin_stat': {
        const adminData = drilldown.adminData;
        if (!adminData) return <p className="text-xs text-slate-500">Không có dữ liệu chi tiết.</p>;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div>
                <span className="text-xs text-slate-500">{adminData.title}</span>
                <p className="text-2xl font-black text-blue-600 mt-0.5">{adminData.total}</p>
              </div>
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200"
              >
                {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                <span>{isAnonymous ? 'Chế độ ẩn danh (Bật)' : 'Hiện thông tin đầy đủ'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 pb-1 border-b border-slate-100">
              Danh sách dữ liệu gốc ({adminData.items.length} bản ghi):
            </div>

            <div className="space-y-2">
              {adminData.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {isAnonymous ? `User #${idx + 101} (Ẩn danh)` : item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.detail}</div>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 font-bold border border-blue-200">
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={closeDrilldown} />

      {/* Slide-up Bottom Sheet on Mobile, Centered Card on Desktop */}
      <div className="relative bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl p-5 sm:p-6 text-slate-900 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {drilldown.title}
              </h3>
            </div>
            {drilldown.subtitle && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">{drilldown.subtitle}</p>
            )}
          </div>

          <button
            onClick={closeDrilldown}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Đóng bảng (hoặc bấm ra ngoài)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain pr-1 flex-1 space-y-4">
          {renderContent()}
        </div>

        {/* Bottom Close Button */}
        <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex justify-end">
          <button
            onClick={closeDrilldown}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium text-xs transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
