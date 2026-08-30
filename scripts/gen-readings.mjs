// Generate contextual pinyin annotations and quality metadata for the reading module.
// Usage: npm run gen:readings
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinyin } from 'pinyin-pro';
import { READING_SOURCES } from './readings-source.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (path) => resolve(__dirname, path);
const HANZI_RE = /[\u3400-\u9fff]/u;
const SENTENCE_END_RE = /[。！？!?；;]/u;
const CLOSING_MARK_RE = /[”’》」』）)\]]/u;
const THEMES = ['童话', '生活', '自然', '校园'];
const PINYIN_OVERRIDES = new Map([
  ['排得', ['pái', 'de']],
  ['推得', ['tuī', 'de']],
  ['跑得', ['pǎo', 'de']],
  ['看得', ['kàn', 'de']],
  ['转来转去', ['zhuǎn', 'lái', 'zhuǎn', 'qù']],
  ['长了', ['zhǎng', 'le']],
  ['种下', ['zhòng', 'xià']],
  ['倒好', ['dào', 'hǎo']],
  ['露出来', ['lòu', 'chū', 'lái']],
  ['月亮', ['yuè', 'liang']],
  ['时候', ['shí', 'hou']],
  ['朋友', ['péng', 'you']],
  ['地方', ['dì', 'fang']],
  ['故事', ['gù', 'shi']],
  ['消息', ['xiāo', 'xi']],
  ['明白', ['míng', 'bai']],
  ['热闹', ['rè', 'nao']],
  ['精神', ['jīng', 'shen']],
  ['星星', ['xīng', 'xing']],
  ['早上', ['zǎo', 'shang']],
  ['晚上', ['wǎn', 'shang']],
]);

const hanziItems = JSON.parse(readFileSync(R('../src/data/hanzi.generated.json'), 'utf8'));
const basicHanzi = new Set(hanziItems.map((item) => item.char));

function annotate(text) {
  const tokens = pinyin(text, {
    type: 'all',
    toneType: 'symbol',
    nonZh: 'consecutive',
    toneSandhi: true,
    segmentit: 2,
  }).map((item) => {
    if (!item.isZh) return { text: item.origin };
    return {
      text: item.origin,
      pinyin: item.pinyin,
      ...(basicHanzi.has(item.origin) ? {} : { isNew: true }),
    };
  });

  for (const [phrase, readings] of PINYIN_OVERRIDES) {
    const phraseChars = [...phrase];
    for (let index = 0; index <= tokens.length - phraseChars.length; index++) {
      const matches = phraseChars.every(
        (char, offset) => tokens[index + offset].text === char,
      );
      if (!matches) continue;
      readings.forEach((reading, offset) => {
        tokens[index + offset].pinyin = reading;
      });
    }
  }

  return tokens;
}

function splitSentences(paragraph) {
  const chars = [...paragraph];
  const sentences = [];
  let current = '';

  for (let i = 0; i < chars.length; i++) {
    current += chars[i];
    if (!SENTENCE_END_RE.test(chars[i])) continue;
    while (i + 1 < chars.length && CLOSING_MARK_RE.test(chars[i + 1])) {
      current += chars[++i];
    }
    sentences.push(current);
    current = '';
  }
  if (current) sentences.push(current);
  return sentences;
}

function countHanzi(text) {
  return [...text].filter((char) => HANZI_RE.test(char)).length;
}

function assertSourceQuality() {
  if (READING_SOURCES.length !== 20) {
    throw new Error(`Expected 20 readings, received ${READING_SOURCES.length}`);
  }

  const ids = new Set();
  const themeCounts = new Map(THEMES.map((theme) => [theme, 0]));
  let previousDifficulty = 0;

  for (const [phrase, readings] of PINYIN_OVERRIDES) {
    if ([...phrase].length !== readings.length) {
      throw new Error(`${phrase}: pinyin override length does not match phrase length`);
    }
  }

  READING_SOURCES.forEach((source, index) => {
    if (!/^\d{2}-[a-z0-9-]+$/.test(source.id)) {
      throw new Error(`${source.id}: id must have a two-digit ASCII prefix and kebab-case slug`);
    }
    if (ids.has(source.id)) throw new Error(`${source.id}: duplicate id`);
    ids.add(source.id);

    const expectedPrefix = String(index + 1).padStart(2, '0');
    if (!source.id.startsWith(`${expectedPrefix}-`)) {
      throw new Error(`${source.id}: expected prefix ${expectedPrefix}-`);
    }
    if (!THEMES.includes(source.theme)) throw new Error(`${source.id}: unsupported theme ${source.theme}`);
    themeCounts.set(source.theme, (themeCounts.get(source.theme) ?? 0) + 1);
    if (!Number.isInteger(source.difficulty) || source.difficulty < 1 || source.difficulty > 5) {
      throw new Error(`${source.id}: difficulty must be an integer from 1 to 5`);
    }
    if (source.difficulty < previousDifficulty) {
      throw new Error(`${source.id}: difficulty must not decrease`);
    }
    previousDifficulty = source.difficulty;
    if (!Array.isArray(source.paragraphs) || source.paragraphs.length < 2 || source.paragraphs.length > 4) {
      throw new Error(`${source.id}: expected 2-4 paragraphs`);
    }

    const body = source.paragraphs.join('');
    const characterCount = countHanzi(body);
    if (characterCount < 80 || characterCount > 120) {
      throw new Error(`${source.id}: expected 80-120 Hanzi, received ${characterCount}`);
    }
    const allText = `${source.title}${body}`;
    const newCharacters = [...new Set([...allText].filter(
      (char) => HANZI_RE.test(char) && !basicHanzi.has(char),
    ))];
    if (newCharacters.length > 5) {
      throw new Error(`${source.id}: more than 5 new characters (${newCharacters.join('')})`);
    }
  });

  for (const theme of THEMES) {
    if (themeCounts.get(theme) !== 5) {
      throw new Error(`Expected 5 readings for ${theme}, received ${themeCounts.get(theme)}`);
    }
  }
}

assertSourceQuality();

const readings = READING_SOURCES.map((source) => {
  const titleTokens = annotate(source.title);
  const paragraphs = source.paragraphs.map((paragraph) => ({
    sentences: splitSentences(paragraph).map((text) => ({ text, tokens: annotate(text) })),
  }));
  const body = source.paragraphs.join('');
  const allTokens = [
    ...titleTokens,
    ...paragraphs.flatMap((paragraph) => paragraph.sentences.flatMap((sentence) => sentence.tokens)),
  ];
  const newCharacters = new Map();
  for (const token of allTokens) {
    if (token.isNew && token.pinyin && !newCharacters.has(token.text)) {
      newCharacters.set(token.text, token.pinyin);
    }
  }

  return {
    id: source.id,
    title: source.title,
    titleTokens,
    theme: source.theme,
    difficulty: source.difficulty,
    characterCount: countHanzi(body),
    newCharacters: [...newCharacters].map(([char, py]) => ({ char, pinyin: py })),
    paragraphs,
  };
});

writeFileSync(
  R('../src/data/readings.generated.json'),
  `${JSON.stringify(readings)}\n`,
  'utf8',
);

console.log(`Generated ${readings.length} readings -> src/data/readings.generated.json`);
for (const reading of readings) {
  const newChars = reading.newCharacters.map(({ char }) => char).join('') || '无';
  console.log(`${reading.id}: ${reading.characterCount} 字，生字 ${newChars}`);
}
