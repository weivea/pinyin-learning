# 拼音趣味卡片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 63 个拼音条目（声母 23 / 单韵母 6 / 复韵母 18 / 整体认读 16）增加 emoji 形象、形似提示文字、口诀朗读（卡拉 OK 高亮）和入场弹入动画，使 CardsPage 卡片详情更有趣。

**Architecture:** 在 `PinyinItem` 上新增可选 `mnemonic` 与 `rhyme` 字段，提取一个独立的 `MnemonicSection` 组件挂入 `PinyinCard`；口诀高亮由纯函数 `tokenize` + `useKaraoke` hook + `RhymeKaraoke` 组件协作完成。数据驱动，emoji→SVG 升级时只动一个组件。

**Tech Stack:** React 18 + TypeScript + Vite + vitest + @testing-library/react

参考 spec：`docs/superpowers/specs/2026-04-29-pinyin-fun-cards-design.md`

---

## 文件结构

**新增**
- `client/src/utils/tokenize.ts` — 默认切分规则（纯函数）
- `client/src/utils/tokenize.test.ts` — 单元测试
- `client/src/hooks/useKaraoke.ts` — RAF 节拍 hook
- `client/src/components/RhymeKaraoke.tsx` — 卡拉 OK 高亮渲染
- `client/src/components/RhymeKaraoke.test.tsx` — 渲染测试
- `client/src/components/MnemonicSection.tsx` — 形象 + 口诀容器
- `client/src/components/MnemonicSection.test.tsx` — 容器渲染测试

**修改**
- `client/src/types.ts` — `PinyinItem` 增加 `mnemonic?` `rhyme?`，新增 `MnemonicAsset` `RhymeData` 类型
- `client/src/data/pinyin.ts` — 为 63 条数据填入 `mnemonic` 与 `rhyme`
- `client/src/components/PinyinCard.tsx` — 挂载一行 `<MnemonicSection />`
- `README.md` — 新增手工验收项

---

### Task 1：扩展类型定义

**Files:**
- Modify: `client/src/types.ts`

- [ ] **Step 1：在 `types.ts` 末尾追加新接口并扩展 `PinyinItem`**

```ts
// 追加到文件末尾（GameBest 接口之后）
export interface MnemonicAsset {
  /** 形象 emoji，例如 '📻'。 */
  emoji: string;
  /** 形似提示文字（≤8 字），例如 '像小喇叭'。 */
  hint: string;
  /** 预留：未来用 svgKey 查内置 SVG 表替换 emoji。 */
  svgKey?: string;
}

export interface RhymeData {
  /** 口诀展示文本，例如 '听广播 b b b'。 */
  text: string;
  /** 可选：人工指定的节奏切片，覆盖默认 tokenize 规则。 */
  tokens?: string[];
  /** 可选：TTS 朗读用文本（与 text 不同时启用）。 */
  audioText?: string;
}
```

修改 `PinyinItem` 接口（在 `examples` 字段之后追加两个可选字段）：

```ts
export interface PinyinItem {
  id: string;
  display: string;
  category: PinyinCategory;
  hasTones: boolean;
  tones?: ToneVariant[];
  audioText: string;
  examples: ExampleWord[];
  mnemonic?: MnemonicAsset;
  rhyme?: RhymeData;
}
```

- [ ] **Step 2：运行类型检查**

Run: `cd client && npx tsc --noEmit`
Expected: 无错误（新增字段都是可选，向后兼容）

- [ ] **Step 3：Commit**

```bash
git add client/src/types.ts
git commit -m "feat(types): 扩展 PinyinItem 增加 mnemonic 与 rhyme 可选字段"
```

---

### Task 2：实现 tokenize 纯函数

**Files:**
- Create: `client/src/utils/tokenize.ts`
- Create: `client/src/utils/tokenize.test.ts`

- [ ] **Step 1：写失败测试**

