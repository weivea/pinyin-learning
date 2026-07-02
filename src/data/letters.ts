/** 英文字母学习数据。
 *  每个字母包含：大小写、儿童向中文介绍、示例单词、在拼音里的读音信息。
 *  英文名发音走浏览器 SpeechSynthesis（见 utils/speech.ts）；
 *  拼音读音复用 useAudio().play() 朗读对应汉字。 */

export interface LetterExample {
  /** 英文单词，如 'Apple'。 */
  word: string;
  /** 形象 emoji。 */
  emoji: string;
  /** 中文释义，如 '苹果'。 */
  zh: string;
}

export interface LetterItem {
  /** 大写字母，如 'A'。 */
  letter: string;
  /** 小写字母，如 'a'。 */
  lower: string;
  /** 英文字母名的发音拼写，如 'A' → 'ay'、'W' → 'double-u'。
   *  用它喂给 SpeechSynthesis，避免单个大写字母被读成 "Capital A"。 */
  spokenName: string;
  /** 儿童向中文介绍（用于展示与语音朗读，纯中文以保证 TTS 自然）。 */
  intro: string;
  /** 示例单词。 */
  examples: LetterExample[];
  /** 在拼音里的读音展示文本，如 '波（bo）'。 */
  pinyinReading: string;
  /** 朗读用汉字（走 zh-CN TTS 读出拼音读音），如 '波'。 */
  pinyinHanzi: string;
  /** 在拼音里的角色说明。 */
  pinyinDesc: string;
}

const CN_NUM = [
  '零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '二十一', '二十二', '二十三', '二十四', '二十五', '二十六',
];

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** 英文字母名的发音拼写：直接读会得到 "ay / bee / see…" 而非 "Capital A"。 */
const SPOKEN_NAME: Record<string, string> = {
  a: 'a', b: 'bee', c: 'see', d: 'dee', e: 'e:', f: 'eff', g: 'gee',
  h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el', m: 'ayem', n: 'en',
  o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'ess', t: 'tee', u: 'you',
  v: 'vee', w: 'double-u', x: 'ex', y: 'why', z: 'zee',
};

/** 每个字母在拼音里的读音（朗读汉字）与角色说明。 */
interface PinyinInfo { hanzi: string; reading: string; desc: string }

const PINYIN_INFO: Record<string, PinyinInfo> = {
  a: { hanzi: '啊', reading: 'ā（啊）', desc: '它是单韵母，可以自己发音，张大嘴巴念「啊」。' },
  b: { hanzi: '波', reading: 'bo（波）', desc: '它是声母，和韵母在一起才好读，念「波」。' },
  c: { hanzi: '雌', reading: 'ci（雌）', desc: '它是声母，念「呲」，像小刺一样。' },
  d: { hanzi: '得', reading: 'de（得）', desc: '它是声母，念「得」。' },
  e: { hanzi: '鹅', reading: 'e（鹅）', desc: '它是单韵母，可以自己发音，念「鹅」。' },
  f: { hanzi: '佛', reading: 'fo（佛）', desc: '它是声母，念「佛」，像吹风一样。' },
  g: { hanzi: '哥', reading: 'ge（哥）', desc: '它是声母，念「哥」。' },
  h: { hanzi: '喝', reading: 'he（喝）', desc: '它是声母，念「喝」，像哈气一样。' },
  i: { hanzi: '衣', reading: 'i（衣）', desc: '它是单韵母，可以自己发音，念「衣」。' },
  j: { hanzi: '机', reading: 'ji（机）', desc: '它是声母，念「鸡」。' },
  k: { hanzi: '科', reading: 'ke（科）', desc: '它是声母，念「科」。' },
  l: { hanzi: '勒', reading: 'le（勒）', desc: '它是声母，念「勒」。' },
  m: { hanzi: '摸', reading: 'mo（摸）', desc: '它是声母，念「摸」。' },
  n: { hanzi: '讷', reading: 'ne（讷）', desc: '它是声母，念「讷」。' },
  o: { hanzi: '喔', reading: 'o（喔）', desc: '它是单韵母，可以自己发音，念「喔」，像公鸡打鸣。' },
  p: { hanzi: '坡', reading: 'po（坡）', desc: '它是声母，念「坡」。' },
  q: { hanzi: '七', reading: 'qi（七）', desc: '它是声母，念「七」。' },
  r: { hanzi: '日', reading: 'ri（日）', desc: '它是声母，念「日」，卷起舌头念。' },
  s: { hanzi: '思', reading: 'si（思）', desc: '它是声母，念「丝」，像小蛇吐气。' },
  t: { hanzi: '特', reading: 'te（特）', desc: '它是声母，念「特」。' },
  u: { hanzi: '乌', reading: 'u（乌）', desc: '它是单韵母，可以自己发音，念「乌」，嘴巴嘟成小圆。' },
  v: { hanzi: '迂', reading: 'ü（迂）', desc: '拼音里一般不用 v，打字时用它代替 ü，念「迂」。' },
  w: { hanzi: '屋', reading: 'wu（屋）', desc: '它是声母，念「屋」。' },
  x: { hanzi: '西', reading: 'xi（西）', desc: '它是声母，念「西」。' },
  y: { hanzi: '医', reading: 'yi（医）', desc: '它是声母，念「衣」。' },
  z: { hanzi: '资', reading: 'zi（资）', desc: '它是声母，念「资」。' },
};

