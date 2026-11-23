// TAIO Time App — Profession Onboarding Seeds Index (PRD v0.3.54 Part K)
import { getDeviceCalendarDate } from '@/core/clock';
import type { TaioExportV1 } from '@/features/data-transfer/model/taioExportV1';

import technicalData from './technical.json';
import managerData from './manager.json';
import ownerData from './owner.json';
import adminData from './admin.json';
import tradeData from './trade.json';
import freelancerData from './freelancer.json';

export type ProfessionRole = 'technical' | 'manager' | 'owner' | 'admin' | 'trade' | 'freelancer';

export const SEED_ROLES: ProfessionRole[] = [
  'technical',
  'manager',
  'owner',
  'admin',
  'trade',
  'freelancer',
];

const SEED_MAP: Record<ProfessionRole, unknown> = {
  technical: technicalData,
  manager: managerData,
  owner: ownerData,
  admin: adminData,
  trade: tradeData,
  freelancer: freelancerData,
};

function formatOffsetDate(baseDateStr: string, offsetDays: number): string {
  const d = new Date(baseDateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Loads the seed payload for a given profession role and adapts dynamic relative dates.
 */
export function getSeedData(role: ProfessionRole): TaioExportV1 {
  const raw = SEED_MAP[role] || SEED_MAP.manager;
  let jsonStr = JSON.stringify(raw);

  const todayStr = getDeviceCalendarDate();
  const yesterdayStr = formatOffsetDate(todayStr, -1);
  const tomorrowStr = formatOffsetDate(todayStr, 1);

  jsonStr = jsonStr.replace(/DATE_YESTERDAY/g, yesterdayStr);
  jsonStr = jsonStr.replace(/DATE_TODAY/g, todayStr);
  jsonStr = jsonStr.replace(/DATE_TOMORROW/g, tomorrowStr);

  // Replace DATE_PLUS_X
  jsonStr = jsonStr.replace(/DATE_PLUS_(\d+)/g, (_, days) => {
    return formatOffsetDate(todayStr, parseInt(days, 10));
  });

  return JSON.parse(jsonStr) as TaioExportV1;
}
