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

// --- 复韵母 (18) ---
const compoundFinals: PinyinItem[] = [
  { id: 'ai', display: 'ai', category: 'compound-final', hasTones: true, audioText: '哀',
    tones: [
      { tone: 1, text: 'āi', audioText: '哀' },
      { tone: 2, text: 'ái', audioText: '挨' },
      { tone: 3, text: 'ǎi', audioText: '矮' },
      { tone: 4, text: 'ài', audioText: '爱' },
    ],
    examples: [
      { hanzi: '爱', pinyin: 'ài', tone: 4, emoji: '❤️' },
      { hanzi: '白', pinyin: 'bái', tone: 2, emoji: '🤍' },
    ] },
  { id: 'ei', display: 'ei', category: 'compound-final', hasTones: true, audioText: '诶',
    tones: [
      { tone: 1, text: 'ēi', audioText: '诶' },
      { tone: 2, text: 'éi', audioText: '诶' },
      { tone: 3, text: 'ěi', audioText: '诶' },
      { tone: 4, text: 'èi', audioText: '诶' },
    ],
    examples: [
      { hanzi: '黑', pinyin: 'hēi', tone: 1, emoji: '⬛' },
      { hanzi: '杯', pinyin: 'bēi', tone: 1, emoji: '🥤' },
    ] },
  { id: 'ui', display: 'ui', category: 'compound-final', hasTones: true, audioText: '威',
    tones: [
      { tone: 1, text: 'uī', audioText: '威' },
      { tone: 2, text: 'uí', audioText: '围' },
      { tone: 3, text: 'uǐ', audioText: '伟' },
      { tone: 4, text: 'uì', audioText: '为' },
    ],
    examples: [
      { hanzi: '水', pinyin: 'shuǐ', tone: 3, emoji: '💧' },
      { hanzi: '腿', pinyin: 'tuǐ', tone: 3, emoji: '🦵' },
    ] },
  { id: 'ao', display: 'ao', category: 'compound-final', hasTones: true, audioText: '熬',
    tones: [
      { tone: 1, text: 'āo', audioText: '凹' },
      { tone: 2, text: 'áo', audioText: '熬' },
      { tone: 3, text: 'ǎo', audioText: '袄' },
      { tone: 4, text: 'ào', audioText: '奥' },
    ],
    examples: [
      { hanzi: '猫', pinyin: 'māo', tone: 1, emoji: '🐱' },
      { hanzi: '草', pinyin: 'cǎo', tone: 3, emoji: '🌿' },
    ] },
  { id: 'ou', display: 'ou', category: 'compound-final', hasTones: true, audioText: '欧',
    tones: [
      { tone: 1, text: 'ōu', audioText: '欧' },
      { tone: 2, text: 'óu', audioText: '欧' },
      { tone: 3, text: 'ǒu', audioText: '偶' },
      { tone: 4, text: 'òu', audioText: '欧' },
    ],
    examples: [
      { hanzi: '狗', pinyin: 'gǒu', tone: 3, emoji: '🐶' },
      { hanzi: '猴', pinyin: 'hóu', tone: 2, emoji: '🐵' },
    ] },
  { id: 'iu', display: 'iu', category: 'compound-final', hasTones: true, audioText: '忧',
    tones: [
      { tone: 1, text: 'iū', audioText: '忧' },
      { tone: 2, text: 'iú', audioText: '游' },
      { tone: 3, text: 'iǔ', audioText: '友' },
      { tone: 4, text: 'iù', audioText: '又' },
    ],
    examples: [
      { hanzi: '牛', pinyin: 'niú', tone: 2, emoji: '🐮' },
      { hanzi: '六', pinyin: 'liù', tone: 4, emoji: '6️⃣' },
    ] },
  { id: 'ie', display: 'ie', category: 'compound-final', hasTones: true, audioText: '耶',
    tones: [
      { tone: 1, text: 'iē', audioText: '耶' },
      { tone: 2, text: 'ié', audioText: '爷' },
      { tone: 3, text: 'iě', audioText: '也' },
      { tone: 4, text: 'iè', audioText: '夜' },
    ],
    examples: [
      { hanzi: '鞋', pinyin: 'xié', tone: 2, emoji: '👟' },
      { hanzi: '蝶', pinyin: 'dié', tone: 2, emoji: '🦋' },
    ] },
  { id: 'üe', display: 'üe', category: 'compound-final', hasTones: true, audioText: '约',
    tones: [
      { tone: 1, text: 'üē', audioText: '约' },
      { tone: 2, text: 'üé', audioText: '约' },
      { tone: 3, text: 'üě', audioText: '约' },
      { tone: 4, text: 'üè', audioText: '月' },
    ],
    examples: [
      { hanzi: '月', pinyin: 'yuè', tone: 4, emoji: '🌙' },
      { hanzi: '雪', pinyin: 'xuě', tone: 3, emoji: '❄️' },
    ] },
  { id: 'er', display: 'er', category: 'compound-final', hasTones: true, audioText: '儿',
    tones: [
      { tone: 1, text: 'ēr', audioText: '儿' },
      { tone: 2, text: 'ér', audioText: '儿' },
      { tone: 3, text: 'ěr', audioText: '耳' },
      { tone: 4, text: 'èr', audioText: '二' },
    ],
    examples: [
      { hanzi: '耳', pinyin: 'ěr', tone: 3, emoji: '👂' },
      { hanzi: '二', pinyin: 'èr', tone: 4, emoji: '2️⃣' },
    ] },
  { id: 'an', display: 'an', category: 'compound-final', hasTones: true, audioText: '安',
    tones: [
      { tone: 1, text: 'ān', audioText: '安' },
      { tone: 2, text: 'án', audioText: '安' },
      { tone: 3, text: 'ǎn', audioText: '俺' },
      { tone: 4, text: 'àn', audioText: '岸' },
    ],
    examples: [
      { hanzi: '山', pinyin: 'shān', tone: 1, emoji: '⛰️' },
      { hanzi: '伞', pinyin: 'sǎn', tone: 3, emoji: '☂️' },
    ] },
  { id: 'en', display: 'en', category: 'compound-final', hasTones: true, audioText: '恩',
    tones: [
      { tone: 1, text: 'ēn', audioText: '恩' },
      { tone: 2, text: 'én', audioText: '恩' },
      { tone: 3, text: 'ěn', audioText: '恩' },
      { tone: 4, text: 'èn', audioText: '恩' },
    ],
    examples: [
      { hanzi: '门', pinyin: 'mén', tone: 2, emoji: '🚪' },
      { hanzi: '本', pinyin: 'běn', tone: 3, emoji: '📒' },
    ] },
  { id: 'in', display: 'in', category: 'compound-final', hasTones: true, audioText: '因',
    tones: [
      { tone: 1, text: 'īn', audioText: '因' },
      { tone: 2, text: 'ín', audioText: '银' },
      { tone: 3, text: 'ǐn', audioText: '引' },
      { tone: 4, text: 'ìn', audioText: '印' },
    ],
    examples: [
      { hanzi: '心', pinyin: 'xīn', tone: 1, emoji: '💖' },
      { hanzi: '林', pinyin: 'lín', tone: 2, emoji: '🌲' },
    ] },
  { id: 'un', display: 'un', category: 'compound-final', hasTones: true, audioText: '温',
    tones: [
      { tone: 1, text: 'ūn', audioText: '温' },
      { tone: 2, text: 'ún', audioText: '魂' },
      { tone: 3, text: 'ǔn', audioText: '稳' },
      { tone: 4, text: 'ùn', audioText: '问' },
    ],
    examples: [
      { hanzi: '春', pinyin: 'chūn', tone: 1, emoji: '🌸' },
      { hanzi: '云', pinyin: 'yún', tone: 2, emoji: '☁️' },
    ] },
  { id: 'ün', display: 'ün', category: 'compound-final', hasTones: true, audioText: '晕',
    tones: [
      { tone: 1, text: 'ǖn', audioText: '晕' },
      { tone: 2, text: 'ǘn', audioText: '云' },
      { tone: 3, text: 'ǚn', audioText: '允' },
      { tone: 4, text: 'ǜn', audioText: '运' },
    ],
    examples: [
      { hanzi: '裙', pinyin: 'qún', tone: 2, emoji: '👗' },
    ] },
  { id: 'ang', display: 'ang', category: 'compound-final', hasTones: true, audioText: '昂',
    tones: [
      { tone: 1, text: 'āng', audioText: '肮' },
      { tone: 2, text: 'áng', audioText: '昂' },
      { tone: 3, text: 'ǎng', audioText: '昂' },
      { tone: 4, text: 'àng', audioText: '盎' },
    ],
    examples: [
      { hanzi: '羊', pinyin: 'yáng', tone: 2, emoji: '🐑' },
      { hanzi: '糖', pinyin: 'táng', tone: 2, emoji: '🍬' },
    ] },
  { id: 'eng', display: 'eng', category: 'compound-final', hasTones: true, audioText: '亨',
    tones: [
      { tone: 1, text: 'ēng', audioText: '亨' },
      { tone: 2, text: 'éng', audioText: '亨' },
      { tone: 3, text: 'ěng', audioText: '亨' },
      { tone: 4, text: 'èng', audioText: '亨' },
    ],
    examples: [
      { hanzi: '风', pinyin: 'fēng', tone: 1, emoji: '🌬️' },
      { hanzi: '灯', pinyin: 'dēng', tone: 1, emoji: '💡' },
    ] },
  { id: 'ing', display: 'ing', category: 'compound-final', hasTones: true, audioText: '英',
    tones: [
      { tone: 1, text: 'īng', audioText: '英' },
      { tone: 2, text: 'íng', audioText: '迎' },
      { tone: 3, text: 'ǐng', audioText: '影' },
      { tone: 4, text: 'ìng', audioText: '硬' },
    ],
    examples: [
      { hanzi: '星', pinyin: 'xīng', tone: 1, emoji: '⭐' },
      { hanzi: '冰', pinyin: 'bīng', tone: 1, emoji: '🧊' },
    ] },
  { id: 'ong', display: 'ong', category: 'compound-final', hasTones: true, audioText: '翁',
    tones: [
      { tone: 1, text: 'ōng', audioText: '翁' },
      { tone: 2, text: 'óng', audioText: '红' },
      { tone: 3, text: 'ǒng', audioText: '拥' },
      { tone: 4, text: 'òng', audioText: '用' },
    ],
    examples: [
      { hanzi: '红', pinyin: 'hóng', tone: 2, emoji: '🟥' },
      { hanzi: '虫', pinyin: 'chóng', tone: 2, emoji: '🐛' },
    ] },
];

