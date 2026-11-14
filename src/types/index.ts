export type UserProfileType = 
  | 'technical' 
  | 'manager' 
  | 'owner' 
  | 'admin' 
  | 'trade' 
  | 'freelancer';

export type UserRole = 
  | 'decision-maker' 
  | 'operator' 
  | 'seller' 
  | 'self' 
  | 'family' 
  | 'friend';

export type WorkStyle = 'multitasking' | 'sequential' | 'mixed';

export interface UserProfile {
  id: string;
  name: string;
  type: UserProfileType;
  title: string;
  description: string;
  split: {
    deepWork: number; // percentage
    interruptions: number;
    meetings: number;
    other: number;
  };
  interruptionReserveMins: number;
  focusBlockDurationMins: number;
  reminderIntensity: 'gentle' | 'standard' | 'high';
  personalAnchors: {
    lunchTime: string;
    dinnerTime: string;
    windDownTime: string;
  };
  ageBand?: '<45' | '>=45';
  // v0.22.0 B23:
  workStyle?: WorkStyle;
}

export type BlockType = 'deep' | 'meeting' | 'interruption' | 'personal' | 'planning';

export type TaskEndType = 'timebox' | 'until_done_pausable' | 'until_done_atomic';

export type BlockStatus = 
  | 'planned' 
  | 'in_progress' 
  | 'done' 
  | 'extended' 
  | 'partly_done' 
  | 'dropped' 
  | 'unconfirmed';

// v0.20: Definition of Done (DoD) Item
export interface DodItem {
  id: string;
  text: string;
  completed: boolean;
}

export type BlockKind = 'task' | 'ritual' | 'meeting' | 'personal';

// PRD v0.3.35 Part D: SubTask (việc con)
export interface SubTask {
  id: string;        // "st-" + id
  title: string;
  done: boolean;
  note?: string;
  createdAt: number;
}

// PRD v0.3.36 Part B: Task Extension record (+5p, +10p, +15p, custom)
export interface TaskExtension {
  at: number;        // timestamp ms
  mins: number;      // minutes extended
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "14:00"
  endTime: string;   // "15:30"
  type: BlockType;
  status: BlockStatus;
  goalId?: string; // or undefined for "outside goals"
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  stepNumber?: number;
  totalSteps?: number;
  returnPoint?: string;
  notes?: string;
  children?: SubTask[]; // PRD v0.3.35 Part D: Việc con (tối đa 10)
  extensions?: TaskExtension[]; // PRD v0.3.36 Part B: Lịch sử gia hạn (+5p, +10p, +15p)
  // B16 Priority Matrix
  quadrant?: 1 | 2 | 3 | 4;
  isImportant?: boolean;
  isUrgent?: boolean;
  estimatedMinutes?: number;
  ageDays?: number;
  // v0.18 - v0.20 additions:
  blockKind?: BlockKind;
  dodChecklist?: DodItem[];
  timeboxEndOutcome?: 'done_on_time' | 'done_over_time' | 'continue_later' | 'extended';
  nextStep?: string;
  touchTimeMinutes?: number;
  cycleTimeMinutes?: number;
  flowEfficiency?: number;
  // v0.22.0 B23 additions:
  taskEndType?: TaskEndType;
  timeLimitMins?: number; // User-set appetite / time limit when planning (default = estimate)
  deadline?: string;
  updatedAt?: string | number;
  // v0.3.20 B24 additions:
  isTemplateBlock?: boolean;
  templateKind?: string;
  goalMinutes?: Record<string, number>;
  matrixGroup?: 'do_now' | 'delegate' | 'schedule' | 'drop';
  taskSource?: string;
  carryFrom?: string;
  createdAt?: string;
  parallelOf?: string; // id of main task if this is a side/parallel task (PRD v0.3.33 Part F)
  extra?: Record<string, unknown>;
}

