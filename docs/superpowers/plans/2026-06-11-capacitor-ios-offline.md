# 拼音学习 iOS 版（Capacitor 纯离线单 App @ ios-version/）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在仓库内新建 `ios-version/` 目录，把现有 `client/` 的 React 应用复制为一个**扁平化的独立单包应用**，用 Capacitor 包装成**纯离线 iOS App**：无后端、所有用户与进度数据本地存储、218 个拼音音节 mp3 随包打包、汉字例字与口诀朗读改用 iOS 原生 TTS。仓库根的 `client/` + `server/` 保持为现有 web 版，不受影响。

**Architecture:**
- `ios-version/` 是一个**独立 npm 项目**（不是根 workspace 成员，有自己的 `package.json` / `node_modules` / `package-lock.json`）。源码从 `client/` 复制而来并就地改造。
- 数据层：`ios-version/src/api/users.ts`、`api/progress.ts` **保持导出函数签名不变**，底层从 HTTP `fetch` 换成 `@capacitor/preferences` 本地存储；把 `server` 端 `UserService` / `ProgressService` 的逻辑（昵称 upsert、`learnedCount` 累加、`MAX(score)` 取最佳、`isNewBest`）移植为纯 TS。调用方（`NicknameLogin`、`useProgress`）零改动。
- 音频层：静态音节音频从根 `server/audio/pinyin/` 复制进 `ios-version/public/audio/pinyin/`，随 Vite 构建打入 App bundle；`pinyinAudioUrl` 从 `/api/audio/pinyin/x.mp3` 改为相对路径 `audio/pinyin/x.mp3`。
- TTS：汉字例字 / 口诀 / 形象提示朗读从「Azure TTS URL + `new Audio()`」改为「`@capacitor-community/text-to-speech` 原生朗读」。**权衡**：原生 TTS 无音频时间轴，`MnemonicSection` 中口诀「汉字段」的逐字卡拉OK高亮降级为按 token 估算时长驱动（拼音段仍走真实 `<audio>` 时间轴，高亮不受影响）。
- iOS 静音键：原生侧把 `AVAudioSession` category 设为 `.playback`，让学习音频不被物理静音键静音。
- 路由：`BrowserRouter` → `HashRouter`，适配 Capacitor 的 `file://` / `capacitor://` 加载。

**Tech Stack:** React 18 + Vite 5 + TypeScript（strict, ESM）+ react-router-dom 6 + Capacitor + `@capacitor/ios` + `@capacitor/preferences` + `@capacitor-community/text-to-speech` + Xcode / CocoaPods + Vitest + @testing-library/react。

**分支：** `ios-version`（已从 main 切出）。

参考背景：`AGENTS.md`（架构约定、手工验收重点）、`docs/superpowers/specs/2026-04-21-ssml-phoneme-tts-design.md`（原 TTS 设计）。

---

## 命令约定（重要）

- **除 Phase 0 的复制命令明确从仓库根执行外，其余所有命令默认 cwd = `ios-version/`。**
- 即在 `ios-version/` 内直接用 `npm install` / `npm test` / `npm run build` / `npx cap ...`，不使用根 workspace 命令。
- vitest 过滤：`npm test -- <pattern>`（cwd 在 `ios-version/`）。

---

## 关键设计决策与权衡

> 实现前务必先读这一节。

1. **`ios-version/` 是独立项目，不进根 workspaces。** 根 `package.json` 的 `workspaces` 保持 `["client","server"]` 不变，避免把离线 App 和 web 版耦合。`ios-version/` 自带依赖与锁文件。

2. **存储选 `@capacitor/preferences`（key-value）而非 SQLite。** 数据量极小（单设备）。Preferences 底层是 iOS `UserDefaults`，持久、无迁移脚本。不引入 `@capacitor-community/sqlite`（YAGNI）。

3. **API 层「换底不换面」。** `api/users.ts`、`api/progress.ts` 导出签名与返回类型不变，仅换实现。调用方不改，回归面最小。

4. **昵称账号语义保留。** 「相同昵称 = 同一账号」：本地维护 `users` 列表 + 自增 `id`，按昵称命中则复用 id，否则新建。`useUser` 仍只在 `localStorage` 存「当前登录用户」，不动。

5. **音频主路径完全离线，TTS 仅兜底。** 218 个音节 mp3 覆盖所有拼音读音（主路径）；TTS 只用于汉字例字 / 口诀 / 形象提示（无静态音频的文本），改用 iOS 原生 `AVSpeechSynthesizer`。

6. **卡拉OK高亮降级（必须知道的代价）。** 原生 TTS 只有开始/结束回调、无时间轴。口诀「汉字段」高亮改为「speak 开始时按 token 数 × `FALLBACK_PER_TOKEN_MS` 估算推进，speak 结束停下」。口诀「拼音段」仍播静态 mp3，保留真实时间轴高亮。不预生成口诀音频（避免构建复杂度与体积膨胀）。

7. **去掉静态音频 `HEAD` 预检。** 打包资源在 `capacitor://` 下 `HEAD` 不可靠且无意义（资源必随包存在）。改为「乐观播放 + `onerror` 兜底」。

8. **`HashRouter`。** Capacitor 以 `file://`/`capacitor://localhost` 加载，`BrowserRouter` 的 pushState 在深层路径冷启动/刷新易 404。改 `HashRouter` 最稳，路由代码无需改。

9. **先建可工作基线。** Phase 0 完成后 `ios-version/` 是「能跑的 web 版副本」（baseline 测试/构建全绿），之后每个 Phase 都保持可工作中间产物。

---

## File Structure

> 路径均相对仓库根。`ios-version/` 内结构是扁平化单包（对应原 `client/` 去掉 workspace 层）。

