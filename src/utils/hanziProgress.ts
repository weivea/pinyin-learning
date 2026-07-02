/** 记录小朋友"看过"的汉字（本地存储，按用户区分）。
 *  仅用于在汉字表上打个 ⭐ 鼓励，不涉及后端，也不与拼音/字母进度冲突。 */

const PREFIX = 'pinyin-learning:visited-hanzi:';

function keyFor(userId?: number): string {
  return `${PREFIX}${userId ?? 'guest'}`;
}

export function readVisitedHanzi(userId?: number): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function markHanziVisited(userId: number | undefined, char: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const set = readVisitedHanzi(userId);
    if (set.has(char)) return;
    set.add(char);
    localStorage.setItem(keyFor(userId), JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}