export interface HardDeadline {
  id: string;
  title: string;
  time: string; // "16:00"
  source: 'manual' | 'calendar';
  isCritical?: boolean;
}

export interface Milestone {
  id: string;
  goalId: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'completed';
}

export type GoalProgressType = 'key_result' | 'tasks' | 'time_commitment';

export interface Goal {
  id: string;
  name: string;
  measurableResult: string;
  horizonDays: number;
  dailyBudgetMins: number;
  deadline: string;
  milestones: Milestone[];
  workArea: 'Business' | 'Product' | 'Operations' | 'Personal';
  progressPercent: number;
  progressType?: GoalProgressType; // B7 v0.3.18/v0.3.19: default 'tasks'
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL'; // v0.3.34 Part E5: T-Shirt Goal Sizing
  keyResultCurrent?: number;
  keyResultTarget?: number;
  keyResultUnit?: string;
  committedHours?: number;
  newTasksAddedCount?: number;
  color?: string;
  plannedMinutesTotal?: number;
  actualMinutesTotal?: number;
  updatedAt?: string | number;
  start?: string;
  commitment?: {
    minutesPerDay: number;
    days: number;
    start: string;
  };
  extra?: Record<string, unknown>;
}

export type InterruptionDecision = 
  | 'postpone'    // v0.3.9 B5: Để sau (Mặc định)
  | 'do_now'      // Làm luôn
  | 'parallel'    // v0.3.33 Part F: Làm kèm (Làm song song với việc chính)
  | 'delegate'    // Nhờ người khác
  | 'decline'     // Không làm
  | 'schedule'    // Lên lịch
  | 'go_social';  // Giao lưu xã hội

// B5 v0.3.9: Two situations for categories
export type InterruptionSituation = 'moment' | 'review';

// B5 v0.16 & v0.3.1: 13 Default Activity Categories (Added Exercise)
export type InterruptionActivityCategory =
  | 'eating_drinks'      // Ăn uống
  | 'overslept'          // Ngủ quên / nướng
  | 'chatting_gossip'    // Tán gẫu / Buôn chuyện
  | 'travel'             // Di chuyển
  | 'research_reading'   // Đọc / Nghiên cứu lan man
  | 'drank_too_much'     // Uống quá chén / Nhậu
  | 'phone_scrolling'    // Lướt điện thoại
  | 'calls_messages'     // Cuộc gọi / Nhắn tin
  | 'family_matter'      // Việc gia đình
  | 'work_came_up'       // Việc mới phát sinh
  | 'break'              // Nghỉ giải lao
  | 'exercise'           // Tập thể dục / Gym / Thể thao
  | 'prev_task_over'     // Việc trước đó (chạy quá giờ)
  | 'other';             // Khác

// Backwards compatibility for v0.8
export type InterruptionWhatType = InterruptionActivityCategory | 'work_call' | 'client' | 'team' | 'family' | 'friends' | 'errand' | 'other';
export type InterruptionSourceType = 'boss' | 'colleague' | 'client' | 'family' | 'friend' | 'my_idea';

export interface InterruptionRecord {
  id: string;
  timestamp: string;
  title: string;
  minutes: number;
  decision: InterruptionDecision;
  goalId?: string;
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  returnPoint?: string;
  socialEndTime?: string;
  travelBufferMins?: number;
  sourcePerson?: string;
  whatType?: InterruptionWhatType;
  sourceType?: InterruptionSourceType;
  // v0.16 & v0.3.9 additions:
  category?: InterruptionActivityCategory;
  note?: string;
  situation?: InterruptionSituation;
  isDistraction?: boolean; // v0.3.9: tách riêng Xao nhãng và Chen ngang
  date?: string;
  updatedAt?: string | number;
  extra?: Record<string, unknown>;
}

export type GapLabel = 
  | 'rest' 
  | 'meal' 
  | 'travel' 
  | 'small_tasks' 
  | 'distraction' 
  | 'other';

