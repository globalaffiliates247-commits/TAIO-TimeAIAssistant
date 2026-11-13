// PRD FIX v0.3.30 Part B2: Pure segmentBuilder function
import { RawMotionSegment, PedometerResult } from './motionBridge';
import { PassiveTimeSuggestion } from '@/types';

export interface TaskTimeInterval {
  startSec: number;
  endSec: number;
  title?: string;
}

export type DisplayMotionGroup = 'walking' | 'transport';

export interface MergedMotionSegment {
  startSec: number;
  endSec: number;
  group: DisplayMotionGroup;
  rawKinds: string[];
  steps?: number;
}

export function classifyMotionKind(kind: string): DisplayMotionGroup | 'stationary' | 'other' {
  switch (kind) {
    case 'walking':
    case 'running':
      return 'walking';
    case 'cycling':
    case 'automotive':
      return 'transport';
    case 'stationary':
      return 'stationary';
    default:
      return 'other';
  }
}

function formatHhMm(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Pure function to filter, merge, and clean raw Core Motion segments into actionable PassiveTimeSuggestions.
 */
export function buildMotionSegments(
  rawSegments: RawMotionSegment[],
  completedTasks: TaskTimeInterval[],
  pedometerLookup?: (startSec: number, endSec: number) => number
): PassiveTimeSuggestion[] {
  if (!rawSegments || rawSegments.length === 0) return [];

  // 1. Drop low-confidence segments and stationary/other for movement suggestions
  const validMoving = rawSegments.filter(s => {
    if (s.confidence === 'low') return false;
    const g = classifyMotionKind(s.kind);
    return g === 'walking' || g === 'transport';
  });

  if (validMoving.length === 0) return [];

  // Sort chronologically
  const sorted = [...validMoving].sort((a, b) => a.start - b.start);

  // 2. Merge consecutive segments of the same group if gap < 2 minutes (120 seconds)
  const merged: MergedMotionSegment[] = [];

  for (const seg of sorted) {
    const group = classifyMotionKind(seg.kind) as DisplayMotionGroup;
    const last = merged[merged.length - 1];

    if (last && last.group === group && seg.start - last.endSec <= 120) {
      // Extend current merged segment
      last.endSec = Math.max(last.endSec, seg.end);
      if (!last.rawKinds.includes(seg.kind)) {
        last.rawKinds.push(seg.kind);
      }
    } else {
      merged.push({
        startSec: seg.start,
        endSec: seg.end,
        group,
        rawKinds: [seg.kind],
      });
    }
  }

  // 3. Only keep segments >= 5 minutes (300 seconds)
  const durationFiltered = merged.filter(m => m.endSec - m.startSec >= 300);

  // 4. Filter out parts overlapping with already recorded completed tasks
  const nonOverlapping: MergedMotionSegment[] = [];

  for (const seg of durationFiltered) {
    // Check overlap with completed tasks
    const hasOverlap = completedTasks.some(t => {
      return seg.startSec < t.endSec && seg.endSec > t.startSec;
    });

    if (!hasOverlap) {
      nonOverlapping.push(seg);
    }
  }

  // 5. Build PassiveTimeSuggestion items
  const suggestions: PassiveTimeSuggestion[] = nonOverlapping.map(seg => {
    const durationMins = Math.round((seg.endSec - seg.startSec) / 60);
    const steps = seg.group === 'walking' && pedometerLookup
      ? pedometerLookup(seg.startSec, seg.endSec)
      : undefined;

    const suggestedActivity = seg.group === 'walking'
      ? (steps && steps > 0 ? `Đi bộ (${steps.toLocaleString('vi-VN')} bước)` : 'Đi bộ')
      : 'Di chuyển';

    return {
      id: `motion-${Math.floor(seg.startSec)}-${Math.floor(seg.endSec)}`,
      startTime: formatHhMm(seg.startSec),
      endTime: formatHhMm(seg.endSec),
      durationMins,
      suggestedActivity,
      category: seg.group === 'walking' ? 'exercise' : 'travel',
      source: 'motion',
      status: 'pending',
      steps,
      motionKind: seg.group,
    };
  });

  return suggestions;
}
