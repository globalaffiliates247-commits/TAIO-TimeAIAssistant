// TAIO Time App — Sacred Mascots Line Art (PRD v0.3.54 Part J)
import React from 'react';

export interface MascotConfig {
  id: string;
  nameVi: string;
  nameEn: string;
  i18nKey: string;
}

export const MASCOTS: MascotConfig[] = [
  { id: 'long', nameVi: 'Long', nameEn: 'Dragon', i18nKey: 'settings.mascotDragon' },
  { id: 'lan', nameVi: 'Lân', nameEn: 'Kirin', i18nKey: 'settings.mascotKirin' },
  { id: 'quy', nameVi: 'Quy', nameEn: 'Turtle', i18nKey: 'settings.mascotTurtle' },
  { id: 'phung', nameVi: 'Phụng', nameEn: 'Phoenix', i18nKey: 'settings.mascotPhoenix' },
  { id: 'meo', nameVi: 'Mèo mướp TAIO', nameEn: 'TAIO Cat', i18nKey: 'settings.mascotCat' },
];

export const MascotIcon: React.FC<{ id: string; className?: string; size?: number }> = ({
  id,
  className = '',
  size = 20,
}) => {
  const s = size;
  switch (id) {
    case 'long': // Dragon (Long)
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 14c2-4 6-6 10-5 2 .5 4 2 5 4" />
          <path d="M6 18c3-1 6-1 9 1" />
          <path d="M12 9c-1-2-1-4 0-5 2 0 4 2 3 5" />
          <circle cx="17" cy="8" r="1" fill="currentColor" />
          <path d="M19 8c1-1 3-1 3 0-1 2-3 2-4 2" />
          <path d="M7 11c-2 1-3 3-3 5 2 1 4 0 5-2" />
        </svg>
      );
    case 'lan': // Kirin (Lân)
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 4v4" />
          <path d="M8 8c1-3 5-3 6 0" />
          <path d="M6 14c1-3 4-5 8-4 2 .5 4 2 4 4" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <path d="M10 16c1.5 1 2.5 1 4 0" />
          <path d="M5 19c3-1 11-1 14 0" />
        </svg>
      );
    case 'quy': // Turtle (Quy)
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <ellipse cx="12" cy="13" rx="7" ry="6" />
          <circle cx="12" cy="5" r="2.5" />
          <path d="M6 10l-2-2" />
          <path d="M18 10l2-2" />
          <path d="M6 16l-2 2" />
          <path d="M18 16l2 2" />
          <path d="M12 10v6" />
          <path d="M9 13h6" />
        </svg>
      );
    case 'phung': // Phoenix (Phụng)
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 4c2 2 3 4 2 7-1 3-3 4-6 5" />
          <circle cx="14" cy="5" r="1" fill="currentColor" />
          <path d="M15 5c2-1 4-1 5 1-2 1-3 1-4 1" />
          <path d="M12 11c3 1 6 3 7 6-2 1-4 0-5-2" />
          <path d="M8 16c0 3-2 5-4 5 1-2 2-3 2-5" />
          <path d="M10 17c1 3 0 5-1 5" />
        </svg>
      );
    case 'meo': // TAIO Tabby Cat (Mèo mướp)
    default:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 8l2-4 3 2c1.3-.6 2.7-.6 4 0l3-2 2 4c1 2 1 4 0 6-1.5 3-4 4.5-7 4.5s-5.5-1.5-7-4.5c-1-2-1-4 0-6z" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
          <path d="M12 13v1.5" />
          <path d="M10.5 15c.5.5 1 .5 1.5.5s1 0 1.5-.5" />
          <path d="M4 12h3" />
          <path d="M17 12h3" />
        </svg>
      );
  }
};