export interface UndeclaredGap {
  id: string;
  start: string;
  end: string;
  durationMins: number;
  label?: GapLabel;
}

export interface DaySummary {
  date: string;
  plannedMinutes: number;
  doneMinutes: number;
  deepWorkMinutes: number;
  interruptionReserveMins: number;
  interruptionUsedMins: number;
  protectedFocusMinutes: number;
  tomorrowTopTask?: string;
  locked: boolean;
}

export type ToneLevel = 1 | 2 | 3 | 'auto'; // 1: Gentle, 2: Clear, 3: Firm

// B14: Action Nudges (one CTA, never blocking)
export type ActionNudgeType = 
  | 'sleep' 
  | 'sleep_next_day' // v0.3.10: morning after expired sleep nudge asks B12 next-day question
  | 'meal' 
  | 'leave_now' 
  | 'start_deep' 
  | 'close_day' 
  | 'back_to_plan';

export interface ActionNudge {
  id: string;
  type: ActionNudgeType;
  context: string;
  ctaText: string;
  repeatCount: number;
  maxRepeats: number;
  isDismissed: boolean;
  timeShown: string;
  // v0.3.10: active window & expiry
  windowStartHour?: number; // 0-23
  windowEndHour?: number;   // 0-23
  status?: 'active' | 'accepted' | 'ignored' | 'expired';
}

// B14 v0.3.11: In-app Bell Notification History Item (5 latest notifications)
export interface AppNotificationItem {
  id: string;
  kind: 'nudge' | 'question' | 'checkin';
  title: string;
  time: string;
  ctaLabel: string;
  read: boolean;
  targetAction: 'sleep' | 'start_deep' | 'open_questions' | 'open_checkin' | 'open_swipe' | 'open_dayclose';
  targetBlockId?: string;
}

// B15: Habit Insights & Weekly Experiments
export interface HabitCard {
  id: string;
  type: 'keep' | 'change' | 'suggestion';
  title: string;
  example: string;
  evidence: string;
  confidence: number;
  suggestedStep: string;
  status: 'active' | 'trying' | 'rejected' | 'dismissed';
}

export interface WeeklyExperiment {
  id: string;
  habit: string;
  startDate: string;
  baseline: string;
  result: string;
  status: 'running' | 'kept' | 'discarded';
}

// C6: Super Admin AI Improvement Suggestions
export interface SuperAdminAISuggestion {
  id: string;
  title: string;
  evidence: string;
  expectedEffect: string;
  status: 'pending' | 'accepted' | 'rejected' | 'testing';
  category: 'nudges' | 'profiles' | 'templates';
}

// B17: Appearance & Device Settings
export type DeviceLook = 'auto' | 'macos' | 'windows' | 'phone';
export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorPalette = 'warm' | 'cool' | 'neutral';

export interface PaletteColors {
  name: ColorPalette;
  brandAccent: string;
  deepWork: string;
  interruption: string;
  meeting: string;
  personal: string;
  planning: string;
}

// B20: Inbox Mini App ("Rổ công việc")
export interface InboxItem {
  id: string;
  title: string;
  source: 'quick' | 'telegram' | 'voice' | 'meeting_followup';
  createdAt: string;
  nextAction?: string;
  estimatedMinutes?: number;
  linkedGoalId?: string;
  linkedGoalName?: string;
  suggestedQuadrant?: 1 | 2 | 3 | 4;
  status: 'inbox' | 'scheduled' | 'done_2min' | 'delegated' | 'dropped';
  updatedAt?: string | number;
}

// B1b & B21 (v0.3.15): 24-Hour Time Ledger (Actual groups)
export type TimeLedgerCategory = 
  | 'sleep' 
  | 'personal' 
  | 'goal_work' 
  | 'meeting' 
  | 'planning'
  | 'interruption' 
  | 'distraction' 
  | 'unconfirmed'
  | 'not_yet'
  | 'other';

