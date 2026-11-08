'use client';

import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { TAIONative } from '../../features/native';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

declare global {
  interface Window {
    __TAIO_SAFE_AREA__?: SafeAreaInsets;
    webkit?: {
      messageHandlers?: Record<string, unknown>;
    };
  }
}

/**
 * Inline style helper for centered modal overlays (fixed inset-0)
 * Guarantees modals never collide with top status bar (--sat) or bottom home indicator (--sab).
 */
export const MODAL_SAFE_STYLE: React.CSSProperties = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  paddingTop: 'calc(var(--sat, 0px) + 12px)',
  paddingBottom: 'calc(var(--sab, 0px) + 12px)',
  paddingLeft: 'max(var(--sal, 0px), 12px)',
  paddingRight: 'max(var(--sar, 0px), 12px)',
};

/**
 * Inline style helper for bottom-sheet overlays (fixed inset-0 items-end on mobile)
 * Keeps top clearance below --sat and bottom clearance above --sab.
 */
export const BOTTOM_SHEET_SAFE_STYLE: React.CSSProperties = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  paddingTop: 'calc(var(--sat, 0px) + 16px)',
  paddingBottom: 'var(--sab, 0px)',
};

function computeAndApplySafeArea(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const ua = window.navigator?.userAgent || '';
  const isIOSDevice =
    /iPhone|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
  const isCapacitorIOS =
    (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') ||
    window.location?.protocol === 'capacitor:' ||
    Boolean(window.webkit?.messageHandlers?.bridge);
  const isStandalonePWA = Boolean((window.navigator as any)?.standalone);

  const isPortrait = window.innerHeight >= window.innerWidth;
  const nativeInjected = window.__TAIO_SAFE_AREA__;

  if (isCapacitorIOS || isStandalonePWA || isIOSDevice) {
    root.classList.add('is-native-ios');
    const minTop = isPortrait ? 59 : 0;
    const minBottom = isPortrait ? 34 : 20;
    const topPx = Math.max(nativeInjected?.top ?? 0, minTop);
    const bottomPx = Math.max(nativeInjected?.bottom ?? 0, minBottom);
    const leftPx = Math.max(nativeInjected?.left ?? 0, 0);
    const rightPx = Math.max(nativeInjected?.right ?? 0, 0);

    root.style.setProperty('--native-sat', `${topPx}px`);
    root.style.setProperty('--native-sab', `${bottomPx}px`);
    root.style.setProperty('--sat', `max(env(safe-area-inset-top, 0px), ${topPx}px)`);
    root.style.setProperty('--sab', `max(env(safe-area-inset-bottom, 0px), ${bottomPx}px)`);
    root.style.setProperty('--sal', `max(env(safe-area-inset-left, 0px), ${leftPx}px)`);
    root.style.setProperty('--sar', `max(env(safe-area-inset-right, 0px), ${rightPx}px)`);
  } else {
    root.style.setProperty('--sat', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--sal', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--sar', 'env(safe-area-inset-right, 0px)');
  }
}

export interface AppShellProps {
  /** Top peripheral progress bar (AmbientProgressEdge) */
  topEdge?: React.ReactNode;
  /** Sticky navigation header (Navbar) */
  header: React.ReactNode;
  /** Nudge banner directly below header (ActionNudgeBanner) */
  nudge?: React.ReactNode;
  /** Top feedback banners (Toast, Celebration, Server Backup notice) */
  banners?: React.ReactNode;
  /** Main tab content */
  children: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Modals, bottom sheets, and floating overlays */
  overlays?: React.ReactNode;
  /** Whether a fixed bottom tab bar is active (phone look) */
  hasBottomTabBar?: boolean;
  /** Max width class for <main> container */
  mainMaxWidthClass?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  topEdge,
  header,
  nudge,
  banners,
  children,
  footer,
  overlays,
  hasBottomTabBar = false,
  mainMaxWidthClass = 'max-w-6xl',
}) => {
  useEffect(() => {
    computeAndApplySafeArea();

    // Query native iOS plugin for exact UIWindow.safeAreaInsets when running in Capacitor
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      TAIONative.getCapabilities()
        .then((caps: any) => {
          if (typeof caps?.safeAreaTop === 'number' || typeof caps?.safeAreaBottom === 'number') {
            window.__TAIO_SAFE_AREA__ = {
              top: caps.safeAreaTop ?? 59,
              bottom: caps.safeAreaBottom ?? 34,
              left: 0,
              right: 0,
            };
            computeAndApplySafeArea();
          }
        })
        .catch(() => {
          // Fallback already applied by computeAndApplySafeArea()
        });
    }

    const handleSafeAreaChange = () => computeAndApplySafeArea();
    window.addEventListener('taio:safe-area-change', handleSafeAreaChange);
    window.addEventListener('resize', handleSafeAreaChange);
    window.addEventListener('orientationchange', handleSafeAreaChange);

    return () => {
      window.removeEventListener('taio:safe-area-change', handleSafeAreaChange);
      window.removeEventListener('resize', handleSafeAreaChange);
      window.removeEventListener('orientationchange', handleSafeAreaChange);
    };
  }, []);

  return (
    <div
      style={{ overflowX: 'clip' }}
      className="min-h-screen flex flex-col bg-white text-slate-900 w-full max-w-full"
    >
      {/* Fixed Top Status-Bar Shield: prevents scrolling content from showing under iOS status bar / Dynamic Island */}
      <div
        aria-hidden="true"
        style={{ top: 0, height: 'var(--sat, 0px)' }}
        className="fixed left-0 right-0 z-50 bg-white pointer-events-none"
      />

      {/* In-Flow Top Safe-Area Spacer: physically offsets header below --sat at scrollY=0 and during body scroll lock */}
      <div
        aria-hidden="true"
        style={{ height: 'var(--sat, 0px)' }}
        className="w-full shrink-0 bg-white"
      />

      {/* Peripheral Progress Edge (positioned at top: var(--sat)) */}
      {topEdge}

      {/* Sticky Header & Top Banners */}
      {header}
      {nudge}
      {banners}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 transition-all duration-300 ${mainMaxWidthClass}`}
      >
        {children}
      </main>

      {/* Footer with deterministic bottom safe-area padding (--sab) */}
      {footer && (
        <footer
          style={{
            paddingBottom: hasBottomTabBar
              ? 'calc(60px + var(--sab, 0px))'
              : 'max(var(--sab, 0px), 16px)',
          }}
          className="border-t border-slate-200/80 pt-3.5 px-4 text-center text-xs text-slate-500 bg-white"
        >
          {footer}
        </footer>
      )}

      {/* Modals, Bottom Sheets & Floating Overlays */}
      {overlays}
    </div>
  );
};
