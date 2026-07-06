/** 记录每个字母 / 拼音 / 汉字的"熟悉程度"（0-5 档，用 ♥️ 展示）。
 *  本地存储，按用户 + 类别区分，不涉及后端，也不与"学没学过"的星标冲突。
 *  小朋友学过一遍不代表真会，家长/孩子可在详情页手动调整熟悉度。 */

export type FamiliarityKind = 'letters' | 'pinyin' | 'hanzi';

/** 熟悉度最高档位（♥️ 的数量）。 */
export const MAX_FAMILIARITY = 5;

const PREFIX = 'pinyin-learning:familiarity:';

function keyFor(kind: FamiliarityKind, userId?: number): string {
  return `${PREFIX}${kind}:${userId ?? 'guest'}`;
}

/** 把任意输入裁剪成 0-5 的整数档位。 */
export function clampFamiliarity(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(MAX_FAMILIARITY, Math.round(level)));
}

/** 读取某类别下所有条目的熟悉度：{ id: level }（只含 level>0 的条目）。 */
export function readFamiliarityMap(kind: FamiliarityKind, userId?: number): Record<string, number> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(keyFor(kind, userId));
    const obj = raw ? (JSON.parse(raw) as unknown) : {};
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const out: Record<string, number> = {};
    for (const [id, val] of Object.entries(obj as Record<string, unknown>)) {
      const lvl = clampFamiliarity(typeof val === 'number' ? val : Number(val));
      if (lvl > 0) out[id] = lvl;
    }
    return out;
  } catch {
    return {};
  }
}

/** 读取单个条目的熟悉度（0-5）。 */
export function getFamiliarity(kind: FamiliarityKind, userId: number | undefined, id: string): number {
  return readFamiliarityMap(kind, userId)[id] ?? 0;
}

/** 设置单个条目的熟悉度（自动裁剪到 0-5），返回实际保存的档位。 */
export function setFamiliarity(
  kind: FamiliarityKind,
  userId: number | undefined,
  id: string,
  level: number,
): number {
  const next = clampFamiliarity(level);
  if (typeof localStorage === 'undefined') return next;
  try {
    const map = readFamiliarityMap(kind, userId);
    if (next > 0) map[id] = next;
    else delete map[id];
    localStorage.setItem(keyFor(kind, userId), JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return next;
}
