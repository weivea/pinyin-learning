/** 记录小朋友"看过"的英文字母（本地存储，按用户区分）。
 *  仅用于在字母表上打个 ⭐ 鼓励，不涉及后端，也不与拼音进度冲突。 */

const PREFIX = 'pinyin-learning:visited-letters:';

function keyFor(userId?: number): string {
  return `${PREFIX}${userId ?? 'guest'}`;
}

export function readVisitedLetters(userId?: number): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function markLetterVisited(userId: number | undefined, lower: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const set = readVisitedLetters(userId);
    if (set.has(lower)) return;
    set.add(lower);
    localStorage.setItem(keyFor(userId), JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}
