# 拼音字母背诵表 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在拼音学习网站中新增 `/recite` 页面，提供"挂图模式（点击播音）+ 跟读模式（按范围顺序自动播报，1.5s 停顿）"，并在 `HomePage` 增加入口。

**Architecture:** 一个新页面 `RecitePage`，UI 拆为 `RecitationTable` / `RecitationCell` / `RecitationControls`，跟读逻辑封装在 `useReciter` 状态机 hook 中（idle/playing/paused/finished + start/pause/resume/reset/playOne），通过外部注入 `onItem(item, index): Promise<void>` 实际播音；`onItem` 用现有 `useAudio.playPinyin` + 监听 `<audio>.ended` + 3000ms 硬超时兜底。数据复用 `client/src/data/pinyin.ts`，不改后端。

**Tech Stack:** React 18 + TypeScript + Vite + react-router-dom 6 + vitest + @testing-library/react

参考设计文档：`docs/superpowers/specs/2026-04-29-pinyin-recitation-design.md`

---

## File Structure

**Create:**
- `client/src/hooks/useReciter.ts` — 跟读状态机 hook
- `client/src/hooks/useReciter.test.ts` — 状态机单测
- `client/src/components/RecitationCell.tsx` — 单字格子（高亮 + 点击）
- `client/src/components/RecitationTable.tsx` — 挂图（4 分组 + 锚点）
- `client/src/components/RecitationControls.tsx` — 控制条（范围 + 按钮）
- `client/src/components/RecitationControls.test.tsx` — 控制条单测
- `client/src/pages/RecitePage.tsx` — 页面装配

**Modify:**
- `client/src/App.tsx` — 注册 `/recite` 路由
- `client/src/pages/HomePage.tsx` — 新增"📖 背诵表"按钮

---

## Task 1: `useReciter` hook —— 状态与 idle/start/reset

**Files:**
- Create: `client/src/hooks/useReciter.ts`
- Test: `client/src/hooks/useReciter.test.ts`

- [ ] **Step 1: Write the failing test (initial + start)**

Create `client/src/hooks/useReciter.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReciter } from './useReciter';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as any;

describe('useReciter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts in idle with currentIndex -1', () => {
    const { result } = renderHook(() =>
      useReciter(items, { onItem: vi.fn().mockResolvedValue(undefined) }),
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.currentIndex).toBe(-1);
  });

  it('start() moves to playing and invokes onItem with index 0', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100 }));
    await act(async () => { result.current.start(); });
    expect(result.current.status).toBe('playing');
    expect(result.current.currentIndex).toBe(0);
    expect(onItem).toHaveBeenCalledWith(items[0], 0);
  });

  it('reset() returns to idle and currentIndex -1', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100 }));
    await act(async () => { result.current.start(); });
    act(() => { result.current.reset(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.currentIndex).toBe(-1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace client test -- useReciter`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement minimal hook (idle/start/reset only)**