`client/src/utils/tokenize.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('每个中文字符一个 token', () => {
    expect(tokenize('听广播')).toEqual(['听', '广', '播']);
  });

  it('中英混合：中文按字、英文按空格', () => {
    expect(tokenize('听广播 b b b')).toEqual(['听', '广', '播', 'b', 'b', 'b']);
  });

  it('忽略中英文标点', () => {
    expect(tokenize('你好，世界！')).toEqual(['你', '好', '世', '界']);
  });

  it('多空格视为一个分隔符', () => {
    expect(tokenize('b   b   b')).toEqual(['b', 'b', 'b']);
  });

  it('override 直接返回，不做切分', () => {
    expect(tokenize('听广播 b b b', ['广播', '广播', 'b', 'b', 'b'])).toEqual([
      '广播', '广播', 'b', 'b', 'b',
    ]);
  });

  it('空字符串返回空数组', () => {
    expect(tokenize('')).toEqual([]);
  });
});
```

- [ ] **Step 2：运行测试验证失败**

Run: `cd client && npx vitest run src/utils/tokenize.test.ts`
Expected: FAIL（`tokenize` 未定义）

- [ ] **Step 3：实现 tokenize**

`client/src/utils/tokenize.ts`：

```ts
/**
 * 将口诀文本切分为高亮 token 序列。
 * - 中文字符（CJK Unified Ideographs U+4E00-U+9FFF）每字一个 token
 * - ASCII 字母/数字按空白分组
 * - 标点和空白被跳过
 * 若提供 override，直接返回 override（不做切分）。
 */
export function tokenize(text: string, override?: string[]): string[] {
  if (override) return override;
  const tokens: string[] = [];
  let buf = '';
  const flush = () => { if (buf) { tokens.push(buf); buf = ''; } };
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    const isCJK = code >= 0x4e00 && code <= 0x9fff;
    const isAlnum = /[A-Za-z0-9]/.test(ch);
    if (isCJK) {
      flush();
      tokens.push(ch);
    } else if (isAlnum) {
      buf += ch;
    } else {
      // 空白、标点等：作为分隔符
      flush();
    }
  }
  flush();
  return tokens;
}
```

- [ ] **Step 4：运行测试验证通过**

Run: `cd client && npx vitest run src/utils/tokenize.test.ts`
Expected: PASS（6 tests）

- [ ] **Step 5：Commit**

```bash
git add client/src/utils/tokenize.ts client/src/utils/tokenize.test.ts
git commit -m "feat(utils): 添加 tokenize 口诀切分纯函数"
```

---

### Task 3：实现 useKaraoke hook

**Files:**
- Create: `client/src/hooks/useKaraoke.ts`

> 说明：useKaraoke 通过 `requestAnimationFrame` 推进当前高亮 index。它没有副作用且 hook 形式简单，本任务以"组件层 RhymeKaraoke 测试覆盖其行为"代替专门的 hook 单测，避免引入 fake timer 复杂度。

- [ ] **Step 1：实现 useKaraoke**

`client/src/hooks/useKaraoke.ts`：

```ts
import { useEffect, useState } from 'react';

/**
 * 按节拍推进口诀高亮 index。
 * @param total       token 数量
 * @param isPlaying   是否在播放
 * @param durationMs  音频总时长（毫秒）
 * @returns currentIndex —— 当前应高亮的 token 下标；未播放或 total<=0 时为 -1
 */
export function useKaraoke(
  total: number,
  isPlaying: boolean,
  durationMs: number,
): { currentIndex: number } {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (!isPlaying || total <= 0 || durationMs <= 0) {
      setCurrentIndex(-1);
      return;
    }
    const start = performance.now();
    const perToken = durationMs / total;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const idx = Math.min(total - 1, Math.floor(elapsed / perToken));
      setCurrentIndex(idx);
      if (elapsed < durationMs) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setCurrentIndex(-1);
    };
  }, [total, isPlaying, durationMs]);

  return { currentIndex };
}
```

- [ ] **Step 2：运行类型检查**

