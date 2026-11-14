// TAIO Time App — Goal Folders Component (PRD v0.3.33 Part H)
'use client';

import React, { useState } from 'react';
import { Goal, TimeBlock } from '@/types';
import { STICKY_COLORS, StickyColor } from '@/features/sticky/model/stickyTypes';
import { FolderSpine, WorkAreaType } from './FolderSpine';
import { GoalRow } from './GoalRow';
import { Plus, Target } from 'lucide-react';
import { useT } from '@/i18n/useT';

export interface GoalFoldersProps {
  goals: Goal[];
  scheduleBlocks: TimeBlock[];
  orientation?: 'vertical' | 'horizontal';
  activeArea?: WorkAreaType;
  onActiveAreaChange?: (area: WorkAreaType) => void;
  onOpenCreateGoal: (area: WorkAreaType) => void;
  onOpenDedicatedGoalPage: (goal: Goal) => void;
}

const FOLDER_CONFIGS: { area: WorkAreaType; labelKey: string; defaultLabel: string; color: StickyColor }[] = [
  { area: 'Product', labelKey: 'goals.area_product', defaultLabel: 'Sản phẩm', color: 'blue' },
  { area: 'Business', labelKey: 'goals.area_business', defaultLabel: 'Kinh doanh', color: 'yellow' },
  { area: 'Operations', labelKey: 'goals.area_operations', defaultLabel: 'Vận hành', color: 'green' },
  { area: 'Personal', labelKey: 'goals.area_personal', defaultLabel: 'Cá nhân', color: 'pink' },
];