**Create:**
- `ios-version/package.json` — 独立单包配置（react + capacitor 依赖 + scripts）。
- `ios-version/tsconfig.json` — 复制自 `client/tsconfig.json`。
- `ios-version/vite.config.ts` — 基于 `client/vite.config.ts`，改 `base:'./'`、去 `/api` 代理。
- `ios-version/index.html` — 复制自 `client/index.html`。
- `ios-version/src/**` — 复制自 `client/src/**`，就地改造。
- `ios-version/capacitor.config.ts` — Capacitor 配置（appId / appName / webDir:'dist'）。
- `ios-version/src/storage/local.ts` + `.test.ts` — Preferences 薄封装。
- `ios-version/src/storage/userStore.ts` + `.test.ts` — 本地用户存储（移植 UserService）。
- `ios-version/src/storage/progressStore.ts` + `.test.ts` — 本地进度存储（移植 ProgressService）。
- `ios-version/src/audio/speak.ts` + `.test.ts` — 原生 TTS 封装。
- `ios-version/src/test-mocks/capacitor.ts` — Capacitor 插件内存 mock（store/speak 测试复用）。
- `ios-version/public/audio/pinyin/*.mp3` — 从 `server/audio/pinyin/` 复制的 218 个音频。
- `ios-version/ios/**` — `npx cap add ios` 生成的 Xcode 工程。
- `ios-version/README.md` — iOS 版构建/运行说明。

**Modify（均在 `ios-version/` 内）:**
- `src/main.tsx` — `BrowserRouter` → `HashRouter`。
- `src/api/users.ts` — 实现改走 `userStore`（签名不变）。
- `src/api/progress.ts` — 实现改走 `progressStore`（签名不变）。
- `src/utils/pinyin.ts` + `src/utils/pinyin.test.ts` — `pinyinAudioUrl` 改相对路径。
- `src/hooks/useAudio.ts` — 去 `HEAD` 预检；TTS / fallback 改 `speak`。
- `src/components/MnemonicSection.tsx` — 汉字段 TTS 改 `speak` + 估算高亮；`mnemonic.hint` 改 `speak`。
- `src/pages/RecitePage.tsx` — `playReciteItem` 的 TTS fallback 改 `speak`。
- `.gitignore`（仓库根）— 新增 `!ios-version/public/audio/pinyin/*.mp3` 例外与 iOS 构建产物忽略。

**Delete（Phase E，均在 `ios-version/` 内）:**
- `src/api/tts.ts`、`src/api/tts.test.ts`（确认无引用后）。
- `src/api/client.ts`（若 `apiFetch` 不再被引用）。

---

## Phase 0 — 脚手架：把 client 复制为独立单包

### Task 0: 在 ios-version/ 建立可工作的 app 副本

**Files:**
- Create: `ios-version/package.json`、`ios-version/tsconfig.json`、`ios-version/vite.config.ts`、`ios-version/index.html`、`ios-version/src/**`

- [ ] **Step 1: 复制源码与配置（从仓库根执行）**

```bash
mkdir -p ios-version
cp -R client/src ios-version/src
cp client/index.html ios-version/index.html
cp client/tsconfig.json ios-version/tsconfig.json
cp client/vite.config.ts ios-version/vite.config.ts
```

Expected: `ios-version/src/` 出现完整源码；`ls ios-version` 显示 `src index.html tsconfig.json vite.config.ts`。

- [ ] **Step 2: 创建独立 `ios-version/package.json`**

```json
{
  "name": "pinyin-learning-ios",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "cap:sync": "npm run build && npx cap sync ios",
    "cap:open": "npx cap open ios"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0"
  }
}
```

> Capacitor 依赖在 Phase A Task 1 安装（用 `@latest` 获取匹配版本），此处先不写。

- [ ] **Step 3: 安装依赖并建立基线（cwd = ios-version/）**

```bash
cd ios-version && npm install
```

Expected: 生成 `ios-version/node_modules` 与 `ios-version/package-lock.json`，无报错。

- [ ] **Step 4: 基线测试 —— 复制副本应原样通过**

Run（cwd = ios-version/）: `npm test`
Expected: 全部通过（这是 client 的忠实副本，尚未改造）。

- [ ] **Step 5: 基线构建**

Run（cwd = ios-version/）: `npm run build`
Expected: 构建成功，产出 `ios-version/dist`。

- [ ] **Step 6: 确认 node_modules/dist 被忽略（仓库根 .gitignore 已含 `node_modules/`、`dist/` 通配）**

Run（仓库根）: `git status --short ios-version | head`
Expected: `src/`、`package.json` 等被纳入，`node_modules/`、`dist/` 不出现。

- [ ] **Step 7: Commit**

```bash
git add ios-version
git commit -m "chore(ios): scaffold standalone app copy from client"
```

---

## Phase A — Capacitor 基础设施

### Task 1: 引入 Capacitor 依赖与配置

**Files:**
- Create: `ios-version/capacitor.config.ts`
- Modify: `ios-version/package.json`（由安装命令自动更新）

- [ ] **Step 1: 安装 Capacitor 与插件依赖（cwd = ios-version/）**

```bash
npm install @capacitor/core @capacitor/ios @capacitor/preferences @capacitor-community/text-to-speech
npm install -D @capacitor/cli
```

Expected：`ios-version/package.json` 的 `dependencies` 出现上述 4 个包，`devDependencies` 出现 `@capacitor/cli`。

- [ ] **Step 2: 创建 `ios-version/capacitor.config.ts`**

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: 替换为你自己的 Bundle ID（需与 Apple 开发者账号一致）
  appId: 'com.pinyinlearning.app',
  appName: '拼音乐园',
  webDir: 'dist',
  ios: {
    // 允许在 WKWebView 中以内联方式播放音频
    contentInset: 'always',
  },
};

