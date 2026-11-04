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
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  HelpCircle
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
  let balanceMessage = 'Phân bổ thời gian lý tưởng: Bạn dành phần lớn công sức cho mục tiêu dài hạn (Q2)!';
  if (q1Pct > 40) {
    balanceStatus = 'firefighting';
    balanceMessage = 'Cảnh báo "Chữa cháy": Quá nhiều thời gian cho việc khẩn cấp Q1. Hãy giảm áp lực bằng cách lên lịch sớm hơn ở Q2.';
  } else if (q3Pct > 30) {
    balanceStatus = 'distracted';
    balanceMessage = 'Cảnh báo "Bị lôi kéo": Việc khẩn nhưng ít quan trọng (Q3) chiếm nhiều thì giờ. Hãy ủy quyền hoặc từ chối bớt.';
  } else if (q4Pct > 20) {
    balanceStatus = 'waste';
    balanceMessage = 'Nhiều việc ở Q4 không phục vụ mục tiêu nào. Hãy mạnh dạn xóa bỏ để giải phóng tâm trí.';
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
    styling: {
      cardBg: string;
      borderColor: string;
      titleColor: string;
      badgeColor: string;
      btnBg: string;
    }
  ) => {
    return (
      <div className={`rounded-3xl border ${styling.borderColor} ${styling.cardBg} p-5 sm:p-6 flex flex-col justify-between shadow-2xl relative transition-all`}>
        {/* Quadrant Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${styling.badgeColor}`}>
                    Q{quadrantNum}
                  </span>
                  <h3 className={`text-base sm:text-lg font-bold tracking-tight ${styling.titleColor}`}>{title}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
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
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-right cursor-pointer group transition-all"
            >
              <div className="text-sm font-extrabold text-slate-900 group-hover:text-amber-400 transition-colors">
                {tasks.length} việc
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {timeMins}p ({percentage}%)
              </div>
            </button>
          </div>

          {/* Quick add trigger button */}
          <div className="flex items-center justify-between mb-3.5 mt-2 pt-2 border-t border-white/5">
            <span className="text-[11px] text-slate-400 font-medium">
              {quadrantNum === 1 && 'Khủng hoảng & Hạn chót gấp'}
              {quadrantNum === 2 && 'Trọng tâm phát triển dài hạn'}
              {quadrantNum === 3 && 'Việc của người khác / Họp vụn'}
              {quadrantNum === 4 && 'Việc thừa / Cần loại bỏ'}
            </span>
            <button
              onClick={() => setQuickAddQuadrant(quickAddQuadrant === quadrantNum ? null : quadrantNum)}
              className="text-xs text-slate-200 hover:text-slate-900 flex items-center gap-1.5 font-semibold bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-all border border-slate-200 shadow-xs text-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-slate-900" /> Thêm nhanh
            </button>
          </div>

          {/* Inline Quick Add Form */}
          {quickAddQuadrant === quadrantNum && (
            <div className="p-3.5 mb-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200 shadow-xs">
              <input
                type="text"
                placeholder="Tên công việc mới..."
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(quadrantNum); }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Phút"
                  value={quickAddMinutes}
                  onChange={(e) => setQuickAddMinutes(Number(e.target.value))}
                  className="w-20 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 shadow-xs"
                />
                <select
                  value={quickAddGoalId}
                  onChange={(e) => setQuickAddGoalId(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:outline-none"
                >
                  <option value="">-- Thuộc mục tiêu nào? --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleQuickAdd(quadrantNum)}
                  className="px-4 py-1.5 bg-[#E0401F] hover:bg-[#d03515] text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <div className="py-7 text-center text-xs text-slate-500 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có việc nào ở góc phần tư này
              </div>
            ) : (
              tasks.map(task => {
                const isOverdueAging = (task.ageDays || 0) > 7;
                return (
                  <div
                    key={task.id}
                    className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs group"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs sm:text-sm font-bold ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          {isOverdueAging && (
                            <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Tồn {task.ageDays} ngày
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-400">
                          {task.goalName ? (
                            <span className="text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-semibold truncate max-w-[170px] font-medium text-[11px]">
                              {task.goalName}
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                              Ngoài mục tiêu
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" /> {task.estimatedMinutes || 60}p
                          </span>
                        </div>
                      </div>

                      {/* 1-tap Done button */}
                      <button
                        onClick={() => markTaskDone(task.id)}
                        title="Đánh dấu hoàn thành"
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 shrink-0 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Move Quadrant Row */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Chuyển góc:</span>
                      <div className="flex items-center gap-1">
                        {quadrantNum !== 1 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 1)}
                            className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold"
                            title="Chuyển sang Q1: Làm ngay"
                          >
                            Q1
                          </button>
                        )}
                        {quadrantNum !== 2 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 2)}
                            className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 font-bold"
                            title="Chuyển sang Q2: Lên lịch"
                          >
                            Q2
                          </button>
                        )}
                        {quadrantNum !== 3 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 3)}
                            className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-bold"
                            title="Chuyển sang Q3: Ủy quyền"
                          >
                            Q3
                          </button>
                        )}
                        {quadrantNum !== 4 && (
                          <button
                            onClick={() => moveTaskQuadrant(task.id, 4)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-bold"
                            title="Chuyển sang Q4: Bỏ qua"
                          >
                            Q4
                          </button>
                        )}
                        <button
                          onClick={() => dropTask(task.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 ml-1.5 transition-colors"
                          title="Xóa bỏ việc này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E0401F] to-orange-500 flex items-center justify-center text-slate-900 shrink-0 shadow-lg shadow-red-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                Ma trận Ưu tiên Eisenhower (Stephen Covey)
                <span className="text-[10px] font-mono bg-red-500/15 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30 font-bold">
                  PRD v0.11 B16
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                Phân loại công việc theo <strong className="text-slate-900">Tầm quan trọng</strong> và <strong className="text-slate-900">Tính khẩn cấp</strong> để thoát khỏi vòng xoáy chữa cháy.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEduCard(!showEduCard)}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            title={showEduCard ? 'Thu gọn giải thích' : 'Mở rộng giải thích'}
          >
            {showEduCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showEduCard && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
              <span className="font-bold text-rose-400 block mb-1">Q1: Làm ngay</span>
              Khẩn cấp + Quan trọng. Khủng hoảng, hạn chót sát nút. Cần giải quyết ngay lập tức.
            </div>
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl ring-1 ring-blue-500/30">
              <span className="font-bold text-blue-400 block mb-1">Q2: Lên lịch (Trọng tâm)</span>
              Không khẩn + Quan trọng. Lập kế hoạch, rèn luyện, việc sâu dài hạn. Càng dành nhiều thời gian cho Q2, bạn càng bớt rơi vào Q1.
            </div>
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
              <span className="font-bold text-amber-400 block mb-1">Q3: Cắt gọn / Ủy quyền</span>
              Khẩn cấp + Không quan trọng. Cuộc gọi gián đoạn, việc nhờ vả. Cần giao việc hoặc nói không khéo léo.
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="font-bold text-slate-700 block mb-1">Q4: Bỏ qua / Loại trừ</span>
              Không khẩn + Không quan trọng. Lướt mạng vô thức, việc thừa. Cần dũng cảm loại bỏ khỏi lịch trình.
            </div>
          </div>
        )}
      </div>

      {/* Balance Signal Bar (Thanh tín hiệu cân bằng) */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E0401F]" />
              Tín hiệu Cân bằng Phân bổ Thời gian
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{balanceMessage}</p>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Q1: {q1Pct}%</span>
            <span className="text-blue-400 font-extrabold bg-blue-500/15 px-2.5 py-0.5 rounded-md border border-blue-500/30">Q2: {q2Pct}%</span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Q3: {q3Pct}%</span>
            <span className="text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">Q4: {q4Pct}%</span>
          </div>
        </div>

        {/* Progress bar split */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1 border border-slate-200">
          <div 
            style={{ width: `${q1Pct}%` }} 
            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-l-full transition-all" 
            title={`Q1 Khẩn cấp: ${q1Pct}% (${q1Time} phút)`}
          />
          <div 
            style={{ width: `${q2Pct}%` }} 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" 
            title={`Q2 Trọng tâm dài hạn: ${q2Pct}% (${q2Time} phút)`}
          />
          <div 
            style={{ width: `${q3Pct}%` }} 
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all" 
            title={`Q3 Ủy quyền: ${q3Pct}% (${q3Time} phút)`}
          />
          <div 
            style={{ width: `${q4Pct}%` }} 
            className="h-full bg-slate-700 rounded-r-full transition-all" 
            title={`Q4 Loại bỏ: ${q4Pct}% (${q4Time} phút)`}
          />
        </div>
        
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
          <span>Khuyến nghị mục tiêu: Q2 &ge; 60%</span>
          <span>Tổng số phút: <strong className="text-slate-200">{totalTime} phút</strong> ({blocks.length} việc)</span>
        </div>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Q1: Do Now */}
        {renderQuadrantCard(
          1,
          'Làm ngay (Do Now)',
          'Quan trọng & Khẩn cấp',
          <Flame className="w-5 h-5 text-rose-400" />,
          q1Tasks,
          q1Time,
          q1Pct,
          {
            cardBg: 'bg-gradient-to-b from-rose-950/20 to-slate-900/80',
            borderColor: 'border-rose-500/30',
            titleColor: 'text-rose-400',
            badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
            btnBg: 'bg-rose-600 hover:bg-rose-500'
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
            cardBg: 'bg-gradient-to-b from-blue-950/25 to-slate-900/80',
            borderColor: 'border-blue-500/40 ring-1 ring-blue-500/30',
            titleColor: 'text-blue-400',
            badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
            btnBg: 'bg-blue-600 hover:bg-blue-500'
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
            cardBg: 'bg-gradient-to-b from-amber-950/20 to-slate-900/80',
            borderColor: 'border-amber-500/30',
            titleColor: 'text-amber-400',
            badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
            btnBg: 'bg-amber-600 hover:bg-amber-500'
          }
        )}

        {/* Q4: Drop */}
        {renderQuadrantCard(
          4,
          'Bỏ qua / Loại trừ (Drop / Park)',
          'Không khẩn cấp & Không quan trọng',
          <Trash2 className="w-5 h-5 text-slate-400" />,
          q4Tasks,
          q4Time,
          q4Pct,
          {
            cardBg: 'bg-gradient-to-b from-slate-900/40 to-slate-900/80',
            borderColor: 'border-slate-700/60',
            titleColor: 'text-slate-700',
            badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200',
            btnBg: 'bg-slate-700 hover:bg-slate-600'
          }
        )}
      </div>
    </div>
  );
};
