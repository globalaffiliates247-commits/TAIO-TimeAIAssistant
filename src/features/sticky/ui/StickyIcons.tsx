// PRD B34 v0.3.26: small line icons for the sticky sheets (same stroke style everywhere).
import React from 'react';

type P = { color: string; size?: number };
const base = (size = 15) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const });

export const IconClose = ({ color, size }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconPin = ({ color, size, filled }: P & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? color : 'none'} stroke={color} strokeWidth={1.7} strokeLinejoin="round">
    <path d="M15 3l6 6-3 1-4 4 1 5-2 2-4-4-5 5-1-1 5-5-4-4 2-2 5 1 4-4z" />
  </svg>
);
export const IconShirt = ({ color, size }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={1.9} strokeLinejoin="round"><path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z" /></svg>
);
export const IconCollapse = ({ color, size }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={1.9}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M4 9h16" /></svg>
);
export const IconPlus = ({ color, size }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
export const IconHourglass = ({ color, size = 13 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={2} strokeLinecap="round"><path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" /></svg>
);
export const IconLock = ({ color, size = 13 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={2.2}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconSpark = ({ color, size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" /></svg>
);
export const IconOverlap = ({ color, size = 13 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="12" height="12" rx="2" />
    <path d="M9 15v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-4" />
  </svg>
);