export default config;
```

- [ ] **Step 3: 验证 Capacitor CLI 可用（cwd = ios-version/）**

Run: `npx cap --version`
Expected: 打印版本号（如 `6.x.x` / `7.x.x`），无报错。

- [ ] **Step 4: Commit**

```bash
git add ios-version/package.json ios-version/package-lock.json ios-version/capacitor.config.ts
git commit -m "build(ios): add Capacitor deps and config"
```

---

### Task 2: Vite 相对 base + 路由改 HashRouter

**Files:**
- Modify: `ios-version/vite.config.ts`、`ios-version/src/main.tsx`

- [ ] **Step 1: 把 `ios-version/vite.config.ts` 改为相对 base、去 /api 代理**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Capacitor 以本地 scheme 加载，必须用相对路径引用 assets
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 2: `src/main.tsx` 改 HashRouter**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
```

- [ ] **Step 3: 构建验证（资源走相对路径，cwd = ios-version/）**

Run: `npm run build`
Expected: 构建成功；`ios-version/dist/index.html` 中 `<script>`/`<link>` 引用形如 `./assets/...`。核对：

```bash
grep -o 'src="[^"]*"' dist/index.html | head
```

Expected: 形如 `src="./assets/index-xxxx.js"`。

- [ ] **Step 4: 跑测试确保未回归（cwd = ios-version/）**

Run: `npm test`
Expected: 全部通过。

- [ ] **Step 5: Commit**

```bash
git add ios-version/vite.config.ts ios-version/src/main.tsx
git commit -m "build(ios): relative base + HashRouter for Capacitor"
```

---

## Phase B — 数据离线化

### Task 3: 本地存储封装 `storage/local.ts`

**Files:**
- Create: `ios-version/src/storage/local.ts`、`ios-version/src/storage/local.test.ts`、`ios-version/src/test-mocks/capacitor.ts`

- [ ] **Step 1: 创建 Capacitor Preferences 内存 mock**

Create `ios-version/src/test-mocks/capacitor.ts`：

```ts
import { vi } from 'vitest';

/** 内存版 @capacitor/preferences，行为对齐官方 API（value 为 string）。 */
export function installPreferencesMock() {
  const store = new Map<string, string>();
  vi.mock('@capacitor/preferences', () => ({
    Preferences: {
      get: async ({ key }: { key: string }) => ({ value: store.get(key) ?? null }),
      set: async ({ key, value }: { key: string; value: string }) => { store.set(key, value); },
      remove: async ({ key }: { key: string }) => { store.delete(key); },
      clear: async () => { store.clear(); },
    },
  }));
  return {
    reset: () => store.clear(),
    raw: store,
  };
}
```

- [ ] **Step 2: 写失败测试**

Create `ios-version/src/storage/local.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';

const mock = installPreferencesMock();

import { getJSON, setJSON, remove } from './local';

describe('storage/local', () => {
  beforeEach(() => { mock.reset(); vi.clearAllMocks(); });

  it('returns fallback when key missing', async () => {
    expect(await getJSON('missing', { a: 1 })).toEqual({ a: 1 });
  });

  it('round-trips an object', async () => {
    await setJSON('k', { hello: 'world', n: 2 });
    expect(await getJSON('k', null)).toEqual({ hello: 'world', n: 2 });
  });

  it('returns fallback on corrupt JSON', async () => {
    mock.raw.set('bad', '{not json');
    expect(await getJSON('bad', 'fallback')).toBe('fallback');
  });

  it('remove deletes the key', async () => {
    await setJSON('k', 1);
    await remove('k');
    expect(await getJSON('k', 'gone')).toBe('gone');
  });
});
```

- [ ] **Step 3: 运行确认失败（cwd = ios-version/）**

Run: `npm test -- local`
Expected: FAIL — `./local` 不存在。

- [ ] **Step 4: 实现 `ios-version/src/storage/local.ts`**

```ts
import { Preferences } from '@capacitor/preferences';

/** 读取并 JSON.parse；缺失或解析失败返回 fallback。 */
export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    if (value == null) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** JSON.stringify 后写入。 */
export async function setJSON(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export async function remove(key: string): Promise<void> {
  await Preferences.remove({ key });
}
```

- [ ] **Step 5: 运行确认通过（cwd = ios-version/）**

Run: `npm test -- local`
Expected: PASS（4 个用例）。

- [ ] **Step 6: Commit**

```bash
git add ios-version/src/storage/local.ts ios-version/src/storage/local.test.ts ios-version/src/test-mocks/capacitor.ts
git commit -m "feat(ios): local key-value storage wrapper over Preferences"
```

---

### Task 4: 用户本地化 `userStore` + 改 `api/users.ts`

**Files:**
- Create: `ios-version/src/storage/userStore.ts`、`ios-version/src/storage/userStore.test.ts`
- Modify: `ios-version/src/api/users.ts`

- [ ] **Step 1: 写失败测试（昵称 upsert 语义）**

Create `ios-version/src/storage/userStore.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';

const mock = installPreferencesMock();

import { upsertByNickname, getById } from './userStore';

describe('userStore', () => {
  beforeEach(() => { mock.reset(); vi.clearAllMocks(); });

  it('creates a new user with id 1 then 2', async () => {
    const a = await upsertByNickname('小明', '🐰');
    const b = await upsertByNickname('小红', '🐱');
    expect(a).toMatchObject({ id: 1, nickname: '小明', avatar: '🐰' });
    expect(b).toMatchObject({ id: 2, nickname: '小红', avatar: '🐱' });
  });

  it('same nickname returns the same account (id stable)', async () => {
    const first = await upsertByNickname('小明', '🐰');
    const again = await upsertByNickname('小明', '🐶');
    expect(again.id).toBe(first.id);
  });

  it('getById returns the stored user or null', async () => {
    const a = await upsertByNickname('小明', '🐰');
    expect(await getById(a.id)).toMatchObject({ id: a.id, nickname: '小明' });
    expect(await getById(999)).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败（cwd = ios-version/）**

Run: `npm test -- userStore`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现 `ios-version/src/storage/userStore.ts`**

```ts
import type { User } from '../types';
import { getJSON, setJSON } from './local';

