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

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "14:00"
  endTime: string;   // "15:30"
  type: BlockType;
  status: BlockStatus;
  goalId?: string; // or undefined for "outside goals"
  goalName?: string;
  milestoneName?: string;
  stepNumber?: number;
  totalSteps?: number;
  returnPoint?: string;
  notes?: string;
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
  color?: string;
}

export type InterruptionDecision = 
  | 'do_now' 
  | 'schedule' 
  | 'delegate' 
  | 'decline' 
  | 'go_social';

// B5 v0.16: 12 Default Activity Categories
export type InterruptionActivityCategory =
  | 'eating_drinks'      // Ăn uống
  | 'overslept'          // Ngủ quên / nướng
  | 'chatting_gossip'    // Tán gẫu / Buôn chuyện
  | 'travel'             // Di chuyển
  | 'research_reading'   // Đọc / Nghiên cứu
  | 'drank_too_much'     // Uống quá chén
  | 'phone_scrolling'    // Lướt điện thoại
  | 'calls_messages'     // Gọi điện / Nhắn tin
  | 'family_matter'      // Việc gia đình
  | 'work_came_up'       // Việc công ty phát sinh
  | 'break'              // Nghỉ giải lao
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
  returnPoint?: string;
  socialEndTime?: string;
  travelBufferMins?: number;
  sourcePerson?: string;
  whatType?: InterruptionWhatType;
  sourceType?: InterruptionSourceType;
  // v0.16 additions:
  category?: InterruptionActivityCategory;
  note?: string;
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
}

// B1b & B21: 24-Hour Time Ledger
export type TimeLedgerCategory = 
  | 'sleep' 
  | 'personal' 
  | 'goal_work' 
  | 'meeting' 
  | 'interruption' 
  | 'distraction' 
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

