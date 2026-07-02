// 生成「拼音学汉字」数据：拼音（pinyin-pro）+ 组词（jieba 词频 ∩ 教材词汇）+ 造句（初稿模板）。
// 用法：node scripts/gen-hanzi.mjs  ->  写入 src/data/hanzi.generated.json
// 组词/造句为「批量生成初稿」，需人工抽查校对；可用 overrides.mjs 覆盖任意字。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pinyin } from 'pinyin-pro';
import { VOLUMES } from './charlists.mjs';
import { WORD_OVERRIDES, SENTENCE_OVERRIDES } from './overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dirname, p);

const isHanziStr = (s) => /^[\u4e00-\u9fa5]+$/.test(s);
const isHanziChar = (c) => /[\u4e00-\u9fa5]/.test(c);

// —— 基础字集合（本模块的 1000 字）：用于「组词全部由基础字组成」优先级 —— //
const BASIC = new Set(VOLUMES.flatMap((v) => v.chars));

// —— 教材词汇（现代汉语词典第7版 + 按册标注，来自 Zenkryo/yuwen）—— //
const textbookWords = JSON.parse(readFileSync(R('data/all_words.json'), 'utf8'));
const inTextbook = new Set(Object.keys(textbookWords));

// —— jieba 词频 + 词性 —— //
const badPOS = new Set(['r', 'p', 'c', 'u', 'xc', 'y', 'e', 'o', 'w', 'uj', 'ul', 'k', 'h', 'g', 'x', 'd']);
const freq = new Map();
const pos = new Map();
for (const ln of readFileSync(R('data/jieba.txt'), 'utf8').split('\n')) {
  const [w, f, p] = ln.split(' ');
  if (!w || !f || !isHanziStr(w) || w.length < 2 || w.length > 3) continue;
  freq.set(w, +f);
  pos.set(w, p);
}
// char -> [words...] 倒排，加速组词
const wordsByChar = new Map();
for (const w of freq.keys()) {
  for (const c of new Set(w)) {
    if (!wordsByChar.has(c)) wordsByChar.set(c, []);
    wordsByChar.get(c).push(w);
  }
}

function allBasic(w) {
  for (const c of w) if (!BASIC.has(c)) return false;
  return true;
}

// 明显不适合低龄或歧义的组词，直接排除
const WORD_BLOCK = new Set(['人大', '大要', '小水', '水红', '回目', '牛马', '牛皮']);

function pickWords(ch) {
  if (WORD_OVERRIDES[ch]) {
    return WORD_OVERRIDES[ch].map((w) => ({ word: w, pinyin: pinyin(w, { toneType: 'symbol', nonZh: 'consecutive' }) }));
  }
  const cand = (wordsByChar.get(ch) || []).filter((w) => !badPOS.has(pos.get(w)) && !WORD_BLOCK.has(w));
  cand.sort((a, b) => {
    const ba = allBasic(a) ? 0 : 1;
    const bb = allBasic(b) ? 0 : 1;
    if (ba !== bb) return ba - bb; // 全部基础字优先（更简单、贴近儿童）
    const la = a.length === 2 ? 0 : 1;
    const lb = b.length === 2 ? 0 : 1;
    if (la !== lb) return la - lb; // 双字词优先
    const ta = inTextbook.has(a) ? 0 : 1;
    const tb = inTextbook.has(b) ? 0 : 1;
    if (ta !== tb) return ta - tb; // 教材词汇优先（年龄合适）
    return (freq.get(b) || 0) - (freq.get(a) || 0); // 再按词频
  });
  const seen = new Set();
  const out = [];
  for (const w of cand) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push({ word: w, pinyin: pinyin(w, { toneType: 'symbol', nonZh: 'consecutive' }) });
    if (out.length >= 3) break;
  }
  return out;
}

// —— 造句初稿：非覆盖字用「安全句式」，保证任意词都语法正确、适合识字启蒙 —— //
const SAFE_FRAMES = [
  (ch, w) => `我会读“${w}”。`,
  (ch, w) => `我们一起读一读“${w}”。`,
  (ch, w) => `我认识“${w}”这个词。`,
  (ch, w) => `“${ch}”可以组成“${w}”。`,
  (ch, w) => `我学会了“${w}”。`,
];
function makeSentence(ch, words, idx) {
  if (SENTENCE_OVERRIDES[ch]) return SENTENCE_OVERRIDES[ch];
  if (words.length === 0) return [`我学会写“${ch}”字了。`];
  const w = words[0].word;
  return [SAFE_FRAMES[idx % SAFE_FRAMES.length](ch, w)];
}

const items = [];
for (const v of VOLUMES) {
  v.chars.forEach((ch, idx) => {
    const pys = pinyin(ch, { toneType: 'symbol', type: 'array' });
    const words = pickWords(ch);
    items.push({
      char: ch,
      pinyin: pys[0],
      grade: v.grade,
      volumeId: v.id,
      volume: v.volume,
      words,
      sentences: makeSentence(ch, words, idx),
    });
  });
}

writeFileSync(R('../src/data/hanzi.generated.json'), JSON.stringify(items, null, 0) + '\n', 'utf8');

// —— 质量报告 —— //
const noWords = items.filter((i) => i.words.length === 0);
const fewWords = items.filter((i) => i.words.length < 2);
console.log(`生成 ${items.length} 字 -> src/data/hanzi.generated.json`);
console.log(`无组词: ${noWords.length}  (${noWords.map((i) => i.char).join('')})`);
console.log(`组词<2: ${fewWords.length}  (${fewWords.map((i) => i.char).join('')})`);
console.log(`覆盖组词: ${Object.keys(WORD_OVERRIDES).length}  覆盖造句: ${Object.keys(SENTENCE_OVERRIDES).length}`);
