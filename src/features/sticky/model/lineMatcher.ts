// TAIO Time App — Line matching with stable IDs (PRD v0.3.39 Part E2.6)

export interface LineItem {
  id: string;
  text: string;
  done?: boolean;
}

/**
 * Matches new rawLines from textarea with previous lines to keep line IDs completely stable,
 * preventing task misassociation when lines are inserted or deleted.
 */
export function matchLinesWithStableIds(
  rawLines: string[],
  oldLines: LineItem[] = []
): Array<{ id: string; text: string; done: boolean }> {
  const result: Array<{ id: string; text: string; done: boolean }> = [];
  const usedOldIndices = new Set<number>();

  // Pass 1: exact text match in oldLines
  for (let i = 0; i < rawLines.length; i++) {
    const rawText = rawLines[i];
    let matchedOldIdx = -1;
    if (i < oldLines.length && !usedOldIndices.has(i) && oldLines[i].text === rawText) {
      matchedOldIdx = i;
    } else {
      for (let j = 0; j < oldLines.length; j++) {
        if (!usedOldIndices.has(j) && oldLines[j].text === rawText) {
          matchedOldIdx = j;
          break;
        }
      }
    }
    if (matchedOldIdx !== -1) {
      usedOldIndices.add(matchedOldIdx);
      result[i] = {
        id: oldLines[matchedOldIdx].id,
        text: rawText,
        done: Boolean(oldLines[matchedOldIdx].done),
      };
    }
  }

  // Pass 2: match remaining lines to remaining oldLines in sequence or generate new id
  let nextOldIdx = 0;
  for (let i = 0; i < rawLines.length; i++) {
    if (result[i]) continue;
    while (nextOldIdx < oldLines.length && usedOldIndices.has(nextOldIdx)) {
      nextOldIdx++;
    }
    if (nextOldIdx < oldLines.length) {
      usedOldIndices.add(nextOldIdx);
      result[i] = {
        id: oldLines[nextOldIdx].id,
        text: rawLines[i],
        done: Boolean(oldLines[nextOldIdx].done),
      };
      nextOldIdx++;
    } else {
      result[i] = {
        id: `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        text: rawLines[i],
        done: false,
      };
    }
  }

  return result;
}