const USERS_KEY = 'pinyin:users';
const SEQ_KEY = 'pinyin:users:seq';

async function readUsers(): Promise<User[]> {
  return getJSON<User[]>(USERS_KEY, []);
}

export async function upsertByNickname(nickname: string, avatar: string): Promise<User> {
  const users = await readUsers();
  const existing = users.find(u => u.nickname === nickname);
  if (existing) return existing;

  const nextId = (await getJSON<number>(SEQ_KEY, 0)) + 1;
  const user: User = { id: nextId, nickname, avatar };
  users.push(user);
  await setJSON(USERS_KEY, users);
  await setJSON(SEQ_KEY, nextId);
  return user;
}

export async function getById(id: number): Promise<User | null> {
  const users = await readUsers();
  return users.find(u => u.id === id) ?? null;
}
```

- [ ] **Step 4: 运行确认通过（cwd = ios-version/）**

Run: `npm test -- userStore`
Expected: PASS（3 个用例）。

- [ ] **Step 5: 改 `src/api/users.ts` 走本地（签名不变）**

替换 `ios-version/src/api/users.ts` 全文：

```ts
import type { User } from '../types';
import { upsertByNickname, getById } from '../storage/userStore';

export function loginOrCreate(nickname: string, avatar: string): Promise<User> {
  return upsertByNickname(nickname, avatar);
}

export function getUser(id: number): Promise<User> {
  return getById(id).then(u => {
    if (!u) throw new Error('USER_NOT_FOUND');
    return u;
  });
}
```

- [ ] **Step 6: 全量前端测试（cwd = ios-version/）**

Run: `npm test`
Expected: 全部通过（调用方签名不变）。

- [ ] **Step 7: Commit**

```bash
git add ios-version/src/storage/userStore.ts ios-version/src/storage/userStore.test.ts ios-version/src/api/users.ts
git commit -m "feat(ios): local-backed user store"
```

---

### Task 5: 进度本地化 `progressStore` + 改 `api/progress.ts`

**Files:**
- Create: `ios-version/src/storage/progressStore.ts`、`ios-version/src/storage/progressStore.test.ts`
- Modify: `ios-version/src/api/progress.ts`

- [ ] **Step 1: 写失败测试（移植 ProgressService 行为）**

Create `ios-version/src/storage/progressStore.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';

const mock = installPreferencesMock();

import { recordPinyinLearned, recordGameScore, getProgress } from './progressStore';

describe('progressStore', () => {
  beforeEach(() => { mock.reset(); vi.clearAllMocks(); });

  it('accumulates learnedCount per (user,pinyin)', async () => {
    expect((await recordPinyinLearned(1, 'b')).learnedCount).toBe(1);
    expect((await recordPinyinLearned(1, 'b')).learnedCount).toBe(2);
    expect((await recordPinyinLearned(1, 'p')).learnedCount).toBe(1);
  });

  it('isolates progress between users', async () => {
    await recordPinyinLearned(1, 'b');
    await recordPinyinLearned(2, 'b');
    const u1 = await getProgress(1);
    expect(u1.pinyinProgress.find(p => p.pinyin === 'b')?.learnedCount).toBe(1);
  });

  it('keeps best game score and flags new best', async () => {
    const r1 = await recordGameScore(1, 'listen', 50, 2);
    expect(r1.isNewBest).toBe(true);
    const r2 = await recordGameScore(1, 'listen', 30, 1);
    expect(r2.isNewBest).toBe(false);
    const r3 = await recordGameScore(1, 'listen', 80, 3);
    expect(r3.isNewBest).toBe(true);

    const { gameScores } = await getProgress(1);
    const best = gameScores.find(g => g.gameType === 'listen');
    expect(best).toMatchObject({ bestScore: 80, bestStars: 3 });
  });
});
```

- [ ] **Step 2: 运行确认失败（cwd = ios-version/）**

Run: `npm test -- progressStore`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现 `ios-version/src/storage/progressStore.ts`**

```ts
import type { GameType, PinyinProgress, GameBest } from '../types';
import { getJSON, setJSON } from './local';

interface GameScoreRow { gameType: GameType; score: number; stars: number; playedAt: number; }

const pinyinKey = (userId: number) => `pinyin:progress:${userId}`;
const gameKey = (userId: number) => `pinyin:games:${userId}`;

export async function recordPinyinLearned(
  userId: number,
  pinyin: string,
): Promise<{ pinyin: string; learnedCount: number }> {
  const list = await getJSON<PinyinProgress[]>(pinyinKey(userId), []);
  const now = Date.now();
  const idx = list.findIndex(p => p.pinyin === pinyin);
  if (idx >= 0) {
    list[idx] = { ...list[idx], learnedCount: list[idx].learnedCount + 1, lastLearnedAt: now };
  } else {
    list.push({ pinyin, learnedCount: 1, lastLearnedAt: now });
  }
  await setJSON(pinyinKey(userId), list);
  const learnedCount = list.find(p => p.pinyin === pinyin)!.learnedCount;
  return { pinyin, learnedCount };
}

export async function recordGameScore(
  userId: number,
  gameType: GameType,
  score: number,
  stars: number,
): Promise<{ gameType: GameType; score: number; stars: number; isNewBest: boolean }> {
  const rows = await getJSON<GameScoreRow[]>(gameKey(userId), []);
  const prevBest = rows
    .filter(r => r.gameType === gameType)
    .reduce<number | null>((max, r) => (max === null ? r.score : Math.max(max, r.score)), null);
  rows.push({ gameType, score, stars, playedAt: Date.now() });
  await setJSON(gameKey(userId), rows);
  const isNewBest = prevBest === null || score > prevBest;
  return { gameType, score, stars, isNewBest };
}