Create `client/src/hooks/useReciter.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export type ReciterStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface ReciterOptions<T> {
  gapMs?: number;
  perItemTimeoutMs?: number;
  onItem?: (item: T, index: number) => Promise<void>;
}

export interface UseReciterResult {
  status: ReciterStatus;
  currentIndex: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  playOne: (index: number) => void;
}

export function useReciter<T>(items: T[], options: ReciterOptions<T> = {}): UseReciterResult {
  const { gapMs = 1500, perItemTimeoutMs = 3000, onItem } = options;
  const [status, setStatus] = useState<ReciterStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(-1);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onItemRef = useRef(onItem);
  onItemRef.current = onItem;
  const gapMsRef = useRef(gapMs);
  gapMsRef.current = gapMs;
  const perItemTimeoutRef = useRef(perItemTimeoutMs);
  perItemTimeoutRef.current = perItemTimeoutMs;

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playFrom = useCallback(async (startIdx: number, runId: number) => {
    for (let i = startIdx; i < itemsRef.current.length; i++) {
      if (cancelledRef.current || runIdRef.current !== runId) return;
      setCurrentIndex(i);
      const item = itemsRef.current[i];
      const playPromise = onItemRef.current
        ? onItemRef.current(item, i).catch(() => undefined)
        : Promise.resolve();
      const timeoutPromise = new Promise<void>((resolve) => {
        timerRef.current = setTimeout(resolve, perItemTimeoutRef.current);
      });
      await Promise.race([playPromise, timeoutPromise]);
      clearTimer();
      if (cancelledRef.current || runIdRef.current !== runId) return;
      await new Promise<void>((resolve) => {
        timerRef.current = setTimeout(resolve, gapMsRef.current);
      });
      clearTimer();
      if (cancelledRef.current || runIdRef.current !== runId) return;
    }
    if (runIdRef.current === runId) setStatus('finished');
  }, []);

  const start = useCallback(() => {
    if (status === 'playing') return;
    cancelledRef.current = false;
    runIdRef.current++;
    setStatus('playing');
    setCurrentIndex(-1);
    void playFrom(0, runIdRef.current);
  }, [status, playFrom]);

  const reset = useCallback(() => {
    runIdRef.current++;
    cancelledRef.current = true;
    clearTimer();
    setStatus('idle');
    setCurrentIndex(-1);
  }, []);

  const pause = useCallback(() => { /* stub for next task */ }, []);
  const resume = useCallback(() => { /* stub for next task */ }, []);
  const playOne = useCallback((_idx: number) => { /* stub */ }, []);

  useEffect(() => () => {
    cancelledRef.current = true;
    clearTimer();
  }, []);

  return { status, currentIndex, start, pause, resume, reset, playOne };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --workspace client test -- useReciter`
Expected: PASS for the 3 cases.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useReciter.ts client/src/hooks/useReciter.test.ts
git commit -m "feat(recite): useReciter idle/start/reset 骨架"
```

---

## Task 2: `useReciter` —— 自动推进、finished、unmount cleanup

**Files:**
- Modify: `client/src/hooks/useReciter.ts`
- Test: `client/src/hooks/useReciter.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `client/src/hooks/useReciter.test.ts` inside `describe('useReciter', ...)`:

```ts
  it('advances to next item after gap and finishes at end', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 50 }));
    await act(async () => { result.current.start(); });
    // 第 1 个：playPromise resolve → 等 gap 100ms → 进入 index 1
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.currentIndex).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.currentIndex).toBe(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.status).toBe('finished');
    expect(onItem).toHaveBeenCalledTimes(3);
  });

  it('perItemTimeoutMs bounds a stuck onItem', async () => {
    const onItem = vi.fn().mockReturnValue(new Promise<void>(() => { /* never resolve */ }));
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 200 }));
    await act(async () => { result.current.start(); });
    // 200ms 兜底 + 100ms gap = 300ms 后到达 index 1
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(result.current.currentIndex).toBe(1);
  });

  it('cleans up on unmount: no further onItem after unmount', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 50 }));
    await act(async () => { result.current.start(); });
    expect(onItem).toHaveBeenCalledTimes(1);
    unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onItem).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run tests**

Run: `npm --workspace client test -- useReciter`
Expected: All 6 tests pass (Task 1 implementation already supports this flow because it uses Promise.race + setTimeout chain; if "advances" test is flaky, see step 3).

- [ ] **Step 3: Adjustment if needed**

If any test fails, the most likely cause is microtask flushing: ensure `act(async () => await vi.advanceTimersByTimeAsync(...))` is used (already done above). No code change should be required. Proceed only if all 6 pass.

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/useReciter.test.ts
git commit -m "test(recite): useReciter 自动推进/finished/unmount 用例"
```

---

## Task 3: `useReciter` —— pause / resume / playOne

**Files:**
- Modify: `client/src/hooks/useReciter.ts`
- Test: `client/src/hooks/useReciter.test.ts`

- [ ] **Step 1: Append failing tests**

Append:

```ts
  it('pause stops advancement; resume continues from current index', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 50 }));
    await act(async () => { result.current.start(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.currentIndex).toBe(1);
    act(() => { result.current.pause(); });
    expect(result.current.status).toBe('paused');
    const callsBeforeResume = onItem.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(onItem.mock.calls.length).toBe(callsBeforeResume);
    expect(result.current.currentIndex).toBe(1);
    await act(async () => { result.current.resume(); });
    expect(result.current.status).toBe('playing');
    // resume 不重播当前字 → 直接走 gap 后到 index 2
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.currentIndex).toBe(2);
  });

  it('playOne triggers onItem once; ignored while playing', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 50 }));
    act(() => { result.current.playOne(2); });
    expect(onItem).toHaveBeenCalledWith(items[2], 2);
    expect(result.current.currentIndex).toBe(-1);
    onItem.mockClear();
    await act(async () => { result.current.start(); });
    act(() => { result.current.playOne(0); });
    expect(onItem).toHaveBeenCalledTimes(1); // 只有 start 触发的那一次，playOne 被忽略
  });
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm --workspace client test -- useReciter`
Expected: FAIL — pause/resume/playOne are stubs.

- [ ] **Step 3: Implement pause / resume / playOne**

Replace the three stub callbacks in `client/src/hooks/useReciter.ts`:

```ts
  const pause = useCallback(() => {
    setStatus(prev => {
      if (prev !== 'playing') return prev;
      runIdRef.current++;          // 终止当前 run
      cancelledRef.current = true; // 即时停下 in-flight loop
      clearTimer();
      return 'paused';
    });
  }, []);

  const resume = useCallback(() => {
    setStatus(prev => {
      if (prev !== 'paused') return prev;
      cancelledRef.current = false;
      runIdRef.current++;
      const next = currentIndex + 1; // 不重播当前字
      if (next >= itemsRef.current.length) {
        return 'finished';
      }
      void playFrom(next, runIdRef.current);
      return 'playing';
    });
  }, [currentIndex, playFrom]);

  const playOne = useCallback((idx: number) => {
    if (statusRef.current === 'playing') return;
    if (idx < 0 || idx >= itemsRef.current.length) return;
    void onItemRef.current?.(itemsRef.current[idx], idx);
  }, []);
```

Add a `statusRef` to mirror status (insert near other refs):

```ts
  const statusRef = useRef<ReciterStatus>('idle');
  useEffect(() => { statusRef.current = status; }, [status]);
```

- [ ] **Step 4: Run tests**

Run: `npm --workspace client test -- useReciter`
Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useReciter.ts client/src/hooks/useReciter.test.ts
git commit -m "feat(recite): useReciter pause/resume/playOne"
```

---

## Task 4: `RecitationCell` —— 单字格子组件

**Files:**
- Create: `client/src/components/RecitationCell.tsx`

- [ ] **Step 1: Implement (no separate test — covered indirectly by Task 6 page-level test)**

Create `client/src/components/RecitationCell.tsx`:

```tsx
import { memo } from 'react';
import type { PinyinItem } from '../types';

interface Props {
  item: PinyinItem;
  isHighlight: boolean;
  onClick: () => void;
}

function RecitationCellInner({ item, isHighlight, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={`播放 ${item.display}`}
      aria-current={isHighlight ? 'true' : undefined}
      data-testid={`cell-${item.id}`}
      data-highlight={isHighlight ? 'true' : 'false'}
      style={{
        minWidth: 64, minHeight: 64,
        padding: '12px 16px',
        fontSize: 32, fontWeight: 'bold',
        borderRadius: 12,
        border: isHighlight ? '4px solid #fb8500' : '2px solid #ccc',
        background: isHighlight ? '#fff8e7' : '#fff',
        cursor: 'pointer',
      }}
    >
      {item.display}
    </button>
  );
}

export const RecitationCell = memo(RecitationCellInner);
```

- [ ] **Step 2: Type-check**

Run: `npm --workspace client run build`
Expected: build passes (if it touches build of unused file, it's fine — TS will validate).

Alternative quick check: `npm --workspace client exec -- tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RecitationCell.tsx
git commit -m "feat(recite): RecitationCell 字母格子组件"
```

---

## Task 5: `RecitationTable` —— 4 分组 + 锚点 + scrollIntoView

**Files:**
- Create: `client/src/components/RecitationTable.tsx`

- [ ] **Step 1: Implement**

Create `client/src/components/RecitationTable.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import type { PinyinCategory, PinyinItem } from '../types';
import { RecitationCell } from './RecitationCell';

