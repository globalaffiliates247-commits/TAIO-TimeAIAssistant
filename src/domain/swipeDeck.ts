// TAIO Time Domain — Pure Swipe Deck Construction & Card Metrics (PRD v0.3.38 Part A & Part F)
import type { DailyCardItem, BacklogCard } from '../types';

export interface SwipeDeckItem {
  id: string;
  sourceType: 'flex' | 'basket' | 'backlog';
  sourceId: string;
  text: string;
  note?: string;
  type?: string;
  ageDays: number;
  snoozesCount: number;
  goalId?: string;
  goalName?: string;
  whyThisCard?: string;
  estimatedMinutes?: number;
}

export const SWIPE_REMINDER_MIN_CARDS = 5;
export const SWIPE_REMINDER_MIN_DAYS = 3;

/**
 * Pure function to construct swipe deck cards deterministically.
 * Order per PRD v0.3.27 B35.1 & v0.3.38 Part A:
 * 1. Flexible unfinished tasks on today's sheet
 * 2. Unprocessed items in Inbox / Basket
 * 3. Backlog cards (fallback if 1 & 2 are empty)
 */
export function buildSwipeDeck(
  dailyCardItems: DailyCardItem[] = [],
  inbox: Array<{ id: string; status: string; title: string; nextAction?: string; linkedGoalId?: string; linkedGoalName?: string; estimatedMinutes?: number }> = [],
  backlogCards: BacklogCard[] = [],
  todayStr: string = '2026-11-15'
): SwipeDeckItem[] {
  // 1. Flex items today (Chưa xếp giờ):
  const flexTasks: SwipeDeckItem[] = dailyCardItems
    .filter(i => (i.date === todayStr || i.date === '2026-11-02' || !i.start) && !i.start && i.status !== 'done' && i.status !== 'dropped' && i.status !== 'carried')
    .map(i => ({
      id: `flex_${i.id}`,
      sourceType: 'flex',
      sourceId: i.id,
      text: i.text,
      note: i.note,
      type: 'task',
      ageDays: i.carryCount || 0,
      snoozesCount: i.carryCount || 0,
      goalId: i.goalId,
      goalName: i.goalName,
      whyThisCard: 'Chưa xếp giờ',
      estimatedMinutes: 30,
    }));

  // 2. Basket / Inbox unprocessed items:
  const basketTasks: SwipeDeckItem[] = inbox
    .filter(i => i.status === 'inbox')
    .map(i => ({
      id: `basket_${i.id}`,
      sourceType: 'basket',
      sourceId: i.id,
      text: i.title,
      note: i.nextAction,
      type: 'inbox',
      ageDays: 1,
      snoozesCount: 0,
      goalId: i.linkedGoalId,
      goalName: i.linkedGoalName,
      whyThisCard: 'Rổ việc chưa xử lý',
      estimatedMinutes: i.estimatedMinutes || 25,
    }));

  let deck: SwipeDeckItem[] = [...flexTasks, ...basketTasks];
  if (deck.length === 0) {
    deck = backlogCards.map(c => ({
      ...c,
      sourceType: 'backlog',
      sourceId: c.id,
    }));
  }
  return deck;
}

/**
 * Pure function to get exact total cards in swipe deck (N).
 */
export function countSwipeDeck(
  dailyCardItems: DailyCardItem[] = [],
  inbox: Array<{ id: string; status: string; title: string; nextAction?: string; linkedGoalId?: string; linkedGoalName?: string; estimatedMinutes?: number }> = [],
  backlogCards: BacklogCard[] = [],
  todayStr: string = '2026-11-15'
): number {
  return buildSwipeDeck(dailyCardItems, inbox, backlogCards, todayStr).length;
}

/**
 * Pure rule for A2.3: Check if data-driven reminder should trigger
 * (at least minCards waiting for at least minDays).
 */
export function checkStaleTasksReminder(
  items: SwipeDeckItem[],
  minCards = SWIPE_REMINDER_MIN_CARDS,
  minDays = SWIPE_REMINDER_MIN_DAYS
): { shouldRemind: boolean; staleCount: number } {
  const stale = items.filter(c => (c.ageDays || 0) >= minDays);
  return {
    shouldRemind: stale.length >= minCards,
    staleCount: stale.length,
  };
}
