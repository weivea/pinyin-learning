import type { PinyinItem, ToneVariant } from '../types';

function tonesFor(base: string, audio: [string, string, string, string]): ToneVariant[] {
  const map: Record<string, [string, string, string, string]> = {
    a: ['ā', 'á', 'ǎ', 'à'],
    o: ['ō', 'ó', 'ǒ', 'ò'],
    e: ['ē', 'é', 'ě', 'è'],
    i: ['ī', 'í', 'ǐ', 'ì'],
    u: ['ū', 'ú', 'ǔ', 'ù'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };
  const variants = map[base] ?? [base, base, base, base];
  return [1, 2, 3, 4].map((t, i) => ({
    tone: t as 1 | 2 | 3 | 4,
    text: variants[i],
    audioText: audio[i],
  }));
}

// --- 声母 (23) ---
const initials: PinyinItem[] = [
  { id: 'b', display: 'b', category: 'initial', hasTones: false, audioText: '波',
    examples: [
      { hanzi: '爸', pinyin: 'bà', tone: 4, emoji: '👨' },
      { hanzi: '包', pinyin: 'bāo', tone: 1, emoji: '🎒' },
    ] },
  { id: 'p', display: 'p', category: 'initial', hasTones: false, audioText: '坡',
    examples: [
      { hanzi: '皮', pinyin: 'pí', tone: 2, emoji: '🍎' },
      { hanzi: '盘', pinyin: 'pán', tone: 2, emoji: '🍽️' },
    ] },
  { id: 'm', display: 'm', category: 'initial', hasTones: false, audioText: '摸',
    examples: [
      { hanzi: '妈', pinyin: 'mā', tone: 1, emoji: '👩' },
      { hanzi: '猫', pinyin: 'māo', tone: 1, emoji: '🐱' },
    ] },
  { id: 'f', display: 'f', category: 'initial', hasTones: false, audioText: '佛',
    examples: [
      { hanzi: '飞', pinyin: 'fēi', tone: 1, emoji: '✈️' },
      { hanzi: '风', pinyin: 'fēng', tone: 1, emoji: '🌬️' },
    ] },
  { id: 'd', display: 'd', category: 'initial', hasTones: false, audioText: '得',
    examples: [
      { hanzi: '弟', pinyin: 'dì', tone: 4, emoji: '👦' },
      { hanzi: '灯', pinyin: 'dēng', tone: 1, emoji: '💡' },
    ] },
  { id: 't', display: 't', category: 'initial', hasTones: false, audioText: '特',
    examples: [
      { hanzi: '兔', pinyin: 'tù', tone: 4, emoji: '🐰' },
      { hanzi: '太', pinyin: 'tài', tone: 4, emoji: '☀️' },
    ] },
  { id: 'n', display: 'n', category: 'initial', hasTones: false, audioText: '呢',
    examples: [
      { hanzi: '牛', pinyin: 'niú', tone: 2, emoji: '🐮' },
      { hanzi: '鸟', pinyin: 'niǎo', tone: 3, emoji: '🐦' },
    ] },
  { id: 'l', display: 'l', category: 'initial', hasTones: false, audioText: '了',
    examples: [
      { hanzi: '老', pinyin: 'lǎo', tone: 3, emoji: '👴' },
      { hanzi: '龙', pinyin: 'lóng', tone: 2, emoji: '🐉' },
    ] },
  { id: 'g', display: 'g', category: 'initial', hasTones: false, audioText: '哥',
    examples: [
      { hanzi: '狗', pinyin: 'gǒu', tone: 3, emoji: '🐶' },
      { hanzi: '高', pinyin: 'gāo', tone: 1, emoji: '🦒' },
    ] },
  { id: 'k', display: 'k', category: 'initial', hasTones: false, audioText: '科',
    examples: [
      { hanzi: '看', pinyin: 'kàn', tone: 4, emoji: '👀' },
      { hanzi: '哭', pinyin: 'kū', tone: 1, emoji: '😭' },
    ] },
  { id: 'h', display: 'h', category: 'initial', hasTones: false, audioText: '喝',
    examples: [
      { hanzi: '花', pinyin: 'huā', tone: 1, emoji: '🌸' },
      { hanzi: '海', pinyin: 'hǎi', tone: 3, emoji: '🌊' },
    ] },
  { id: 'j', display: 'j', category: 'initial', hasTones: false, audioText: '机',
    examples: [
      { hanzi: '鸡', pinyin: 'jī', tone: 1, emoji: '🐔' },
      { hanzi: '家', pinyin: 'jiā', tone: 1, emoji: '🏠' },
    ] },
  { id: 'q', display: 'q', category: 'initial', hasTones: false, audioText: '七',
    examples: [
      { hanzi: '球', pinyin: 'qiú', tone: 2, emoji: '⚽' },
      { hanzi: '汽', pinyin: 'qì', tone: 4, emoji: '🚗' },
    ] },
  { id: 'x', display: 'x', category: 'initial', hasTones: false, audioText: '西',
    examples: [
      { hanzi: '小', pinyin: 'xiǎo', tone: 3, emoji: '🐭' },
      { hanzi: '虾', pinyin: 'xiā', tone: 1, emoji: '🦐' },
    ] },
  { id: 'zh', display: 'zh', category: 'initial', hasTones: false, audioText: '知',
    examples: [
      { hanzi: '猪', pinyin: 'zhū', tone: 1, emoji: '🐷' },
      { hanzi: '钟', pinyin: 'zhōng', tone: 1, emoji: '🕰️' },
    ] },
  { id: 'ch', display: 'ch', category: 'initial', hasTones: false, audioText: '吃',
    examples: [
      { hanzi: '车', pinyin: 'chē', tone: 1, emoji: '🚙' },
      { hanzi: '虫', pinyin: 'chóng', tone: 2, emoji: '🐛' },
    ] },
  { id: 'sh', display: 'sh', category: 'initial', hasTones: false, audioText: '诗',
    examples: [
      { hanzi: '书', pinyin: 'shū', tone: 1, emoji: '📚' },
      { hanzi: '蛇', pinyin: 'shé', tone: 2, emoji: '🐍' },
    ] },
  { id: 'r', display: 'r', category: 'initial', hasTones: false, audioText: '日',
    examples: [
      { hanzi: '日', pinyin: 'rì', tone: 4, emoji: '☀️' },
      { hanzi: '人', pinyin: 'rén', tone: 2, emoji: '🧑' },
    ] },
  { id: 'z', display: 'z', category: 'initial', hasTones: false, audioText: '资',
    examples: [
      { hanzi: '走', pinyin: 'zǒu', tone: 3, emoji: '🚶' },
      { hanzi: '嘴', pinyin: 'zuǐ', tone: 3, emoji: '👄' },
    ] },
  { id: 'c', display: 'c', category: 'initial', hasTones: false, audioText: '雌',
    examples: [
      { hanzi: '草', pinyin: 'cǎo', tone: 3, emoji: '🌿' },
      { hanzi: '醋', pinyin: 'cù', tone: 4, emoji: '🍶' },
    ] },
  { id: 's', display: 's', category: 'initial', hasTones: false, audioText: '思',
    examples: [
      { hanzi: '伞', pinyin: 'sǎn', tone: 3, emoji: '☂️' },
      { hanzi: '四', pinyin: 'sì', tone: 4, emoji: '4️⃣' },
    ] },
  { id: 'y', display: 'y', category: 'initial', hasTones: false, audioText: '医',
    examples: [
      { hanzi: '鸭', pinyin: 'yā', tone: 1, emoji: '🦆' },
      { hanzi: '鱼', pinyin: 'yú', tone: 2, emoji: '🐟' },
    ] },
  { id: 'w', display: 'w', category: 'initial', hasTones: false, audioText: '屋',
    examples: [
      { hanzi: '蛙', pinyin: 'wā', tone: 1, emoji: '🐸' },
      { hanzi: '碗', pinyin: 'wǎn', tone: 3, emoji: '🥣' },
    ] },
];

// --- 单韵母 (6) ---
const simpleFinals: PinyinItem[] = [
  { id: 'a', display: 'a', category: 'simple-final', hasTones: true, audioText: '啊',
    tones: tonesFor('a', ['啊', '啊', '啊', '啊']),
    examples: [
      { hanzi: '阿', pinyin: 'ā', tone: 1, emoji: '👋' },
      { hanzi: '矮', pinyin: 'ǎi', tone: 3, emoji: '🧒' },
    ] },
  { id: 'o', display: 'o', category: 'simple-final', hasTones: true, audioText: '喔',
    tones: tonesFor('o', ['喔', '喔', '喔', '喔']),
    examples: [
      { hanzi: '哦', pinyin: 'ó', tone: 2, emoji: '💭' },
    ] },
  { id: 'e', display: 'e', category: 'simple-final', hasTones: true, audioText: '鹅',
    tones: tonesFor('e', ['鹅', '鹅', '鹅', '鹅']),
    examples: [
      { hanzi: '鹅', pinyin: 'é', tone: 2, emoji: '🦢' },
      { hanzi: '饿', pinyin: 'è', tone: 4, emoji: '😋' },
    ] },
  { id: 'i', display: 'i', category: 'simple-final', hasTones: true, audioText: '衣',
    tones: tonesFor('i', ['衣', '姨', '椅', '亿']),
    examples: [
      { hanzi: '衣', pinyin: 'yī', tone: 1, emoji: '👕' },
      { hanzi: '一', pinyin: 'yī', tone: 1, emoji: '1️⃣' },
    ] },
  { id: 'u', display: 'u', category: 'simple-final', hasTones: true, audioText: '乌',
    tones: tonesFor('u', ['乌', '无', '五', '雾']),
    examples: [
      { hanzi: '五', pinyin: 'wǔ', tone: 3, emoji: '5️⃣' },
      { hanzi: '雾', pinyin: 'wù', tone: 4, emoji: '🌫️' },
    ] },
  { id: 'ü', display: 'ü', category: 'simple-final', hasTones: true, audioText: '迂',
    tones: tonesFor('ü', ['迂', '鱼', '雨', '玉']),
    examples: [
      { hanzi: '鱼', pinyin: 'yú', tone: 2, emoji: '🐟' },
      { hanzi: '雨', pinyin: 'yǔ', tone: 3, emoji: '🌧️' },
    ] },
];

// 复韵母与整体认读音节在 Task 9 补全
const compoundFinals: PinyinItem[] = [];
const wholeSyllables: PinyinItem[] = [];

export const PINYIN_DATA: PinyinItem[] = [
  ...initials,
  ...simpleFinals,
  ...compoundFinals,
  ...wholeSyllables,
];

export function getByCategory(category: PinyinItem['category']): PinyinItem[] {
  return PINYIN_DATA.filter(p => p.category === category);
}

export function getById(id: string): PinyinItem | undefined {
  return PINYIN_DATA.find(p => p.id === id);
}