export interface TimeLedgerSegment {
  id: string;
  start: string;
  end: string;
  durationMins: number;
  category: TimeLedgerCategory;
  label: string;
  linkedTaskTitle?: string;
  isTransitionGrace?: boolean;
}

// B22: Method Library & Contextual Coach Cards
export interface MethodConcept {
  id: string;
  name: string;
  nameVi: string;
  oneSentenceVi: string;
  sourceAuthor: string;
  year: number | string;
  bookOrStudy: string;
  appApplicationVi: string;
  tryTodayVi: string;
  category: 'plan' | 'do' | 'recover' | 'review';
}

export interface CoachCard {
  id: string;
  conceptId: string;
  triggerMoment: 'first_interruption' | 'first_timebox' | 'first_dod_done' | 'first_inbox' | 'first_matrix';
  titleVi: string;
  conceptLineVi: string;
  meaningVi: string;
  actionDoneVi: string;
  encourageVi: string;
}

// B25 (PRD v0.3.1): Daily Card, Carry-over & Work Diary
export type ItemOrigin = 'planned' | 'unplanned_goal' | 'interruption';
export type ItemStatus = 'open' | 'done' | 'carried' | 'left' | 'dropped';

export interface DailyCardItem {
  id: string;
  text: string;
  date: string; // "YYYY-MM-DD"
  goalId?: string;
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  start?: string;
  end?: string;
  status: ItemStatus;
  carriedFromId?: string;
  carryCount: number; // e.g. 0, 1, 2, 3
  origin: ItemOrigin;
  displacedItemId?: string;
  displacedItemTitle?: string;
  displacedMinutes?: number;
  dropReason?: string;
  dodChecklist?: DodItem[];
  note?: string;
  nextStep?: string;
  timeUsedFor?: string;
  movedTo?: string;
  isTemplateBlock?: boolean;
  parallelOf?: string; // id of main task if this is a side/parallel task (Part F)
  children?: SubTask[]; // PRD v0.3.35 Part D: Việc con (tối đa 10)
  extensions?: TaskExtension[]; // PRD v0.3.36 Part B: Lịch sử gia hạn (+5p, +10p, +15p)
  updatedAt?: string | number;
  extra?: Record<string, unknown>;
}

// B24 (PRD v0.3.0 / v0.23.0): Data Export for AI Assistant
export interface ExportSnapshot {
  id: string;
  createdAt: string;
  date: string;
  token: string;
  markdownContent: string;
  shareUrlLatest: string;
  shareUrlExact: string;
}

// B26 (PRD v0.3.2): Mini app Lists ("Danh sách")
export type ListType = 'idea' | 'project' | 'checklist';
export type IdeaState = 'new' | 'considering' | 'used' | 'dropped';
export type ProjectStatus = 'planned' | 'active' | 'paused' | 'done' | 'cancelled';

export interface AppList {
  id: string;
  name: string;
  type: ListType;
  tag?: string; // e.g. "#ytuong"
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  extra?: Record<string, unknown>;
}

export interface ListItemLink {
  kind: 'goal' | 'task' | 'timeBlock' | 'dayCard' | 'item';
  id: string;
}

export interface ListItem {
  id: string;
  listId: string;
  text: string;
  note?: string;
  order: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  source: 'typed' | 'voice' | 'widget' | 'telegram' | 'inbox';
  links?: ListItemLink[];
  // Idea list fields
  ideaState?: IdeaState;
  usedIn?: string;
  // Project list fields (same entity as projects in Goals & Efficiency B21)
  goalId?: string;
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  startDate?: string;
  deadline?: string;
  projectStatus?: ProjectStatus;
  progressMode?: 'auto' | 'manual';
  progress?: number; // 0-100%
  nextAction?: string; // GTD next action
  timeSpentMinutes?: number;
  // Simple checklist field
  checked?: boolean;
  extra?: Record<string, unknown>;
}