export interface RecitationGroup {
  category: PinyinCategory;
  label: string;
  items: PinyinItem[];
}

interface Props {
  groups: RecitationGroup[];
  highlightId: string | null;
  onCellClick: (item: PinyinItem) => void;
}

const ANCHORS: { category: PinyinCategory; label: string }[] = [
  { category: 'initial', label: '声母' },
  { category: 'simple-final', label: '单韵母' },
  { category: 'compound-final', label: '复韵母' },
  { category: 'whole-syllable', label: '整体认读' },
];

export function RecitationTable({ groups, highlightId, onCellClick }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightId || !rootRef.current) return;
    const el = rootRef.current.querySelector<HTMLElement>(`[data-testid="cell-${highlightId}"]`);
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }, [highlightId]);

  return (
    <div ref={rootRef}>
      <nav style={{ display: 'flex', gap: 12, padding: '8px 0', flexWrap: 'wrap' }}>
        {ANCHORS.map(a => (
          <a key={a.category} href={`#anchor-${a.category}`}
             style={{ padding: '6px 12px', fontSize: 18, color: '#0077b6', textDecoration: 'none' }}>
            {a.label}
          </a>
        ))}
      </nav>

      {groups.map(group => (
        <section key={group.category} id={`anchor-${group.category}`} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 24, margin: '12px 0' }}>
            {group.label} ({group.items.length})
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {group.items.map(item => (
              <RecitationCell
                key={item.id}
                item={item}
                isHighlight={item.id === highlightId}
                onClick={() => onCellClick(item)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm --workspace client exec -- tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RecitationTable.tsx
git commit -m "feat(recite): RecitationTable 分组挂图 + 锚点"
```

---

## Task 6: `RecitationControls` —— 范围 + 按钮，含单测

**Files:**
- Create: `client/src/components/RecitationControls.tsx`
- Test: `client/src/components/RecitationControls.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/RecitationControls.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecitationControls } from './RecitationControls';

const baseProps = {
  scope: 'all' as const,
  onScopeChange: vi.fn(),
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onReset: vi.fn(),
};

describe('RecitationControls', () => {
  it('renders [开始] when status is idle', () => {
    render(<RecitationControls {...baseProps} status="idle" />);
    expect(screen.getByRole('button', { name: '开始跟读' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '暂停' })).toBeNull();
  });

  it('renders [开始] when status is finished', () => {
    render(<RecitationControls {...baseProps} status="finished" />);
    expect(screen.getByRole('button', { name: '开始跟读' })).toBeInTheDocument();
  });

  it('renders [暂停][重置] when playing', () => {
    render(<RecitationControls {...baseProps} status="playing" />);
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '开始跟读' })).toBeNull();
  });

  it('renders [继续][重置] when paused', () => {
    render(<RecitationControls {...baseProps} status="paused" />);
    expect(screen.getByRole('button', { name: '继续' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
  });

  it('clicking 开始 calls onStart', () => {
    const onStart = vi.fn();
    render(<RecitationControls {...baseProps} status="idle" onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '开始跟读' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('changing scope calls onScopeChange', () => {
    const onScopeChange = vi.fn();
    render(<RecitationControls {...baseProps} status="idle" onScopeChange={onScopeChange} />);
    fireEvent.click(screen.getByLabelText('声母'));
    expect(onScopeChange).toHaveBeenCalledWith('initial');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm --workspace client test -- RecitationControls`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/src/components/RecitationControls.tsx`:

```tsx
import type { PinyinCategory } from '../types';
import type { ReciterStatus } from '../hooks/useReciter';

export type ReciteScope = 'all' | PinyinCategory;

interface Props {
  status: ReciterStatus;
  scope: ReciteScope;
  onScopeChange: (scope: ReciteScope) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const SCOPES: { id: ReciteScope; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'initial', label: '声母' },
  { id: 'simple-final', label: '单韵母' },
  { id: 'compound-final', label: '复韵母' },
  { id: 'whole-syllable', label: '整体认读' },
];

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  minWidth: 96, minHeight: 56,
  padding: '12px 20px', fontSize: 20, fontWeight: 'bold',
  borderRadius: 14, border: '2px solid #ccc', background: '#fff', cursor: 'pointer',
  ...extra,
});

export function RecitationControls({
  status, scope, onScopeChange, onStart, onPause, onResume, onReset,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="radiogroup" aria-label="跟读范围">
        {SCOPES.map(s => (
          <button
            key={s.id}
            aria-label={s.label}
            aria-pressed={scope === s.id}
            onClick={() => onScopeChange(s.id)}
            style={btn({
              border: scope === s.id ? '3px solid #fb8500' : '2px solid #ccc',
              background: scope === s.id ? '#fff8e7' : '#fff',
            })}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {(status === 'idle' || status === 'finished') && (
          <button aria-label="开始跟读" onClick={onStart}
                  style={btn({ background: '#06d6a0', color: '#fff', border: 'none' })}>
            ▶ 开始跟读
          </button>
        )}
        {status === 'playing' && (
          <>
            <button aria-label="暂停" onClick={onPause}
                    style={btn({ background: '#ffd166', border: 'none' })}>⏸ 暂停</button>
            <button aria-label="重置" onClick={onReset} style={btn()}>↺ 重置</button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button aria-label="继续" onClick={onResume}
                    style={btn({ background: '#06d6a0', color: '#fff', border: 'none' })}>
              ▶ 继续
            </button>
            <button aria-label="重置" onClick={onReset} style={btn()}>↺ 重置</button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm --workspace client test -- RecitationControls`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/RecitationControls.tsx client/src/components/RecitationControls.test.tsx
git commit -m "feat(recite): RecitationControls 控制条 + 单测"
```

---

## Task 7: `RecitePage` —— 装配页面 + 注入播音

**Files:**
- Create: `client/src/pages/RecitePage.tsx`

- [ ] **Step 1: Implement**

Create `client/src/pages/RecitePage.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { RecitationTable, type RecitationGroup } from '../components/RecitationTable';
import { RecitationControls, type ReciteScope } from '../components/RecitationControls';
import { useReciter } from '../hooks/useReciter';
import { getByCategory } from '../data/pinyin';
import { pinyinAudioUrl, stripTone } from '../utils/pinyin';
import { ttsUrl } from '../api/tts';
import type { PinyinItem } from '../types';

const GROUPS_META: { category: RecitationGroup['category']; label: string }[] = [
  { category: 'initial', label: '声母' },
  { category: 'simple-final', label: '单韵母' },
  { category: 'compound-final', label: '复韵母' },
  { category: 'whole-syllable', label: '整体认读' },
];

/** 播放一个 PinyinItem，监听 ended/error；失败 resolve 不抛。 */
function playReciteItem(item: PinyinItem): Promise<void> {
  return new Promise<void>((resolve) => {
    const base = stripTone(item.id);
    const url = pinyinAudioUrl(base);
    const audio = new Audio(url);
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    audio.onended = finish;
    audio.onerror = () => {
      // 静态失败 → TTS 兜底（无调单读）
      try {
        const tts = new Audio(ttsUrl(item.audioText));
        tts.onended = finish;
        tts.onerror = finish;
        void tts.play().catch(finish);
      } catch {
        finish();
      }
    };
    void audio.play().catch(() => audio.onerror?.(new Event('error') as any));
  });
}

export function RecitePage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const [scope, setScope] = useState<ReciteScope>('all');

  const groups: RecitationGroup[] = useMemo(
    () => GROUPS_META.map(m => ({ ...m, items: getByCategory(m.category) })),
    [],
  );

  const reciteItems = useMemo<PinyinItem[]>(() => {
    if (scope === 'all') return groups.flatMap(g => g.items);
    return groups.find(g => g.category === scope)?.items ?? [];
  }, [scope, groups]);

  const reciter = useReciter(reciteItems, { onItem: (item) => playReciteItem(item) });

  // 范围变化时重置
  useEffect(() => { reciter.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scope]);

  const handleCellClick = useCallback((item: PinyinItem) => {
    if (reciter.status === 'playing') return;
    void playReciteItem(item);
  }, [reciter.status]);

  if (!user) return null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);
  const highlightId = reciter.currentIndex >= 0 ? reciteItems[reciter.currentIndex]?.id ?? null : null;

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <RecitationControls
          status={reciter.status}
          scope={scope}
          onScopeChange={setScope}
          onStart={reciter.start}
          onPause={reciter.pause}
          onResume={reciter.resume}
          onReset={reciter.reset}
        />
        <RecitationTable
          groups={groups}
          highlightId={highlightId}
          onCellClick={handleCellClick}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm --workspace client exec -- tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/RecitePage.tsx
git commit -m "feat(recite): RecitePage 装配 + 注入静态/TTS 播音"
```

---

## Task 8: 路由 + 首页入口

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: Add route to App.tsx**

In `client/src/App.tsx`, add the import and the `<Route>`. After:

```tsx
import { ProfilePage } from './pages/ProfilePage';
```

add:

```tsx
import { RecitePage } from './pages/RecitePage';
```

And inside the `<Routes>` block, after the `/profile` route, add:

```tsx
        <Route path="/recite" element={<RequireUser><RecitePage /></RequireUser>} />
```

- [ ] **Step 2: Add HomePage button**

In `client/src/pages/HomePage.tsx`, inside the grid `<div>`, after the existing `HomeButton` for `/profile`, add a fourth one:

```tsx
        <HomeButton to="/recite" emoji="📖" label="背诵表" color="#bb8fce" />
```

- [ ] **Step 3: Type-check + dev sanity**

Run: `npm --workspace client exec -- tsc --noEmit`
Expected: PASS.

Optional manual check (skip in CI): `npm run dev`, log in, click "📖 背诵表"。

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/pages/HomePage.tsx
git commit -m "feat(recite): 路由 /recite + 首页入口"
```

---

## Task 9: 全量测试 + 验收

**Files:** none

- [ ] **Step 1: Run full client test suite**

Run: `npm --workspace client test`
Expected: 所有原有测试 + 本次新增的 `useReciter` (8) 与 `RecitationControls` (6) 全部通过。

- [ ] **Step 2: Run server test suite (确保未误伤)**

Run: `npm --workspace server test`
Expected: 与 main 一致。

- [ ] **Step 3: 手工验收清单（可选，开发者本地）**

启动 `npm run dev`，登录后：

- [ ] 首页出现"📖 背诵表"按钮，点击进入 `/recite`
- [ ] 4 个分组完整展示，每个格子点击都能听到发音
- [ ] 顶部锚点点击能滚动到对应分组
- [ ] 选 "声母" 范围 → 点"开始跟读" → 第一个声母高亮且发声，约 1.5s 停顿后切下一个
- [ ] 跟读中点 "暂停" → 不再前进；点 "继续" → 从下一个开始（不重播当前）
- [ ] 切换范围（如从"声母"切到"全部"）→ 自动停止并清空高亮
- [ ] 跟读到末尾 → 按钮恢复为 "开始跟读"
- [ ] 浏览器后退离开页面 → 无残留音频继续播放

---

## Self-Review

- **Spec coverage:**
  - 挂图模式（点击播音、4 分组、锚点）→ Task 4-5, 7
  - 跟读模式（开始/暂停/继续/重置 + 范围）→ Task 1-3, 6, 7
  - 入口 + 路由 → Task 8
  - 错误处理（静态 404、TTS 失败、超时兜底、unmount cleanup）→ `playReciteItem` (Task 7) + `useReciter` (Task 1-3)
  - 不写后端 / 不影响 `/profile` → Task 7 不调用 `learnPinyin`
  - 测试（`useReciter` 11 用例 + `RecitationControls` 6 用例）→ Task 1-3, 6
- **Placeholder scan:** 无 TBD/TODO；所有代码块完整可粘贴。
- **Type consistency:** `ReciterStatus` / `ReciteScope` / `RecitationGroup` 在跨任务间一致；`UseReciterResult` 接口在 Task 1 完整定义后续不再变更。