export const GoalFolders: React.FC<GoalFoldersProps> = ({
  goals,
  scheduleBlocks,
  orientation = 'vertical',
  activeArea: controlledActiveArea,
  onActiveAreaChange,
  onOpenCreateGoal,
  onOpenDedicatedGoalPage,
}) => {
  const { t } = useT();

  const [internalActiveArea, setInternalActiveArea] = useState<WorkAreaType>('Product');
  const activeArea = controlledActiveArea || internalActiveArea;

  const setActiveArea = (area: WorkAreaType) => {
    setInternalActiveArea(area);
    onActiveAreaChange?.(area);
  };

  // Only one goal open at a time (PRD H1.4)
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const activeConfig = FOLDER_CONFIGS.find(f => f.area === activeArea) || FOLDER_CONFIGS[0];
  const activePalette = STICKY_COLORS[activeConfig.color];

  // Filter goals for current active folder
  const folderGoals = goals.filter(g => (g.workArea || 'Product') === activeArea);

  // Compute today's focus minutes per goal from scheduleBlocks
  const todayMinutesByGoal = React.useMemo(() => {
    const map: Record<string, number> = {};
    (scheduleBlocks || []).forEach(b => {
      if (b.goalId && b.status === 'done') {
        const mins = (b.extra?.actualMinutes as number) || (b.touchTimeMinutes as number) || 45;
        map[b.goalId] = (map[b.goalId] || 0) + mins;
      }
    });
    return map;
  }, [scheduleBlocks]);

  return (
    <div className="w-full">
      {orientation === 'vertical' ? (
        // Vertical Dossier Spine Layout (PRD H1.1: Mac default)
        <div className="flex items-stretch min-h-[460px]">
          {/* Vertical spines on the left */}
          <div className="flex flex-col justify-start gap-1 py-4 shrink-0">
            {FOLDER_CONFIGS.map(cfg => {
              const count = goals.filter(g => (g.workArea || 'Product') === cfg.area).length;
              return (
                <FolderSpine
                  key={cfg.area}
                  area={cfg.area}
                  label={t(cfg.labelKey, cfg.defaultLabel)}
                  color={cfg.color}
                  count={count}
                  isActive={activeArea === cfg.area}
                  orientation="vertical"
                  onClick={() => {
                    setActiveArea(cfg.area);
                    setExpandedGoalId(null);
                  }}
                />
              );
            })}
          </div>

          {/* Dossier folder content panel */}
          <div
            style={{ backgroundColor: activePalette.paper }}
            className="flex-1 rounded-3xl p-5 sm:p-7 border border-black/10 shadow-sm transition-colors duration-200 space-y-4"
          >
            {/* Folder Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <h3
                  className="text-base sm:text-lg font-bold tracking-tight"
                  style={{ color: activePalette.ink }}
                >
                  {t(activeConfig.labelKey, activeConfig.defaultLabel)}
                </h3>
                <span
                  style={{ backgroundColor: activePalette.bar, color: activePalette.ink }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                >
                  {folderGoals.length} {t('goals.count_unit', 'mục tiêu')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateGoal(activeArea)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('goals.add_goal', '+ Mục tiêu')}</span>
              </button>
            </div>

            {/* Folder Goals List */}
            {folderGoals.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Target className="w-8 h-8 mx-auto text-black/20" />
                <p className="text-xs font-medium" style={{ color: activePalette.muted }}>
                  {t('goals.empty_folder', 'Chưa có mục tiêu nào trong ngăn này')}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenCreateGoal(activeArea)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs hover:bg-black/5 transition-all"
                >
                  {t('goals.create_first', '+ Thêm mục tiêu đầu tiên')}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {folderGoals.map(goal => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    isExpanded={expandedGoalId === goal.id}
                    todayMinutes={todayMinutesByGoal[goal.id] || 0}
                    todayBlocks={(scheduleBlocks || []).filter(b => b.goalId === goal.id)}
                    onToggle={() =>
                      setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)
                    }
                    onOpenDedicatedPage={() => onOpenDedicatedGoalPage(goal)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Horizontal Spine Strip Layout (PRD H1.8: iPhone / Horizontal)
        <div className="space-y-4">
          {/* Horizontal scrollable strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FOLDER_CONFIGS.map(cfg => {
              const count = goals.filter(g => (g.workArea || 'Product') === cfg.area).length;
              return (
                <FolderSpine
                  key={cfg.area}
                  area={cfg.area}
                  label={t(cfg.labelKey, cfg.defaultLabel)}
                  color={cfg.color}
                  count={count}
                  isActive={activeArea === cfg.area}
                  orientation="horizontal"
                  onClick={() => {
                    setActiveArea(cfg.area);
                    setExpandedGoalId(null);
                  }}
                />
              );
            })}
          </div>

          {/* Dossier folder content panel */}
          <div
            style={{ backgroundColor: activePalette.paper }}
            className="rounded-3xl p-5 sm:p-6 border border-black/10 shadow-sm transition-colors duration-200 space-y-4"
          >
            {/* Folder Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <h3
                  className="text-base font-bold tracking-tight"
                  style={{ color: activePalette.ink }}
                >
                  {t(activeConfig.labelKey, activeConfig.defaultLabel)}
                </h3>
                <span
                  style={{ backgroundColor: activePalette.bar, color: activePalette.ink }}
                  className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                >
                  {folderGoals.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateGoal(activeArea)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('goals.add_goal', '+ Mục tiêu')}</span>
              </button>
            </div>

            {/* Folder Goals List */}
            {folderGoals.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Target className="w-8 h-8 mx-auto text-black/20" />
                <p className="text-xs font-medium" style={{ color: activePalette.muted }}>
                  {t('goals.empty_folder', 'Chưa có mục tiêu nào trong ngăn này')}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenCreateGoal(activeArea)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs hover:bg-black/5 transition-all"
                >
                  {t('goals.create_first', '+ Thêm mục tiêu đầu tiên')}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {folderGoals.map(goal => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    isExpanded={expandedGoalId === goal.id}
                    todayMinutes={todayMinutesByGoal[goal.id] || 0}
                    todayBlocks={(scheduleBlocks || []).filter(b => b.goalId === goal.id)}
                    onToggle={() =>
                      setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)
                    }
                    onOpenDedicatedPage={() => onOpenDedicatedGoalPage(goal)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
