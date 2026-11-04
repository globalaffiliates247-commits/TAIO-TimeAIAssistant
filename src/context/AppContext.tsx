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
  InterruptionSituation,
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
  PaletteColors,
  InboxItem,
  TimeLedgerSegment,
  MethodConcept,
  CoachCard,
  DailyCardItem,
  ItemOrigin,
  ItemStatus,
  AppList,
  ListItem,
  ListType,
  UserProfileDetail,
  CommunityRemoteConfig,
  ScreenDwellEvent,
  BacklogCard,
  ReminderQuestion,
  BackfillEntry,
  PassiveTimeSuggestion,
  SavedPlace,
  AppNotificationItem
} from '../types';
import { 
  PROFILES, 
  INITIAL_GOALS, 
  INITIAL_BLOCKS, 
  INITIAL_DEADLINES, 
  INITIAL_INTERRUPTIONS, 
  INITIAL_GAPS,
  INITIAL_ACTION_NUDGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_HABIT_CARDS,
  INITIAL_EXPERIMENTS,
  INITIAL_AI_SUGGESTIONS,
  PALETTES,
  INITIAL_INBOX,
  INITIAL_TIME_LEDGER,
  METHOD_CONCEPTS,
  INITIAL_COACH_CARDS,
  INITIAL_DAILY_CARD_ITEMS,
  INITIAL_LISTS,
  INITIAL_LIST_ITEMS,
  INITIAL_USER_PROFILE_DETAIL,
  INITIAL_COMMUNITY_CONFIG,
  INITIAL_BACKLOG_CARDS,
  INITIAL_REMINDER_QUESTIONS,
  INITIAL_SAVED_PLACES,
  INITIAL_PASSIVE_SUGGESTIONS
} from '../data/mockData';

export type AppTab = 'now' | 'plan' | 'efficiency' | 'achievements' | 'goals' | 'admin';

