/** Records passages that a learner has opened, scoped to the local user. */
const PREFIX = 'pinyin-learning:visited-readings:';

function keyFor(userId?: number): string {
  return `${PREFIX}${userId ?? 'guest'}`;
}

export function readVisitedReadings(userId?: number): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const values = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(
      Array.isArray(values)
        ? values.filter((value): value is string => typeof value === 'string')
        : [],
    );
  } catch {
    return new Set();
  }
}

export function markReadingVisited(userId: number | undefined, readingId: string): void {
  if (typeof localStorage === 'undefined' || !readingId) return;
  try {
    const visited = readVisitedReadings(userId);
    if (visited.has(readingId)) return;
    visited.add(readingId);
    localStorage.setItem(keyFor(userId), JSON.stringify([...visited]));
  } catch {
    // Progress is non-critical; storage may be unavailable in privacy modes.
  }
}
