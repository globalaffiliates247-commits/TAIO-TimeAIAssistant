// TAIO Time App — useHighlight Hook (PRD v0.3.35 Part C4)
'use client';

import { useState, useEffect } from 'react';
import {
  HighlightPrefs,
  getHighlightPrefs,
  subscribeHighlightPrefs,
} from './userPrefsStore';

export interface UseHighlightReturn {
  color: string | null;
  bold: boolean;
  highlightStyle: React.CSSProperties;
}

export function useHighlight(): UseHighlightReturn {
  const [prefs, setPrefs] = useState<HighlightPrefs>(() => getHighlightPrefs());

  useEffect(() => {
    return subscribeHighlightPrefs((next) => {
      setPrefs(next);
    });
  }, []);

  const highlightStyle: React.CSSProperties = {};
  if (prefs.color) {
    highlightStyle.color = prefs.color;
  }
  if (prefs.bold) {
    highlightStyle.fontWeight = 'bold';
  }

  return {
    color: prefs.color,
    bold: prefs.bold,
    highlightStyle,
  };
}