export async function getProgress(
  userId: number,
): Promise<{ pinyinProgress: PinyinProgress[]; gameScores: GameBest[] }> {
  const pinyinProgress = await getJSON<PinyinProgress[]>(pinyinKey(userId), []);
  const rows = await getJSON<GameScoreRow[]>(gameKey(userId), []);

  const byType = new Map<GameType, GameBest>();
  for (const r of rows) {
    const cur = byType.get(r.gameType);
    if (!cur) {
      byType.set(r.gameType, { gameType: r.gameType, bestScore: r.score, bestStars: r.stars });
    } else {
      cur.bestScore = Math.max(cur.bestScore, r.score);
      cur.bestStars = Math.max(cur.bestStars, r.stars);
    }
  }
  return { pinyinProgress, gameScores: [...byType.values()] };
}
```

> 原后端 `bestStars` 用 `MAX(stars)`（与最高分行不一定同局），这里保持一致用全局 `MAX`，复刻既有行为。

- [ ] **Step 4: 运行确认通过（cwd = ios-version/）**

Run: `npm test -- progressStore`
Expected: PASS（3 个用例）。

- [ ] **Step 5: 改 `src/api/progress.ts` 走本地（签名不变）**

替换 `ios-version/src/api/progress.ts` 全文：

```ts
import type { PinyinProgress, GameBest, GameType } from '../types';
import * as store from '../storage/progressStore';

export interface ProgressResponse {
  pinyinProgress: PinyinProgress[];
  gameScores: GameBest[];
}

export function getProgress(userId: number): Promise<ProgressResponse> {
  return store.getProgress(userId);
}

export function recordPinyinLearned(userId: number, pinyin: string) {
  return store.recordPinyinLearned(userId, pinyin);
}

export function recordGameScore(userId: number, gameType: GameType, score: number, stars: number) {
  return store.recordGameScore(userId, gameType, score, stars);
}
```

- [ ] **Step 6: 全量前端测试（cwd = ios-version/）**

Run: `npm test`
Expected: 全部通过（`useProgress` 调用方签名不变）。

- [ ] **Step 7: Commit**

```bash
git add ios-version/src/storage/progressStore.ts ios-version/src/storage/progressStore.test.ts ios-version/src/api/progress.ts
git commit -m "feat(ios): local-backed progress store"
```

---

## Phase C — 音频离线化

### Task 6: 静态音频打包 + `pinyinAudioUrl` 相对路径

**Files:**
- Create: `ios-version/public/audio/pinyin/*.mp3`
- Modify: `ios-version/src/utils/pinyin.ts`、`ios-version/src/utils/pinyin.test.ts`、`.gitignore`

- [ ] **Step 1: 复制 218 个音频（从仓库根执行）**

```bash
mkdir -p ios-version/public/audio/pinyin
cp server/audio/pinyin/*.mp3 ios-version/public/audio/pinyin/
ls ios-version/public/audio/pinyin | wc -l
```

Expected: 输出 `218`。

- [ ] **Step 2: 更新仓库根 `.gitignore` 允许提交 ios 音频**

在 `.gitignore` 中 `!server/audio/pinyin/*.mp3` 下方新增：

```
!ios-version/public/audio/pinyin/*.mp3
```

验证（仓库根）：

```bash
git add ios-version/public/audio/pinyin && git status --short ios-version/public/audio/pinyin | head
```

Expected: 列出 `A  ios-version/public/audio/pinyin/*.mp3`（未被忽略）。

- [ ] **Step 3: 改 `pinyinAudioUrl` 为相对路径并更新测试**

修改 `ios-version/src/utils/pinyin.ts` 末尾函数：

```ts
/** 打包在 App 内的相对路径（webDir 下 audio/pinyin/*.mp3）。 */
export function pinyinAudioUrl(base: string, tone?: 0 | 1 | 2 | 3 | 4): string {
  return `audio/pinyin/${pinyinAudioFile(base, tone)}`;
}
```

同步更新 `ios-version/src/utils/pinyin.test.ts` 中对 `pinyinAudioUrl` 的断言为相对路径，例如：

```ts
expect(pinyinAudioUrl('ma', 1)).toBe('audio/pinyin/ma1.mp3');
expect(pinyinAudioUrl('üe', 3)).toBe('audio/pinyin/ve3.mp3');
expect(pinyinAudioUrl('b')).toBe('audio/pinyin/b.mp3');
```

- [ ] **Step 4: 跑测试确认通过（cwd = ios-version/）**

Run: `npm test -- pinyin`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add ios-version/public/audio/pinyin .gitignore ios-version/src/utils/pinyin.ts ios-version/src/utils/pinyin.test.ts
git commit -m "feat(ios): bundle pinyin audio, relative audio url"
```

---

### Task 7: 原生 TTS 封装 `audio/speak.ts`

**Files:**
- Create: `ios-version/src/audio/speak.ts`、`ios-version/src/audio/speak.test.ts`

- [ ] **Step 1: 写失败测试（mock TTS 插件）**