interface AppContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
  toneLevel: ToneLevel;
  setToneLevel: (tl: ToneLevel) => void;

  // v0.8: Who am I? (Current Role)
  currentUserRole: UserRole;
  setCurrentUserRole: (r: UserRole) => void;

  // v0.12 - v0.20: Appearance & Device Settings (B17)
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

  // v0.18 - v0.20: Inbox Mini App ("Rổ công việc")
  inbox: InboxItem[];
  inboxModalOpen: boolean;
  setInboxModalOpen: (val: boolean) => void;
  addInboxItem: (item: { title: string; source?: 'quick' | 'telegram' | 'voice' | 'meeting_followup'; nextAction?: string; estimatedMinutes?: number; linkedGoalId?: string }) => void;
  processInboxItem: (id: string, action: 'schedule' | 'done_2min' | 'delegate' | 'drop', details?: { quadrant?: 1 | 2 | 3 | 4 }) => void;

  // v0.18 - v0.21: 24-Hour Time Ledger
  timeLedger: TimeLedgerSegment[];

  // v0.19 - v0.22: Method Library & Contextual Coach Cards
  methodLibraryOpen: boolean;
  setMethodLibraryOpen: (val: boolean) => void;
  methodConcepts: MethodConcept[];
  activeCoachCard: CoachCard | null;
  dismissCoachCard: () => void;
  triggerCoachCard: (moment: 'first_interruption' | 'first_timebox' | 'first_dod_done' | 'first_inbox' | 'first_matrix') => void;

  // v0.3.1 B25: Daily Card & Work Diary
  dailyCardItems: DailyCardItem[];
  selectedCardDate: string;
  setSelectedCardDate: (d: string) => void;
  addDailyCardItem: (item: { 
    text: string; 
    goalId?: string; 
    origin?: ItemOrigin; 
    start?: string; 
    end?: string;
    displacedItemId?: string;
    displacedItemTitle?: string;
    displacedMinutes?: number;
  }) => void;
  toggleDailyCardItem: (id: string) => void;
  carryOverItem: (id: string, action: 'tomorrow' | 'leave' | 'drop', reason?: string) => void;

  // v0.3.0 / v0.23.0 B24: Data Export for AI Assistant
  exportModalOpen: boolean;
  setExportModalOpen: (val: boolean) => void;
  shareToken: string;
  rotateShareToken: () => void;
  generateMarkdownSnapshot: () => string;

  // v0.3.2 B26: Mini app Lists ("Danh sách")
  lists: AppList[];
  listItems: ListItem[];
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
  isListsModalOpen: boolean;
  setIsListsModalOpen: (val: boolean) => void;
  createList: (name: string, type: ListType, tag?: string) => string;
  archiveList: (id: string) => void;
  togglePinList: (id: string) => void;
  addListItem: (listId: string, text: string, extra?: Partial<ListItem>) => void;
  toggleListItemCheck: (itemId: string) => void;
  updateListItem: (itemId: string, patch: Partial<ListItem>) => void;
  archiveListItem: (itemId: string) => void;

  // v0.3.4 B27: Profile, Personalization and Community links
  userProfileDetail: UserProfileDetail;
  setUserProfileDetail: React.Dispatch<React.SetStateAction<UserProfileDetail>>;
  updateUserProfileDetail: (patch: Partial<UserProfileDetail>) => void;
  communityConfig: CommunityRemoteConfig;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (val: boolean) => void;

  // v0.3.3 C6.1: Screen Dwell Statistics
  screenDwells: ScreenDwellEvent[];
  recordScreenDwell: (screenId: string, dwellSeconds: number, source?: string) => void;

  // v0.3.6 B28: Thẻ nhắc việc (Backlog Swipe Review)
  backlogCards: BacklogCard[];
  isSwipeModalOpen: boolean;
  setIsSwipeModalOpen: (v: boolean) => void;
  handleSwipeAction: (cardId: string, action: 'plan' | 'later' | 'done_now' | 'drop', planDetails?: { durationMins: number; deadline?: string; goalId?: string }) => void;

  // v0.3.6 B29: Câu hỏi nhắc việc (Reminder Questions)
  reminderQuestions: ReminderQuestion[];
  isQuestionsModalOpen: boolean;
  setIsQuestionsModalOpen: (v: boolean) => void;
  activeQuestion: ReminderQuestion | null;
  setActiveQuestion: (q: ReminderQuestion | null) => void;
  triggerReminderQuestion: (triggerType: string) => void;

  // v0.3.7 B30: Active Capture (Ghi bù & Địa điểm Geofence)
  isActiveCaptureOpen: boolean;
  setIsActiveCaptureOpen: (v: boolean) => void;
  savedPlaces: SavedPlace[];
  passiveSuggestions: PassiveTimeSuggestion[];
  acceptPassiveSuggestion: (id: string) => void;
  ignorePassiveSuggestion: (id: string) => void;
  backfillTime: (entry: Omit<BackfillEntry, 'id'>) => void;
  savePlace: (place: SavedPlace) => void;
  togglePlaceLocation: (placeId: string) => void;
  
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
    situation?: InterruptionSituation;
    isDistraction?: boolean;
  }) => void;
  handleCheckInAnswer: (answer: 'done' | 'continue_later' | 'more_time' | 'remind_10m' | 'stop_here', extraMins?: number, nextStep?: string) => void;
  handleLabelGap: (gapId: string, label: GapLabel) => void;
  handleCloseDay: (tomorrowTask: string) => void;
  addNewBlock: (block: Omit<TimeBlock, 'id'>) => void;
  addGoalWithBackplanning: (goal: Omit<Goal, 'id' | 'milestones' | 'progressPercent'>) => void;
  dayClosed: boolean;
  celebrationMsg: string | null;
  setCelebrationMsg: (msg: string | null) => void;
  // v0.3.9 B5: Toast notifications (with optional Undo action for B28 v0.3.11)
  toastMsg: string | null;
  toastUndoAction: (() => void) | null;
  showToast: (msg: string, onUndo?: () => void) => void;
  // v0.3.11 B14: Bell notifications (5 most recent)
  notifications: AppNotificationItem[];
  markAllNotificationsRead: () => void;
  triggerNotificationAction: (notif: AppNotificationItem) => void;
  // v0.3.12 B27: Wipe all user data & server copy restore prompt
  resetAllUserData: (deleteServerCopy: boolean) => void;
  hasServerBackupToRestore: boolean;
  resolveServerBackupChoice: (choice: 'restore' | 'fresh') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(PROFILES.owner);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<AppTab>('now');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [toneLevel, setToneLevel] = useState<ToneLevel>(1);

  // v0.12 - v0.20: Appearance & Device Settings (B17)
  const [deviceLook, setDeviceLook] = useState<DeviceLook>('auto');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [palette, setPalette] = useState<ColorPalette>('warm');
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // v0.20: Inbox Mini App State
  const [inbox, setInbox] = useState<InboxItem[]>(INITIAL_INBOX);
  const [inboxModalOpen, setInboxModalOpen] = useState<boolean>(false);

  // v0.20: 24-Hour Time Ledger
  const [timeLedger, setTimeLedger] = useState<TimeLedgerSegment[]>(INITIAL_TIME_LEDGER);

  // v0.20: Method Library & Contextual Coach Cards
  const [methodLibraryOpen, setMethodLibraryOpen] = useState<boolean>(false);
  const [methodConcepts] = useState<MethodConcept[]>(METHOD_CONCEPTS);
  const [activeCoachCard, setActiveCoachCard] = useState<CoachCard | null>(null);

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

  // v0.9 & v0.3.10: Action Nudges (B14) — select nudge matching current active window
  const selectActiveNudgeForCurrentHour = (): ActionNudge | null => {
    const hr = new Date().getHours();
    const matched = INITIAL_ACTION_NUDGES.find(n => {
      if (n.windowStartHour === undefined || n.windowEndHour === undefined) return true;
      if (n.windowStartHour <= n.windowEndHour) {
        return hr >= n.windowStartHour && hr < n.windowEndHour;
      }
      // Overnight window (e.g. 22 -> 5)
      return hr >= n.windowStartHour || hr < n.windowEndHour;
    });
    return matched ? { ...matched, timeShown: new Date().toTimeString().slice(0, 5) } : null;
  };
  const [actionNudge, setActionNudge] = useState<ActionNudge | null>(() => selectActiveNudgeForCurrentHour());
  const [notifications, setNotifications] = useState<AppNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [hasServerBackupToRestore, setHasServerBackupToRestore] = useState<boolean>(false);

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
  // v0.3.9 B5 & v0.3.11 B28: Toast notifications with optional 3-second Undo
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastUndoAction, setToastUndoAction] = useState<(() => void) | null>(null);
  const showToast = (msg: string, onUndo?: () => void) => {
    setToastMsg(msg);
    setToastUndoAction(() => onUndo || null);
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev);
      setToastUndoAction(null);
    }, 3000);
  };

  // v0.3.1 B25: Daily Card & Work Diary State
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedCardDate, setSelectedCardDate] = useState<string>(todayDateStr);
  const [dailyCardItems, setDailyCardItems] = useState<DailyCardItem[]>(INITIAL_DAILY_CARD_ITEMS);

  // v0.3.2 B26: Mini app Lists ("Danh sách")
  const [lists, setLists] = useState<AppList[]>(INITIAL_LISTS);
  const [listItems, setListItems] = useState<ListItem[]>(INITIAL_LIST_ITEMS);
  const [activeListId, setActiveListId] = useState<string | null>(INITIAL_LISTS[0]?.id || null);
  const [isListsModalOpen, setIsListsModalOpen] = useState<boolean>(false);

  const createList = (name: string, type: ListType, tag?: string): string => {
    const newList: AppList = {
      id: `lst-${Date.now()}`,
      name,
      type,
      tag: tag ? (tag.startsWith('#') ? tag : `#${tag}`) : undefined,
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLists(prev => [newList, ...prev]);
    setActiveListId(newList.id);
    setCelebrationMsg(`Đã tạo danh sách mới: "${name}"!`);
    return newList.id;
  };

  const archiveList = (id: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, archived: !l.archived } : l));
  };

  const togglePinList = (id: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l));
  };

  const addListItem = (listId: string, text: string, extra?: Partial<ListItem>) => {
    const targetList = lists.find(l => l.id === listId);
    const nowStr = new Date().toISOString();
    const newItem: ListItem = {
      id: `li-${Date.now()}`,
      listId,
      text,
      note: extra?.note,
      order: 1,
      archived: false,
      createdAt: nowStr,
      updatedAt: nowStr,
      source: extra?.source || 'typed',
      links: extra?.links || (extra?.goalId ? [{ kind: 'goal', id: extra.goalId }] : []),
      ideaState: targetList?.type === 'idea' ? (extra?.ideaState || 'new') : undefined,
      usedIn: extra?.usedIn,
      goalId: extra?.goalId,
      goalName: goals.find(g => g.id === extra?.goalId)?.name,
      startDate: extra?.startDate,
      deadline: extra?.deadline,
      projectStatus: targetList?.type === 'project' ? (extra?.projectStatus || 'active') : undefined,
      progressMode: extra?.progressMode || 'manual',
      progress: extra?.progress ?? 0,
      nextAction: extra?.nextAction,
      timeSpentMinutes: extra?.timeSpentMinutes ?? 0,
      checked: targetList?.type === 'checklist' ? false : undefined,
    };
    setListItems(prev => [newItem, ...prev]);
    setLists(prev => prev.map(l => l.id === listId ? { ...l, updatedAt: nowStr } : l));
    setCelebrationMsg(`Đã thêm mục vào danh sách!`);
  };

  const toggleListItemCheck = (itemId: string) => {
    setListItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !i.checked, updatedAt: new Date().toISOString() } : i));
  };

  const updateListItem = (itemId: string, patch: Partial<ListItem>) => {
    setListItems(prev => prev.map(i => i.id === itemId ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i));
  };

  const archiveListItem = (itemId: string) => {
    setListItems(prev => prev.map(i => i.id === itemId ? { ...i, archived: true, updatedAt: new Date().toISOString() } : i));
  };

  // v0.3.4 B27: Profile, Personalization and Community links
  const [userProfileDetail, setUserProfileDetail] = useState<UserProfileDetail>(INITIAL_USER_PROFILE_DETAIL);
  const [communityConfig] = useState<CommunityRemoteConfig>(INITIAL_COMMUNITY_CONFIG);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const updateUserProfileDetail = (patch: Partial<UserProfileDetail>) => {
    setUserProfileDetail(prev => ({ ...prev, ...patch }));
    setCelebrationMsg('Đã cập nhật thông tin cá nhân & cài đặt!');
  };

  // v0.3.3 C6.1: Screen Dwell Statistics
  const [screenDwells, setScreenDwells] = useState<ScreenDwellEvent[]>([]);
  const recordScreenDwell = (screenId: string, dwellSeconds: number, source: string = 'tab_tap') => {
    if (userProfileDetail.analyticsOptOut) return;
    const device = typeof window !== 'undefined' && window.innerWidth < 600 ? 'phone' : typeof window !== 'undefined' && window.innerWidth < 1024 ? 'tablet' : 'desktop';
    const ev: ScreenDwellEvent = {
      screenId,
      dwellSeconds,
      enteredAt: new Date().toISOString(),
      source,
      deviceClass: device,
    };
    setScreenDwells(prev => [ev, ...prev.slice(0, 49)]);
  };

  // v0.3.6 B28: Thẻ nhắc việc (Backlog Swipe Review)
  const [backlogCards, setBacklogCards] = useState<BacklogCard[]>(INITIAL_BACKLOG_CARDS);
  const [isSwipeModalOpen, setIsSwipeModalOpen] = useState<boolean>(false);

  const handleSwipeAction = (
    cardId: string, 
    action: 'plan' | 'later' | 'done_now' | 'drop', 
    planDetails?: { durationMins: number; deadline?: string; goalId?: string }
  ) => {
    const card = backlogCards.find(c => c.id === cardId);
    if (!card) return;

    if (action === 'plan') {
      const duration = planDetails?.durationMins || card.estimatedMinutes || 30;
      const goal = goals.find(g => g.id === planDetails?.goalId);
      // Add to plan / timeblocks
      addNewBlock({
        title: card.text,
        startTime: '15:00',
        endTime: `15:${duration < 60 ? duration : 45}`,
        type: 'deep',
        status: 'planned',
        goalId: planDetails?.goalId || card.goalId,
        goalName: goal?.name || card.goalName,
        quadrant: 2,
        estimatedMinutes: duration,
        notes: `Xếp lịch từ Thẻ nhắc việc: ${card.note || ''}`,
      });
      // Also add to today's daily card
      addDailyCardItem({
        text: card.text,
        goalId: planDetails?.goalId || card.goalId,
        origin: 'planned',
      });
      setBacklogCards(prev => prev.filter(c => c.id !== cardId));
      setCelebrationMsg(`Đã lên lịch thành công cho: "${card.text}"!`);
    } else if (action === 'done_now') {
      const prevTimer = timerMinutesRemaining;
      setTimerMinutesRemaining(card.estimatedMinutes || 15);
      setIsTimerRunning(true);
      setCurrentTab('now');
      setIsSwipeModalOpen(false);
      setBacklogCards(prev => prev.filter(c => c.id !== cardId));
      // B28 v0.3.11: Tap the card = Làm ngay, with a 3-second "Hoàn tác" (undo) toast
      showToast(`Đang làm ngay: "${card.text}"`, () => {
        setBacklogCards(prev => [card, ...prev]);
        setTimerMinutesRemaining(prevTimer);
        setIsSwipeModalOpen(true);
      });
    } else if (action === 'later') {
      setBacklogCards(prev => {
        const remaining = prev.filter(c => c.id !== cardId);
        return [...remaining, { ...card, snoozesCount: card.snoozesCount + 1 }];
      });
      setCelebrationMsg(`Đã dời thẻ "${card.text}" xem lại sau.`);
    } else if (action === 'drop') {
      setBacklogCards(prev => prev.filter(c => c.id !== cardId));
      setCelebrationMsg(`Đã loại bỏ thẻ khỏi rổ tồn đọng.`);
    }
  };

  // v0.3.6 B29: Câu hỏi nhắc việc (Reminder Questions)
  const [reminderQuestions] = useState<ReminderQuestion[]>(INITIAL_REMINDER_QUESTIONS);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<ReminderQuestion | null>(INITIAL_REMINDER_QUESTIONS[0] || null);

  const triggerReminderQuestion = (triggerType: string) => {
    const q = reminderQuestions.find(item => item.triggerType === triggerType) || reminderQuestions[0];
    if (q) {
      setActiveQuestion(q);
      setIsQuestionsModalOpen(true);
    }
  };

  // v0.3.7 B30: Active Capture (Ghi bù & Địa điểm Geofence)
  const [isActiveCaptureOpen, setIsActiveCaptureOpen] = useState<boolean>(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(INITIAL_SAVED_PLACES);
  const [passiveSuggestions, setPassiveSuggestions] = useState<PassiveTimeSuggestion[]>(INITIAL_PASSIVE_SUGGESTIONS);

  const acceptPassiveSuggestion = (id: string) => {
    const suggestion = passiveSuggestions.find(s => s.id === id);
    if (!suggestion) return;

    // Add to daily card as unplanned on goal / interruption
    addDailyCardItem({
      text: suggestion.suggestedActivity,
      goalId: suggestion.goalId,
      origin: suggestion.category === 'travel' ? 'interruption' : 'unplanned_goal',
      start: suggestion.startTime,
      end: suggestion.endTime,
    });

    // Add segment to time ledger
    setTimeLedger(prev => [
      ...prev,
      {
        id: `tls-${Date.now()}`,
        start: suggestion.startTime,
        end: suggestion.endTime,
        durationMins: suggestion.durationMins,
        category: suggestion.category === 'travel' ? 'interruption' : 'goal_work',
        label: suggestion.suggestedActivity,
      }
    ]);

    setPassiveSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'accepted' } : s));
    setCelebrationMsg(`Đã xác nhận ghi nhận: "${suggestion.suggestedActivity}" (${suggestion.durationMins} phút)!`);
  };

  const ignorePassiveSuggestion = (id: string) => {
    setPassiveSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'ignored' } : s));
  };

  const backfillTime = (entry: Omit<BackfillEntry, 'id'>) => {
    const goal = goals.find(g => g.id === entry.goalId);
    // Add to daily card
    addDailyCardItem({
      text: entry.note || `Ghi bù: ${entry.category}`,
      goalId: entry.goalId,
      origin: entry.origin,
      start: entry.startTime,
      end: entry.endTime,
      displacedItemTitle: entry.displacedBlockTitle,
    });

    // Add to time ledger
    setTimeLedger(prev => [
      ...prev,
      {
        id: `tls-${Date.now()}`,
        start: entry.startTime,
        end: entry.endTime,
        durationMins: entry.durationMins,
        category: entry.origin === 'interruption' ? 'interruption' : 'goal_work',
        label: entry.note || `Ghi bù ${entry.category}`,
      }
    ]);

    setCelebrationMsg(`Đã ghi bù thành công ${entry.durationMins} phút (${entry.startTime} - ${entry.endTime})!`);
  };

  const savePlace = (newPlace: SavedPlace) => {
    setSavedPlaces(prev => {
      const idx = prev.findIndex(p => p.id === newPlace.id);
      if (idx >= 0) {
        return prev.map(p => p.id === newPlace.id ? newPlace : p);
      }
      return [...prev, newPlace];
    });
    setCelebrationMsg(`Đã lưu thiết lập địa điểm "${newPlace.name}"!`);
  };

  const togglePlaceLocation = (placeId: string) => {
    setSavedPlaces(prev => prev.map(p => {
      const isTarget = p.id === placeId;
      return { ...p, isCurrentLocation: isTarget ? !p.isCurrentLocation : false };
    }));
    const target = savedPlaces.find(p => p.id === placeId);
    if (target) {
      setCelebrationMsg(`Đã kích hoạt vị trí mô phỏng: Đang ở "${target.name}"! Các quy tắc If-Then tự động sẵn sàng.`);
    }
  };

  // v0.3.0 / v0.23.0 B24: Data Export for AI Assistant State
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string>('taio_sec_tok_9f8a7e6d5c4b3a210987654321fedcba');

  const rotateShareToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let newToken = 'taio_sec_tok_';
    for (let i = 0; i < 32; i++) {
      newToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setShareToken(newToken);
    setCelebrationMsg('Đã tạo mã token bảo mật mới. Các link cũ đã được vô hiệu hóa an toàn!');
  };

  const addDailyCardItem = (item: {
    text: string;
    goalId?: string;
    origin?: ItemOrigin;
    start?: string;
    end?: string;
    displacedItemId?: string;
    displacedItemTitle?: string;
    displacedMinutes?: number;
  }) => {
    const goal = goals.find(g => g.id === item.goalId);
    const newItem: DailyCardItem = {
      id: `dc-${Date.now()}`,
      text: item.text,
      date: selectedCardDate,
      goalId: item.goalId,
      goalName: goal?.name,
      start: item.start,
      end: item.end,
      status: 'open',
      carryCount: 0,
      origin: item.origin || 'planned',
      displacedItemId: item.displacedItemId,
      displacedItemTitle: item.displacedItemTitle,
      displacedMinutes: item.displacedMinutes,
    };
    setDailyCardItems(prev => [newItem, ...prev]);
  };

  const toggleDailyCardItem = (id: string) => {
    setDailyCardItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus: ItemStatus = item.status === 'done' ? 'open' : 'done';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const carryOverItem = (id: string, action: 'tomorrow' | 'leave' | 'drop', reason?: string) => {
    setDailyCardItems(prev => prev.map(item => {
      if (item.id === id) {
        if (action === 'tomorrow') {
          const d = new Date(item.date);
          d.setDate(d.getDate() + 1);
          const tomorrowStr = d.toISOString().split('T')[0];
          return {
            ...item,
            date: tomorrowStr,
            status: 'open',
            carryCount: item.carryCount + 1,
          };
        } else if (action === 'leave') {
          return { ...item, status: 'left' };
        } else if (action === 'drop') {
          return { ...item, status: 'dropped', dropReason: reason || 'Bỏ qua cuối ngày' };
        }
      }
      return item;
    }));
  };

  const generateMarkdownSnapshot = (): string => {
    const today = new Date().toISOString().split('T')[0];
    const exportTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    // 1. Header
    let md = `# TAIO Time App · Daily log ${today}\n`;
    md += `- Người dùng: ${userProfileDetail.displayName} (${userProfileDetail.salutation})\n`;
    md += `- Xuất lúc: ${exportTime} (GMT+7)\n`;
    md += `- Phiên bản ứng dụng: TAIO Time App v0.3.9\n`;
    md += `- Hồ sơ người dùng: ${profile.title} (${profile.workStyle || 'mixed'})\n`;
    md += `- Mã xuất dữ liệu: exp_${Date.now()}\n\n`;

    // 2. Schedule and results
    md += `## 1. Lịch trình và kết quả thực hiện (Schedule and results)\n`;
    md += `| Khung giờ | Nhiệm vụ | Loại | Cách kết thúc | Mục tiêu | Kết quả |\n`;
    md += `| --- | --- | --- | --- | --- | --- |\n`;
    blocks.forEach(b => {
      const outcome = b.status === 'done' ? 'Đã xong đúng hẹn' : b.status === 'in_progress' ? 'Đang thực hiện' : 'Chưa đến giờ';
      md += `| ${b.startTime} - ${b.endTime} | ${b.title} | ${b.type} | ${b.taskEndType || 'timebox'} | ${b.goalName || 'Ngoài mục tiêu'} | ${outcome} |\n`;
    });
    md += `\n`;

    // 3. Time ledger (24h continuous)
    md += `## 2. Sổ cái thời gian 24 giờ (Time ledger)\n`;
    timeLedger.forEach(s => {
      md += `- ${s.start} - ${s.end} (${s.durationMins}p): **${s.label}** [${s.category}]\n`;
    });
    md += `\n`;

    // 4. Interruptions
    md += `## 3. Việc phát sinh & Quỹ gián đoạn (Interruptions)\n`;
    md += `- Quỹ dự phòng: ${profile.interruptionReserveMins} phút\n`;
    if (interruptions.length === 0) {
      md += `- Chưa ghi nhận việc gián đoạn nào.\n`;
    } else {
      md += `| Thời điểm | Danh mục | Nội dung | Số phút | Quyết định |\n`;
      md += `| --- | --- | --- | --- | --- |\n`;
      interruptions.forEach(i => {
        md += `| ${i.timestamp} | ${i.category || 'Khác'} | ${i.title} | ${i.minutes}p | ${i.decision} |\n`;
      });
    }
    md += `\n`;

    // 5. Undeclared time & distraction
    md += `## 4. Khoảng thời gian chưa khai báo & Xao nhãng\n`;
    md += `- Khoảng trống: ${gaps.length} khoảng trống\n`;
    gaps.forEach(g => {
      md += `  + ${g.start} - ${g.end} (${g.durationMins}p): Nhãn "${g.label || 'Chưa gắn'}"\n`;
    });
    md += `\n`;

    // 6. Goals and projects
    md += `## 5. Mục tiêu lớn & Lộ trình (Goals and projects)\n`;
    goals.forEach(g => {
      md += `- **${g.name}** (${g.workArea}): Tiến độ ${g.progressPercent}%, Hạn chót ${g.deadline}, Ngân sách ${g.dailyBudgetMins}p/ngày\n`;
    });
    md += `\n`;

    // 7. Priority matrix
    md += `## 6. Ma trận ưu tiên Eisenhower\n`;
    md += `- Ô 1 (Làm ngay): ${blocks.filter(b => b.quadrant === 1).length} việc\n`;
    md += `- Ô 2 (Lên lịch - Trọng tâm): ${blocks.filter(b => b.quadrant === 2).length} việc\n`;
    md += `- Ô 3 (Ủy quyền): ${blocks.filter(b => b.quadrant === 3).length} việc\n`;
    md += `- Ô 4 (Bỏ qua): ${blocks.filter(b => b.quadrant === 4).length} việc\n\n`;

    // 8. Inbox (GTD)
    md += `## 7. Rổ công việc Inbox (GTD)\n`;
    md += `- Việc đang chờ xử lý: ${inbox.filter(i => i.status === 'inbox').length} việc\n`;
    md += `- Việc đã xử lý hôm nay: ${inbox.filter(i => i.status !== 'inbox').length} việc\n\n`;

    // 9. Daily card & carry-over (B25)
    md += `## 8. Thẻ ngày & Dời việc (Daily card & carry-over)\n`;
    dailyCardItems.forEach(dc => {
      const strike = dc.status === 'done' ? '✓ [Đã xong]' : dc.status === 'dropped' ? '✗ [Đã bỏ]' : '[ ]';
      const carry = dc.carryCount > 0 ? ` (Dời ↻${dc.carryCount})` : '';
      const orig = dc.origin === 'unplanned_goal' ? ' [Ngoài KH có MT]' : '';
      md += `- ${strike} ${dc.text}${carry}${orig}\n`;
    });
    md += `\n`;

    // 10. Day close
    md += `## 9. Đóng ngày (Day close)\n`;
    md += `- Trạng thái: ${dayClosed ? 'Đã đóng ngày an toàn' : 'Chưa đóng ngày'}\n`;
    md += `- Nhiệm vụ số 1 ngày mai: Sẵn sàng thực thi\n\n`;

    // 11. Lists & Projects (B26)
    md += `## 10. Danh sách & Dự án (Lists & Projects)\n`;
    lists.filter(l => !l.archived).forEach(l => {
      const items = listItems.filter(i => i.listId === l.id && !i.archived);
      md += `### ${l.name} [${l.type.toUpperCase()}]\n`;
      items.forEach(it => {
        if (l.type === 'checklist') {
          md += `- [${it.checked ? 'X' : ' '}] ${it.text}\n`;
        } else if (l.type === 'idea') {
          md += `- [${it.ideaState || 'new'}] ${it.text}${it.usedIn ? ` (Đã dùng: ${it.usedIn})` : ''}\n`;
        } else {
          md += `- **${it.text}** (${it.projectStatus || 'active'} - Tiến độ ${it.progress || 0}%) | Kế tiếp: ${it.nextAction || 'Chưa định'}\n`;
        }
      });
      md += `\n`;
    });

    // 12. Active Capture & Địa điểm (B30)
    md += `## 11. Thu thập chủ động & Địa điểm (Active Capture & Geofence)\n`;
    savedPlaces.forEach(p => {
      md += `- **${p.name}** (Bán kính ${p.radiusMeters}m${p.isCurrentLocation ? ' - Đang ở đây' : ''})\n`;
    });

    return md;
  };

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

  // v0.9, v0.3.10 & v0.3.11: Action Nudge & Bell Notification actions (B14)
  const acceptActionNudge = () => {
    if (!actionNudge) return;
    const currentType = actionNudge.type;
    setActionNudge(null);
    if (currentType === 'sleep_next_day') {
      // B14 v0.3.10 -> opens B12 next-day cost question
      setSocialAuditModalOpen(true);
    } else if (currentType === 'close_day') {
      setCloseDayModalOpen(true);
    } else {
      setCelebrationMsg(language === 'vi' ? '✓ Đã hoàn tất hành động nhắc nhở!' : 'Action completed!');
    }
  };

  const dismissActionNudge = () => {
    if (!actionNudge) return;
    // Dismiss temporarily, returns after pause (15 min in production; 60s demo)
    setActionNudge(prev => prev ? { ...prev, isDismissed: true, repeatCount: prev.repeatCount + 1, status: 'ignored' } : null);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const triggerNotificationAction = (notif: AppNotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.targetAction === 'sleep') {
      setSocialAuditModalOpen(true);
    } else if (notif.targetAction === 'start_deep') {
      setCurrentTab('now');
      setIsTimerRunning(true);
    } else if (notif.targetAction === 'open_questions') {
      setIsQuestionsModalOpen(true);
    } else if (notif.targetAction === 'open_checkin') {
      setCheckInBlock(blocks[0] || null);
      setCheckInModalOpen(true);
    } else if (notif.targetAction === 'open_swipe') {
      setIsSwipeModalOpen(true);
    } else if (notif.targetAction === 'open_dayclose') {
      setCloseDayModalOpen(true);
    }
  };

  // B27 v0.3.12: Wipe all personal data and return to onboarding
  const resetAllUserData = (deleteServerCopy: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch {}
    setInbox([]);
    setDailyCardItems([]);
    setLists([]);
    setListItems([]);
    setInterruptions([]);
    setGaps([]);
    setIsProfileModalOpen(false);
    setHasServerBackupToRestore(!deleteServerCopy);
    setIsOnboarded(false);
    showToast(
      deleteServerCopy
        ? 'Đã xóa toàn bộ dữ liệu trên thiết bị và yêu cầu xóa bản sao máy chủ.'
        : 'Đã xóa dữ liệu trên thiết bị và đăng xuất về màn hình thiết lập ban đầu.'
    );
  };

  const resolveServerBackupChoice = (choice: 'restore' | 'fresh') => {
    if (choice === 'restore') {
      setInbox(INITIAL_INBOX);
      setDailyCardItems(INITIAL_DAILY_CARD_ITEMS);
      setLists(INITIAL_LISTS);
      setListItems(INITIAL_LIST_ITEMS);
      setInterruptions(INITIAL_INTERRUPTIONS);
      setGaps(INITIAL_GAPS);
      showToast('Đã khôi phục dữ liệu cũ từ máy chủ.');
    } else {
      showToast('Đã bắt đầu mới. Bản sao cũ được lưu trữ 30 ngày trước khi xóa hẳn.');
    }
    setHasServerBackupToRestore(false);
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
    situation,
    isDistraction,
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
    situation?: InterruptionSituation;
    isDistraction?: boolean;
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
      situation,
      isDistraction: isDistraction ?? (situation === 'review'),
    };

    setInterruptions(prev => [newInt, ...prev]);

    if (returnPoint) {
      setActiveReturnPoint(returnPoint);
      if (currentBlock) {
        setBlocks(prev => prev.map(b => b.id === currentBlock.id ? { ...b, returnPoint } : b));
      }
    }

    if (decision === 'postpone') {
      const isBodyNeed = category === 'eating_drinks' || category === 'travel' || category === 'break';
      if (!isBodyNeed) {
        // v0.3.9 B5: Việc yêu cầu (cuộc gọi, việc mới, gia đình) -> Cho vào Inbox
        const newInboxItem: InboxItem = {
          id: `inbox-${Date.now()}`,
          title: title,
          source: 'quick',
          createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          nextAction: 'Xử lý sau',
          estimatedMinutes: minutes || 15,
          linkedGoalId: goalId,
          linkedGoalName: goal?.name,
          suggestedQuadrant: 2,
          status: 'inbox',
        };
        setInbox(prev => [newInboxItem, ...prev]);
        showToast('Đã cho vào Rổ công việc. Bạn có thể sắp xếp làm sau.');
      } else {
        // Nhu cầu cơ thể -> Nhắc khi hết block hiện tại
        showToast('Sẽ nhắc bạn khi hết khung giờ hiện tại.');
      }
    } else if (decision === 'do_now') {
      setTimerMinutesRemaining(minutes || 15);
      setIsTimerRunning(true);
      showToast(language === 'vi' ? 'Đang chạy đồng hồ việc phát sinh. Giảm trừ vào quỹ dự phòng hôm nay!' : 'Interruption timer active. Deducted from today\'s reserve.');
    } else if (decision === 'delegate') {
      const newInboxItem: InboxItem = {
        id: `inbox-${Date.now()}`,
        title: title,
        source: 'quick',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        nextAction: 'Chờ người khác xử lý (Waiting for)',
        estimatedMinutes: minutes || 15,
        linkedGoalId: goalId,
        linkedGoalName: goal?.name,
        suggestedQuadrant: 3,
        status: 'delegated',
      };
      setInbox(prev => [newInboxItem, ...prev]);
      showToast('Đã chuyển vào Rổ việc chờ người khác xử lý.');
    } else if (decision === 'decline') {
      showToast(
        language === 'vi' 
          ? `Tuyệt vời! Bạn vừa bảo vệ được ${minutes || 15} phút tập trung quý giá.` 
          : `Protected ${minutes || 15} focus minutes!`
      );
    } else if (decision === 'schedule') {
      showToast(
        language === 'vi' 
          ? `Đã xếp việc "${title}" vào khung giờ trống kế tiếp.` 
          : `Scheduled "${title}" to next free slot.`
      );
    } else if (decision === 'go_social') {
      showToast(
        language === 'vi' 
          ? `Đã ghi nhận giao lưu kèm 30 phút đệm di chuyển. App sẽ nhắc nhẹ giờ về lúc ${socialEndTime}!` 
          : `Social outing logged with 30m travel buffer. Gentle nudge set for ${socialEndTime}!`
      );
    }

    setInterruptionModalOpen(false);
  };

  // Contextual Coach Card triggers
  const triggerCoachCard = (moment: 'first_interruption' | 'first_timebox' | 'first_dod_done' | 'first_inbox' | 'first_matrix') => {
    const card = INITIAL_COACH_CARDS.find(c => c.triggerMoment === moment);
    if (card) {
      setActiveCoachCard(card);
    }
  };

  const dismissCoachCard = () => {
    setActiveCoachCard(null);
  };

  // Inbox operations (B20)
  const addInboxItem = (itemData: { 
    title: string; 
    source?: 'quick' | 'telegram' | 'voice' | 'meeting_followup'; 
    nextAction?: string; 
    estimatedMinutes?: number; 
    linkedGoalId?: string 
  }) => {
    const goal = goals.find(g => g.id === itemData.linkedGoalId);
    const newItem: InboxItem = {
      id: `inbox-${Date.now()}`,
      title: itemData.title,
      source: itemData.source || 'quick',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      nextAction: itemData.nextAction || itemData.title,
      estimatedMinutes: itemData.estimatedMinutes || 15,
      linkedGoalId: itemData.linkedGoalId,
      linkedGoalName: goal?.name,
      suggestedQuadrant: itemData.linkedGoalId ? 2 : 3,
      status: 'inbox',
    };
    setInbox(prev => [newItem, ...prev]);
    setCelebrationMsg(language === 'vi' ? 'Đã thêm việc vào Rổ công việc (Inbox)!' : 'Added to Inbox!');
    triggerCoachCard('first_inbox');
  };

  const processInboxItem = (
    id: string, 
    action: 'schedule' | 'done_2min' | 'delegate' | 'drop', 
    details?: { quadrant?: 1 | 2 | 3 | 4 }
  ) => {
    const target = inbox.find(i => i.id === id);
    if (!target) return;

    if (action === 'done_2min') {
      setInbox(prev => prev.map(i => i.id === id ? { ...i, status: 'done_2min' } : i));
      setCelebrationMsg(language === 'vi' ? 'Đã hoàn thành ngay theo Quy tắc 2 phút (GTD)!' : 'Completed via 2-minute rule!');
    } else if (action === 'schedule') {
      setInbox(prev => prev.map(i => i.id === id ? { ...i, status: 'scheduled' } : i));
      // Add to blocks
      addNewBlock({
        title: target.title,
        startTime: '16:00',
        endTime: '16:30',
        type: 'deep',
        status: 'planned',
        goalId: target.linkedGoalId,
        goalName: target.linkedGoalName,
        quadrant: details?.quadrant || target.suggestedQuadrant || 2,
        estimatedMinutes: target.estimatedMinutes || 30,
        notes: `Từ Inbox: ${target.nextAction || ''}`,
      });
      setCelebrationMsg(language === 'vi' ? 'Đã lên lịch thành công từ Rổ việc vào Kế hoạch!' : 'Scheduled to Plan tab!');
    } else if (action === 'delegate') {
      setInbox(prev => prev.map(i => i.id === id ? { ...i, status: 'delegated' } : i));
      setCelebrationMsg(language === 'vi' ? 'Đã đánh dấu ủy quyền việc này.' : 'Delegated!');
    } else if (action === 'drop') {
      setInbox(prev => prev.map(i => i.id === id ? { ...i, status: 'dropped' } : i));
      setCelebrationMsg(language === 'vi' ? 'Đã loại bỏ / lưu tham khảo khỏi rổ việc.' : 'Archived!');
    }
  };

  // Check-in answers (v0.20 B9 Anatomy)
  const handleCheckInAnswer = (
    answer: 'done' | 'continue_later' | 'more_time' | 'remind_10m' | 'stop_here', 
    extraMins = 15,
    nextStep?: string
  ) => {
    if (!checkInBlock) return;

    if (answer === 'done') {
      setBlocks(prev => prev.map(b => b.id === checkInBlock.id ? { 
        ...b, 
        status: 'done', 
        timeboxEndOutcome: 'done_on_time',
        touchTimeMinutes: b.estimatedMinutes || 60,
        cycleTimeMinutes: b.estimatedMinutes || 60,
        flowEfficiency: 1.0,
      } : b));
      setCelebrationMsg(language === 'vi' ? '🎉 Hoàn thành đúng tiêu chí (Definition of Done)! Tiến độ mục tiêu đã cập nhật.' : '🎉 Completed per Definition of Done!');
      triggerCoachCard('first_dod_done');
      const nextBlock = blocks.find(b => b.id !== checkInBlock.id && b.status === 'planned');
      if (nextBlock) {
        setBlocks(prev => prev.map(b => b.id === nextBlock.id ? { ...b, status: 'in_progress' } : b));
        setTimerMinutesRemaining(profile.focusBlockDurationMins);
      }
    } else if (answer === 'continue_later' || answer === 'stop_here') {
      setBlocks(prev => prev.map(b => b.id === checkInBlock.id ? { 
        ...b, 
        status: 'partly_done',
        timeboxEndOutcome: 'continue_later',
        nextStep: nextStep || b.nextStep || 'Làm tiếp bước kế tiếp',
      } : b));
      // Auto add residual step to Inbox so mind is clear (Zeigarnik effect reduction)
      if (nextStep) {
        addInboxItem({
          title: `Làm tiếp: ${checkInBlock.title}`,
          nextAction: nextStep,
          estimatedMinutes: 30,
          linkedGoalId: checkInBlock.goalId,
        });
      }
      setCelebrationMsg(language === 'vi' ? 'Đã lưu bước kế tiếp và đưa vào Rổ việc để tâm trí hoàn toàn thanh thản (Zeigarnik)!' : 'Saved next step cleanly!');
    } else if (answer === 'more_time') {
      setBlocks(prev => prev.map(b => b.id === checkInBlock.id ? { ...b, status: 'extended' } : b));
      setTimerMinutesRemaining(prev => prev + extraMins);
      setCelebrationMsg(language === 'vi' ? `Đã thêm +${extraMins} phút tập trung cho nhiệm vụ hiện tại.` : `Added +${extraMins} minutes.`);
    } else if (answer === 'remind_10m') {
      setCelebrationMsg(language === 'vi' ? 'Sẽ nhắc lại điểm kiểm tra sau 10 phút.' : 'Will remind you in 10 minutes.');
    }

    setCheckInModalOpen(false);
    setCheckInBlock(null);
  };

  // D5 v0.3.11: Overlays must lock the screen behind them (fixes drag scrolling behind sheets on iOS)
  const isAnyOverlayOpen =
    !isOnboarded ||
    interruptionModalOpen ||
    checkInModalOpen ||
    closeDayModalOpen ||
    socialAuditModalOpen ||
    settingsModalOpen ||
    inboxModalOpen ||
    methodLibraryOpen ||
    exportModalOpen ||
    isListsModalOpen ||
    isProfileModalOpen ||
    isSwipeModalOpen ||
    isQuestionsModalOpen ||
    isActiveCaptureOpen ||
    !!drilldown.isOpen;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (isAnyOverlayOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      return () => {
        const y = Math.abs(parseInt(document.body.style.top || '0', 10));
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, y);
      };
    }
  }, [isAnyOverlayOpen]);

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
      toastMsg,
      toastUndoAction,
      showToast,
      notifications,
      markAllNotificationsRead,
      triggerNotificationAction,
      resetAllUserData,
      hasServerBackupToRestore,
      resolveServerBackupChoice,
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
      setSettingsModalOpen,
      inbox,
      inboxModalOpen,
      setInboxModalOpen,
      addInboxItem,
      processInboxItem,
      timeLedger,
      methodLibraryOpen,
      setMethodLibraryOpen,
      methodConcepts,
      activeCoachCard,
      dismissCoachCard,
      triggerCoachCard,
      dailyCardItems,
      selectedCardDate,
      setSelectedCardDate,
      addDailyCardItem,
      toggleDailyCardItem,
      carryOverItem,
      exportModalOpen,
      setExportModalOpen,
      shareToken,
      rotateShareToken,
      generateMarkdownSnapshot,
      lists,
      listItems,
      activeListId,
      setActiveListId,
      isListsModalOpen,
      setIsListsModalOpen,
      createList,
      archiveList,
      togglePinList,
      addListItem,
      toggleListItemCheck,
      updateListItem,
      archiveListItem,
      userProfileDetail,
      setUserProfileDetail,
      updateUserProfileDetail,
      communityConfig,
      isProfileModalOpen,
      setIsProfileModalOpen,
      screenDwells,
      recordScreenDwell,
      backlogCards,
      isSwipeModalOpen,
      setIsSwipeModalOpen,
      handleSwipeAction,
      reminderQuestions,
      isQuestionsModalOpen,
      setIsQuestionsModalOpen,
      activeQuestion,
      setActiveQuestion,
      triggerReminderQuestion,
      isActiveCaptureOpen,
      setIsActiveCaptureOpen,
      savedPlaces,
      passiveSuggestions,
      acceptPassiveSuggestion,
      ignorePassiveSuggestion,
      backfillTime,
      savePlace,
      togglePlaceLocation
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
