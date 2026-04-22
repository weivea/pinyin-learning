# 拼读演示功能设计

日期：2026-04-22
状态：草案 → 待用户审阅

## 背景

「学拼音」页面中，每个拼音音节卡片下方有「试着读这些字」例字区，
当前每个例字只有一个 🔊 按钮（直接读出整个汉字读音）。

按大陆小学语文（人教版/部编版）标准教学法，学生掌握音节的关键是
**拼读过程**：把音节拆成"声母 + 韵母"或"声母 + 介母 + 韵母"，
逐段读出再合成。本功能为每个例字增加一个「拼读」按钮，
按教学法演示拼读过程。

## 教学法依据

| 类型 | 拼读流程 | 示例 |
|---|---|---|
| **两拼**（声母+韵母） | 声母呼读音 → 韵母 → 加调字 | bà：b - a - bà 爸 |
| **三拼**（声母+介母+韵母） | 声母 → 介母 → 韵母 → 加调字 | guā：g - u - a - guā 瓜 |
| **整体认读音节**（16 个） | 整音无调 → 加调字 | yú：yu - yú 鱼 |
| **零声母**（a/o/e 开头） | 韵母无调 → 加调字 | ài：ai - ài 爱 |

注：不再播放"合成无调音节"过渡段（如 ba / gua / xue），避免与例字加调读音冗余，
也避开了静态库不含双拼合成音的问题。

整体认读音节集合：zhi chi shi ri / zi ci si / yi wu yu / ye yue yuan / yin yun ying

零声母 base：a, ai, an, ang, ao, e, ei, en, eng, er, o, ou

三拼韵母：ia, ua, uo, uai, iao, ian, iang, uan, uang, iong, üan

声母表：b p m f d t n l g k h j q x zh ch sh r z c s

## 用户故事

> 作为家长/小朋友，我点击例字「爸」下方的「拼读」按钮，
> 应用依次读出 `b` `a` `ba` `bà 爸` 四段，期间字幕高亮当前段，
> 帮助孩子理解音节是如何拼出来的。

## 架构

### 1. 拼读分段（纯函数）

新文件：`client/src/utils/spell.ts`

```ts
export interface SpellStep {
  /** 该段去声调拼音（用于查找静态音频或 TTS phoneme 的 pinyin 字段） */
  base: string;
  /** 1-4 = 带调；undefined = 无调音段（声母、介母、韵母、合成无调） */
  tone?: 1 | 2 | 3 | 4;
  /** 仅最后一段有：用于 Edge TTS phoneme 回退的汉字 */
  hanzi?: string;
  /** 字幕显示文字，如 "b"、"a"、"ba"、"bà 爸" */
  caption: string;
}

export function buildSpellSteps(hanzi: string, pinyin: string): SpellStep[];
```

判定优先级：整体认读 → 零声母 → 三拼 → 两拼。

### 2. 音频编排（hook 扩展）

`client/src/hooks/useAudio.ts` 增加：

```ts
const playSequence = useCallback(
  async (steps: SpellStep[], opts?: { gapMs?: number }) => Promise<void>,
  [],
);
```

- 串行播放，段间默认 400ms（可调）
- 每段调用现有 `playPinyin(base, tone ?? 0, hanzi)`，自动走静态 mp3 → Edge TTS 回退
- 用一个 `cancelTokenRef` 标识"上一次播放"，开始新序列时取消旧序列
- 通过 React state 暴露 `currentStepIndex`（-1 表示未播放）供 UI 高亮

### 3. UI 改动

`client/src/components/ExampleWord.tsx`：

```
┌─────────────┐
│   🐱 emoji   │
│      爸     │
│      bà     │
│  🔊    ✋   │   ← 新增「拼读」按钮（小尺寸，icon=✋ 或文字"拼"）
│ b a bà 爸   │   ← 字幕区，仅在拼读时显示，正在播放的段加粗 + 颜色
└─────────────┘
```

- 拼读按钮 `aria-label="拼读 爸"`
- 字幕区固定高度 28px（避免抖动）；非拼读态空白
- 播放期间 🔊 按钮 disabled

### 4. 数据流

```
ExampleWord
  ├─ buildSpellSteps(word.hanzi, word.pinyin)  → SpellStep[]
  ├─ useAudio.playSequence(steps)
  │    └─ for each step: playPinyin(base, tone, hanzi)
  │         ├─ HEAD /api/audio/pinyin/<base><tone>.mp3
  │         │   └─ 200 → <audio> 播放
  │         │   └─ 404 → fallback: ttsUrl(hanzi, {pinyin, tone}) → /api/tts
  │         └─ await audio ended
  └─ 字幕 = steps[currentStepIndex].caption
```

## 测试

### 单元测试
`client/src/utils/spell.test.ts`：

- 两拼：`bà` → `[b, a, bà]`
- 三拼：`guā` → `[g, u, a, guā]`
- 整体认读：`yú` → `[yu, yú]`、`yuán` → `[yuan, yuán]`
- 零声母：`ài` → `[ai, ài]`、`ér` → `[er, ér]`
- ü 类两拼：`lǜ` → `[l, ü, lǜ]`、`jǔ` → `[j, ü, jǔ]`（j/q/x 后 u 写法是 u，音是 ü，按 ü 播放静态 v.mp3）
- ü 类三拼：`xué` → `[x, ü, e, xué]`、`quán` → `[q, ü, an, quán]`
- 加调字 step 的 `hanzi` 字段非空（用于 TTS 回退）

不为 `playSequence` 写 jsdom 集成测试（音频播放在 jsdom 中行为难真实模拟），手动验证。

### 手动验证
- 点击「爸」拼读：听到 b、a、ba、bà 四段，字幕高亮跟随
- 点击「乐」拼读：最后一段必须读 yuè（多音字 phoneme 模式生效）
- 拼读中再点别的拼读按钮：旧序列立即停止，新序列开始
- 拼读中点 🔊：按钮应被 disabled（或停掉拼读后播放整音）

## 范围控制（YAGNI）

不做：
- 用户可调节速度
- 拼读"自动连读"动画/激励
- 重新录制拼读专用音频
- 修改 `pinyin.ts` 数据结构（在 `spell.ts` 内由 pinyin 字符串推导即可）

## 文件清单

新增：
- `client/src/utils/spell.ts`
- `client/src/utils/spell.test.ts`
- `docs/superpowers/specs/2026-04-22-pinyin-spelling-design.md`（本文件）

修改：
- `client/src/hooks/useAudio.ts`：增加 `playSequence`
- `client/src/components/ExampleWord.tsx`：增加拼读按钮 + 字幕区