/** 每个字母一个示例单词。 */
const EXAMPLES: Record<string, LetterExample> = {
  a: { word: 'Apple', emoji: '🍎', zh: '苹果' },
  b: { word: 'Bear', emoji: '🐻', zh: '小熊' },
  c: { word: 'Cat', emoji: '🐱', zh: '小猫' },
  d: { word: 'Dog', emoji: '🐶', zh: '小狗' },
  e: { word: 'Elephant', emoji: '🐘', zh: '大象' },
  f: { word: 'Fish', emoji: '🐟', zh: '小鱼' },
  g: { word: 'Giraffe', emoji: '🦒', zh: '长颈鹿' },
  h: { word: 'Horse', emoji: '🐴', zh: '小马' },
  i: { word: 'Ice cream', emoji: '🍦', zh: '冰淇淋' },
  j: { word: 'Juice', emoji: '🧃', zh: '果汁' },
  k: { word: 'Kite', emoji: '🪁', zh: '风筝' },
  l: { word: 'Lion', emoji: '🦁', zh: '狮子' },
  m: { word: 'Monkey', emoji: '🐵', zh: '猴子' },
  n: { word: 'Nose', emoji: '👃', zh: '鼻子' },
  o: { word: 'Orange', emoji: '🍊', zh: '橙子' },
  p: { word: 'Panda', emoji: '🐼', zh: '熊猫' },
  q: { word: 'Queen', emoji: '👑', zh: '女王' },
  r: { word: 'Rabbit', emoji: '🐰', zh: '兔子' },
  s: { word: 'Sun', emoji: '☀️', zh: '太阳' },
  t: { word: 'Tiger', emoji: '🐯', zh: '老虎' },
  u: { word: 'Umbrella', emoji: '☂️', zh: '雨伞' },
  v: { word: 'Violin', emoji: '🎻', zh: '小提琴' },
  w: { word: 'Watermelon', emoji: '🍉', zh: '西瓜' },
  x: { word: 'Xylophone', emoji: '🎹', zh: '木琴' },
  y: { word: 'Yo-yo', emoji: '🪀', zh: '悠悠球' },
  z: { word: 'Zebra', emoji: '🦓', zh: '斑马' },
};

function buildLetter(upper: string, index: number): LetterItem {
  const lower = upper.toLowerCase();
  const info = PINYIN_INFO[lower];
  const example = EXAMPLES[lower];
  const kind = VOWELS.has(lower) ? '元音' : '辅音';
  const intro =
    `${upper} 是英文字母表里的第${CN_NUM[index + 1]}个字母，也是一个${kind}。` +
    `它的大写写作 ${upper}，小写写作 ${lower}。` +
    `我们一起来听一听、写一写吧！`;
  return {
    letter: upper,
    lower,
    spokenName: SPOKEN_NAME[lower],
    intro,
    examples: [example],
    pinyinReading: info.reading,
    pinyinHanzi: info.hanzi,
    pinyinDesc: info.desc,
  };
}

export const LETTERS: LetterItem[] = Array.from({ length: 26 }, (_, i) =>
  buildLetter(String.fromCharCode(65 + i), i),
);

/** 按小写字母查找。大小写不敏感。 */
export function getLetter(letter: string | undefined): LetterItem | undefined {
  if (!letter) return undefined;
  const lower = letter.toLowerCase();
  return LETTERS.find(l => l.lower === lower);
}

/** 返回上一个 / 下一个字母的小写（用于详情页导航）。 */
export function getAdjacent(lower: string): { prev?: string; next?: string } {
  const idx = LETTERS.findIndex(l => l.lower === lower);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? LETTERS[idx - 1].lower : undefined,
    next: idx < LETTERS.length - 1 ? LETTERS[idx + 1].lower : undefined,
  };
}
