// PRD FIX v0.3.30 Part B2: Core Motion Bridge for TypeScript
import { Capacitor } from '@capacitor/core';
import { TAIONative } from '@/features/native';

export interface MotionCapability {
  supported: boolean;
  isActivityAvailable: boolean;
  isStepCountingAvailable: boolean;
  isDistanceAvailable: boolean;
  authorizationStatus: 'authorized' | 'denied' | 'restricted' | 'notDetermined' | 'not_supported' | 'unknown';
}

export interface RawMotionSegment {
  start: number;      // epoch seconds
  end: number;        // epoch seconds
  kind: 'stationary' | 'walking' | 'running' | 'cycling' | 'automotive' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
}

export interface PedometerResult {
  steps: number;
  distanceMeters: number;
}

export async function getMotionCapability(): Promise<MotionCapability> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return {
      supported: false,
      isActivityAvailable: false,
      isStepCountingAvailable: false,
      isDistanceAvailable: false,
      authorizationStatus: 'not_supported',
    };
  }

  try {
    const res = await (TAIONative as any).getMotionCapability();
    return {
      supported: !!res?.supported,
      isActivityAvailable: !!res?.isActivityAvailable,
      isStepCountingAvailable: !!res?.isStepCountingAvailable,
      isDistanceAvailable: !!res?.isDistanceAvailable,
      authorizationStatus: res?.authorizationStatus || 'unknown',
    };
  } catch (err) {
    console.warn('[motionBridge] getMotionCapability failed', err);
    return {
      supported: false,
      isActivityAvailable: false,
      isStepCountingAvailable: false,
      isDistanceAvailable: false,
      authorizationStatus: 'unknown',
    };
  }
}

export async function requestMotionPermission(): Promise<{ ok: boolean; status: string }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return { ok: false, status: 'not_supported' };
  }

  try {
    const res = await (TAIONative as any).requestMotionPermission();
    return {
      ok: !!res?.ok,
      status: res?.status || 'unknown',
    };
  } catch (err: any) {
    console.warn('[motionBridge] requestMotionPermission failed', err);
    return { ok: false, status: err?.message || 'exception' };
  }
}

export async function queryMotionSegments(fromSec: number, toSec: number): Promise<RawMotionSegment[]> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return [];
  }

  try {
    const res = await (TAIONative as any).queryMotionSegments({ from: fromSec, to: toSec });
    if (res?.ok && Array.isArray(res.segments)) {
      return res.segments;
    }
    return [];
  } catch (err) {
    console.warn('[motionBridge] queryMotionSegments failed', err);
    return [];
  }
}

export async function queryPedometer(fromSec: number, toSec: number): Promise<PedometerResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return { steps: 0, distanceMeters: 0 };
  }

  try {
    const res = await (TAIONative as any).queryPedometer({ from: fromSec, to: toSec });
    if (res?.ok) {
      return {
        steps: Number(res.steps) || 0,
        distanceMeters: Number(res.distanceMeters) || 0,
      };
    }
    return { steps: 0, distanceMeters: 0 };
  } catch (err) {
    console.warn('[motionBridge] queryPedometer failed', err);
    return { steps: 0, distanceMeters: 0 };
  }
}