// --- 整体认读 (16) ---
const wholeSyllables: PinyinItem[] = [
  { id: 'zhi', display: 'zhi', category: 'whole-syllable', hasTones: true, audioText: '知',
    tones: [
      { tone: 1, text: 'zhī', audioText: '知' },
      { tone: 2, text: 'zhí', audioText: '直' },
      { tone: 3, text: 'zhǐ', audioText: '纸' },
      { tone: 4, text: 'zhì', audioText: '志' },
    ],
    examples: [{ hanzi: '纸', pinyin: 'zhǐ', tone: 3, emoji: '📄' }] },
  { id: 'chi', display: 'chi', category: 'whole-syllable', hasTones: true, audioText: '吃',
    tones: [
      { tone: 1, text: 'chī', audioText: '吃' },
      { tone: 2, text: 'chí', audioText: '池' },
      { tone: 3, text: 'chǐ', audioText: '尺' },
      { tone: 4, text: 'chì', audioText: '赤' },
    ],
    examples: [{ hanzi: '吃', pinyin: 'chī', tone: 1, emoji: '🍚' }] },
  { id: 'shi', display: 'shi', category: 'whole-syllable', hasTones: true, audioText: '诗',
    tones: [
      { tone: 1, text: 'shī', audioText: '诗' },
      { tone: 2, text: 'shí', audioText: '十' },
      { tone: 3, text: 'shǐ', audioText: '使' },
      { tone: 4, text: 'shì', audioText: '是' },
    ],
    examples: [{ hanzi: '十', pinyin: 'shí', tone: 2, emoji: '🔟' }] },
  { id: 'ri', display: 'ri', category: 'whole-syllable', hasTones: true, audioText: '日',
    tones: [
      { tone: 1, text: 'rī', audioText: '日' },
      { tone: 2, text: 'rí', audioText: '日' },
      { tone: 3, text: 'rǐ', audioText: '日' },
      { tone: 4, text: 'rì', audioText: '日' },
    ],
    examples: [{ hanzi: '日', pinyin: 'rì', tone: 4, emoji: '☀️' }] },
  { id: 'zi', display: 'zi', category: 'whole-syllable', hasTones: true, audioText: '资',
    tones: [
      { tone: 1, text: 'zī', audioText: '资' },
      { tone: 2, text: 'zí', audioText: '资' },
      { tone: 3, text: 'zǐ', audioText: '紫' },
      { tone: 4, text: 'zì', audioText: '字' },
    ],
    examples: [{ hanzi: '字', pinyin: 'zì', tone: 4, emoji: '🔤' }] },
  { id: 'ci', display: 'ci', category: 'whole-syllable', hasTones: true, audioText: '雌',
    tones: [
      { tone: 1, text: 'cī', audioText: '雌' },
      { tone: 2, text: 'cí', audioText: '词' },
      { tone: 3, text: 'cǐ', audioText: '此' },
      { tone: 4, text: 'cì', audioText: '次' },
    ],
    examples: [{ hanzi: '刺', pinyin: 'cì', tone: 4, emoji: '🌵' }] },
  { id: 'si', display: 'si', category: 'whole-syllable', hasTones: true, audioText: '思',
    tones: [
      { tone: 1, text: 'sī', audioText: '思' },
      { tone: 2, text: 'sí', audioText: '思' },
      { tone: 3, text: 'sǐ', audioText: '死' },
      { tone: 4, text: 'sì', audioText: '四' },
    ],
    examples: [{ hanzi: '四', pinyin: 'sì', tone: 4, emoji: '4️⃣' }] },
  { id: 'yi', display: 'yi', category: 'whole-syllable', hasTones: true, audioText: '衣',
    tones: [
      { tone: 1, text: 'yī', audioText: '衣' },
      { tone: 2, text: 'yí', audioText: '姨' },
      { tone: 3, text: 'yǐ', audioText: '椅' },
      { tone: 4, text: 'yì', audioText: '亿' },
    ],
    examples: [{ hanzi: '一', pinyin: 'yī', tone: 1, emoji: '1️⃣' }] },
  { id: 'wu', display: 'wu', category: 'whole-syllable', hasTones: true, audioText: '乌',
    tones: [
      { tone: 1, text: 'wū', audioText: '乌' },
      { tone: 2, text: 'wú', audioText: '无' },
      { tone: 3, text: 'wǔ', audioText: '五' },
      { tone: 4, text: 'wù', audioText: '雾' },
    ],
    examples: [{ hanzi: '五', pinyin: 'wǔ', tone: 3, emoji: '5️⃣' }] },
  { id: 'yu', display: 'yu', category: 'whole-syllable', hasTones: true, audioText: '迂',
    tones: [
      { tone: 1, text: 'yū', audioText: '迂' },
      { tone: 2, text: 'yú', audioText: '鱼' },
      { tone: 3, text: 'yǔ', audioText: '雨' },
      { tone: 4, text: 'yù', audioText: '玉' },
    ],
    examples: [{ hanzi: '鱼', pinyin: 'yú', tone: 2, emoji: '🐟' }] },
  { id: 'ye', display: 'ye', category: 'whole-syllable', hasTones: true, audioText: '耶',
    tones: [
      { tone: 1, text: 'yē', audioText: '耶' },
      { tone: 2, text: 'yé', audioText: '爷' },
      { tone: 3, text: 'yě', audioText: '也' },
      { tone: 4, text: 'yè', audioText: '夜' },
    ],
    examples: [{ hanzi: '叶', pinyin: 'yè', tone: 4, emoji: '🍃' }] },
  { id: 'yue', display: 'yue', category: 'whole-syllable', hasTones: true, audioText: '约',
    tones: [
      { tone: 1, text: 'yuē', audioText: '约' },
      { tone: 2, text: 'yué', audioText: '约' },
      { tone: 3, text: 'yuě', audioText: '约' },
      { tone: 4, text: 'yuè', audioText: '月' },
    ],
    examples: [{ hanzi: '月', pinyin: 'yuè', tone: 4, emoji: '🌙' }] },
  { id: 'yuan', display: 'yuan', category: 'whole-syllable', hasTones: true, audioText: '冤',
    tones: [
      { tone: 1, text: 'yuān', audioText: '冤' },
      { tone: 2, text: 'yuán', audioText: '元' },
      { tone: 3, text: 'yuǎn', audioText: '远' },
      { tone: 4, text: 'yuàn', audioText: '愿' },
    ],
    examples: [{ hanzi: '园', pinyin: 'yuán', tone: 2, emoji: '🏞️' }] },
  { id: 'yin', display: 'yin', category: 'whole-syllable', hasTones: true, audioText: '因',
    tones: [
      { tone: 1, text: 'yīn', audioText: '因' },
      { tone: 2, text: 'yín', audioText: '银' },
      { tone: 3, text: 'yǐn', audioText: '引' },
      { tone: 4, text: 'yìn', audioText: '印' },
    ],
    examples: [{ hanzi: '银', pinyin: 'yín', tone: 2, emoji: '🥈' }] },
  { id: 'yun', display: 'yun', category: 'whole-syllable', hasTones: true, audioText: '晕',
    tones: [
      { tone: 1, text: 'yūn', audioText: '晕' },
      { tone: 2, text: 'yún', audioText: '云' },
      { tone: 3, text: 'yǔn', audioText: '允' },
      { tone: 4, text: 'yùn', audioText: '运' },
    ],
    examples: [{ hanzi: '云', pinyin: 'yún', tone: 2, emoji: '☁️' }] },
  { id: 'ying', display: 'ying', category: 'whole-syllable', hasTones: true, audioText: '英',
    tones: [
      { tone: 1, text: 'yīng', audioText: '英' },
      { tone: 2, text: 'yíng', audioText: '迎' },
      { tone: 3, text: 'yǐng', audioText: '影' },
      { tone: 4, text: 'yìng', audioText: '硬' },
    ],
    examples: [{ hanzi: '鹰', pinyin: 'yīng', tone: 1, emoji: '🦅' }] },
];

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