Run: `cd client && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3：Commit**

```bash
git add client/src/hooks/useKaraoke.ts
git commit -m "feat(hooks): 添加 useKaraoke 卡拉 OK 节拍 hook"
```

---

### Task 4：实现 RhymeKaraoke 组件

**Files:**
- Create: `client/src/components/RhymeKaraoke.tsx`
- Create: `client/src/components/RhymeKaraoke.test.tsx`

- [ ] **Step 1：写失败测试**

`client/src/components/RhymeKaraoke.test.tsx`：

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RhymeKaraoke } from './RhymeKaraoke';

describe('RhymeKaraoke', () => {
  it('未播放时所有 token 为 future（无 active class）', () => {
    render(<RhymeKaraoke text="听广播 b b b" isPlaying={false} durationMs={0} />);
    const tokens = screen.getAllByTestId('rhyme-token');
    expect(tokens).toHaveLength(6);
    tokens.forEach(t => {
      expect(t.getAttribute('data-state')).toBe('future');
    });
  });

  it('提供 override tokens 时使用 override', () => {
    render(
      <RhymeKaraoke
        text="听广播 b b b"
        tokens={['听', '广播', 'b', 'b', 'b']}
        isPlaying={false}
        durationMs={0}
      />
    );
    expect(screen.getAllByTestId('rhyme-token')).toHaveLength(5);
    expect(screen.getByText('广播')).toBeInTheDocument();
  });

  it('空文本不渲染任何 token', () => {
    render(<RhymeKaraoke text="" isPlaying={false} durationMs={0} />);
    expect(screen.queryAllByTestId('rhyme-token')).toHaveLength(0);
  });
});
```

- [ ] **Step 2：运行测试验证失败**

Run: `cd client && npx vitest run src/components/RhymeKaraoke.test.tsx`
Expected: FAIL（组件未定义）

- [ ] **Step 3：实现 RhymeKaraoke**

`client/src/components/RhymeKaraoke.tsx`：

```tsx
import type { CSSProperties } from 'react';
import { tokenize } from '../utils/tokenize';
import { useKaraoke } from '../hooks/useKaraoke';

interface Props {
  text: string;
  tokens?: string[];
  isPlaying: boolean;
  durationMs: number;
}

export function RhymeKaraoke({ text, tokens, isPlaying, durationMs }: Props) {
  const list = tokenize(text, tokens);
  const { currentIndex } = useKaraoke(list.length, isPlaying, durationMs);

  return (
    <div style={containerStyle}>
      {list.map((tok, i) => {
        const state =
          currentIndex < 0 || i > currentIndex ? 'future'
          : i === currentIndex ? 'active'
          : 'past';
        return (
          <span
            key={i}
            data-testid="rhyme-token"
            data-state={state}
            style={tokenStyle(state)}
          >
            {tok}
          </span>
        );
      })}
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: 6,
  fontSize: 28,
  fontWeight: 600,
  margin: '12px 0',
};

function tokenStyle(state: 'past' | 'active' | 'future'): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-block',
    transition: 'all 120ms ease-out',
  };
  if (state === 'active') {
    return {
      ...base,
      color: '#fb8500',
      transform: 'scale(1.15)',
      textShadow: '0 0 8px rgba(251,133,0,0.4)',
    };
  }
  if (state === 'past') {
    return { ...base, color: '#999' };
  }
  return { ...base, color: '#333' };
}
```

- [ ] **Step 4：运行测试验证通过**

Run: `cd client && npx vitest run src/components/RhymeKaraoke.test.tsx`
Expected: PASS（3 tests）

- [ ] **Step 5：Commit**

```bash
git add client/src/components/RhymeKaraoke.tsx client/src/components/RhymeKaraoke.test.tsx
git commit -m "feat(component): RhymeKaraoke 卡拉 OK 高亮组件"
```

---

### Task 5：实现 MnemonicSection 容器组件

**Files:**
- Create: `client/src/components/MnemonicSection.tsx`
- Create: `client/src/components/MnemonicSection.test.tsx`

> 说明：MnemonicSection 内部需要触发 TTS 播放并管理 `isPlaying` / `durationMs` 状态，但 TTS（`useAudio`）涉及 Audio 元素和网络请求，单测中只验证渲染分支（mnemonic/rhyme 任一缺失场景），播放交互在端到端验收清单中走人工。

