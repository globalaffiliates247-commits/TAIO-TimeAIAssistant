'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GapLabel } from '../types';
import { HabitInsights } from './HabitInsights';
import { 
  Trophy, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Moon, 
  AlertCircle, 
  Sparkles, 
  Tag,
  ArrowRight,
  Target,
  Compass,
  BarChart3
} from 'lucide-react';

const GAP_LABELS: { key: GapLabel; label: string }[] = [
  { key: 'rest', label: 'Nghỉ ngơi' },
  { key: 'meal', label: 'Ăn uống' },
  { key: 'travel', label: 'Di chuyển' },
  { key: 'small_tasks', label: 'Việc vặt' },
  { key: 'distraction', label: 'Xao nhãng' },
  { key: 'other', label: 'Khác' },
];

export const AchievementsTab: React.FC = () => {
  const { 
    blocks, 
    goals, 
    interruptions, 
    gaps, 
    profile, 
    handleLabelGap, 
    setCloseDayModalOpen,
    dayClosed,
    setBlocks,
    openDrilldown
  } = useApp();

  const [viewMode, setViewMode] = useState<'today' | 'habits'>('today');

  const completedBlocks = blocks.filter(b => b.status === 'done');
  const waitingBlocks = blocks.filter(b => b.status === 'unconfirmed' || b.status === 'partly_done');

  // Calculate stats
  const totalPlannedMins = blocks.length * 60;
  const doneMins = completedBlocks.length * 60;
  const deepWorkDoneMins = completedBlocks.filter(b => b.type === 'deep').length * profile.focusBlockDurationMins || 150;

  const intUsedMins = interruptions
    .filter(i => i.decision === 'do_now')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const protectedMins = interruptions
    .filter(i => i.decision === 'decline' || i.decision === 'delegate')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Thành tựu & Dấu vết (Achievements)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Cập nhật trực tiếp theo check-in • Cuối ngày chuyển sang chế độ "Đóng ngày trong 2 phút"
          </p>
        </div>

        {/* View mode buttons & Close day */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setViewMode('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'today' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Hôm nay</span>
            </button>
            <button
              onClick={() => setViewMode('habits')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'habits' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Dấu vết thói quen (B15)</span>
            </button>
          </div>

          {!dayClosed ? (
            <button
              onClick={() => setCloseDayModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white font-semibold text-xs shadow-lg shadow-red-950/40 transition-all"
            >
              <Moon className="w-4 h-4" />
              <span>Đóng ngày</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#E0401F]" />
              <span>Đã khóa</span>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'habits' ? (
        <HabitInsights />
      ) : (
        <>
      {/* 1. Day Progress Overview with WYSIWYG Drilldown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Completed / Total tasks */}
        <div 
          onClick={() => openDrilldown({
            type: 'tasks',
            title: `Vòng ${completedBlocks.length} / ${blocks.length} việc đã xong`,
            subtitle: `${completedBlocks.length} đã xong • ${blocks.filter(b => b.status === 'in_progress').length} chờ xác nhận/đang chạy • ${blocks.filter(b => b.status === 'planned').length} chưa đến giờ`,
          })}
          className="bg-[#121620] border border-gray-800 hover:border-indigo-500/60 hover:bg-gray-800/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
          title="Bấm để mở danh sách toàn bộ các việc hôm nay kèm trạng thái và 1 chạm: Xong, Dời, Bỏ"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 group-hover:text-indigo-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Hoàn thành
            </span>
            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1 group-hover:text-indigo-400 transition-colors">
            {completedBlocks.length} / {blocks.length}
          </p>
          <span className="text-[11px] text-gray-500">Bấm xem cả {blocks.length} việc</span>
        </div>

        {/* Card 2: Deep work minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'deep_work',
            title: 'Các khối việc sâu (Deep Work)',
            subtitle: `Tổng cộng ${deepWorkDoneMins} phút tập trung chất lượng cao`,
          })}
          className="bg-[#121620] border border-gray-800 hover:border-indigo-500/60 hover:bg-gray-800/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
          title="Bấm để mở danh sách các khối việc sâu và số phút của từng khối"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 group-hover:text-indigo-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-indigo-400" /> Tập trung sâu
            </span>
            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {deepWorkDoneMins}p
          </p>
          <span className="text-[11px] text-gray-500">Bấm xem số phút từng khối</span>
        </div>

        {/* Card 3: Interruption reserve */}
        <div 
          onClick={() => openDrilldown({
            type: 'interruptions',
            title: 'Nhật ký việc chen ngang & Quỹ dự phòng',
            subtitle: `Đã dùng ${intUsedMins}p / ${profile.interruptionReserveMins}p • Còn lại ${Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút`,
          })}
          className="bg-[#121620] border border-gray-800 hover:border-amber-500/60 hover:bg-gray-800/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
          title="Bấm để mở nhật ký chen ngang, loại việc và người kéo bạn vào"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 group-hover:text-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Quỹ gián đoạn
            </span>
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {intUsedMins} / {profile.interruptionReserveMins}p
          </p>
          <span className="text-[11px] text-gray-500">Bấm xem người kéo vào</span>
        </div>

        {/* Card 4: Protected minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'protected_focus',
            title: 'Thời gian tập trung đã bảo vệ (+45p)',
            subtitle: 'Đạt được nhờ từ chối hoặc ủy quyền việc chen ngang',
          })}
          className="bg-[#121620] border border-gray-800 hover:border-emerald-500/60 hover:bg-gray-800/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
          title="Bấm để xem danh sách việc đã từ chối/ủy quyền"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 group-hover:text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Đã bảo vệ
            </span>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            +{protectedMins}p
          </p>
          <span className="text-[11px] text-gray-500">từ chối / ủy quyền</span>
        </div>
      </div>

      {/* 2. Done by Goal with WYSIWYG Drilldown */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-[#E0401F]" />
            <span>Thời gian hoàn thành theo từng mục tiêu (Done by goal)</span>
          </h3>
          <span className="text-xs text-[#E0401F]">Bấm mục tiêu để xem các việc ↗</span>
        </div>

        <div className="space-y-3">
          {goals.map((g) => {
            const goalBlocks = blocks.filter(b => b.goalId === g.id);
            const goalCompletedBlocks = goalBlocks.filter(b => b.status === 'done');
            const goalMinutes = goalCompletedBlocks.length * 60;
            return (
              <div 
                key={g.id} 
                onClick={() => openDrilldown({
                  type: 'goal_tasks',
                  title: `Nhiệm vụ phục vụ: ${g.name}`,
                  subtitle: `Có ${goalBlocks.length} việc hôm nay (${goalCompletedBlocks.length} đã xong) • ${g.progressPercent}% tiến độ`,
                  goalId: g.id,
                })}
                className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500/60 hover:bg-gray-800/70 transition-all cursor-pointer flex items-center justify-between group"
                title="Bấm để mở danh sách các việc hôm nay phục vụ mục tiêu này (WYSIWYG)"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{g.name}</h4>
                    <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded font-bold">
                      {goalBlocks.length} việc
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">Kết quả: {g.measurableResult}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-indigo-400">{goalMinutes} phút</span>
                  <p className="text-[11px] text-gray-500">Mục tiêu: {g.dailyBudgetMins}p/ngày</p>
                </div>
              </div>
            );
          })}

          <div 
            onClick={() => openDrilldown({
              type: 'tasks',
              title: 'Các việc ngoài mục tiêu chính (Outside my goals)',
              subtitle: 'Bao gồm việc vặt, phát sinh hành chính hoặc cá nhân',
            })}
            className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all cursor-pointer flex items-center justify-between group"
            title="Bấm để xem danh sách các việc ngoài mục tiêu chính"
          >
            <div>
              <h4 className="text-sm font-semibold text-gray-300 group-hover:text-white">Ngoài mục tiêu chính (Outside my goals)</h4>
              <span className="text-xs text-gray-400">Các việc vặt, phát sinh hành chính hoặc cá nhân</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">45 phút</span>
              <p className="text-[10px] text-gray-500">Bấm xem ↗</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interruptions Accepted Breakdown */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Các gián đoạn đã ghi nhận hôm nay</span>
        </h3>

        {interruptions.length === 0 ? (
          <p className="text-xs text-gray-400">Chưa ghi nhận việc gián đoạn nào.</p>
        ) : (
          <div className="space-y-2">
            {interruptions.map((item) => (
              <div 
                key={item.id} 
                onClick={() => openDrilldown({
                  type: 'interruptions',
                  title: 'Nhật ký việc chen ngang & Quỹ dự phòng',
                  subtitle: `Chi tiết việc: "${item.title}" • Kéo vào bởi: ${item.sourcePerson || 'Đối tác ngoài'}`,
                })}
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/50 hover:bg-gray-800/80 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                title="Bấm để xem chi tiết người kéo bạn vào và trạng thái quỹ"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold">
                    {item.timestamp}
                  </span>
                  <div>
                    <h5 className="font-semibold text-white">{item.title}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.sourcePerson && (
                        <span className="text-[10px] text-amber-300 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/30">
                          Từ: {item.sourcePerson}
                        </span>
                      )}
                      {item.returnPoint && (
                        <span className="text-indigo-300 text-[10px] truncate max-w-xs">
                          Điểm về: {item.returnPoint}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-gray-400 font-bold">{item.minutes}p</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.decision === 'do_now'
                      ? 'bg-amber-500/20 text-amber-300'
                      : item.decision === 'decline'
                      ? 'bg-rose-500/20 text-rose-300'
                      : item.decision === 'delegate'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {item.decision === 'do_now' ? 'Làm ngay' : item.decision === 'decline' ? 'Từ chối' : item.decision === 'delegate' ? 'Ủy quyền' : item.decision === 'go_social' ? 'Giao lưu' : 'Lên lịch'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Undeclared Time Gaps (PRD B10) */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div>
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-sky-400" />
            <span>Khoảng thời gian chưa khai báo (Undeclared Time - 15p+)</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Gắn nhãn 1 chạm không phán xét để giúp hệ thống học thích ứng theo thói quen của bạn.
          </p>
        </div>

        {gaps.length === 0 ? (
          <p className="text-xs text-gray-400">Không có khoảng trống thời gian nào.</p>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap) => (
              <div key={gap.id} className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-200">
                      {gap.start} - {gap.end} ({gap.durationMins} phút)
                    </span>
                    {gap.label && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-semibold">
                        Đã gắn: {GAP_LABELS.find(l => l.key === gap.label)?.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Khoảng trống không có lịch cố định</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {GAP_LABELS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleLabelGap(gap.id, item.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        gap.label === item.key
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Waiting for you (PRD B10) */}
      {waitingBlocks.length > 0 && (
        <div className="bg-[#121620] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Đang chờ bạn xác nhận (Waiting for you)</span>
          </h3>

          <div className="space-y-2">
            {waitingBlocks.map((b) => (
              <div key={b.id} className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <h5 className="font-semibold text-white">{b.title}</h5>
                  {b.returnPoint && <p className="text-gray-400 text-[11px]">Điểm về: {b.returnPoint}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setBlocks(prev => prev.map(item => item.id === b.id ? { ...item, status: 'done' } : item))}
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium"
                  >
                    Đã xong
                  </button>
                  <button
                    onClick={() => setBlocks(prev => prev.map(item => item.id === b.id ? { ...item, status: 'dropped' } : item))}
                    className="px-2.5 py-1 rounded bg-gray-800 text-gray-300 hover:text-white"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
};