Create `ios-version/src/audio/speak.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const speakSpy = vi.fn().mockResolvedValue(undefined);
const stopSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: {
    speak: (...args: unknown[]) => speakSpy(...args),
    stop: (...args: unknown[]) => stopSpy(...args),
  },
}));

import { speak, stopSpeaking } from './speak';

describe('speak', () => {
  beforeEach(() => { speakSpy.mockClear(); stopSpy.mockClear(); });

  it('speaks zh-CN with default rate', async () => {
    await speak('妈');
    expect(stopSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: '妈', lang: 'zh-CN', rate: 1 }),
    );
  });

  it('maps a slow rate', async () => {
    await speak('听广播', { rate: 0.7 });
    expect(speakSpy).toHaveBeenCalledWith(expect.objectContaining({ rate: 0.7 }));
  });

  it('does not throw when plugin rejects', async () => {
    speakSpy.mockRejectedValueOnce(new Error('boom'));
    await expect(speak('x')).resolves.toBeUndefined();
  });

  it('stopSpeaking calls plugin stop', async () => {
    await stopSpeaking();
    expect(stopSpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行确认失败（cwd = ios-version/）**

Run: `npm test -- speak`
Expected: FAIL — `./speak` 不存在。

- [ ] **Step 3: 实现 `ios-version/src/audio/speak.ts`**

```ts
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export interface SpeakOptions {
  /** 1 = 正常语速；<1 更慢（儿童慢速建议 0.6–0.8）。 */
  rate?: number;
}

/** 用 iOS 原生 AVSpeechSynthesizer 朗读中文文本；失败静默兜底，不抛。
 *  Promise 在朗读结束（或失败）后 resolve，便于串行编排。 */
export async function speak(text: string, opts?: SpeakOptions): Promise<void> {
  try {
    await TextToSpeech.stop();
    await TextToSpeech.speak({
      text,
      lang: 'zh-CN',
      rate: opts?.rate ?? 1,
    });
  } catch (err) {
    console.warn('[speak] native tts failed', err);
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await TextToSpeech.stop();
  } catch {
    /* ignore */
  }
}
```

> 语速换算：原 SSML 的 `-20%`/`-35%` 映射为数字 `rate`（约 `0.8`/`0.65`），真机听感微调。

- [ ] **Step 4: 运行确认通过（cwd = ios-version/）**

Run: `npm test -- speak`
Expected: PASS（4 个用例）。

- [ ] **Step 5: Commit**

```bash
git add ios-version/src/audio/speak.ts ios-version/src/audio/speak.test.ts
git commit -m "feat(ios): native TTS speak wrapper"
```

---

### Task 8: `useAudio` 改造（去 HEAD 预检、TTS 改 speak）

**Files:**
- Modify: `ios-version/src/hooks/useAudio.ts`（及受影响的测试）

- [ ] **Step 1: 替换 `ios-version/src/hooks/useAudio.ts` 全文**

```ts
import { useCallback, useRef, useState } from 'react';
import { pinyinAudioUrl } from '../utils/pinyin';
import { speak, stopSpeaking } from '../audio/speak';
import type { SpellStep } from '../utils/spell';