- [ ] **Step 1：写失败测试**

`client/src/components/MnemonicSection.test.tsx`：

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MnemonicSection } from './MnemonicSection';

describe('MnemonicSection', () => {
  it('mnemonic 与 rhyme 均缺失时不渲染', () => {
    const { container } = render(<MnemonicSection pinyinId="b" />);
    expect(container.firstChild).toBeNull();
  });

  it('仅 mnemonic 时渲染 emoji 与 hint，无口诀按钮', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
      />
    );
    expect(screen.getByText('📻')).toBeInTheDocument();
    expect(screen.getByText('像小喇叭')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /听口诀/ })).toBeNull();
  });

  it('仅 rhyme 时渲染口诀区与按钮，无 emoji 块', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    expect(screen.queryByText('📻')).toBeNull();
    expect(screen.getAllByTestId('rhyme-token').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /听口诀/ })).toBeInTheDocument();
  });

  it('mnemonic 与 rhyme 都提供时全部渲染', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    expect(screen.getByText('📻')).toBeInTheDocument();
    expect(screen.getByText('像小喇叭')).toBeInTheDocument();
    expect(screen.getAllByTestId('rhyme-token')).toHaveLength(6);
    expect(screen.getByRole('button', { name: /听口诀/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2：运行测试验证失败**

Run: `cd client && npx vitest run src/components/MnemonicSection.test.tsx`
Expected: FAIL（组件未定义）

- [ ] **Step 3：实现 MnemonicSection**

`client/src/components/MnemonicSection.tsx`：

```tsx
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MnemonicAsset, RhymeData } from '../types';
import { ttsUrl } from '../api/tts';
import { tokenize } from '../utils/tokenize';
import { RhymeKaraoke } from './RhymeKaraoke';

interface Props {
  pinyinId: string;
  mnemonic?: MnemonicAsset;
  rhyme?: RhymeData;
}

const FALLBACK_PER_TOKEN_MS = 300;

export function MnemonicSection({ pinyinId, mnemonic, rhyme }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 切换条目时复位播放状态
  useEffect(() => {
    setIsPlaying(false);
    setDurationMs(0);
    audioRef.current?.pause();
    audioRef.current = null;
  }, [pinyinId]);

  if (!mnemonic && !rhyme) return null;

  const playRhyme = () => {
    if (!rhyme) return;
    const speakText = rhyme.audioText ?? rhyme.text;
    const tokenCount = tokenize(rhyme.text, rhyme.tokens).length;
    const fallback = FALLBACK_PER_TOKEN_MS * Math.max(1, tokenCount);

    audioRef.current?.pause();
    const audio = new Audio(ttsUrl(speakText));
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      const d = isFinite(audio.duration) ? audio.duration * 1000 : fallback;
      setDurationMs(d > 0 ? d : fallback);
    });
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => setIsPlaying(false));

    setDurationMs(fallback);
    setIsPlaying(true);
    void audio.play().catch(() => setIsPlaying(false));
  };

  const speakHint = () => {
    if (!mnemonic) return;
    const audio = new Audio(ttsUrl(mnemonic.hint));
    void audio.play().catch(() => {});
  };

  return (
    <section key={pinyinId} style={containerStyle}>
      {mnemonic && (
        <div style={mnemonicBlockStyle}>
          <button
            onClick={speakHint}
            aria-label={`朗读：${mnemonic.hint}`}
            style={emojiButtonStyle}
            className="mnemonic-emoji"
          >
            {mnemonic.emoji}
          </button>
          <div style={hintStyle}>{mnemonic.hint}</div>
        </div>
      )}
      {rhyme && (
        <div style={rhymeBlockStyle}>
          <RhymeKaraoke
            text={rhyme.text}
            tokens={rhyme.tokens}
            isPlaying={isPlaying}
            durationMs={durationMs}
          />
          <button onClick={playRhyme} style={listenButtonStyle}>
            🔊 听口诀
          </button>
        </div>
      )}
    </section>
  );
}

const containerStyle: CSSProperties = {
  marginTop: 24,
  padding: '20px 16px',
  background: '#fffaf0',
  borderRadius: 24,
  border: '2px dashed #ffd166',
  animation: 'mnemonic-enter 240ms cubic-bezier(.34,1.56,.64,1)',
};

const mnemonicBlockStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: 16,
};

const emojiButtonStyle: CSSProperties = {
  fontSize: 80,
  lineHeight: 1,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 8,
  transition: 'transform 200ms ease-out',
};

const hintStyle: CSSProperties = {
  fontSize: 18,
  color: '#666',
  marginTop: 4,
};

const rhymeBlockStyle: CSSProperties = {
  textAlign: 'center',
};

const listenButtonStyle: CSSProperties = {
  fontSize: 18,
  padding: '10px 20px',
  borderRadius: 16,
  border: '2px solid #fb8500',
  background: '#fff',
  cursor: 'pointer',
  marginTop: 8,
};
```

- [ ] **Step 4：添加全局 CSS 动画**

修改 `client/src/main.tsx`（或定位到现有全局样式入口；若已存在 `index.css` 优先用它，否则在 `main.tsx` 顶部新增 `import './styles/animations.css';`）。

创建 `client/src/styles/animations.css`：

```css
@keyframes mnemonic-enter {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes mnemonic-shake {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-4deg); }
  80% { transform: rotate(4deg); }
}

.mnemonic-emoji:hover {
  transform: rotate(-6deg) scale(1.08);
}

.mnemonic-emoji:active {
  animation: mnemonic-shake 600ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  section[style*="mnemonic-enter"],
  .mnemonic-emoji,
  .mnemonic-emoji:hover,
  .mnemonic-emoji:active {
    animation: none !important;
    transform: none !important;
  }
}
```

在 `client/src/main.tsx` 现有 import 块末尾添加：

```ts
import './styles/animations.css';
```

- [ ] **Step 5：运行测试验证通过**

Run: `cd client && npx vitest run src/components/MnemonicSection.test.tsx`
Expected: PASS（4 tests）

- [ ] **Step 6：Commit**

```bash
git add client/src/components/MnemonicSection.tsx client/src/components/MnemonicSection.test.tsx client/src/styles/animations.css client/src/main.tsx
git commit -m "feat(component): MnemonicSection 形象 + 口诀容器与入场动画"
```

---

### Task 6：在 PinyinCard 中挂载 MnemonicSection

**Files:**
- Modify: `client/src/components/PinyinCard.tsx`

- [ ] **Step 1：修改 PinyinCard，引入并挂载**

在文件顶部 import 块追加：

```ts
import { MnemonicSection } from './MnemonicSection';
```

在现有 JSX 中，在音调按钮/AudioButton 区块之后、"试着读这些字"标题之前插入：

```tsx
<MnemonicSection
  pinyinId={item.id}
  mnemonic={item.mnemonic}
  rhyme={item.rhyme}
/>
```

修改后的 JSX 关键片段（参考完整文件结构，仅展示插入位置）：

```tsx
{item.hasTones && item.tones ? (
  <div style={{ marginTop: 24 }}>
    <ToneButtons tones={item.tones} basePinyin={item.display} onPlay={() => onLearned?.()} />
  </div>
) : (
  <div style={{ marginTop: 24 }}>
    <AudioButton text={item.audioText} pinyin={item.id} size="lg" />
  </div>
)}

<MnemonicSection
  pinyinId={item.id}
  mnemonic={item.mnemonic}
  rhyme={item.rhyme}
/>

<h3 style={{ marginTop: 32, fontSize: 24, color: '#666' }}>试着读这些字：</h3>
```

- [ ] **Step 2：运行类型检查与已有测试**

Run: `cd client && npx tsc --noEmit && npx vitest run`
Expected: 类型 OK，所有现有 + 新增测试 PASS

- [ ] **Step 3：Commit**

```bash
git add client/src/components/PinyinCard.tsx
git commit -m "feat(card): PinyinCard 挂载 MnemonicSection"
```

---

### Task 7：填充 23 条声母数据

**Files:**
- Modify: `client/src/data/pinyin.ts`

- [ ] **Step 1：为声母数组每条追加 mnemonic 与 rhyme**

按下表逐条修改 `initials` 数组中的对象字面量，在 `examples: [...]` 之后追加：

```ts
mnemonic: { emoji: 'XX', hint: 'XX' },
rhyme: { text: 'XX' },
```

完整数据（来自 spec 草稿）：

| id | emoji | hint | rhyme.text |
|----|-------|------|------------|
| b | 📻 | 像小喇叭 | 听广播 b b b |
| p | 🫖 | 像小水壶 | 泼水泼水 p p p |
| m | 🚪 | 像两扇门 | 两扇门 m m m |
| f | 🦯 | 像拐杖 | 老爷爷拐杖 f f f |
| d | 🐎 | 像小马 | 小马跑 d d d |
| t | ☂️ | 像伞把 | 伞把伞把 t t t |
| n | 🚪 | 像一扇门 | 一个门洞 n n n |
| l | 🥢 | 像小棍 | 一根小棍 l l l |
| g | 🕊️ | 像鸽子 | 鸽子叫 g g g |
| k | 🐦 | 像小鸟蹲 | 小鸟蹲枝 k k k |
| h | 🪑 | 像椅子 | 椅子椅子 h h h |
| j | 🏑 | 像小球拍 | 打球打球 j j j |
| q | 🎈 | 像气球 | 气球气球 q q q |
| x | ✂️ | 像小剪刀 | 剪刀剪刀 x x x |
| zh | 🪑 | 像小椅子 | 织毛衣 zh zh zh |
| ch | 🍵 | 像小茶杯 | 喝茶喝茶 ch ch ch |
| sh | 📚 | 像翻开书 | 读书读书 sh sh sh |
| r | ☀️ | 像太阳出 | 太阳出来 r r r |
| z | 🦌 | 像小鹿角 | 写字写字 z z z |
| c | 🪥 | 像小刺刷 | 刷牙刷牙 c c c |
| s | 🐍 | 像小蛇 | 一条小蛇 s s s |
| y | 🌳 | 像树杈 | 树杈树杈 y y y |
| w | 🏔️ | 像小山峰 | 一座山峰 w w w |

示例（id='b' 的修改后形态）：

```ts
{ id: 'b', display: 'b', category: 'initial', hasTones: false, audioText: '波',
  examples: [
    { hanzi: '爸', pinyin: 'bà', tone: 4, emoji: '👨' },
    { hanzi: '包', pinyin: 'bāo', tone: 1, emoji: '🎒' },
    { hanzi: '冰', pinyin: 'bīng', tone: 1, emoji: '🧊' },
    { hanzi: '白', pinyin: 'bái', tone: 2, emoji: '🤍' },
  ],
  mnemonic: { emoji: '📻', hint: '像小喇叭' },
  rhyme: { text: '听广播 b b b' },
},
```

- [ ] **Step 2：运行类型检查**

Run: `cd client && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3：运行已有测试**

Run: `cd client && npx vitest run src/data/pinyin.test.ts`
Expected: PASS

- [ ] **Step 4：Commit**

```bash
git add client/src/data/pinyin.ts
git commit -m "data(pinyin): 23 个声母补 emoji 形象与口诀"
```

---

### Task 8：填充 6 条单韵母数据

**Files:**
- Modify: `client/src/data/pinyin.ts`

- [ ] **Step 1：为 simpleFinals 数组每条追加 mnemonic 与 rhyme**

| id | emoji | hint | rhyme.text |
|----|-------|------|------------|
| a | 👶 | 张大嘴巴 | 医生检查 a a a |
| o | 🐔 | 像鸡蛋圆 | 公鸡打鸣 o o o |
| e | 🦢 | 像白鹅游 | 白鹅水中 e e e |
| i | 🕯️ | 像小蜡烛 | 蜡烛点亮 i i i |
| u | 🥣 | 像小碗口 | 一只小碗 u u u |
| ü | 🐟 | 像小鱼吐泡 | 小鱼吐泡 ü ü ü |

每条在 `examples: [...]` 之后追加：

```ts
mnemonic: { emoji: 'XX', hint: 'XX' },
rhyme: { text: 'XX' },
```

- [ ] **Step 2：运行类型检查与测试**

Run: `cd client && npx tsc --noEmit && npx vitest run src/data/pinyin.test.ts`
Expected: PASS

- [ ] **Step 3：Commit**

```bash
git add client/src/data/pinyin.ts
git commit -m "data(pinyin): 6 个单韵母补 emoji 形象与口诀"
```

---

### Task 9：填充 18 条复韵母数据

**Files:**
- Modify: `client/src/data/pinyin.ts`

- [ ] **Step 1：为 compoundFinals 数组每条追加 mnemonic 与 rhyme**

| id | emoji | hint | rhyme.text |
|----|-------|------|------------|
| ai | ❤️ | 想到爱 | 爸爸爱我 ai ai ai |
| ei | ✋ | 想到诶 | 你过来呀 ei ei ei |
| ui | 💧 | 想到水 | 喝水喝水 ui ui ui |
| ao | 🐱 | 想到猫叫 | 小猫喵叫 ao ao ao |
| ou | 🐶 | 想到狗叫 | 小狗汪汪 ou ou ou |
| iu | 🏊 | 想到游泳 | 游泳游泳 iu iu iu |
| ie | 👟 | 想到鞋 | 一双小鞋 ie ie ie |
| üe | 🌙 | 想到月亮 | 看见月亮 üe üe üe |
| er | 👂 | 像小耳朵 | 一只耳朵 er er er |
| an | ⛰️ | 想到山 | 高高的山 an an an |
| en | 🚪 | 想到门 | 推开大门 en en en |
| in | 💖 | 想到心 | 一颗红心 in in in |
| un | 🌸 | 想到春 | 春天来到 un un un |
| ün | 👗 | 想到裙 | 一条小裙 ün ün ün |
| ang | 🐑 | 想到羊 | 一只小羊 ang ang ang |
| eng | 💡 | 想到灯 | 一盏小灯 eng eng eng |
| ing | ⭐ | 想到星 | 天上星星 ing ing ing |
| ong | 🐉 | 想到龙 | 一条飞龙 ong ong ong |

每条在 `examples: [...]` 之后追加：

```ts
mnemonic: { emoji: 'XX', hint: 'XX' },
rhyme: { text: 'XX' },
```

- [ ] **Step 2：运行类型检查与测试**

Run: `cd client && npx tsc --noEmit && npx vitest run src/data/pinyin.test.ts`
Expected: PASS

- [ ] **Step 3：Commit**

```bash
git add client/src/data/pinyin.ts
git commit -m "data(pinyin): 18 个复韵母补 emoji 形象与口诀"
```

---

### Task 10：填充 16 条整体认读数据

**Files:**
- Modify: `client/src/data/pinyin.ts`

- [ ] **Step 1：为 wholeSyllables 数组每条追加 mnemonic 与 rhyme**

| id | emoji | hint | rhyme.text |
|----|-------|------|------------|
| zhi | 📄 | 想到纸 | 一张白纸 zhi zhi zhi |
| chi | 🍚 | 想到吃 | 我要吃饭 chi chi chi |
| shi | 🦁 | 想到狮 | 一头狮子 shi shi shi |
| ri | ☀️ | 想到日 | 太阳红日 ri ri ri |
| zi | 🔤 | 想到字 | 我会写字 zi zi zi |
| ci | 🌵 | 想到刺 | 仙人有刺 ci ci ci |
| si | 4️⃣ | 想到四 | 一二三四 si si si |
| yi | 1️⃣ | 想到一 | 一二三 yi yi yi |
| wu | 5️⃣ | 想到五 | 五个手指 wu wu wu |
| yu | 🐟 | 想到鱼 | 池里小鱼 yu yu yu |
| ye | 🍃 | 想到叶 | 一片树叶 ye ye ye |
| yue | 🌙 | 想到月 | 弯弯月亮 yue yue yue |
| yuan | ⭕ | 想到圆 | 圆圆月亮 yuan yuan yuan |
| yin | 🥈 | 想到银 | 银光闪闪 yin yin yin |
| yun | ☁️ | 想到云 | 蓝天白云 yun yun yun |
| ying | 🦅 | 想到鹰 | 老鹰展翅 ying ying ying |

每条在 `examples: [...]` 之后追加：

```ts
mnemonic: { emoji: 'XX', hint: 'XX' },
rhyme: { text: 'XX' },
```

- [ ] **Step 2：运行类型检查与测试**

Run: `cd client && npx tsc --noEmit && npx vitest run src/data/pinyin.test.ts`
Expected: PASS

- [ ] **Step 3：Commit**

```bash
git add client/src/data/pinyin.ts
git commit -m "data(pinyin): 16 个整体认读补 emoji 形象与口诀"
```

---

### Task 11：完整回归测试 + README 验收清单

**Files:**
- Modify: `README.md`

- [ ] **Step 1：跑全量测试**

Run: `cd client && npx vitest run`
Expected: 所有 test 通过（旧测试 + 新增的 tokenize / RhymeKaraoke / MnemonicSection）

- [ ] **Step 2：跑前端构建**

Run: `cd client && npm run build`
Expected: 成功，无 type 报错

- [ ] **Step 3：在 README 验收清单追加 4 条**

在 `## 手工验收清单（v1）` 末尾追加：

```markdown
- [ ] 拼音卡片：每个条目（声母/韵母/整体认读）都显示 emoji 形象 + 形似提示文字 + 口诀
- [ ] 点击"听口诀"，听到 TTS 朗读，且口诀文字按节拍依次高亮
- [ ] 切换条目时，emoji + 口诀区块有弹入动画；点击 emoji 摇头并朗读 hint
- [ ] 启用系统"减少动画"（macOS 辅助功能 / 浏览器 prefers-reduced-motion）时，动画关闭但卡拉 OK 高亮变色仍工作
```

- [ ] **Step 4：手工烟雾测试**

Run: `cd .. && npm run dev`
打开 `http://localhost:5173`，登录后进入"拼音卡片"，依次点开 4 个分类的几个条目，验证：
- emoji 与 hint 显示正确
- "听口诀"按钮能播放并能看到高亮跟随
- 切换条目时入场动画存在

- [ ] **Step 5：Commit**

```bash
git add README.md
git commit -m "docs(readme): 趣味拼音卡片手工验收清单"
```

---

## Self-Review 结果

**Spec 覆盖：**
- ✅ 数据模型扩展 → Task 1
- ✅ tokenize 切分规则 → Task 2
- ✅ useKaraoke hook → Task 3
- ✅ RhymeKaraoke → Task 4
- ✅ MnemonicSection + 入场/晃头/reduced-motion 动画 → Task 5
- ✅ PinyinCard 挂载 → Task 6
- ✅ 63 条数据填充 → Task 7-10
- ✅ 验收清单 → Task 11

**Placeholder 扫描：** 无 TBD/TODO；表格中明确列出每条 emoji/hint/rhyme；测试代码完整。

**类型一致性：** `MnemonicAsset` / `RhymeData` 字段名（`emoji` `hint` `text` `tokens` `audioText` `svgKey`）在 Task 1、Task 4、Task 5、Task 7-10 中一致使用；`MnemonicSection` props（`pinyinId` / `mnemonic?` / `rhyme?`）在 Task 5、Task 6 一致。

**未覆盖项：** Task 5 中提到的"主拼音字符弹跳（useBumpKey）"在 spec 标记为可选优化，本 plan 暂不展开（避免引入额外 hook），可后续单独迭代。这与 spec 第 §3 节"可选优化项，不阻塞主线"说明一致。
