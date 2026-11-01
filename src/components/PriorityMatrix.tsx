'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TimeBlock } from '../types';
import { 
  Flame, 
  Target, 
  Users, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const PriorityMatrix: React.FC = () => {
  const { 
    blocks, 
    moveTaskQuadrant, 
    markTaskDone, 
    dropTask, 
    addNewBlock, 
    goals, 
    openDrilldown,
    language 
  } = useApp();

  const [showEduCard, setShowEduCard] = useState<boolean>(true);
  const [quickAddQuadrant, setQuickAddQuadrant] = useState<1 | 2 | 3 | 4 | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddMinutes, setQuickAddMinutes] = useState(45);
  const [quickAddGoalId, setQuickAddGoalId] = useState<string>('');

  // Partition blocks into 4 quadrants
  const q1Tasks = blocks.filter(b => b.quadrant === 1);
  const q2Tasks = blocks.filter(b => b.quadrant === 2);
  const q3Tasks = blocks.filter(b => b.quadrant === 3);
  const q4Tasks = blocks.filter(b => b.quadrant === 4);

  // Time calculations
  const getTime = (taskList: TimeBlock[]) => taskList.reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);
  const q1Time = getTime(q1Tasks);
  const q2Time = getTime(q2Tasks);
  const q3Time = getTime(q3Tasks);
  const q4Time = getTime(q4Tasks);
  const totalTime = q1Time + q2Time + q3Time + q4Time || 1;

  const q1Pct = Math.round((q1Time / totalTime) * 100);
  const q2Pct = Math.round((q2Time / totalTime) * 100);
  const q3Pct = Math.round((q3Time / totalTime) * 100);
  const q4Pct = Math.round((q4Time / totalTime) * 100);

  // Balance assessment
  let balanceStatus = 'healthy';
  let balanceMessage = 'Phân bổ thời gian rất lành mạnh: Bạn dành phần lớn công sức cho mục tiêu dài hạn (Q2)!';
  if (q1Pct > 40) {
    balanceStatus = 'firefighting';
    balanceMessage = 'Cảnh báo "Chữa cháy": Quá nhiều thời gian cho việc khẩn cấp Q1. Hãy giảm áp lực bằng cách lên kế hoạch sớm hơn ở Q2.';
  } else if (q3Pct > 30) {
    balanceStatus = 'distracted';
    balanceMessage = 'Cảnh báo "Bị lôi kéo": Việc khẩn nhưng ít quan trọng (Q3) đang chiếm nhiều thì giờ. Hãy ủy quyền hoặc từ chối bớt.';
  } else if (q4Pct > 20) {
    balanceStatus = 'waste';
    balanceMessage = 'Nhiều việc ở Q4 không phục vụ mục tiêu nào. Hãy mạnh dạn xóa bỏ hoặc xếp vào thời gian rảnh rỗi.';
  }

  const handleQuickAdd = (quadrant: 1 | 2 | 3 | 4) => {
    if (!quickAddTitle.trim()) return;
    const selectedGoal = goals.find(g => g.id === quickAddGoalId);
    addNewBlock({
      title: quickAddTitle.trim(),
      startTime: '16:00',
      endTime: '17:00',
      type: quadrant === 1 || quadrant === 2 ? 'deep' : 'personal',
      status: 'planned',
      quadrant,
      isImportant: quadrant === 1 || quadrant === 2,
      isUrgent: quadrant === 1 || quadrant === 3,
      estimatedMinutes: Number(quickAddMinutes) || 45,
      goalId: selectedGoal ? selectedGoal.id : undefined,
      goalName: selectedGoal ? selectedGoal.name : undefined,
      ageDays: 1,
    });
    setQuickAddTitle('');
    setQuickAddQuadrant(null);
  };

  const renderQuadrantCard = (
    quadrantNum: 1 | 2 | 3 | 4,
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    tasks: TimeBlock[],
    timeMins: number,
    percentage: number,
    colorClasses: {
      border: string;
      bg: string;
      headerBg: string;
      badge: string;
      text: string;
    }
  ) => {
    return (
      <div className={`rounded-2xl border ${colorClasses.border} ${colorClasses.bg} p-4 sm:p-5 flex flex-col justify-between shadow-lg relative transition-all`}>
        {/* Quadrant Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${colorClasses.headerBg}`}>
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">
                    Q{quadrantNum}
                  </span>
                  <h3 className={`text-base font-bold ${colorClasses.text}`}>{title}</h3>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              </div>
            </div>

            {/* WYSIWYG drilldown trigger button */}
            <button
              onClick={() => openDrilldown({
                type: 'tasks',
                title: `Chi tiết Q${quadrantNum}: ${title} (${tasks.length} việc)`,
                subtitle: `Các công việc thuộc góc phần tư Q${quadrantNum}`
              })}
              title="Bấm để xem danh sách chi tiết (WYSIWYG)"
              className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-right cursor-pointer group"
            >
              <div className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors">
                {tasks.length} việc
              </div>
              <div className="text-[10px] text-gray-400 font-medium">
                {timeMins}p ({percentage}%)
              </div>
            </button>
          </div>

          {/* Quick add trigger button */}
          <div className="flex items-center justify-between mb-3 mt-1">
            <span className="text-[11px] text-gray-400 font-medium">
              {quadrantNum === 1 && 'Khủng hoảng & Hạn chót gấp'}
              {quadrantNum === 2 && 'Trọng tâm phát triển dài hạn'}
              {quadrantNum === 3 && 'Việc của người khác / Họp vụn'}
              {quadrantNum === 4 && 'Việc thừa / Cần loại bỏ'}
            </span>
            <button
              onClick={() => setQuickAddQuadrant(quickAddQuadrant === quadrantNum ? null : quadrantNum)}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg transition-colors border border-indigo-500/30"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm nhanh
            </button>
          </div>

          {/* Inline Quick Add Form */}
          {quickAddQuadrant === quadrantNum && (
            <div className="p-3 mb-3 bg-black/50 border border-indigo-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
              <input
                type="text"
                placeholder="Tên công việc mới..."
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(quadrantNum); }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Phút"
                  value={quickAddMinutes}
                  onChange={(e) => setQuickAddMinutes(Number(e.target.value))}
                  className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <select
                  value={quickAddGoalId}
                  onChange={(e) => setQuickAddGoalId(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none"
                >
                  <option value="">-- Thuộc mục tiêu nào? --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleQuickAdd(quadrantNum)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  Lưu
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 italic bg-black/20 rounded-xl border border-dashed border-gray-800">
                Chưa có việc nào ở góc phần tư này
              </div>
            ) : (
              tasks.map(task => {
                const isOverdueAging = (task.ageDays || 0) > 7;
                return (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800/80 rounded-xl transition-all shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                            {task.title}
                          </p>
                          {isOverdueAging && (
                            <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Tồn {task.ageDays} ngày
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-gray-400">
                          {task.goalName ? (
                            <span className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40 truncate max-w-[150px]">
                              {task.goalName}
                            </span>
                          ) : (
                            <span className="text-gray-400 bg-gray-800/60 px-1.5 py-0.5 rounded">
                              Ngoài mục tiêu
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-gray-400 font-mono">
                            <Clock className="w-3 h-3" /> {task.estimatedMinutes || 60}p
                          </span>
                        </div>
                      </div>

                      {/* 1-tap Done button */}
                      <button
                        onClick={() => markTaskDone(task.id)}
                        title="Đánh dấu hoàn thành"
                        className="p-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Move Quadrant Row */}
                    <div className="mt-2.5 pt-2 border-t border-gray-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 font-medium">Chuyển góc:</span>
                      <div className="flex items-center gap-1">
                        {quadrantNum !== 1 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 1)}
                            className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 hover:bg-red-900/80 border border-red-800/40"
                            title="Chuyển sang Q1: Làm ngay"
                          >
                            Q1
                          </button>
                        )}
                        {quadrantNum !== 2 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 2)}
                            className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 hover:bg-blue-900/80 border border-blue-800/40"
                            title="Chuyển sang Q2: Lên lịch"
                          >
                            Q2
                          </button>
                        )}
                        {quadrantNum !== 3 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 3)}
                            className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-800/40"
                            title="Chuyển sang Q3: Ủy quyền"
                          >
                            Q3
                          </button>
                        )}
                        {quadrantNum !== 4 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 4)}
                            className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                            title="Chuyển sang Q4: Bỏ qua"
                          >
                            Q4
                          </button>
                        )}
                        <button
                          onClick={() => dropTask(task.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-400 ml-1"
                          title="Xóa bỏ việc này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Educational Card: Eisenhower / Stephen Covey explanation */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/70 via-gray-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Ma trận Ưu tiên Eisenhower (Stephen Covey)
                <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  PRD v0.11 B16
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                Phân loại công việc theo <strong className="text-white">Tầm quan trọng</strong> và <strong className="text-white">Tính khẩn cấp</strong> để thoát khỏi vòng xoáy chữa cháy.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEduCard(!showEduCard)}
            className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10"
            title={showEduCard ? 'Thu gọn giải thích' : 'Mở rộng giải thích'}
          >
            {showEduCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showEduCard && (
          <div className="mt-4 pt-4 border-t border-indigo-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-300">
            <div className="p-3 bg-red-950/30 border border-red-800/30 rounded-xl">
              <span className="font-bold text-red-400 block mb-1">Q1: Làm ngay</span>
              Khẩn cấp + Quan trọng. Khủng hoảng, hạn chót sát nút. Cần giải quyết ngay lập tức.
            </div>
            <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-xl ring-1 ring-blue-500/40">
              <span className="font-bold text-blue-400 block mb-1">Q2: Lên lịch (Trọng tâm)</span>
              Không khẩn + Quan trọng. Lập kế hoạch, rèn luyện, việc sâu dài hạn. Càng dành nhiều thời gian cho Q2, bạn càng bớt rơi vào Q1.
            </div>
            <div className="p-3 bg-amber-950/30 border border-amber-800/30 rounded-xl">
              <span className="font-bold text-amber-400 block mb-1">Q3: Cắt gọn / Ủy quyền</span>
              Khẩn cấp + Không quan trọng. Cuộc gọi gián đoạn, việc nhờ vả của người khác. Cần giao việc hoặc nói không khéo léo.
            </div>
            <div className="p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl">
              <span className="font-bold text-gray-300 block mb-1">Q4: Bỏ qua / Loại trừ</span>
              Không khẩn + Không quan trọng. Lướt mạng vô bổ, việc thừa. Cần dũng cảm loại bỏ khỏi lịch trình.
            </div>
          </div>
        )}
      </div>

      {/* Balance Signal Bar (Thanh tín hiệu cân bằng) */}
      <div className="p-4 sm:p-5 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Tín hiệu Cân bằng Phân bổ Thời gian
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{balanceMessage}</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-red-400 font-bold">Q1: {q1Pct}%</span>
            <span className="text-blue-400 font-extrabold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">Q2: {q2Pct}%</span>
            <span className="text-amber-400 font-bold">Q3: {q3Pct}%</span>
            <span className="text-gray-400 font-bold">Q4: {q4Pct}%</span>
          </div>
        </div>

        {/* Progress bar split */}
        <div className="w-full h-3.5 bg-gray-950 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-gray-800">
          <div 
            style={{ width: `${q1Pct}%` }} 
            className="h-full bg-red-500 rounded-l-full transition-all" 
            title={`Q1 Khẩn cấp: ${q1Pct}% (${q1Time} phút)`}
          />
          <div 
            style={{ width: `${q2Pct}%` }} 
            className="h-full bg-blue-500 transition-all" 
            title={`Q2 Trọng tâm dài hạn: ${q2Pct}% (${q2Time} phút)`}
          />
          <div 
            style={{ width: `${q3Pct}%` }} 
            className="h-full bg-amber-500 transition-all" 
            title={`Q3 Ủy quyền: ${q3Pct}% (${q3Time} phút)`}
          />
          <div 
            style={{ width: `${q4Pct}%` }} 
            className="h-full bg-gray-600 rounded-r-full transition-all" 
            title={`Q4 Loại bỏ: ${q4Pct}% (${q4Time} phút)`}
          />
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-mono">
          <span>Khuyến nghị mục tiêu: Q2 &ge; 60%</span>
          <span>Tổng số phút: {totalTime} phút ({blocks.length} đầu việc)</span>
        </div>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Q1: Do Now */}
        {renderQuadrantCard(
          1,
          'Làm ngay (Do Now)',
          'Quan trọng & Khẩn cấp',
          <Flame className="w-5 h-5 text-red-400" />,
          q1Tasks,
          q1Time,
          q1Pct,
          {
            border: 'border-red-500/40',
            bg: 'bg-red-950/20',
            headerBg: 'bg-red-950/80 text-red-400 border border-red-700/40',
            badge: 'bg-red-900/60 text-red-300',
            text: 'text-red-300'
          }
        )}

        {/* Q2: Schedule */}
        {renderQuadrantCard(
          2,
          'Lên lịch (Schedule)',
          'Quan trọng & Không khẩn cấp (Khuyến nghị ưu tiên)',
          <Target className="w-5 h-5 text-blue-400" />,
          q2Tasks,
          q2Time,
          q2Pct,
          {
            border: 'border-blue-500/50 ring-1 ring-blue-500/30',
            bg: 'bg-blue-950/25',
            headerBg: 'bg-blue-950/80 text-blue-400 border border-blue-700/40',
            badge: 'bg-blue-900/60 text-blue-300',
            text: 'text-blue-300'
          }
        )}

        {/* Q3: Delegate */}
        {renderQuadrantCard(
          3,
          'Ủy quyền / Cắt gọn (Delegate)',
          'Khẩn cấp & Không quan trọng',
          <Users className="w-5 h-5 text-amber-400" />,
          q3Tasks,
          q3Time,
          q3Pct,
          {
            border: 'border-amber-500/40',
            bg: 'bg-amber-950/20',
            headerBg: 'bg-amber-950/80 text-amber-400 border border-amber-700/40',
            badge: 'bg-amber-900/60 text-amber-300',
            text: 'text-amber-300'
          }
        )}

        {/* Q4: Drop */}
        {renderQuadrantCard(
          4,
          'Bỏ qua / Loại trừ (Drop / Park)',
          'Không khẩn cấp & Không quan trọng',
          <Trash2 className="w-5 h-5 text-gray-400" />,
          q4Tasks,
          q4Time,
          q4Pct,
          {
            border: 'border-gray-700/50',
            bg: 'bg-gray-900/40',
            headerBg: 'bg-gray-800 text-gray-400 border border-gray-700',
            badge: 'bg-gray-800 text-gray-400',
            text: 'text-gray-300'
          }
        )}
      </div>
    </div>
  );
};