/** 播放音频。`play(text)` 走原生 TTS（汉字例字）；
 *  `playPinyin(base, tone?)` 走打包的静态拼音音节 mp3；
 *  `playSequence(steps)` 串行播放一组拼读段。 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);
  const seqIdRef = useRef(0);
  const [spellIndex, setSpellIndex] = useState(-1);

  const stopCurrent = () => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
    void stopSpeaking();
  };

  const cancelSequence = () => {
    seqIdRef.current += 1;
    setSpellIndex(-1);
  };

  /** 播一段静态音频，等待 ended/error。返回是否成功播放完成。 */
  const playOnce = async (url: string): Promise<boolean> => {
    stopCurrent();
    return new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      currentRef.current = audio;
      const cleanup = () => { audio.onended = null; audio.onerror = null; };
      audio.onended = () => { cleanup(); resolve(true); };
      audio.onerror = () => { cleanup(); resolve(false); };
      audio.play().catch(() => { cleanup(); resolve(false); });
    });
  };

  const play = useCallback(async (text: string) => {
    cancelSequence();
    stopCurrent();
    await speak(text);
  }, []);

  /**
   * 播放拼音音节静态音频。
   * @param base 去掉声调的拼音；@param tone 1-4 带调，省略/0 = 无调；
   * @param fallbackText 静态 mp3 缺失时用原生 TTS 朗读的汉字。
   */
  const playPinyin = useCallback(async (
    base: string,
    tone?: 0 | 1 | 2 | 3 | 4,
    fallbackText?: string,
  ) => {
    cancelSequence();
    const ok = await playOnce(pinyinAudioUrl(base, tone));
    if (!ok && fallbackText) {
      await speak(fallbackText);
    }
  }, []);

  /**
   * 串行播放一组拼读段。每段播完等 gapMs 再播下一段。
   * 通过 `spellIndex` 暴露当前段索引（-1 = 未播放）。
   */
  const playSequence = useCallback(async (
    steps: SpellStep[],
    opts?: { gapMs?: number },
  ): Promise<void> => {
    cancelSequence();
    stopCurrent();
    const myId = ++seqIdRef.current;
    const gap = opts?.gapMs ?? 220;

    for (let i = 0; i < steps.length; i++) {
      if (seqIdRef.current !== myId) return;
      const step = steps[i];
      setSpellIndex(i);

      const ok = await playOnce(pinyinAudioUrl(step.base, step.tone));
      if (!ok && step.hanzi) {
        if (seqIdRef.current !== myId) return;
        await speak(step.hanzi, { rate: 0.8 });
      }

      if (seqIdRef.current !== myId) return;
      if (i < steps.length - 1 && gap > 0) {
        await new Promise<void>((r) => setTimeout(r, gap));
      }
    }
    if (seqIdRef.current === myId) setSpellIndex(-1);
  }, []);

  return { play, playPinyin, playSequence, spellIndex };
}
```

- [ ] **Step 2: 跑前端测试，修正受影响用例（cwd = ios-version/）**

Run: `npm test`
Expected: 若有测试 mock 了 `new Audio` / `fetch` / `ttsUrl` 用于 `useAudio`，改为 mock `../audio/speak`，断言改为对 `speak` 的断言。逐个修正至全绿。

- [ ] **Step 3: Commit**

```bash
git add ios-version/src/hooks/useAudio.ts ios-version/src
git commit -m "refactor(ios): useAudio uses bundled audio + native TTS fallback"
```

---

### Task 9: `MnemonicSection` 与 `RecitePage` 的 TTS 替换

**Files:**
- Modify: `ios-version/src/components/MnemonicSection.tsx`、`ios-version/src/pages/RecitePage.tsx`（及受影响测试）

- [ ] **Step 1: `RecitePage` 的 TTS fallback 改 speak**

修改 `ios-version/src/pages/RecitePage.tsx`：删除 `import { ttsUrl } from '../api/tts';`，新增 `import { speak } from '../audio/speak';`。把 `playReciteItem` 的 `fallbackTts` 改为：

```ts
function playReciteItem(item: PinyinItem): Promise<void> {
  const picked = pickAudioForItem(item);
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };

    const fallbackTts = () => { void speak(picked.text).finally(finish); };

    const audio = new Audio(pinyinAudioUrl(picked.base, picked.tone));
    audio.onended = finish;
    audio.onerror = fallbackTts;
    void audio.play().catch(fallbackTts);
  });
}
```

- [ ] **Step 2: `MnemonicSection` 汉字段改 speak + 估算高亮**

修改 `ios-version/src/components/MnemonicSection.tsx`：删除 `import { ttsUrl } from '../api/tts';`，新增 `import { speak } from '../audio/speak';`。

- 「形象提示朗读」（原 `const audio = new Audio(ttsUrl(mnemonic.hint));`）改为 `await speak(mnemonic.hint);`，相应调整 `playing` 状态管理。
- 口诀「汉字段」（原 `ttsUrl(group.text, { rate: HANZI_RATE })` + `playOnce`）改为 `speak(group.text, { rate: 0.65 })`；高亮改为按 token 估算驱动；拼音段（`pinyinAudioUrl` + `playOnce`）保持原真实时间轴高亮不变。

汉字段实现要点（`groupTokens` 循环中 `kind === 'hanzi'` 分支）：

```ts
const estTotal = group.indices.length * FALLBACK_PER_TOKEN_MS;
const startTs = performance.now();
let raf = 0;
const tick = () => {
  const elapsed = performance.now() - startTs;
  const within = Math.min(group.indices.length - 1, Math.floor(elapsed / FALLBACK_PER_TOKEN_MS));
  setActiveIndex(group.indices[within]);
  if (elapsed < estTotal) raf = requestAnimationFrame(tick);
};
raf = requestAnimationFrame(tick);
await speak(group.text, { rate: 0.65 });
cancelAnimationFrame(raf);
```

> 拼音段继续用现有 `playOnce(url, onProgress, PINYIN_PLAYBACK_RATE, PINYIN_TAIL_TRIM_MS)` 路径。`HANZI_RATE` 由字符串改为数字给 `speak` 用或删除。

- [ ] **Step 3: 跑测试，修正 `MnemonicSection.test.tsx` / `RhymeKaraoke.test.tsx`（cwd = ios-version/）**

Run: `npm test`
Expected: 涉及 TTS 的断言从 `ttsUrl`/`new Audio` 改为 mock `../audio/speak`。逐个修正至全绿。

- [ ] **Step 4: 确认无遗留 `ttsUrl` / `/api` 业务引用（cwd = ios-version/）**

Run: `grep -rn "ttsUrl\|/api/" src --include="*.ts" --include="*.tsx"`
Expected: 仅剩 `src/api/tts.ts` 自身与其测试（Phase E 处理），业务代码不再引用。

- [ ] **Step 5: 构建验证（cwd = ios-version/）**

Run: `npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 6: Commit**

```bash
git add ios-version/src/components/MnemonicSection.tsx ios-version/src/pages/RecitePage.tsx ios-version/src
git commit -m "refactor(ios): replace Azure TTS urls with native speak (estimated karaoke)"
```

---

## Phase D — iOS 平台与原生音频会话

### Task 10: 添加 iOS 平台 + AVAudioSession + 模拟器验证

> 需 macOS + Xcode + CocoaPods（`brew install cocoapods`）。

**Files:**
- Create: `ios-version/ios/**`（生成）、修改 `ios-version/ios/App/App/AppDelegate.swift`
- Modify: `.gitignore`（仓库根）

- [ ] **Step 1: 构建并添加 iOS 平台（cwd = ios-version/）**

```bash
npm run build
npx cap add ios
npx cap sync ios
```

Expected: 生成 `ios-version/ios/`；`cap sync` 把 `dist` 拷入 `ios/App/App/public` 并装 Pods，无报错。

- [ ] **Step 2: 配置 AVAudioSession（解决物理静音键静音）**

编辑 `ios-version/ios/App/App/AppDelegate.swift`，顶部加 `import AVFoundation`，在 `didFinishLaunchingWithOptions` 内 `return true` 之前插入：

```swift
import AVFoundation
// ...
func application(_ application: UIApplication,
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    do {
        try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        try AVAudioSession.sharedInstance().setActive(true)
    } catch {
        print("AVAudioSession setup failed: \(error)")
    }
    return true
}
```

- [ ] **Step 3: 忽略 iOS 构建产物（仓库根 `.gitignore` 追加）**

```
# iOS / Capacitor build artifacts
ios-version/ios/App/Pods/
ios-version/ios/App/App/public/
ios-version/ios/App/build/
ios-version/ios/DerivedData/
*.xcuserstate
```

- [ ] **Step 4: 打开 Xcode 并在模拟器运行（cwd = ios-version/）**

```bash
npx cap open ios
```

