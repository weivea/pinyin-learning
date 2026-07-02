/** 「拼音学汉字」数据。
 *  约 1000 个三年级前基础汉字（统编版一、二年级写字表 800 + 常用高频字 200）。
 *  每字含：拼音、组词（带拼音）、造句。朗读走原生 TTS（见 useAudio().play）。
 *
 *  数据由 scripts/gen-hanzi.mjs 生成（拼音 pinyin-pro、组词 jieba 词频∩教材词汇、
 *  造句模板+人工覆盖）。重新生成：`node scripts/gen-hanzi.mjs`。
 *  组词/造句为批量初稿，人工覆盖见 scripts/overrides.mjs。 */
import type { HanziItem } from '../types';
import raw from './hanzi.generated.json';

export const HANZI: HanziItem[] = raw as HanziItem[];

export interface HanziGroup {
  id: string;
  label: string;
  grade: number;
  items: HanziItem[];
}

const GROUP_LABELS: Record<string, string> = {
  g1a: '一年级 · 上册',
  g1b: '一年级 · 下册',
  g2a: '二年级 · 上册',
  g2b: '二年级 · 下册',
  extra: '常用字 · 拓展',
};

const GROUP_ORDER = ['g1a', 'g1b', 'g2a', 'g2b', 'extra'];

/** 按册分组（保持教材顺序），用于列表页展示。 */
export const HANZI_GROUPS: HanziGroup[] = GROUP_ORDER.map((id) => ({
  id,
  label: GROUP_LABELS[id] ?? id,
  grade: HANZI.find((h) => h.volumeId === id)?.grade ?? 1,
  items: HANZI.filter((h) => h.volumeId === id),
}));

const BY_CHAR = new Map(HANZI.map((h) => [h.char, h]));

/** 按汉字查找。 */
export function getHanzi(char: string | undefined): HanziItem | undefined {
  if (!char) return undefined;
  return BY_CHAR.get(char);
}

/** 返回上一个 / 下一个汉字（用于详情页导航，按整体顺序）。 */
export function getAdjacentHanzi(char: string): { prev?: string; next?: string } {
  const idx = HANZI.findIndex((h) => h.char === char);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? HANZI[idx - 1].char : undefined,
    next: idx < HANZI.length - 1 ? HANZI[idx + 1].char : undefined,
  };
}
