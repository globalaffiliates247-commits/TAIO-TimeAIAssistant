// TAIO Time App — Goal Folders Component (PRD v0.3.33 Part H & v0.3.54 Part P)
'use client';

import React, { useState, useMemo } from 'react';
import { Goal, TimeBlock } from '@/types';
import { STICKY_COLORS, StickyColor } from '@/features/sticky/model/stickyTypes';
import { FolderSpine, WorkAreaType } from './FolderSpine';
import { GoalRow } from './GoalRow';
import { Plus, Target, HelpCircle, AlertCircle, X, Pencil } from 'lucide-react';
import { useT } from '@/i18n/useT';
import { useApp } from '@/context/AppContext';
import { getAreaLabel, getAreaQuestion } from './areaLabels';

export interface GoalFoldersProps {
  goals: Goal[];
  scheduleBlocks: TimeBlock[];
  orientation?: 'vertical' | 'horizontal';
  activeArea?: WorkAreaType;
  onActiveAreaChange?: (area: WorkAreaType) => void;
  onOpenCreateGoal: (area: WorkAreaType) => void;
  onOpenDedicatedGoalPage: (goal: Goal) => void;
}

interface AreaFolderConfig {
  area: WorkAreaType;
  color: StickyColor;
}

const BASE_FOLDER_CONFIGS: AreaFolderConfig[] = [
  { area: 'Product', color: 'blue' },
  { area: 'Business', color: 'yellow' },
  { area: 'Operations', color: 'green' },
  { area: 'Personal', color: 'pink' },
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
  const { profile, customAreaNames, updateGoal, updateCustomAreaNames, language, showToast } = useApp();

  const [internalActiveArea, setInternalActiveArea] = useState<WorkAreaType>('Product');
  const activeArea = controlledActiveArea || internalActiveArea;

  const setActiveArea = (area: WorkAreaType) => {
    setInternalActiveArea(area);
    setEditingAreaName(null);
    onActiveAreaChange?.(area);
  };

  // Inline rename folder header (PRD v0.3.55 Part C)
  const [editingAreaName, setEditingAreaName] = useState<string | null>(null);
  const [editAreaValue, setEditAreaValue] = useState<string>('');

  const handleStartEditingAreaName = (area: WorkAreaType, currentLabel: string) => {
    setEditingAreaName(area);
    setEditAreaValue(currentLabel);
  };

  const handleSaveAreaName = (area: WorkAreaType) => {
    if (editAreaValue.trim() && editAreaValue.trim() !== activeLabel) {
      updateCustomAreaNames({ [area]: editAreaValue.trim() });
    }
    setEditingAreaName(null);
  };

  const handleCancelAreaName = () => {
    setEditingAreaName(null);
  };

  // Only one goal open at a time (PRD H1.4)
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [showQuestionPopover, setShowQuestionPopover] = useState(false);

  // PRD Part P1 & P7: Check for uncategorized goals
  const uncategorizedGoals = useMemo(() => {
    return goals.filter(
      g => !g.workArea || g.workArea === 'uncategorized' || !['Product', 'Business', 'Operations', 'Personal'].includes(g.workArea)
    );
  }, [goals]);

  // Dynamic folder list: include uncategorized tab if any uncategorized goals exist or if selected
  const folders = useMemo(() => {
    const list: AreaFolderConfig[] = [...BASE_FOLDER_CONFIGS];
    if (uncategorizedGoals.length > 0 || activeArea === 'uncategorized') {
      list.push({
        area: 'uncategorized',
        color: 'purple',
      });
    }
    return list;
  }, [uncategorizedGoals.length, activeArea]);

  const activeConfig = folders.find(f => f.area === activeArea) || folders[0];
  const activePalette = STICKY_COLORS[activeConfig.color] || STICKY_COLORS.blue;

  // Filter goals strictly for current active folder (PRD Part P1: no blind fallback to Product!)
  const folderGoals = useMemo(() => {
    if (activeArea === 'uncategorized') {
      return uncategorizedGoals;
    }
    return goals.filter(g => g.workArea === activeArea);
  }, [goals, activeArea, uncategorizedGoals]);

  // Compute today's focus minutes per goal from scheduleBlocks
  const todayMinutesByGoal = useMemo(() => {
    const map: Record<string, number> = {};
    (scheduleBlocks || []).forEach(b => {
      if (b.goalId && b.status === 'done') {
        const mins = (b.extra?.actualMinutes as number) || (b.touchTimeMinutes as number) || 45;
        map[b.goalId] = (map[b.goalId] || 0) + mins;
      }
    });
    return map;
  }, [scheduleBlocks]);

  // PRD Part P1 & Acceptance 1: Drag-and-drop goal on folder spine
  const handleDropGoal = (goalId: string, targetArea: WorkAreaType) => {
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;
    const finalArea = targetArea === 'uncategorized' ? undefined : targetArea;
    updateGoal(goalId, { workArea: finalArea });
    const targetLabel = getAreaLabel(targetArea, profile?.type, customAreaNames, language);
    showToast(
      language === 'vi'
        ? `Đã chuyển "${targetGoal.name}" sang ${targetLabel}!`
        : `Moved "${targetGoal.name}" to ${targetLabel}!`
    );
  };

  const activeLabel = getAreaLabel(activeConfig.area, profile?.type, customAreaNames, language);
  const activeQuestion = getAreaQuestion(activeConfig.area, profile?.type, language);

  return (
    <div className="w-full">
      {orientation === 'vertical' ? (
        // Vertical Dossier Spine Layout (PRD H1.1: Mac default)
        <div className="flex items-stretch min-h-[460px]">
          {/* Vertical spines on the left */}
          <div className="flex flex-col justify-start gap-1 py-4 shrink-0">
            {folders.map(cfg => {
              const count = cfg.area === 'uncategorized'
                ? uncategorizedGoals.length
                : goals.filter(g => g.workArea === cfg.area).length;
              const label = getAreaLabel(cfg.area, profile?.type, customAreaNames, language);

              return (
                <FolderSpine
                  key={cfg.area}
                  area={cfg.area}
                  label={label}
                  color={cfg.color}
                  count={count}
                  isActive={activeArea === cfg.area}
                  orientation="vertical"
                  onClick={() => {
                    setActiveArea(cfg.area);
                    setExpandedGoalId(null);
                    setShowQuestionPopover(false);
                  }}
                  onDropGoal={handleDropGoal}
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
            <div className="flex items-center justify-between border-b border-black/5 pb-3 relative">
              <div className="flex items-center gap-2">
                {editingAreaName === activeConfig.area ? (
                  <input
                    type="text"
                    value={editAreaValue}
                    onChange={e => setEditAreaValue(e.target.value)}
                    maxLength={20}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveAreaName(activeConfig.area);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelAreaName();
                      }
                    }}
                    onBlur={() => handleSaveAreaName(activeConfig.area)}
                    className="px-2 py-0.5 text-base sm:text-lg font-bold tracking-tight rounded-lg border border-black/20 bg-white/90 outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ color: activePalette.ink }}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h3
                      className="text-base sm:text-lg font-bold tracking-tight"
                      style={{ color: activePalette.ink }}
                    >
                      {activeLabel}
                    </h3>
                    {activeConfig.area !== 'uncategorized' && (
                      <button
                        type="button"
                        onClick={() => handleStartEditingAreaName(activeConfig.area, activeLabel)}
                        className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer opacity-60 hover:opacity-100"
                        title={t('goals.renameFolder', 'Đổi tên thư mục')}
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: activePalette.ink }} />
                      </button>
                    )}
                  </div>
                )}
                <span
                  style={{ backgroundColor: activePalette.bar, color: activePalette.ink }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                >
                  {folderGoals.length} {t('goals.count_unit', 'mục tiêu')}
                </span>

                {/* Question mark classification helper (Acceptance P8) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuestionPopover(!showQuestionPopover)}
                    className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                    title={t('goals.classificationGuide', 'Tiêu chí phân nhóm')}
                  >
                    <HelpCircle className="w-4 h-4 opacity-60 hover:opacity-100" style={{ color: activePalette.ink }} />
                  </button>

                  {showQuestionPopover && (
                    <div
                      className="absolute left-0 top-full mt-2 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-800 dark:text-slate-100 text-xs space-y-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1 font-bold text-slate-500 uppercase tracking-wider text-[10.5px]">
                        <span>{t('goals.classificationQuestion', 'Câu hỏi phân nhóm')}</span>
                        <button type="button" onClick={() => setShowQuestionPopover(false)} className="p-0.5 text-slate-400 hover:text-slate-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="leading-relaxed font-medium">
                        "{activeQuestion}"
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        {t('goals.classificationTip', 'Khi phân vân giữa hai nhóm: chọn theo kết quả cuối cùng phục vụ ai.')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {activeArea !== 'uncategorized' && (
                <button
                  type="button"
                  onClick={() => onOpenCreateGoal(activeArea)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('goals.add_goal', 'Mục tiêu')}</span>
                </button>
              )}
            </div>

            {/* Uncategorized banner notice */}
            {activeArea === 'uncategorized' && (
              <div className="p-3 rounded-2xl bg-purple-100/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  {t('goals.uncategorizedBanner', 'Các mục tiêu này chưa được xếp nhóm. Kéo sang gáy thư mục hoặc bấm "Chuyển nhóm" để phân loại.')}
                </span>
              </div>
            )}

            {/* Folder Goals List */}
            {folderGoals.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Target className="w-10 h-10 mx-auto text-black/20" />
                <p className="text-xs font-medium" style={{ color: activePalette.muted }}>
                  {t('goals.empty_folder', 'Chưa có mục tiêu nào trong ngăn này')}
                </p>
                {activeArea !== 'uncategorized' && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateGoal(activeArea)}
                    className="px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs hover:bg-black/5 transition-all cursor-pointer"
                  >
                    {t('goals.create_first', '+ Thêm mục tiêu đầu tiên')}
                  </button>
                )}
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
            {folders.map(cfg => {
              const count = cfg.area === 'uncategorized'
                ? uncategorizedGoals.length
                : goals.filter(g => g.workArea === cfg.area).length;
              const label = getAreaLabel(cfg.area, profile?.type, customAreaNames, language);

              return (
                <FolderSpine
                  key={cfg.area}
                  area={cfg.area}
                  label={label}
                  color={cfg.color}
                  count={count}
                  isActive={activeArea === cfg.area}
                  orientation="horizontal"
                  onClick={() => {
                    setActiveArea(cfg.area);
                    setExpandedGoalId(null);
                    setShowQuestionPopover(false);
                  }}
                  onDropGoal={handleDropGoal}
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
            <div className="flex items-center justify-between border-b border-black/5 pb-3 relative">
              <div className="flex items-center gap-2">
                {editingAreaName === activeConfig.area ? (
                  <input
                    type="text"
                    value={editAreaValue}
                    onChange={e => setEditAreaValue(e.target.value)}
                    maxLength={20}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveAreaName(activeConfig.area);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelAreaName();
                      }
                    }}
                    onBlur={() => handleSaveAreaName(activeConfig.area)}
                    className="px-2 py-0.5 text-base font-bold tracking-tight rounded-lg border border-black/20 bg-white/90 outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ color: activePalette.ink }}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h3
                      className="text-base font-bold tracking-tight"
                      style={{ color: activePalette.ink }}
                    >
                      {activeLabel}
                    </h3>
                    {activeConfig.area !== 'uncategorized' && (
                      <button
                        type="button"
                        onClick={() => handleStartEditingAreaName(activeConfig.area, activeLabel)}
                        className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer opacity-60 hover:opacity-100"
                        title={t('goals.renameFolder', 'Đổi tên thư mục')}
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: activePalette.ink }} />
                      </button>
                    )}
                  </div>
                )}
                <span
                  style={{ backgroundColor: activePalette.bar, color: activePalette.ink }}
                  className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                >
                  {folderGoals.length}
                </span>

                {/* Question mark classification helper (Acceptance P8) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuestionPopover(!showQuestionPopover)}
                    className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                    title={t('goals.classificationGuide', 'Tiêu chí phân nhóm')}
                  >
                    <HelpCircle className="w-4 h-4 opacity-60 hover:opacity-100" style={{ color: activePalette.ink }} />
                  </button>

                  {showQuestionPopover && (
                    <div
                      className="absolute left-0 top-full mt-2 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-800 dark:text-slate-100 text-xs space-y-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1 font-bold text-slate-500 uppercase tracking-wider text-[10.5px]">
                        <span>{t('goals.classificationQuestion', 'Câu hỏi phân nhóm')}</span>
                        <button type="button" onClick={() => setShowQuestionPopover(false)} className="p-0.5 text-slate-400 hover:text-slate-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="leading-relaxed font-medium">
                        "{activeQuestion}"
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        {t('goals.classificationTip', 'Khi phân vân giữa hai nhóm: chọn theo kết quả cuối cùng phục vụ ai.')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {activeArea !== 'uncategorized' && (
                <button
                  type="button"
                  onClick={() => onOpenCreateGoal(activeArea)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('goals.add_goal', 'Mục tiêu')}</span>
                </button>
              )}
            </div>

            {/* Uncategorized banner notice */}
            {activeArea === 'uncategorized' && (
              <div className="p-3 rounded-2xl bg-purple-100/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  {t('goals.uncategorizedBanner', 'Các mục tiêu này chưa được xếp nhóm. Kéo sang gáy thư mục hoặc bấm "Chuyển nhóm" để phân loại.')}
                </span>
              </div>
            )}

            {/* Folder Goals List */}
            {folderGoals.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Target className="w-8 h-8 mx-auto text-black/20" />
                <p className="text-xs font-medium" style={{ color: activePalette.muted }}>
                  {t('goals.empty_folder', 'Chưa có mục tiêu nào trong ngăn này')}
                </p>
                {activeArea !== 'uncategorized' && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateGoal(activeArea)}
                    className="px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-2xs hover:bg-black/5 transition-all"
                  >
                    {t('goals.create_first', '+ Thêm mục tiêu đầu tiên')}
                  </button>
                )}
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
