'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Goal, 
  Milestone,
  TimeBlock, 
  HardDeadline, 
  InterruptionRecord, 
  UndeclaredGap, 
  ToneLevel,
  InterruptionDecision,
  InterruptionWhatType,
  InterruptionSourceType,
  InterruptionActivityCategory,
  GapLabel,
  UserRole,
  ActionNudge,
  HabitCard,
  WeeklyExperiment,
  SuperAdminAISuggestion,
  DeviceLook,
  ThemeMode,
  ColorPalette,
  PaletteColors
} from '../types';
import { 
  PROFILES, 
  INITIAL_GOALS, 
  INITIAL_BLOCKS, 
  INITIAL_DEADLINES, 
  INITIAL_INTERRUPTIONS, 
  INITIAL_GAPS,
  INITIAL_ACTION_NUDGES,
  INITIAL_HABIT_CARDS,
  INITIAL_EXPERIMENTS,
  INITIAL_AI_SUGGESTIONS,
  PALETTES
} from '../data/mockData';

interface AppContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  currentTab: 'now' | 'plan' | 'achievements' | 'goals' | 'admin';
  setCurrentTab: (tab: 'now' | 'plan' | 'achievements' | 'goals' | 'admin') => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
  toneLevel: ToneLevel;
  setToneLevel: (tl: ToneLevel) => void;

  // v0.8: Who am I? (Current Role)
  currentUserRole: UserRole;
  setCurrentUserRole: (r: UserRole) => void;

  // v0.12 - v0.16: Appearance & Device Settings (B17)
  deviceLook: DeviceLook;
  setDeviceLook: (d: DeviceLook) => void;
  themeMode: ThemeMode;
  setThemeMode: (t: ThemeMode) => void;
  palette: ColorPalette;
  setPalette: (p: ColorPalette) => void;
  currentPaletteColors: PaletteColors;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (val: boolean) => void;

  // v0.8: Off-plan state
  isOffPlan: boolean;
  offPlanMinutes: number;
  toggleOffPlan: () => void;
  backToPlan: () => void;
  
  // Data
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  blocks: TimeBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  deadlines: HardDeadline[];
  interruptions: InterruptionRecord[];
  gaps: UndeclaredGap[];
  
  // Active state
  currentBlock: TimeBlock | undefined;
  activeReturnPoint: string | null;
  setActiveReturnPoint: (rp: string | null) => void;
  timerMinutesRemaining: number;
  setTimerMinutesRemaining: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  setIsTimerRunning: (val: boolean) => void;

  // Modals & Overlays
  interruptionModalOpen: boolean;
  setInterruptionModalOpen: (val: boolean) => void;
  checkInModalOpen: boolean;
  setCheckInModalOpen: (val: boolean) => void;
  closeDayModalOpen: boolean;
  setCloseDayModalOpen: (val: boolean) => void;
  socialAuditModalOpen: boolean;
  setSocialAuditModalOpen: (val: boolean) => void;
  checkInBlock: TimeBlock | null;
  setCheckInBlock: (b: TimeBlock | null) => void;

  // Drilldown Overlay (WYSIWYG)
  drilldown: {
    isOpen: boolean;
    type: 'tasks' | 'deep_work' | 'interruptions' | 'goal_tasks' | 'protected_focus' | 'admin_stat';
    title: string;
    subtitle?: string;
    goalId?: string;
    adminData?: {
      statKey: string;
      title: string;
      total: string;
      items: { label: string; detail: string; status?: string; badge?: string }[];
    };
  };
  openDrilldown: (config: {
    type: 'tasks' | 'deep_work' | 'interruptions' | 'goal_tasks' | 'protected_focus' | 'admin_stat';
    title: string;
    subtitle?: string;
    goalId?: string;
    adminData?: {
      statKey: string;
      title: string;
      total: string;
      items: { label: string; detail: string; status?: string; badge?: string }[];
    };
  }) => void;
  closeDrilldown: () => void;
  markTaskDone: (taskId: string) => void;
  shiftTaskTime: (taskId: string, extraMins?: number) => void;
  dropTask: (taskId: string) => void;

  // v0.9: Action Nudges (B14)
  actionNudge: ActionNudge | null;
  acceptActionNudge: () => void;
  dismissActionNudge: () => void;

  // v0.10: Habit Insights & Experiments (B15)
  habitCards: HabitCard[];
  experiments: WeeklyExperiment[];
  handleHabitAction: (id: string, action: 'try' | 'dismiss' | 'inaccurate') => void;
  keepExperiment: (id: string) => void;

  // v0.11: Priority Matrix (B16)
  moveTaskQuadrant: (taskId: string, targetQuadrant: 1 | 2 | 3 | 4) => void;

  // v0.9 & v0.11: Super Admin AI Improvement Suggestions (C6)
  aiSuggestions: SuperAdminAISuggestion[];
  handleSuggestionAction: (id: string, action: 'accept' | 'reject' | 'test') => void;

  // Actions
  handleInterruptionSubmit: (data: {
    title: string;
    decision: InterruptionDecision;
    goalId?: string;
    returnPoint?: string;
    minutes: number;
    socialEndTime?: string;
    sourcePerson?: string;
    whatType?: InterruptionWhatType;
    sourceType?: InterruptionSourceType;
    category?: InterruptionActivityCategory;
    note?: string;
  }) => void;
  handleCheckInAnswer: (answer: 'done' | 'more_time' | 'stop_here', extraMins?: number) => void;
  handleLabelGap: (gapId: string, label: GapLabel) => void;
  handleCloseDay: (tomorrowTask: string) => void;
  addNewBlock: (block: Omit<TimeBlock, 'id'>) => void;
  addGoalWithBackplanning: (goal: Omit<Goal, 'id' | 'milestones' | 'progressPercent'>) => void;
  dayClosed: boolean;
  celebrationMsg: string | null;
  setCelebrationMsg: (msg: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(PROFILES.owner);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'now' | 'plan' | 'achievements' | 'goals' | 'admin'>('now');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [toneLevel, setToneLevel] = useState<ToneLevel>(1);

  // v0.12 - v0.16: Appearance & Device Settings (B17)
  const [deviceLook, setDeviceLook] = useState<DeviceLook>('auto');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [palette, setPalette] = useState<ColorPalette>('warm');
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  const currentPaletteColors = PALETTES[palette] || PALETTES.warm;

  // v0.8: Current Role
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('decision-maker');

  // v0.8: Off-plan state
  const [isOffPlan, setIsOffPlan] = useState<boolean>(false);
  const [offPlanMinutes, setOffPlanMinutes] = useState<number>(79); // e.g. 1h 19m past wind-down

  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [blocks, setBlocks] = useState<TimeBlock[]>(INITIAL_BLOCKS);
  const [deadlines, setDeadlines] = useState<HardDeadline[]>(INITIAL_DEADLINES);
  const [interruptions, setInterruptions] = useState<InterruptionRecord[]>(INITIAL_INTERRUPTIONS);
  const [gaps, setGaps] = useState<UndeclaredGap[]>(INITIAL_GAPS);

  // v0.9: Action Nudges (B14)
  const [actionNudge, setActionNudge] = useState<ActionNudge | null>(INITIAL_ACTION_NUDGES[0] || null);

  // v0.10: Habit Insights (B15)
  const [habitCards, setHabitCards] = useState<HabitCard[]>(INITIAL_HABIT_CARDS);
  const [experiments, setExperiments] = useState<WeeklyExperiment[]>(INITIAL_EXPERIMENTS);

  // v0.9 & v0.11: Super Admin AI Suggestions (C6)
  const [aiSuggestions, setAiSuggestions] = useState<SuperAdminAISuggestion[]>(INITIAL_AI_SUGGESTIONS);

  const [activeReturnPoint, setActiveReturnPoint] = useState<string | null>(
    'Đang hoàn thiện cơ chế chuyển đổi 4 quyết định của thẻ việc đột xuất.'
  );
  const [timerMinutesRemaining, setTimerMinutesRemaining] = useState<number>(38);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Modals
  const [interruptionModalOpen, setInterruptionModalOpen] = useState<boolean>(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState<boolean>(false);
  const [closeDayModalOpen, setCloseDayModalOpen] = useState<boolean>(false);
  const [socialAuditModalOpen, setSocialAuditModalOpen] = useState<boolean>(false);
  const [checkInBlock, setCheckInBlock] = useState<TimeBlock | null>(null);

  const [dayClosed, setDayClosed] = useState<boolean>(false);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Drilldown state (WYSIWYG)
  const [drilldown, setDrilldown] = useState<{
    isOpen: boolean;
    type: 'tasks' | 'deep_work' | 'interruptions' | 'goal_tasks' | 'protected_focus' | 'admin_stat';
    title: string;
    subtitle?: string;
    goalId?: string;
    adminData?: {
      statKey: string;
      title: string;
      total: string;
      items: { label: string; detail: string; status?: string; badge?: string }[];
    };
  }>({
    isOpen: false,
    type: 'tasks',
    title: '',
  });

  const openDrilldown = (config: {
    type: 'tasks' | 'deep_work' | 'interruptions' | 'goal_tasks' | 'protected_focus' | 'admin_stat';
    title: string;
    subtitle?: string;
    goalId?: string;
    adminData?: {
      statKey: string;
      title: string;
      total: string;
      items: { label: string; detail: string; status?: string; badge?: string }[];
    };
  }) => {
    setDrilldown({ ...config, isOpen: true });
  };

  const closeDrilldown = () => {
    setDrilldown(prev => ({ ...prev, isOpen: false }));
  };

  // 1-tap actions on blocks: Xong, Dời, Bỏ
  const markTaskDone = (taskId: string) => {
    setBlocks(prev => prev.map(b => b.id === taskId ? { ...b, status: 'done' } : b));
    setCelebrationMsg(language === 'vi' ? '🎉 Đã đánh dấu xong! Số lượng hoàn thành cập nhật ngay.' : '🎉 Task marked done!');
  };

  const shiftTaskTime = (taskId: string, extraMins = 30) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== taskId) return b;
      return { ...b, status: 'extended', notes: `Đã dời thêm ${extraMins} phút` };
    }));
    setCelebrationMsg(language === 'vi' ? `Đã dời nhiệm vụ thêm ${extraMins} phút.` : `Task shifted by ${extraMins} mins.`);
  };

  const dropTask = (taskId: string) => {
    setBlocks(prev => prev.map(b => b.id === taskId ? { ...b, status: 'dropped' } : b));
    setCelebrationMsg(language === 'vi' ? 'Đã bỏ nhiệm vụ này khỏi trọng tâm hôm nay.' : 'Task dropped cleanly.');
  };

  // v0.8: Off-plan actions
  const toggleOffPlan = () => {
    setIsOffPlan(!isOffPlan);
  };

  const backToPlan = () => {
    setIsOffPlan(false);
    setCelebrationMsg(language === 'vi' ? 'Đã quay lại nhịp kế hoạch ban đầu!' : 'Back to original plan!');
  };

  // v0.9: Action Nudge actions (B14)
  const acceptActionNudge = () => {
    if (!actionNudge) return;
    setActionNudge(null);
    setCelebrationMsg(language === 'vi' ? '✓ Đã hoàn tất hành động nhắc nhở!' : 'Action completed!');
  };

  const dismissActionNudge = () => {
    if (!actionNudge) return;
    // Dismiss temporarily, returns after pause
    setActionNudge(prev => prev ? { ...prev, isDismissed: true, repeatCount: prev.repeatCount + 1 } : null);
    setTimeout(() => {
      setActionNudge(prev => prev ? { ...prev, isDismissed: false } : null);
    }, 15000); // 15 sec demo simulation for 15 min
  };

  // v0.10: Habit Insights actions (B15)
  const handleHabitAction = (id: string, action: 'try' | 'dismiss' | 'inaccurate') => {
    if (action === 'try') {
      const card = habitCards.find(c => c.id === id);
      setHabitCards(prev => prev.map(c => c.id === id ? { ...c, status: 'trying' } : c));
      if (card) {
        setExperiments(prev => [
          {
            id: `exp-${Date.now()}`,
            habit: card.example,
            startDate: new Date().toLocaleDateString('vi-VN'),
            baseline: card.evidence,
            result: 'Đang theo dõi trong 7 ngày tới...',
            status: 'running',
          },
          ...prev
        ]);
        setCelebrationMsg(language === 'vi' ? '🌟 Đã thêm thử nghiệm vào kế hoạch tuần này!' : 'Added weekly experiment!');
      }
    } else if (action === 'dismiss') {
      setHabitCards(prev => prev.map(c => c.id === id ? { ...c, status: 'dismissed' } : c));
    } else if (action === 'inaccurate') {
      setHabitCards(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
      setCelebrationMsg(language === 'vi' ? 'Đã ghi nhận phản hồi để AI học chuẩn xác hơn.' : 'Feedback recorded.');
    }
  };

  const keepExperiment = (id: string) => {
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, status: 'kept' } : e));
    setCelebrationMsg(language === 'vi' ? '🎉 Đã biến thói quen thử nghiệm thành thói quen cố định!' : 'Kept as permanent habit!');
  };

  // v0.11: Priority Matrix Move (B16)
  const moveTaskQuadrant = (taskId: string, targetQuadrant: 1 | 2 | 3 | 4) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== taskId) return b;
      const isImportant = targetQuadrant === 1 || targetQuadrant === 2;
      const isUrgent = targetQuadrant === 1 || targetQuadrant === 3;
      return {
        ...b,
        quadrant: targetQuadrant,
        isImportant,
        isUrgent,
      };
    }));
    setCelebrationMsg(
      language === 'vi' 
        ? `Đã chuyển nhiệm vụ sang Góc phần tư Q${targetQuadrant}!` 
        : `Moved task to Quadrant ${targetQuadrant}!`
    );
  };

  // v0.9 & v0.11: Super Admin AI Suggestion Action (C6)
  const handleSuggestionAction = (id: string, action: 'accept' | 'reject' | 'test') => {
    setAiSuggestions(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'testing',
      };
    }));
    setCelebrationMsg(
      language === 'vi' 
        ? `Đã cập nhật trạng thái đề xuất AI: ${action === 'accept' ? 'Chấp thuận' : action === 'reject' ? 'Từ chối' : 'A/B Test'}` 
        : `AI Suggestion updated!`
    );
  };

  // Active current block
  const currentBlock = blocks.find(b => b.status === 'in_progress') || blocks.find(b => b.status === 'planned');

  // Timer countdown ticker
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerMinutesRemaining > 0) {
      interval = setInterval(() => {
        setTimerMinutesRemaining(prev => {
          if (prev <= 1) {
            if (currentBlock && !checkInModalOpen) {
              setCheckInBlock(currentBlock);
              setCheckInModalOpen(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutesRemaining, currentBlock, checkInModalOpen]);

  // Interruption submission
  const handleInterruptionSubmit = ({
    title,
    decision,
    goalId,
    returnPoint,
    minutes,
    socialEndTime,
    sourcePerson,
    whatType,
    sourceType,
    category,
    note,
  }: {
    title: string;
    decision: InterruptionDecision;
    goalId?: string;
    returnPoint?: string;
    minutes: number;
    socialEndTime?: string;
    sourcePerson?: string;
    whatType?: InterruptionWhatType;
    sourceType?: InterruptionSourceType;
    category?: InterruptionActivityCategory;
    note?: string;
  }) => {
    const goal = goals.find(g => g.id === goalId);
    const newInt: InterruptionRecord = {
      id: `int-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      title,
      minutes,
      decision,
      goalId,
      goalName: goal ? goal.name : 'Ngoài mục tiêu chính',
      returnPoint: returnPoint || undefined,
      socialEndTime,
      travelBufferMins: decision === 'go_social' ? 30 : undefined,
      sourcePerson,
      whatType,
      sourceType,
      category,
      note,
    };

    setInterruptions(prev => [newInt, ...prev]);

    if (returnPoint) {
      setActiveReturnPoint(returnPoint);
      if (currentBlock) {
        setBlocks(prev => prev.map(b => b.id === currentBlock.id ? { ...b, returnPoint } : b));
      }
    }

    if (decision === 'do_now') {
      setTimerMinutesRemaining(minutes);
      setIsTimerRunning(true);
      setCelebrationMsg(language === 'vi' ? 'Đang chạy đồng hồ việc phát sinh. Giảm trừ vào quỹ dự phòng hôm nay!' : 'Interruption timer active. Deducted from today\'s reserve.');
    } else if (decision === 'delegate' || decision === 'decline') {
      setCelebrationMsg(
        language === 'vi' 
          ? `Tuyệt vời! Bạn vừa bảo vệ được ${minutes} phút tập trung quý giá.` 
          : `Protected ${minutes} focus minutes!`
      );
    } else if (decision === 'schedule') {
      setCelebrationMsg(
        language === 'vi' 
          ? `Đã xếp việc "${title}" vào khung giờ trống kế tiếp.` 
          : `Scheduled "${title}" to next free slot.`
      );
    } else if (decision === 'go_social') {
      setCelebrationMsg(
        language === 'vi' 
          ? `Đã ghi nhận giao lưu kèm 30 phút đệm di chuyển. App sẽ nhắc nhẹ giờ về lúc ${socialEndTime}!` 
          : `Social outing logged with 30m travel buffer. Gentle nudge set for ${socialEndTime}!`
      );
    }

    setInterruptionModalOpen(false);
  };

  // Check-in answers
  const handleCheckInAnswer = (answer: 'done' | 'more_time' | 'stop_here', extraMins = 15) => {
    if (!checkInBlock) return;

    if (answer === 'done') {
      setBlocks(prev => prev.map(b => b.id === checkInBlock.id ? { ...b, status: 'done' } : b));
      setCelebrationMsg(language === 'vi' ? '🎉 Xuất sắc! Khối công việc đã hoàn thành và ghi nhận vào tiến độ mục tiêu.' : '🎉 Great job! Block completed.');
      const nextBlock = blocks.find(b => b.id !== checkInBlock.id && b.status === 'planned');
      if (nextBlock) {
        setBlocks(prev => prev.map(b => b.id === nextBlock.id ? { ...b, status: 'in_progress' } : b));
        setTimerMinutesRemaining(profile.focusBlockDurationMins);
      }
    } else if (answer === 'more_time') {
      setBlocks(prev => prev.map(b => b.id === checkInBlock.id ? { ...b, status: 'extended' } : b));
      setTimerMinutesRemaining(prev => prev + extraMins);
      setCelebrationMsg(language === 'vi' ? `Đã thêm +${extraMins} phút tập trung cho nhiệm vụ hiện tại.` : `Added +${extraMins} minutes.`);
    } else if (answer === 'stop_here') {
      setBlocks(prev => prev.map(b => b.id === checkInBlock.id ? { ...b, status: 'partly_done' } : b));
      setCelebrationMsg(language === 'vi' ? 'Đã lưu điểm quay lại và tạm dừng công việc an toàn.' : 'Saved return point and paused cleanly.');
    }

    setCheckInModalOpen(false);
    setCheckInBlock(null);
  };

  const handleLabelGap = (gapId: string, label: GapLabel) => {
    setGaps(prev => prev.map(g => g.id === gapId ? { ...g, label } : g));
  };

  const handleCloseDay = (tomorrowTask: string) => {
    setDayClosed(true);
    setCloseDayModalOpen(false);
    setCelebrationMsg(
      language === 'vi' 
        ? `Đã khóa ngày làm việc hôm nay! Việc quan trọng số 1 ngày mai: "${tomorrowTask}". Hãy nghỉ ngơi trọn vẹn!` 
        : `Day closed! Tomorrow's #1 focus: "${tomorrowTask}". Rest well!`
    );
  };

  const addNewBlock = (blockData: Omit<TimeBlock, 'id'>) => {
    const newB: TimeBlock = {
      ...blockData,
      id: `b-${Date.now()}`,
      quadrant: blockData.quadrant || (blockData.goalId ? 2 : 4),
      isImportant: !!blockData.goalId,
      isUrgent: false,
      estimatedMinutes: 60,
      ageDays: 1,
    };
    setBlocks(prev => [...prev, newB]);
  };

  const addGoalWithBackplanning = (goalData: Omit<Goal, 'id' | 'milestones' | 'progressPercent'>) => {
    const weeks = Math.ceil(goalData.horizonDays / 7);
    const generatedMilestones: Milestone[] = [
      { id: `m-${Date.now()}-1`, goalId: '', name: `Giai đoạn 1: Chuẩn bị & Bản nháp (Tuần 1-${Math.ceil(weeks / 3)})`, dueDate: '30 ngày tới', status: 'pending' },
      { id: `m-${Date.now()}-2`, goalId: '', name: `Giai đoạn 2: Triển khai lõi & Đánh giá (Tuần ${Math.ceil(weeks / 3) + 1}-${Math.ceil(weeks * 2 / 3)})`, dueDate: '60 ngày tới', status: 'pending' },
      { id: `m-${Date.now()}-3`, goalId: '', name: `Giai đoạn 3: Hoàn thiện & Đạt kết quả đo lường`, dueDate: goalData.deadline, status: 'pending' },
    ];

    const newG: Goal = {
      ...goalData,
      id: `g-${Date.now()}`,
      progressPercent: 0,
      milestones: generatedMilestones,
    };
    setGoals(prev => [...prev, newG]);
  };

  return (
    <AppContext.Provider value={{
      profile,
      setProfile,
      isOnboarded,
      setIsOnboarded,
      currentTab,
      setCurrentTab,
      language,
      setLanguage,
      toneLevel,
      setToneLevel,
      currentUserRole,
      setCurrentUserRole,
      isOffPlan,
      offPlanMinutes,
      toggleOffPlan,
      backToPlan,
      goals,
      setGoals,
      blocks,
      setBlocks,
      deadlines,
      interruptions,
      gaps,
      currentBlock,
      activeReturnPoint,
      setActiveReturnPoint,
      timerMinutesRemaining,
      setTimerMinutesRemaining,
      isTimerRunning,
      setIsTimerRunning,
      interruptionModalOpen,
      setInterruptionModalOpen,
      checkInModalOpen,
      setCheckInModalOpen,
      closeDayModalOpen,
      setCloseDayModalOpen,
      socialAuditModalOpen,
      setSocialAuditModalOpen,
      checkInBlock,
      setCheckInBlock,
      handleInterruptionSubmit,
      handleCheckInAnswer,
      handleLabelGap,
      handleCloseDay,
      addNewBlock,
      addGoalWithBackplanning,
      dayClosed,
      celebrationMsg,
      setCelebrationMsg,
      drilldown,
      openDrilldown,
      closeDrilldown,
      markTaskDone,
      shiftTaskTime,
      dropTask,
      actionNudge,
      acceptActionNudge,
      dismissActionNudge,
      habitCards,
      experiments,
      handleHabitAction,
      keepExperiment,
      moveTaskQuadrant,
      aiSuggestions,
      handleSuggestionAction,
      deviceLook,
      setDeviceLook,
      themeMode,
      setThemeMode,
      palette,
      setPalette,
      currentPaletteColors,
      settingsModalOpen,
      setSettingsModalOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