// B27 (PRD v0.3.4): Profile, Personalization and Community links ("Cá nhân / Me")
export interface UserProfileDetail {
  displayName: string;
  salutation: string; // "Anh", "Chị", "Bạn"
  avatarType: 'initials' | 'image' | 'preset';
  avatarPreset?: string;
  avatarUrl?: string;
  defaultHomeScreen: 'inbox' | 'daycard' | 'now' | 'plan' | 'lists';
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  analyticsOptOut: boolean;
  updatedAt?: string | number;
  extra?: Record<string, unknown>;
}

export interface CommunityRemoteConfig {
  advisor: {
    name: string;
    title: string;
    description: string;
    avatarUrl?: string;
    zaloUrl: string;
    telegramUrl: string;
    visible: boolean;
  };
  communityGroups: Array<{
    id: string;
    name: string;
    channel: 'zalo' | 'telegram';
    description: string;
    membersCount?: string;
    url: string;
    visible: boolean;
  }>;
  freeTools: Array<{
    id: string;
    name: string;
    oneLineUse: string;
    iconName: string;
    url: string;
    visible: boolean;
  }>;
}

// C6.1 (PRD v0.3.3): Screen Dwell Statistics
export interface ScreenDwellEvent {
  screenId: string;
  dwellSeconds: number;
  enteredAt: string;
  source: string;
  deviceClass: 'phone' | 'tablet' | 'desktop';
}

// B28 (PRD v0.3.16): Quẹt thẻ nhiệm vụ (Swipe review of the backlog)
export interface BacklogCard {
  id: string;
  text: string;
  note?: string;
  type: 'inbox' | 'idea' | 'task';
  sourceId?: string;
  ageDays: number;
  snoozesCount: number;
  goalId?: string;
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  whyThisCard: string; // "Tồn đọng 7 ngày", "Thuộc mục tiêu chậm tiến độ", "Khám phá ngẫu nhiên (1/5)"
  estimatedMinutes?: number;
  deadline?: string;
  updatedAt?: string | number;
}

// B29 (PRD v0.3.6): Câu hỏi nhắc việc (Reminder questions)
export interface ReminderQuestion {
  id: string;
  text: string;
  category: 'today' | 'week' | 'goals';
  triggerType: 'day_start' | 'drift' | 'day_end' | 'free_gaps' | 'backlog_untouched' | 'random_tip';
  answerSummary: string; // Dữ liệu trả lời nhanh từ số liệu của người dùng
  targetScreen: 'plan' | 'now' | 'daycard' | 'goals' | 'swipe_review' | 'close_day';
  actionLabel: string;
}

// B30 (PRD v0.3.7): Active capture (Ghi bù & Địa điểm Geofence)
export interface BackfillEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  category: InterruptionActivityCategory;
  goalId?: string;
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  origin: ItemOrigin;
  displacedBlockTitle?: string;
  note?: string;
}

export interface PassiveTimeSuggestion {
  id: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  suggestedActivity: string;
  category: InterruptionActivityCategory;
  goalId?: string;
  goalName?: string;
  milestoneId?: string;
  milestoneName?: string;
  source: 'ai_tool_timestamp' | 'geofence' | 'calendar' | 'motion';
  status: 'pending' | 'accepted' | 'ignored';
  steps?: number;
  motionKind?: 'walking' | 'transport';
}

export interface PlaceRule {
  id: string;
  trigger: 'arrive' | 'leave';
  actionType: 'remind_task' | 'auto_done' | 'time_segment';
  taskTitle: string;
  autoAccept?: boolean;
}

export interface SavedPlace {
  id: string;
  name: string;
  address?: string;
  radiusMeters: number; // min 100, default 150
  isCurrentLocation?: boolean;
  rules: PlaceRule[];
}

export interface ClosedDayRecord {
  date: string; // YYYY-MM-DD
  closedAt: number; // epoch ms
  method: 'manual' | 'auto';
}

export type ClosedDaysMap = Record<string, ClosedDayRecord>;