Xcode 选 iOS 模拟器点 Run。
Expected: App 启动进入 `/login`（Hash 路由）；可昵称登录、浏览卡片并播放静态音节、三个游戏可玩。

- [ ] **Step 5: 手动验收（见末尾清单）**

重点：物理静音键开启时拼音音频仍可听见；冷启动后登录态与进度仍在。

- [ ] **Step 6: Commit**

```bash
git add ios-version/ios .gitignore
git commit -m "feat(ios): add iOS platform with playback AVAudioSession"
```

---

## Phase E — 收尾清理

### Task 11: 删除废弃 API、补 README、最终验证

**Files:**
- Delete: `ios-version/src/api/tts.ts`、`ios-version/src/api/tts.test.ts`、（视情况）`ios-version/src/api/client.ts`
- Create: `ios-version/README.md`
- Modify: `AGENTS.md`（仓库根，补一段 ios-version 说明）

- [ ] **Step 1: 确认 ios-version 已无 `/api` / `apiFetch` / `ttsUrl` 引用（cwd = ios-version/）**

Run: `grep -rn "/api/\|apiFetch\|ttsUrl" src --include="*.ts" --include="*.tsx"`
Expected: 仅 `src/api/tts.ts`（待删）及其测试、可能的 `src/api/client.ts`。若 `apiFetch` 无人引用则一并删。

- [ ] **Step 2: 删除废弃文件**

```bash
git rm ios-version/src/api/tts.ts ios-version/src/api/tts.test.ts
# 若确认 apiFetch 无引用：
git rm ios-version/src/api/client.ts
```

- [ ] **Step 3: 全量测试 + 构建 + 同步（cwd = ios-version/）**

```bash
npm test
npm run build
npx cap sync ios
```

Expected: 测试全绿；构建成功；`cap sync` 无报错。

- [ ] **Step 4: 写 `ios-version/README.md`**

简要说明：这是离线 iOS 版（独立 npm 项目，与根 web 版分离）；常用命令（`npm install` / `npm test` / `npm run build` / `npm run cap:sync` / `npm run cap:open`）；首次需 `npx cap add ios`；Bundle ID 与签名提醒；与 web 版的差异（本地存储 + 打包音频 + 原生 TTS）。

- [ ] **Step 5: 在仓库根 `AGENTS.md` 补一段 ios-version 说明**

在「项目概览」补一条：`ios-version/`：基于 Capacitor 的纯离线 iOS 版（独立项目，本地存储 + 打包音频 + 原生 TTS），与 `client/`+`server/` 的 web 版并存。

- [ ] **Step 6: Commit**

```bash
git add ios-version/src/api ios-version/README.md AGENTS.md
git commit -m "chore(ios): drop unused api modules, add README and docs"
```

---

## 手动验收清单（参考 AGENTS.md「手工验收重点」）

在 iOS 模拟器与（若有）真机上逐项确认：

- [ ] 冷启动进入 `/login`（Hash 路由）；昵称登录后再次冷启动仍保持登录态。
- [ ] 相同昵称再次登录，进度与之前一致（本地账号语义正确）。
- [ ] `/cards`：声母、单韵母、复韵母、整体认读均可浏览、点击播放静态音节，显示口诀/形象提示。
- [ ] 拼音音调按钮与例字朗读：例字走原生 TTS，声调音节走静态音频；缺失时有 TTS 兜底。
- [ ] `/recite` 挂图/跟读：顺序播报、当前项高亮与播放同步；TTS 兜底不中断流程。
- [ ] 口诀逐字高亮：拼音段精确（真实音频），汉字段按估算推进——观感可接受、无明显错位。
- [ ] 三个游戏各完整玩一局，结算页星数/新纪录正确；最佳分跨冷启动保留。
- [ ] `/profile` 显示已学拼音与游戏最高分。
- [ ] **物理静音键打开时，拼音/例字音频仍可听见**（AVAudioSession=.playback 生效）。
- [ ] 全程飞行模式（断网）下所有功能可用。
- [ ] 开启系统「减少动画」后界面仍可用、关键高亮反馈保留。

---

## 风险与注意事项

- **原生 TTS 声调**：`AVSpeechSynthesizer` 中文声调不如 Azure `<phoneme>` 精确，但仅用于汉字例字/口诀（非拼音主路径），可接受。若后续要求更高音质，可改「预生成 mp3 打包」（不在本计划）。
- **卡拉OK高亮估算误差**：汉字段基于固定 `FALLBACK_PER_TOKEN_MS` 估算，真机语速不同有偏差；常量需按真机听感微调。
- **语速换算**：SSML 百分比 rate 与原生数值 `rate` 量纲不同，需真机校准（建议 0.6–0.8 表「慢」）。
- **插件版本匹配**：确认所选 Capacitor 主版本（6.x/7.x）与 `@capacitor-community/text-to-speech` 版本匹配，否则按其 README 选 tag。
- **音频体积**：1.9MB 全部打包可接受。
- **Bundle ID 与签名**：`capacitor.config.ts` 的 `appId` 必须替换为真实 Bundle ID，并在 Xcode 配置签名团队后方可真机运行/上架。
- **测试环境**：所有 store/speak 测试通过 mock 隔离 Capacitor 插件，`npm test`（cwd = ios-version/）在 Node/jsdom 下独立运行，无需 Xcode。
- **与 web 版同源漂移**：`ios-version/` 是 `client/` 的复制副本，二者会逐渐分叉；本计划不处理两者长期同步问题。

---

## Execution Handoff

执行方式：**Subagent-Driven**（已选定）。每个 Task 派独立 implementer 子代理实现，随后两阶段评审（先 spec 合规，后代码质量），通过后标记完成再进入下一 Task。Phase D（需 Xcode/真机）以手动验收为主。
