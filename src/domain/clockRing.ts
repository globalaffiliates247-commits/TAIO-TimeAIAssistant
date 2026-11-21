// TAIO Time Domain — Clock Ring & Bar Geometry (PRD v0.3.47 Part C)

export type ClockRingMode = 'remaining' | 'elapsed' | 'goal';

export interface RingArcResult {
  /** Mode being rendered */
  mode: ClockRingMode;
  /** Effective elapsed fraction between 0 and 1 */
  elapsedFraction: number;
  /** Visible solid arc fraction between 0 and 1 */
  visibleFraction: number;
  /** Dash length for SVG stroke (in circumference units) */
  dashLength: number;
  /** Dash offset for SVG stroke (in circumference units) */
  dashOffset: number;
  /** Left offset percentage for horizontal bar (0 to 100) */
  barLeftPercent: number;
  /** Width percentage for horizontal bar (0 to 100) */
  barWidthPercent: number;
  /** Whether the time has overrun */
  isOverrun: boolean;
}

/**
 * Computes SVG ring arc stroke geometry and bar progress percentages.
 * Starts at 12 o'clock, proceeds clockwise.
 * 
 * - 'elapsed': solid arc from 12 o'clock (0) to point e.
 * - 'remaining': solid arc from point e to 12 o'clock (end of cycle).
 * - Both modes share the EXACT SAME boundary point e!
 * - When toggling between elapsed & remaining, the boundary point e stays stationary,
 *   and the two arcs simply swap/invert colors.
 */
export function computeRingArc(
  mode: ClockRingMode,
  elapsedFraction: number,
  circumference: number = 100,
  isOverrun: boolean = false
): RingArcResult {
  if (isOverrun) {
    return {
      mode,
      elapsedFraction: 1,
      visibleFraction: 1,
      dashLength: circumference,
      dashOffset: 0,
      barLeftPercent: 0,
      barWidthPercent: 100,
      isOverrun: true,
    };
  }

  const e = Math.max(0, Math.min(1, elapsedFraction));

  if (mode === 'elapsed') {
    return {
      mode: 'elapsed',
      elapsedFraction: e,
      visibleFraction: e,
      dashLength: e * circumference,
      dashOffset: 0,
      barLeftPercent: 0,
      barWidthPercent: Math.round(e * 100),
      isOverrun: false,
    };
  }

  if (mode === 'remaining') {
    const rem = 1 - e;
    return {
      mode: 'remaining',
      elapsedFraction: e,
      visibleFraction: rem,
      dashLength: rem * circumference,
      dashOffset: -e * circumference,
      barLeftPercent: Math.round(e * 100),
      barWidthPercent: Math.round(rem * 100),
      isOverrun: false,
    };
  }

  // mode === 'goal'
  return {
    mode: 'goal',
    elapsedFraction: e,
    visibleFraction: e,
    dashLength: e * circumference,
    dashOffset: 0,
    barLeftPercent: 0,
    barWidthPercent: Math.round(e * 100),
    isOverrun: false,
  };
}
