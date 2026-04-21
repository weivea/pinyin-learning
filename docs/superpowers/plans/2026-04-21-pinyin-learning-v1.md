# 拼音学习网站 V1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向 3-5 岁儿童的拼音学习网站，包含拼音卡片浏览和三种小游戏，支持昵称登录与进度同步。

**Architecture:** Monorepo（npm workspaces）：`client/` 是 Vite + React + TypeScript 前端；`server/` 是 Express + TypeScript 后端，通过 edge-tts 生成发音并文件缓存，SQLite 存用户与进度。前端 Vite dev server 把 `/api` 代理到后端。

**Tech Stack:** Vite, React 18, TypeScript, Express, better-sqlite3, msedge-tts, Twemoji, Vitest, React Testing Library, supertest

**Spec:** `docs/superpowers/specs/2026-04-21-pinyin-learning-v1-design.md`

---

## 文件结构总览

```
pinyin-learning/
├── package.json                     # workspaces 根，含 dev/test 脚本
├── .gitignore
├── README.md
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                 # Express 启动入口
│   │   ├── app.ts                   # Express 应用工厂（便于测试）
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── connection.ts        # better-sqlite3 连接 + 初始化
│   │   ├── services/
│   │   │   ├── edgeTts.ts           # edge-tts 调用 + 缓存
│   │   │   └── userService.ts       # 用户 CRUD
│   │   │   └── progressService.ts   # 进度 CRUD
│   │   ├── routes/
│   │   │   ├── tts.ts
│   │   │   ├── users.ts
│   │   │   └── progress.ts
│   │   └── types.ts
│   ├── tests/
│   │   ├── edgeTts.test.ts
│   │   ├── users.test.ts
│   │   ├── progress.test.ts
│   │   └── tts.test.ts
│   ├── cache/                       # gitignore
│   └── data/                        # gitignore（pinyin.db）
│
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts               # /api 代理到 :3001
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                  # 路由
    │   ├── data/
    │   │   ├── pinyin.ts            # 静态拼音数据
    │   │   └── pinyin.test.ts       # 数据完整性测试
    │   ├── api/
    │   │   ├── client.ts            # fetch 封装
    │   │   ├── users.ts
    │   │   ├── progress.ts
    │   │   └── tts.ts
    │   ├── hooks/
    │   │   ├── useUser.ts
    │   │   ├── useAudio.ts
    │   │   └── useProgress.ts
    │   ├── components/
    │   │   ├── TopBar.tsx
    │   │   ├── NicknameLogin.tsx
    │   │   ├── AudioButton.tsx
    │   │   ├── EmojiTile.tsx
    │   │   ├── StarRating.tsx
    │   │   ├── ToneButtons.tsx
    │   │   ├── ExampleWord.tsx
    │   │   ├── PinyinCard.tsx
    │   │   ├── PinyinGrid.tsx
    │   │   ├── GameListenChoose.tsx
    │   │   ├── GameImageChoose.tsx
    │   │   └── GameMemoryFlip.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── HomePage.tsx
    │   │   ├── CardsPage.tsx
    │   │   ├── GamePage.tsx
    │   │   └── ProfilePage.tsx
    │   ├── styles/
    │   │   └── global.css
    │   └── types.ts
    └── tests/
        └── ... (与组件对齐)
```

---

## Task 1: 初始化 Monorepo 与根配置

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: 创建根 package.json**

```json
{
  "name": "pinyin-learning",
  "private": true,
  "version": "0.1.0",
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "npm-run-all --parallel dev:server dev:client",
    "dev:client": "npm --workspace client run dev",
    "dev:server": "npm --workspace server run dev",
    "build": "npm --workspace client run build && npm --workspace server run build",
    "test": "npm --workspace server run test && npm --workspace client run test"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
```

- [ ] **Step 2: 创建 .gitignore**

```
node_modules/
dist/
*.log
.DS_Store

# server
server/cache/
server/data/
*.db
*.mp3
```

- [ ] **Step 3: 创建 README.md**

````markdown
# 拼音学习网站

面向 3-5 岁儿童的拼音学习网站。

## 启动

```bash
npm install
npm run dev
# 前端 http://localhost:5173
# 后端 http://localhost:3001
```

## 测试

```bash
npm test
```

## 安全说明

本网站使用昵称无密码登录。任何人输入相同昵称都可以访问该账号下的进度，请勿存储隐私信息。
````

- [ ] **Step 4: 安装根依赖**

Run: `npm install`
Expected: 成功安装 npm-run-all，无错误

- [ ] **Step 5: 提交**

```bash
git add package.json .gitignore README.md
git commit -m "chore: init monorepo with workspaces"
```

---

## Task 2: 初始化 Server 工程脚手架

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/app.ts`

- [ ] **Step 1: 创建 server/package.json**

```json
{
  "name": "server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.19.2",
    "better-sqlite3": "^11.0.0",
    "msedge-tts": "^1.3.4",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/better-sqlite3": "^7.6.10",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.12.0",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "vitest": "^1.5.0",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2"
  }
}
```

- [ ] **Step 2: 创建 server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: 创建 server/src/app.ts**

```ts
import express, { Express } from 'express';
import cors from 'cors';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 4: 创建 server/src/index.ts**

```ts
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 5: 安装依赖并验证启动**

Run: `npm install`
Run: `npm --workspace server run dev`
Expected: 看到 `[server] listening on http://localhost:3001`，curl `http://localhost:3001/api/health` 返回 `{"ok":true}`，按 Ctrl+C 退出

- [ ] **Step 6: 提交**

```bash
git add server/
git commit -m "feat(server): scaffold express app with health endpoint"
```

---

## Task 3: 初始化 Client 工程脚手架

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/styles/global.css`

- [ ] **Step 1: 创建 client/package.json**

```json
{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
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

- [ ] **Step 2: 创建 client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: 创建 client/vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 4: 创建 client/index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>拼音学习</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 client/src/styles/global.css**

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #fff8e7;
  color: #333;
}
button { font-family: inherit; cursor: pointer; }
```

- [ ] **Step 6: 创建 client/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 7: 创建 client/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div style={{ padding: 32 }}><h1>拼音学习 🎉</h1></div>} />
    </Routes>
  );
}
```

- [ ] **Step 8: 创建 client/src/test-setup.ts**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 9: 安装并验证**

Run: `npm install`
Run: `npm --workspace client run dev`
Expected: 浏览器打开 http://localhost:5173 看到 "拼音学习 🎉"

- [ ] **Step 10: 提交**

```bash
git add client/
git commit -m "feat(client): scaffold vite + react app"
```

---

## Task 4: SQLite 数据库与 schema 初始化

**Files:**
- Create: `server/src/db/schema.sql`
- Create: `server/src/db/connection.ts`
- Create: `server/src/types.ts`

- [ ] **Step 1: 创建 server/src/db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pinyin_progress (
  user_id INTEGER NOT NULL,
  pinyin TEXT NOT NULL,
  learned_count INTEGER DEFAULT 0,
  last_learned_at INTEGER,
  PRIMARY KEY (user_id, pinyin),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  played_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_type ON game_scores(user_id, game_type);
```

- [ ] **Step 2: 创建 server/src/types.ts**

```ts
export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  created_at: number;
}

export interface PinyinProgressRow {
  user_id: number;
  pinyin: string;
  learned_count: number;
  last_learned_at: number | null;
}

export interface GameScoreRow {
  id: number;
  user_id: number;
  game_type: 'listen' | 'image' | 'memory';
  score: number;
  stars: number;
  played_at: number;
}

export type GameType = 'listen' | 'image' | 'memory';
```

- [ ] **Step 3: 创建 server/src/db/connection.ts**

```ts
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type DB = Database.Database;

export function createDb(filename: string = ':memory:'): DB {
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  return db;
}
```

- [ ] **Step 4: 写测试 server/tests/db.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/connection.js';

describe('createDb', () => {
  it('creates schema with users table', () => {
    const db = createDb(':memory:');
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    expect(stmt.get()).toEqual({ name: 'users' });
  });

  it('creates pinyin_progress and game_scores tables', () => {
    const db = createDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('pinyin_progress');
    expect(names).toContain('game_scores');
  });
});
```

- [ ] **Step 5: 运行测试**

Run: `npm --workspace server run test`
Expected: 2 passed

注意：vitest 需要能加载 schema.sql。tsx/vitest 用 ESM 加载 ts 时 `import.meta.url` 指向 src 目录，schema.sql 在同目录可读。若测试报路径错误，把 `vitest.config.ts` 加到 server 用 `vitest` 默认配置即可，无需特殊设置。

- [ ] **Step 6: 提交**

```bash
git add server/src/db/ server/src/types.ts server/tests/db.test.ts
git commit -m "feat(server): add sqlite schema and connection helper"
```

---

## Task 5: 用户 Service 与 routes（TDD）

**Files:**
- Create: `server/src/services/userService.ts`
- Create: `server/src/routes/users.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/users.test.ts`

- [ ] **Step 1: 写失败测试 server/tests/users.test.ts**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb, DB } from '../src/db/connection.js';

let db: DB;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db });
});

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ nickname: '小明', avatar: '🐰' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nickname: '小明', avatar: '🐰' });
    expect(typeof res.body.id).toBe('number');
  });

  it('returns existing user when nickname exists', async () => {
    const r1 = await request(app).post('/api/users').send({ nickname: '小红', avatar: '🐱' });
    const r2 = await request(app).post('/api/users').send({ nickname: '小红', avatar: '🐶' });
    expect(r2.body.id).toBe(r1.body.id);
    expect(r2.body.avatar).toBe('🐱'); // 沿用原头像
  });

  it('rejects empty nickname', async () => {
    const res = await request(app).post('/api/users').send({ nickname: '', avatar: '🐰' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/users/:id', () => {
  it('returns user by id', async () => {
    const created = await request(app).post('/api/users').send({ nickname: '小蓝', avatar: '🐻' });
    const res = await request(app).get(`/api/users/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.nickname).toBe('小蓝');
  });

  it('returns 404 for missing user', async () => {
    const res = await request(app).get('/api/users/9999');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: 运行测试以验证失败**

Run: `npm --workspace server run test -- users`
Expected: FAIL（createApp 不接受 db 参数；路由不存在）

- [ ] **Step 3: 创建 server/src/services/userService.ts**

```ts
import type { DB } from '../db/connection.js';
import type { User } from '../types.js';

export class UserService {
  constructor(private db: DB) {}

  upsertByNickname(nickname: string, avatar: string): User {
    const existing = this.db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname) as User | undefined;
    if (existing) return existing;

    const now = Date.now();
    const result = this.db.prepare(
      'INSERT INTO users (nickname, avatar, created_at) VALUES (?, ?, ?)'
    ).run(nickname, avatar, now);

    return {
      id: Number(result.lastInsertRowid),
      nickname,
      avatar,
      created_at: now,
    };
  }

  getById(id: number): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return row ?? null;
  }
}
```

- [ ] **Step 4: 创建 server/src/routes/users.ts**

```ts
import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import type { DB } from '../db/connection.js';

export function usersRouter(db: DB): Router {
  const router = Router();
  const service = new UserService(db);

  router.post('/', (req: Request, res: Response) => {
    const { nickname, avatar } = req.body ?? {};
    if (typeof nickname !== 'string' || nickname.trim() === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'nickname required' } });
    }
    const user = service.upsertByNickname(nickname.trim(), typeof avatar === 'string' ? avatar : '');
    res.json(user);
  });

  router.get('/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'id must be number' } });
    }
    const user = service.getById(id);
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'user not found' } });
    res.json(user);
  });

  return router;
}
```

- [ ] **Step 5: 修改 server/src/app.ts 接受 db 注入**

```ts
import express, { Express } from 'express';
import cors from 'cors';
import type { DB } from './db/connection.js';
import { usersRouter } from './routes/users.js';

export interface AppDeps {
  db: DB;
}

export function createApp(deps?: AppDeps): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (deps?.db) {
    app.use('/api/users', usersRouter(deps.db));
  }

  return app;
}
```

- [ ] **Step 6: 修改 server/src/index.ts 创建 db 并注入**

```ts
import { createApp } from './app.js';
import { createDb } from './db/connection.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || './data/pinyin.db';

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = createDb(DB_PATH);
const app = createApp({ db });

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 7: 运行测试**

Run: `npm --workspace server run test -- users`
Expected: 5 passed

- [ ] **Step 8: 提交**

```bash
git add server/src/services/userService.ts server/src/routes/users.ts server/src/app.ts server/src/index.ts server/tests/users.test.ts
git commit -m "feat(server): add user upsert/get with nickname login"
```

---

## Task 6: 进度 Service 与 routes（TDD）

**Files:**
- Create: `server/src/services/progressService.ts`
- Create: `server/src/routes/progress.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/progress.test.ts`

- [ ] **Step 1: 写失败测试 server/tests/progress.test.ts**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb, DB } from '../src/db/connection.js';

let db: DB;
let app: ReturnType<typeof createApp>;
let userId: number;

beforeEach(async () => {
  db = createDb(':memory:');
  app = createApp({ db });
  const r = await request(app).post('/api/users').send({ nickname: 'tester', avatar: '🐰' });
  userId = r.body.id;
});

describe('POST /api/progress/:userId/pinyin', () => {
  it('increments learned_count', async () => {
    const r1 = await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'b' });
    expect(r1.status).toBe(200);
    expect(r1.body.learnedCount).toBe(1);
    const r2 = await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'b' });
    expect(r2.body.learnedCount).toBe(2);
  });

  it('rejects missing pinyin', async () => {
    const res = await request(app).post(`/api/progress/${userId}/pinyin`).send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/progress/:userId/game', () => {
  it('records score and reports new best', async () => {
    const r1 = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'listen', score: 8, stars: 2 });
    expect(r1.body.isNewBest).toBe(true);

    const r2 = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'listen', score: 6, stars: 1 });
    expect(r2.body.isNewBest).toBe(false);

    const r3 = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'listen', score: 10, stars: 3 });
    expect(r3.body.isNewBest).toBe(true);
  });

  it('validates gameType', async () => {
    const res = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'bad', score: 1, stars: 0 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/progress/:userId', () => {
  it('returns aggregated progress', async () => {
    await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'a' });
    await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'a' });
    await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'b' });
    await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'image', score: 7, stars: 2 });
    await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'image', score: 9, stars: 3 });

    const res = await request(app).get(`/api/progress/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.pinyinProgress).toEqual(expect.arrayContaining([
      expect.objectContaining({ pinyin: 'a', learnedCount: 2 }),
      expect.objectContaining({ pinyin: 'b', learnedCount: 1 }),
    ]));
    expect(res.body.gameScores).toEqual([
      expect.objectContaining({ gameType: 'image', bestScore: 9, bestStars: 3 }),
    ]);
  });
});
```

- [ ] **Step 2: 运行测试以验证失败**

Run: `npm --workspace server run test -- progress`
Expected: FAIL（路由不存在）

- [ ] **Step 3: 创建 server/src/services/progressService.ts**

```ts
import type { DB } from '../db/connection.js';
import type { GameType } from '../types.js';

const VALID_GAME_TYPES: GameType[] = ['listen', 'image', 'memory'];

export class ProgressService {
  constructor(private db: DB) {}

  static isValidGameType(t: string): t is GameType {
    return (VALID_GAME_TYPES as string[]).includes(t);
  }

  recordPinyinLearned(userId: number, pinyin: string): { pinyin: string; learnedCount: number } {
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO pinyin_progress (user_id, pinyin, learned_count, last_learned_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, pinyin) DO UPDATE SET
        learned_count = learned_count + 1,
        last_learned_at = excluded.last_learned_at
    `).run(userId, pinyin, now);

    const row = this.db.prepare(
      'SELECT learned_count FROM pinyin_progress WHERE user_id = ? AND pinyin = ?'
    ).get(userId, pinyin) as { learned_count: number };

    return { pinyin, learnedCount: row.learned_count };
  }

  recordGameScore(userId: number, gameType: GameType, score: number, stars: number) {
    const prevBest = this.db.prepare(
      'SELECT MAX(score) as best FROM game_scores WHERE user_id = ? AND game_type = ?'
    ).get(userId, gameType) as { best: number | null };

    const now = Date.now();
    const result = this.db.prepare(
      'INSERT INTO game_scores (user_id, game_type, score, stars, played_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, gameType, score, stars, now);

    const isNewBest = prevBest.best === null || score > prevBest.best;
    return { id: Number(result.lastInsertRowid), gameType, score, stars, isNewBest };
  }

  getProgress(userId: number) {
    const pinyinProgress = (this.db.prepare(`
      SELECT pinyin, learned_count as learnedCount, last_learned_at as lastLearnedAt
      FROM pinyin_progress WHERE user_id = ?
    `).all(userId)) as Array<{ pinyin: string; learnedCount: number; lastLearnedAt: number }>;

    const gameScores = (this.db.prepare(`
      SELECT game_type as gameType, MAX(score) as bestScore, MAX(stars) as bestStars
      FROM game_scores WHERE user_id = ?
      GROUP BY game_type
    `).all(userId)) as Array<{ gameType: GameType; bestScore: number; bestStars: number }>;

    return { pinyinProgress, gameScores };
  }
}
```

- [ ] **Step 4: 创建 server/src/routes/progress.ts**

```ts
import { Router, Request, Response } from 'express';
import { ProgressService } from '../services/progressService.js';
import type { DB } from '../db/connection.js';

export function progressRouter(db: DB): Router {
  const router = Router({ mergeParams: true });
  const service = new ProgressService(db);

  router.get('/:userId', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'bad userId' } });
    res.json(service.getProgress(userId));
  });

  router.post('/:userId/pinyin', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const { pinyin } = req.body ?? {};
    if (!Number.isFinite(userId) || typeof pinyin !== 'string' || pinyin === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'userId or pinyin missing' } });
    }
    res.json(service.recordPinyinLearned(userId, pinyin));
  });

  router.post('/:userId/game', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const { gameType, score, stars } = req.body ?? {};
    if (!Number.isFinite(userId) || !ProgressService.isValidGameType(gameType) ||
        !Number.isFinite(score) || !Number.isFinite(stars)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'bad payload' } });
    }
    res.json(service.recordGameScore(userId, gameType, score, stars));
  });

  return router;
}
```

- [ ] **Step 5: 修改 server/src/app.ts 挂载 progress 路由**

替换文件内容：

```ts
import express, { Express } from 'express';
import cors from 'cors';
import type { DB } from './db/connection.js';
import { usersRouter } from './routes/users.js';
import { progressRouter } from './routes/progress.js';

export interface AppDeps {
  db: DB;
}

export function createApp(deps?: AppDeps): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (deps?.db) {
    app.use('/api/users', usersRouter(deps.db));
    app.use('/api/progress', progressRouter(deps.db));
  }

  return app;
}
```

- [ ] **Step 6: 运行测试**

Run: `npm --workspace server run test`
Expected: 全部 passed（db + users + progress）

- [ ] **Step 7: 提交**

```bash
git add server/src/services/progressService.ts server/src/routes/progress.ts server/src/app.ts server/tests/progress.test.ts
git commit -m "feat(server): add progress tracking for pinyin and games"
```

---

## Task 7: edge-tts 服务与缓存（TDD）

**Files:**
- Create: `server/src/services/edgeTts.ts`
- Create: `server/src/routes/tts.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/index.ts`
- Create: `server/tests/edgeTts.test.ts`
- Create: `server/tests/tts.test.ts`

- [ ] **Step 1: 写失败测试 server/tests/edgeTts.test.ts**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EdgeTtsService } from '../src/services/edgeTts.js';

let cacheDir: string;

beforeEach(() => {
  cacheDir = mkdtempSync(join(tmpdir(), 'tts-cache-'));
});

afterEach(() => {
  rmSync(cacheDir, { recursive: true, force: true });
});

describe('EdgeTtsService', () => {
  it('returns cached file if exists without invoking generator', async () => {
    const generator = vi.fn();
    const svc = new EdgeTtsService({ cacheDir, generator });
    // pre-seed cache
    const path = svc.cachePathFor('hello', 'zh-CN-XiaoxiaoNeural');
    writeFileSync(path, Buffer.from('FAKE_MP3'));

    const result = await svc.getOrGenerate('hello', 'zh-CN-XiaoxiaoNeural');
    expect(result.fromCache).toBe(true);
    expect(generator).not.toHaveBeenCalled();
    expect(existsSync(result.path)).toBe(true);
  });

  it('invokes generator and writes file when cache misses', async () => {
    const generator = vi.fn(async () => Buffer.from('GEN_MP3'));
    const svc = new EdgeTtsService({ cacheDir, generator });

    const result = await svc.getOrGenerate('hi', 'zh-CN-XiaoxiaoNeural');
    expect(result.fromCache).toBe(false);
    expect(generator).toHaveBeenCalledOnce();
    expect(existsSync(result.path)).toBe(true);
  });

  it('dedupes concurrent requests for same key', async () => {
    let calls = 0;
    const generator = vi.fn(async () => {
      calls++;
      await new Promise(r => setTimeout(r, 30));
      return Buffer.from('X');
    });
    const svc = new EdgeTtsService({ cacheDir, generator });

    const [a, b] = await Promise.all([
      svc.getOrGenerate('same', 'v'),
      svc.getOrGenerate('same', 'v'),
    ]);
    expect(calls).toBe(1);
    expect(a.path).toBe(b.path);
  });
});
```

- [ ] **Step 2: 运行测试以验证失败**

Run: `npm --workspace server run test -- edgeTts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 创建 server/src/services/edgeTts.ts**

```ts
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type TtsGenerator = (text: string, voice: string) => Promise<Buffer>;

export interface EdgeTtsOptions {
  cacheDir: string;
  generator?: TtsGenerator;
}

export interface TtsResult {
  path: string;
  fromCache: boolean;
}

async function defaultGenerator(text: string, voice: string): Promise<Buffer> {
  // 动态 import 避免测试时强依赖
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    audioStream.on('data', (c: Buffer) => chunks.push(c));
    audioStream.on('end', () => resolve(Buffer.concat(chunks)));
    audioStream.on('error', reject);
  });
}

export class EdgeTtsService {
  private cacheDir: string;
  private generator: TtsGenerator;
  private inFlight = new Map<string, Promise<TtsResult>>();

  constructor(opts: EdgeTtsOptions) {
    this.cacheDir = opts.cacheDir;
    this.generator = opts.generator ?? defaultGenerator;
    mkdirSync(this.cacheDir, { recursive: true });
  }

  cachePathFor(text: string, voice: string): string {
    const hash = createHash('sha256').update(`${voice}|${text}`).digest('hex');
    return join(this.cacheDir, `${hash}.mp3`);
  }

  async getOrGenerate(text: string, voice: string): Promise<TtsResult> {
    const path = this.cachePathFor(text, voice);
    if (existsSync(path)) return { path, fromCache: true };

    const key = path;
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = (async () => {
      const buffer = await this.generator(text, voice);
      writeFileSync(path, buffer);
      return { path, fromCache: false };
    })().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}
```

- [ ] **Step 4: 运行测试**

Run: `npm --workspace server run test -- edgeTts`
Expected: 3 passed

- [ ] **Step 5: 写路由失败测试 server/tests/tts.test.ts**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';
import { EdgeTtsService } from '../src/services/edgeTts.js';

describe('GET /api/tts', () => {
  let cacheDir: string;
  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'tts-route-'));
  });

  it('returns mp3 audio bytes', async () => {
    const tts = new EdgeTtsService({
      cacheDir,
      generator: async () => Buffer.from('FAKE_MP3_BYTES'),
    });
    const app = createApp({ db: createDb(':memory:'), tts });
    const res = await request(app).get('/api/tts').query({ text: 'hello' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(res.body.toString()).toBe('FAKE_MP3_BYTES');
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('rejects empty text', async () => {
    const tts = new EdgeTtsService({ cacheDir, generator: async () => Buffer.from('x') });
    const app = createApp({ db: createDb(':memory:'), tts });
    const res = await request(app).get('/api/tts').query({ text: '' });
    expect(res.status).toBe(400);
    rmSync(cacheDir, { recursive: true, force: true });
  });
});
```

- [ ] **Step 6: 运行测试以验证失败**

Run: `npm --workspace server run test -- tts`
Expected: FAIL（route 不存在 / app 不接受 tts）

- [ ] **Step 7: 创建 server/src/routes/tts.ts**

```ts
import { Router, Request, Response } from 'express';
import { EdgeTtsService } from '../services/edgeTts.js';
import { createReadStream } from 'node:fs';

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export function ttsRouter(tts: EdgeTtsService): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const text = typeof req.query.text === 'string' ? req.query.text : '';
    const voice = typeof req.query.voice === 'string' && req.query.voice ? req.query.voice : DEFAULT_VOICE;
    if (text.trim() === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'text required' } });
    }

    try {
      const result = await tts.getOrGenerate(text, voice);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      createReadStream(result.path).pipe(res);
    } catch (err) {
      console.error('[tts] generation failed:', err);
      res.status(503).json({ error: { code: 'TTS_UNAVAILABLE', message: 'TTS service failed' } });
    }
  });

  return router;
}
```

- [ ] **Step 8: 修改 server/src/app.ts 加入 tts 依赖**

替换为：

```ts
import express, { Express } from 'express';
import cors from 'cors';
import type { DB } from './db/connection.js';
import { usersRouter } from './routes/users.js';
import { progressRouter } from './routes/progress.js';
import { ttsRouter } from './routes/tts.js';
import type { EdgeTtsService } from './services/edgeTts.js';

export interface AppDeps {
  db: DB;
  tts?: EdgeTtsService;
}

export function createApp(deps?: AppDeps): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (deps?.db) {
    app.use('/api/users', usersRouter(deps.db));
    app.use('/api/progress', progressRouter(deps.db));
  }
  if (deps?.tts) {
    app.use('/api/tts', ttsRouter(deps.tts));
  }

  return app;
}
```

- [ ] **Step 9: 修改 server/src/index.ts 注入 EdgeTtsService**

```ts
import { createApp } from './app.js';
import { createDb } from './db/connection.js';
import { EdgeTtsService } from './services/edgeTts.js';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || './data/pinyin.db';
const CACHE_DIR = process.env.TTS_CACHE_DIR || resolve('./cache');

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = createDb(DB_PATH);
const tts = new EdgeTtsService({ cacheDir: CACHE_DIR });
const app = createApp({ db, tts });

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 10: 运行所有 server 测试**

Run: `npm --workspace server run test`
Expected: 全部 passed

- [ ] **Step 11: 手工验证 edge-tts 真实调用**

Run: `npm --workspace server run dev`
Run（另一个终端）: `curl -o /tmp/test.mp3 'http://localhost:3001/api/tts?text=%E4%BD%A0%E5%A5%BD'`
Expected: `/tmp/test.mp3` 文件存在且能用播放器播放出"你好"

- [ ] **Step 12: 提交**

```bash
git add server/src/services/edgeTts.ts server/src/routes/tts.ts server/src/app.ts server/src/index.ts server/tests/edgeTts.test.ts server/tests/tts.test.ts
git commit -m "feat(server): add edge-tts service with file cache and dedup"
```

---

## Task 8: 前端拼音静态数据 + 完整性测试

**Files:**
- Create: `client/src/types.ts`
- Create: `client/src/data/pinyin.ts`
- Create: `client/src/data/pinyin.test.ts`

- [ ] **Step 1: 创建 client/src/types.ts**

```ts
export type PinyinCategory = 'initial' | 'simple-final' | 'compound-final' | 'whole-syllable';
export type GameType = 'listen' | 'image' | 'memory';

export interface ToneVariant {
  tone: 1 | 2 | 3 | 4;
  text: string;
  audioText: string;
}

export interface ExampleWord {
  hanzi: string;
  pinyin: string;
  tone: 0 | 1 | 2 | 3 | 4;
  emoji: string;
}

export interface PinyinItem {
  id: string;
  display: string;
  category: PinyinCategory;
  hasTones: boolean;
  tones?: ToneVariant[];
  audioText: string;
  examples: ExampleWord[];
}

export interface User {
  id: number;
  nickname: string;
  avatar: string;
}

export interface PinyinProgress {
  pinyin: string;
  learnedCount: number;
  lastLearnedAt: number | null;
}

export interface GameBest {
  gameType: GameType;
  bestScore: number;
  bestStars: number;
}
```

- [ ] **Step 2: 创建 client/src/data/pinyin.ts（声母 + 单韵母部分）**

注意：本任务文件较长，先创建文件框架与声母 + 单韵母数据，复韵母与整体认读在后续步骤补全。

```ts
import type { PinyinItem, ToneVariant } from '../types';

function tonesFor(base: string, audio: [string, string, string, string]): ToneVariant[] {
  // base: 'a' / 'o' / ... 用于推导带调字符
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
```

- [ ] **Step 3: 创建 client/src/data/pinyin.test.ts（数据完整性）**

```ts
import { describe, it, expect } from 'vitest';
import { PINYIN_DATA } from './pinyin';

describe('pinyin data integrity', () => {
  it('has unique ids', () => {
    const ids = PINYIN_DATA.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has at least one example', () => {
    for (const item of PINYIN_DATA) {
      expect(item.examples.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('items with hasTones=true must include tones array of 4', () => {
    for (const item of PINYIN_DATA) {
      if (item.hasTones) {
        expect(item.tones).toBeDefined();
        expect(item.tones!.length).toBe(4);
      }
    }
  });

  it('every item has non-empty audioText', () => {
    for (const item of PINYIN_DATA) {
      expect(item.audioText.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 4: 运行测试**

Run: `npm --workspace client run test -- pinyin`
Expected: 4 passed

- [ ] **Step 5: 提交**

```bash
git add client/src/types.ts client/src/data/pinyin.ts client/src/data/pinyin.test.ts
git commit -m "feat(client): add pinyin data (initials + simple finals) with integrity tests"
```

---

## Task 9: 补全复韵母与整体认读音节数据

**Files:**
- Modify: `client/src/data/pinyin.ts`

- [ ] **Step 1: 替换 client/src/data/pinyin.ts 中的两个空数组**

找到 `const compoundFinals: PinyinItem[] = [];` 和 `const wholeSyllables: PinyinItem[] = [];`，替换为：

```ts
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
```

- [ ] **Step 2: 运行测试**

Run: `npm --workspace client run test`
Expected: 4 passed（数据完整性测试通过，且总数 = 23+6+18+16 = 63）

- [ ] **Step 3: 增加一个总数断言到 pinyin.test.ts**

打开 `client/src/data/pinyin.test.ts`，在末尾追加：

```ts
  it('contains 63 pinyin items total', () => {
    expect(PINYIN_DATA.length).toBe(63);
  });
```

- [ ] **Step 4: 运行测试**

Run: `npm --workspace client run test`
Expected: 5 passed

- [ ] **Step 5: 提交**

```bash
git add client/src/data/pinyin.ts client/src/data/pinyin.test.ts
git commit -m "feat(client): complete pinyin data (compound finals + whole syllables)"
```

---

## Task 10: 前端 API 客户端层

**Files:**
- Create: `client/src/api/client.ts`
- Create: `client/src/api/users.ts`
- Create: `client/src/api/progress.ts`
- Create: `client/src/api/tts.ts`

- [ ] **Step 1: 创建 client/src/api/client.ts**

```ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let code = 'HTTP_ERROR';
    let message = res.statusText;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, code, message);
  }
  return (await res.json()) as T;
}
```

- [ ] **Step 2: 创建 client/src/api/users.ts**

```ts
import { apiFetch } from './client';
import type { User } from '../types';

export function loginOrCreate(nickname: string, avatar: string): Promise<User> {
  return apiFetch<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify({ nickname, avatar }),
  });
}

export function getUser(id: number): Promise<User> {
  return apiFetch<User>(`/api/users/${id}`);
}
```

- [ ] **Step 3: 创建 client/src/api/progress.ts**

```ts
import { apiFetch } from './client';
import type { PinyinProgress, GameBest, GameType } from '../types';

export interface ProgressResponse {
  pinyinProgress: PinyinProgress[];
  gameScores: GameBest[];
}

export function getProgress(userId: number): Promise<ProgressResponse> {
  return apiFetch<ProgressResponse>(`/api/progress/${userId}`);
}

export function recordPinyinLearned(userId: number, pinyin: string) {
  return apiFetch<{ pinyin: string; learnedCount: number }>(`/api/progress/${userId}/pinyin`, {
    method: 'POST',
    body: JSON.stringify({ pinyin }),
  });
}

export function recordGameScore(userId: number, gameType: GameType, score: number, stars: number) {
  return apiFetch<{ id: number; gameType: GameType; score: number; stars: number; isNewBest: boolean }>(
    `/api/progress/${userId}/game`,
    { method: 'POST', body: JSON.stringify({ gameType, score, stars }) },
  );
}
```

- [ ] **Step 4: 创建 client/src/api/tts.ts**

```ts
export function ttsUrl(text: string, voice = 'zh-CN-XiaoxiaoNeural'): string {
  const params = new URLSearchParams({ text, voice });
  return `/api/tts?${params.toString()}`;
}
```

- [ ] **Step 5: 提交**

```bash
git add client/src/api/
git commit -m "feat(client): add api client layer for users/progress/tts"
```

---

## Task 11: 前端 Hooks（useUser, useAudio, useProgress）

**Files:**
- Create: `client/src/hooks/useUser.ts`
- Create: `client/src/hooks/useAudio.ts`
- Create: `client/src/hooks/useProgress.ts`

- [ ] **Step 1: 创建 client/src/hooks/useUser.ts**

```ts
import { useCallback, useEffect, useState } from 'react';
import type { User } from '../types';

const STORAGE_KEY = 'pinyin-learning:user';

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = useCallback((u: User) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  return { user, login, logout };
}
```

- [ ] **Step 2: 创建 client/src/hooks/useAudio.ts**

```ts
import { useCallback, useRef } from 'react';
import { ttsUrl } from '../api/tts';

/**
 * 播放给定文本的 TTS 音频。失败时 fallback 到 Web Speech API。
 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string) => {
    // 停止上一段
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
    try {
      const audio = new Audio(ttsUrl(text));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio] tts failed, fallback to speechSynthesis', err);
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (e2) {
        console.error('[useAudio] fallback also failed', e2);
      }
    }
  }, []);

  return { play };
}
```

- [ ] **Step 3: 创建 client/src/hooks/useProgress.ts**

```ts
import { useCallback, useEffect, useState } from 'react';
import * as progressApi from '../api/progress';
import type { GameBest, GameType, PinyinProgress } from '../types';

export function useProgress(userId: number | undefined) {
  const [pinyinProgress, setPinyinProgress] = useState<PinyinProgress[]>([]);
  const [gameScores, setGameScores] = useState<GameBest[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await progressApi.getProgress(userId);
      setPinyinProgress(data.pinyinProgress);
      setGameScores(data.gameScores);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const learnPinyin = useCallback(async (pinyin: string) => {
    if (!userId) return;
    // 乐观更新
    setPinyinProgress(prev => {
      const idx = prev.findIndex(p => p.pinyin === pinyin);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], learnedCount: next[idx].learnedCount + 1, lastLearnedAt: Date.now() };
        return next;
      }
      return [...prev, { pinyin, learnedCount: 1, lastLearnedAt: Date.now() }];
    });
    try {
      await progressApi.recordPinyinLearned(userId, pinyin);
    } catch (err) {
      console.warn('[useProgress] learnPinyin failed', err);
    }
  }, [userId]);

  const recordGame = useCallback(async (gameType: GameType, score: number, stars: number) => {
    if (!userId) return null;
    try {
      const result = await progressApi.recordGameScore(userId, gameType, score, stars);
      void refresh();
      return result;
    } catch (err) {
      console.warn('[useProgress] recordGame failed', err);
      return null;
    }
  }, [userId, refresh]);

  return { pinyinProgress, gameScores, loading, refresh, learnPinyin, recordGame };
}
```

- [ ] **Step 4: 提交**

```bash
git add client/src/hooks/
git commit -m "feat(client): add useUser, useAudio, useProgress hooks"
```

---

## Task 12: 基础展示组件（AudioButton, EmojiTile, StarRating, ToneButtons, ExampleWord）

**Files:**
- Create: `client/src/components/AudioButton.tsx`
- Create: `client/src/components/EmojiTile.tsx`
- Create: `client/src/components/StarRating.tsx`
- Create: `client/src/components/ToneButtons.tsx`
- Create: `client/src/components/ExampleWord.tsx`
- Create: `client/src/components/ToneButtons.test.tsx`
- Create: `client/src/components/StarRating.test.tsx`

- [ ] **Step 1: 创建 client/src/components/AudioButton.tsx**

```tsx
import { useAudio } from '../hooks/useAudio';

interface Props {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioButton({ text, label = '🔊', size = 'md' }: Props) {
  const { play } = useAudio();
  const sizes = { sm: 32, md: 48, lg: 72 };
  const px = sizes[size];
  return (
    <button
      onClick={() => void play(text)}
      aria-label={`播放 ${text}`}
      style={{
        width: px, height: px, borderRadius: px / 2,
        border: 'none', background: '#ffd166', fontSize: px * 0.5,
      }}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: 创建 client/src/components/EmojiTile.tsx**

```tsx
interface Props {
  emoji: string;
  size?: number;
}

export function EmojiTile({ emoji, size = 64 }: Props) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} role="img" aria-label="emoji">
      {emoji}
    </span>
  );
}
```

- [ ] **Step 3: 创建 client/src/components/StarRating.tsx**

```tsx
interface Props {
  stars: 0 | 1 | 2 | 3;
  size?: number;
}

export function StarRating({ stars, size = 32 }: Props) {
  return (
    <span aria-label={`${stars} 颗星`} style={{ fontSize: size }}>
      {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
    </span>
  );
}
```

- [ ] **Step 4: 创建 client/src/components/StarRating.test.tsx**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders 2 filled and 1 empty', () => {
    render(<StarRating stars={2} />);
    const el = screen.getByLabelText('2 颗星');
    expect(el.textContent).toBe('⭐⭐☆');
  });

  it('renders 0 stars', () => {
    render(<StarRating stars={0} />);
    expect(screen.getByLabelText('0 颗星').textContent).toBe('☆☆☆');
  });
});
```

- [ ] **Step 5: 创建 client/src/components/ToneButtons.tsx**

```tsx
import type { ToneVariant } from '../types';
import { useAudio } from '../hooks/useAudio';

interface Props {
  tones: ToneVariant[];
  onPlay?: (tone: ToneVariant) => void;
}

export function ToneButtons({ tones, onPlay }: Props) {
  const { play } = useAudio();
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {tones.map(t => (
        <button
          key={t.tone}
          onClick={() => { void play(t.audioText); onPlay?.(t); }}
          aria-label={`播放 ${t.text}`}
          style={{
            fontSize: 56, padding: '16px 28px', minWidth: 96,
            borderRadius: 24, border: '4px solid #ffb703', background: '#fff',
            cursor: 'pointer',
          }}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: 创建 client/src/components/ToneButtons.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToneButtons } from './ToneButtons';
import type { ToneVariant } from '../types';

const tones: ToneVariant[] = [
  { tone: 1, text: 'ā', audioText: '啊' },
  { tone: 2, text: 'á', audioText: '啊' },
  { tone: 3, text: 'ǎ', audioText: '啊' },
  { tone: 4, text: 'à', audioText: '啊' },
];

describe('ToneButtons', () => {
  it('renders 4 tone buttons', () => {
    render(<ToneButtons tones={tones} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('invokes onPlay callback with the clicked tone', () => {
    const onPlay = vi.fn();
    render(<ToneButtons tones={tones} onPlay={onPlay} />);
    fireEvent.click(screen.getByLabelText('播放 ǎ'));
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ tone: 3, text: 'ǎ' }));
  });
});
```

- [ ] **Step 7: 创建 client/src/components/ExampleWord.tsx**

```tsx
import type { ExampleWord as EW } from '../types';
import { EmojiTile } from './EmojiTile';
import { AudioButton } from './AudioButton';

interface Props { word: EW; }

export function ExampleWord({ word }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 16, borderRadius: 24, background: '#fff', border: '3px solid #8ecae6',
      gap: 8, minWidth: 120,
    }}>
      <EmojiTile emoji={word.emoji} size={64} />
      <div style={{ fontSize: 36, fontWeight: 'bold' }}>{word.hanzi}</div>
      <div style={{ fontSize: 24, color: '#666' }}>{word.pinyin}</div>
      <AudioButton text={word.hanzi} size="sm" />
    </div>
  );
}
```

- [ ] **Step 8: 运行测试**

Run: `npm --workspace client run test`
Expected: 全部 passed（StarRating + ToneButtons + 拼音数据）

- [ ] **Step 9: 提交**

```bash
git add client/src/components/AudioButton.tsx client/src/components/EmojiTile.tsx client/src/components/StarRating.tsx client/src/components/StarRating.test.tsx client/src/components/ToneButtons.tsx client/src/components/ToneButtons.test.tsx client/src/components/ExampleWord.tsx
git commit -m "feat(client): add base presentation components"
```

---

## Task 13: Login 页 + NicknameLogin 组件

**Files:**
- Create: `client/src/components/NicknameLogin.tsx`
- Create: `client/src/pages/LoginPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: 创建 client/src/components/NicknameLogin.tsx**

```tsx
import { useState } from 'react';
import * as usersApi from '../api/users';
import type { User } from '../types';

const AVATARS = ['🐰', '🐱', '🐶', '🦊', '🐻', '🐼', '🐯', '🐵', '🐸', '🦄', '🐧', '🐢'];

interface Props {
  onLogin: (user: User) => void;
}

export function NicknameLogin({ onLogin }: Props) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!nickname.trim()) { setError('请输入昵称'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const user = await usersApi.loginOrCreate(nickname.trim(), avatar);
      onLogin(user);
    } catch (err) {
      setError('登录失败，请稍后再试');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      maxWidth: 480, margin: '40px auto', padding: 32,
      borderRadius: 24, background: '#fff',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    }}>
      <h1 style={{ textAlign: 'center', fontSize: 36 }}>欢迎来学拼音 🎉</h1>

      <label style={{ fontSize: 22, display: 'block', marginTop: 24 }}>选个头像：</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {AVATARS.map(a => (
          <button
            key={a}
            onClick={() => setAvatar(a)}
            style={{
              fontSize: 36, padding: 8, width: 64, height: 64,
              borderRadius: 16,
              border: avatar === a ? '4px solid #fb8500' : '2px solid #eee',
              background: '#fff', cursor: 'pointer',
            }}
            aria-label={`选择头像 ${a}`}
          >
            {a}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 22, display: 'block', marginTop: 24 }}>你的昵称：</label>
      <input
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="例如：小明"
        maxLength={12}
        style={{
          width: '100%', fontSize: 28, padding: '12px 16px',
          borderRadius: 16, border: '3px solid #8ecae6', marginTop: 8,
        }}
      />

      {error && <div style={{ color: '#e63946', marginTop: 12 }}>{error}</div>}

      <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
        提示：本网站不需要密码。任何人输入相同昵称会看到 ta 的进度。
      </p>

      <button
        onClick={() => void handleSubmit()}
        disabled={submitting}
        style={{
          marginTop: 24, width: '100%', fontSize: 28, padding: '16px',
          borderRadius: 24, border: 'none', background: '#fb8500', color: '#fff',
          cursor: 'pointer',
        }}
      >
        {submitting ? '进入中...' : '开始学习 →'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 创建 client/src/pages/LoginPage.tsx**

```tsx
import { useNavigate } from 'react-router-dom';
import { NicknameLogin } from '../components/NicknameLogin';
import { useUser } from '../hooks/useUser';

export function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  return (
    <NicknameLogin onLogin={(u) => { login(u); navigate('/'); }} />
  );
}
```

- [ ] **Step 3: 修改 client/src/App.tsx 加路由 + 守卫**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { useUser } from './hooks/useUser';

function RequireUser({ children }: { children: JSX.Element }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <RequireUser>
          <div style={{ padding: 32 }}><h1>已登录 🎉</h1></div>
        </RequireUser>
      } />
    </Routes>
  );
}
```

- [ ] **Step 4: 手工验证**

Run: `npm run dev`
- 访问 http://localhost:5173 → 跳到 /login
- 输入昵称、选头像、点"开始学习"→ 跳到 / 显示"已登录"
- 刷新页面 → 仍在 /

- [ ] **Step 5: 提交**

```bash
git add client/src/components/NicknameLogin.tsx client/src/pages/LoginPage.tsx client/src/App.tsx
git commit -m "feat(client): add nickname login page with avatar selection"
```

---

## Task 14: PinyinCard + PinyinGrid + TopBar 组件

**Files:**
- Create: `client/src/components/TopBar.tsx`
- Create: `client/src/components/PinyinCard.tsx`
- Create: `client/src/components/PinyinGrid.tsx`

- [ ] **Step 1: 创建 client/src/components/TopBar.tsx**

```tsx
import { Link } from 'react-router-dom';
import type { User } from '../types';

interface Props {
  user: User;
  totalStars: number;
  onLogout?: () => void;
}

export function TopBar({ user, totalStars, onLogout }: Props) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', background: '#fff', borderBottom: '3px solid #ffd166',
    }}>
      <Link to="/" style={{ fontSize: 24, fontWeight: 'bold', textDecoration: 'none', color: '#333' }}>
        🐣 拼音学习
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22 }}>
        <span>{user.avatar}</span>
        <span>{user.nickname}</span>
        <span>⭐ {totalStars}</span>
        {onLogout && (
          <button onClick={onLogout} style={{
            border: 'none', background: 'transparent', fontSize: 14, color: '#888', cursor: 'pointer',
          }}>退出</button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 创建 client/src/components/PinyinCard.tsx**

```tsx
import type { PinyinItem } from '../types';
import { AudioButton } from './AudioButton';
import { ToneButtons } from './ToneButtons';
import { ExampleWord } from './ExampleWord';

interface Props {
  item: PinyinItem;
  onPrev?: () => void;
  onNext?: () => void;
  onLearned?: () => void;
}

export function PinyinCard({ item, onPrev, onNext, onLearned }: Props) {
  return (
    <div style={{
      maxWidth: 720, margin: '24px auto', padding: 32,
      borderRadius: 32, background: '#fff', border: '4px solid #ffd166',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 160, fontWeight: 'bold', lineHeight: 1, color: '#fb8500' }}>
        {item.display}
      </div>

      {item.hasTones && item.tones ? (
        <div style={{ marginTop: 24 }}>
          <ToneButtons tones={item.tones} onPlay={() => onLearned?.()} />
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <AudioButton text={item.audioText} size="lg" />
        </div>
      )}

      <h3 style={{ marginTop: 32, fontSize: 24, color: '#666' }}>试着读这些字：</h3>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
        {item.examples.map(w => <ExampleWord key={w.hanzi} word={w} />)}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} disabled={!onPrev} style={navBtnStyle}>← 上一个</button>
        <button onClick={() => { onLearned?.(); onNext?.(); }} disabled={!onNext} style={{ ...navBtnStyle, background: '#06d6a0', color: '#fff' }}>
          下一个 →
        </button>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  fontSize: 22, padding: '12px 24px', borderRadius: 16,
  border: '3px solid #8ecae6', background: '#fff', cursor: 'pointer',
};
```

- [ ] **Step 3: 创建 client/src/components/PinyinGrid.tsx**

```tsx
import type { PinyinItem } from '../types';

interface Props {
  items: PinyinItem[];
  learnedIds?: Set<string>;
  onClick: (item: PinyinItem) => void;
}

export function PinyinGrid({ items, learnedIds, onClick }: Props) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12,
    }}>
      {items.map(item => {
        const learned = learnedIds?.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onClick(item)}
            style={{
              padding: 16, fontSize: 36, fontWeight: 'bold',
              borderRadius: 16, border: '3px solid #8ecae6',
              background: learned ? '#fff8e7' : '#fff',
              cursor: 'pointer', position: 'relative',
            }}
          >
            {item.display}
            {learned && <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 14 }}>⭐</span>}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add client/src/components/TopBar.tsx client/src/components/PinyinCard.tsx client/src/components/PinyinGrid.tsx
git commit -m "feat(client): add TopBar, PinyinCard, PinyinGrid components"
```

---

## Task 15: HomePage + CardsPage + ProfilePage

**Files:**
- Create: `client/src/pages/HomePage.tsx`
- Create: `client/src/pages/CardsPage.tsx`
- Create: `client/src/pages/ProfilePage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: 创建 client/src/pages/HomePage.tsx**

```tsx
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';

export function HomePage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  if (!user) return null;
  const totalStars = gameScores.reduce((sum, g) => sum + g.bestStars, 0);

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ display: 'grid', gap: 24, padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <HomeButton to="/cards" emoji="📚" label="学拼音" color="#8ecae6" />
        <HomeButton to="/game" emoji="🎮" label="玩游戏" color="#fb8500" />
        <HomeButton to="/profile" emoji="🏆" label="我的进度" color="#06d6a0" />
      </div>
    </div>
  );
}

function HomeButton({ to, emoji, label, color }: { to: string; emoji: string; label: string; color: string }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: '32px', fontSize: 36, textDecoration: 'none', color: '#333',
      background: '#fff', border: `4px solid ${color}`, borderRadius: 24,
    }}>
      <span style={{ fontSize: 64 }}>{emoji}</span>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </Link>
  );
}
```

- [ ] **Step 2: 创建 client/src/pages/CardsPage.tsx**

```tsx
import { useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { PinyinGrid } from '../components/PinyinGrid';
import { PinyinCard } from '../components/PinyinCard';
import { PINYIN_DATA, getByCategory } from '../data/pinyin';
import type { PinyinCategory, PinyinItem } from '../types';

const CATEGORIES: { id: PinyinCategory; label: string }[] = [
  { id: 'initial', label: '声母' },
  { id: 'simple-final', label: '单韵母' },
  { id: 'compound-final', label: '复韵母' },
  { id: 'whole-syllable', label: '整体认读' },
];

export function CardsPage() {
  const { user, logout } = useUser();
  const { pinyinProgress, gameScores, learnPinyin } = useProgress(user?.id);
  const [category, setCategory] = useState<PinyinCategory>('initial');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = useMemo(() => getByCategory(category), [category]);
  const learnedIds = useMemo(
    () => new Set(pinyinProgress.filter(p => p.learnedCount > 0).map(p => p.pinyin)),
    [pinyinProgress]
  );
  const selectedIndex = selectedId ? items.findIndex(i => i.id === selectedId) : -1;
  const selected: PinyinItem | null = selectedIndex >= 0 ? items[selectedIndex] : null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => { setCategory(c.id); setSelectedId(null); }}
              style={{
                padding: '12px 20px', fontSize: 20, borderRadius: 16,
                border: category === c.id ? '3px solid #fb8500' : '2px solid #ccc',
                background: category === c.id ? '#fff8e7' : '#fff', cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {selected ? (
          <>
            <button onClick={() => setSelectedId(null)} style={{
              padding: '8px 16px', fontSize: 18, borderRadius: 12,
              border: '2px solid #ccc', background: '#fff', cursor: 'pointer',
            }}>← 返回列表</button>
            <PinyinCard
              item={selected}
              onPrev={selectedIndex > 0 ? () => setSelectedId(items[selectedIndex - 1].id) : undefined}
              onNext={selectedIndex < items.length - 1 ? () => setSelectedId(items[selectedIndex + 1].id) : undefined}
              onLearned={() => void learnPinyin(selected.id)}
            />
          </>
        ) : (
          <PinyinGrid items={items} learnedIds={learnedIds} onClick={item => {
            setSelectedId(item.id);
            void learnPinyin(item.id);
          }} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 client/src/pages/ProfilePage.tsx**

```tsx
import { useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { PINYIN_DATA } from '../data/pinyin';
import { StarRating } from '../components/StarRating';

const GAME_LABELS: Record<string, string> = {
  listen: '🎧 听音选字母',
  image: '🖼 看图选拼音',
  memory: '🃏 翻牌配对',
};

export function ProfilePage() {
  const { user, logout } = useUser();
  const { pinyinProgress, gameScores } = useProgress(user?.id);
  const learnedSet = useMemo(() => new Set(pinyinProgress.map(p => p.pinyin)), [pinyinProgress]);
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <h2 style={{ fontSize: 28 }}>已学拼音 ({learnedSet.size} / {PINYIN_DATA.length})</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8,
        }}>
          {PINYIN_DATA.map(p => {
            const learned = learnedSet.has(p.id);
            return (
              <div key={p.id} style={{
                padding: 12, fontSize: 24, textAlign: 'center', borderRadius: 12,
                background: learned ? '#fff8e7' : '#f3f3f3',
                border: learned ? '2px solid #ffb703' : '2px solid #ddd',
                color: learned ? '#333' : '#aaa',
              }}>{p.display}{learned && ' ⭐'}</div>
            );
          })}
        </div>

        <h2 style={{ fontSize: 28, marginTop: 32 }}>游戏成绩</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(['listen', 'image', 'memory'] as const).map(gt => {
            const score = gameScores.find(g => g.gameType === gt);
            return (
              <div key={gt} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 16, borderRadius: 16, background: '#fff', border: '2px solid #8ecae6',
              }}>
                <span style={{ fontSize: 22 }}>{GAME_LABELS[gt]}</span>
                {score
                  ? <span><StarRating stars={score.bestStars as 0 | 1 | 2 | 3} /> 最高 {score.bestScore} 分</span>
                  : <span style={{ color: '#888' }}>还没玩过</span>}
              </div>
            );
          })}
        </div>

        <button onClick={logout} style={{
          marginTop: 32, padding: '12px 24px', fontSize: 18, borderRadius: 16,
          border: '2px solid #e63946', background: '#fff', color: '#e63946', cursor: 'pointer',
        }}>退出登录</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 修改 client/src/App.tsx 加路由**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CardsPage } from './pages/CardsPage';
import { ProfilePage } from './pages/ProfilePage';
import { useUser } from './hooks/useUser';

function RequireUser({ children }: { children: JSX.Element }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireUser><HomePage /></RequireUser>} />
      <Route path="/cards" element={<RequireUser><CardsPage /></RequireUser>} />
      <Route path="/profile" element={<RequireUser><ProfilePage /></RequireUser>} />
      <Route path="/game" element={<RequireUser><div style={{padding:32}}>游戏页（Task 16+ 实现）</div></RequireUser>} />
    </Routes>
  );
}
```

- [ ] **Step 5: 手工验证**

Run: `npm run dev`
- 登录后看到 Home 三个大按钮
- 点"学拼音"→ 切换四个 tab → 点击拼音卡片看详情 → 听发音 → 上下一个切换
- 点"我的进度"→ 看到已学拼音网格
- 刷新后仍保留登录状态与进度

- [ ] **Step 6: 提交**

```bash
git add client/src/pages/ client/src/App.tsx
git commit -m "feat(client): add Home, Cards, Profile pages"
```

---

## Task 16: 游戏 1 - 听音选字母（GameListenChoose）

**Files:**
- Create: `client/src/components/GameListenChoose.tsx`
- Create: `client/src/components/GameListenChoose.test.tsx`
- Create: `client/src/components/gameUtils.ts`

- [ ] **Step 1: 创建 client/src/components/gameUtils.ts**

```ts
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function starsForScore(correct: number, total: number): 0 | 1 | 2 | 3 {
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}
```

- [ ] **Step 2: 创建 client/src/components/GameListenChoose.tsx**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { PINYIN_DATA } from '../data/pinyin';
import { useAudio } from '../hooks/useAudio';
import { pickN, shuffle, starsForScore } from './gameUtils';
import { StarRating } from './StarRating';
import type { PinyinItem } from '../types';

interface Question {
  answer: PinyinItem;
  options: PinyinItem[];
}

const TOTAL_QUESTIONS = 10;

function buildQuestions(): Question[] {
  const picks = pickN(PINYIN_DATA, TOTAL_QUESTIONS);
  return picks.map(answer => {
    const distractors = pickN(PINYIN_DATA.filter(p => p.id !== answer.id), 3);
    return { answer, options: shuffle([answer, ...distractors]) };
  });
}

interface Props {
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

export function GameListenChoose({ onFinish }: Props) {
  const [questions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const { play } = useAudio();
  const current = questions[index];

  useEffect(() => {
    if (current) void play(current.answer.audioText);
  }, [current, play]);

  const stars = useMemo(() => starsForScore(correct, questions.length), [correct, questions.length]);

  function pick(option: PinyinItem) {
    if (feedback) return;
    const isRight = option.id === current.answer.id;
    if (isRight) setCorrect(c => c + 1);
    setFeedback(isRight ? 'right' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 >= questions.length) onFinish(correct + (isRight ? 1 : 0), starsForScore(correct + (isRight ? 1 : 0), questions.length));
      else setIndex(i => i + 1);
    }, 900);
  }

  if (!current) return null;

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#666' }}>
        第 {index + 1} / {questions.length} 题　答对：{correct}　<StarRating stars={stars} size={20} />
      </div>

      <h2 style={{ fontSize: 32, marginTop: 24 }}>听一听，选对的字母 👇</h2>
      <button
        onClick={() => void play(current.answer.audioText)}
        style={{ fontSize: 64, padding: 24, borderRadius: 32, border: 'none', background: '#ffd166', cursor: 'pointer', marginTop: 16 }}
        aria-label="再听一次"
      >
        🔊 再听一次
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 32 }}>
        {current.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => pick(opt)}
            disabled={!!feedback}
            style={{
              padding: 32, fontSize: 64, fontWeight: 'bold',
              borderRadius: 24, border: '4px solid #8ecae6', background: '#fff',
              cursor: feedback ? 'default' : 'pointer',
            }}
          >
            {opt.display}
          </button>
        ))}
      </div>

      {feedback === 'right' && <div style={{ fontSize: 48, marginTop: 16 }}>🎉 答对了！</div>}
      {feedback === 'wrong' && <div style={{ fontSize: 24, marginTop: 16, color: '#fb8500' }}>差一点，再听听看～ 正确：{current.answer.display}</div>}
    </div>
  );
}
```

- [ ] **Step 3: 创建 client/src/components/GameListenChoose.test.tsx**

```tsx
import { describe, it, expect } from 'vitest';
import { starsForScore } from './gameUtils';

describe('starsForScore', () => {
  it('returns 3 stars for >= 90%', () => {
    expect(starsForScore(9, 10)).toBe(3);
    expect(starsForScore(10, 10)).toBe(3);
  });
  it('returns 2 stars for 70-89%', () => {
    expect(starsForScore(7, 10)).toBe(2);
    expect(starsForScore(8, 10)).toBe(2);
  });
  it('returns 1 star for 50-69%', () => {
    expect(starsForScore(5, 10)).toBe(1);
    expect(starsForScore(6, 10)).toBe(1);
  });
  it('returns 0 stars for < 50%', () => {
    expect(starsForScore(4, 10)).toBe(0);
    expect(starsForScore(0, 10)).toBe(0);
  });
});
```

- [ ] **Step 4: 运行测试**

Run: `npm --workspace client run test`
Expected: 全部 passed

- [ ] **Step 5: 提交**

```bash
git add client/src/components/gameUtils.ts client/src/components/GameListenChoose.tsx client/src/components/GameListenChoose.test.tsx
git commit -m "feat(client): add listen-choose game"
```

---

## Task 17: 游戏 2 - 看图选拼音（GameImageChoose）+ 游戏 3 - 翻牌配对（GameMemoryFlip）

**Files:**
- Create: `client/src/components/GameImageChoose.tsx`
- Create: `client/src/components/GameMemoryFlip.tsx`

- [ ] **Step 1: 创建 client/src/components/GameImageChoose.tsx**

```tsx
import { useMemo, useState } from 'react';
import { PINYIN_DATA } from '../data/pinyin';
import { pickN, shuffle, starsForScore } from './gameUtils';
import { EmojiTile } from './EmojiTile';
import { StarRating } from './StarRating';
import type { ExampleWord } from '../types';

interface Question {
  answer: ExampleWord;
  options: string[]; // 拼音字符串
}

const TOTAL_QUESTIONS = 10;

function buildQuestions(): Question[] {
  const allWords = PINYIN_DATA.flatMap(p => p.examples);
  const seen = new Set<string>();
  const unique = allWords.filter(w => {
    if (seen.has(w.hanzi)) return false;
    seen.add(w.hanzi);
    return true;
  });
  const picks = pickN(unique, TOTAL_QUESTIONS);
  return picks.map(answer => {
    const distractors = pickN(unique.filter(w => w.pinyin !== answer.pinyin), 3).map(w => w.pinyin);
    return { answer, options: shuffle([answer.pinyin, ...distractors]) };
  });
}

interface Props {
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

export function GameImageChoose({ onFinish }: Props) {
  const [questions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const current = questions[index];
  const stars = useMemo(() => starsForScore(correct, questions.length), [correct, questions.length]);

  function pick(option: string) {
    if (feedback) return;
    const isRight = option === current.answer.pinyin;
    if (isRight) setCorrect(c => c + 1);
    setFeedback(isRight ? 'right' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 >= questions.length) {
        const final = correct + (isRight ? 1 : 0);
        onFinish(final, starsForScore(final, questions.length));
      } else setIndex(i => i + 1);
    }, 900);
  }

  if (!current) return null;

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#666' }}>
        第 {index + 1} / {questions.length} 题　答对：{correct}　<StarRating stars={stars} size={20} />
      </div>
      <h2 style={{ fontSize: 32, marginTop: 24 }}>看图，选对的拼音 👇</h2>
      <div style={{ marginTop: 16 }}>
        <EmojiTile emoji={current.answer.emoji} size={160} />
        <div style={{ fontSize: 48, fontWeight: 'bold', marginTop: 8 }}>{current.answer.hanzi}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 24 }}>
        {current.options.map(opt => (
          <button
            key={opt}
            onClick={() => pick(opt)}
            disabled={!!feedback}
            style={{
              padding: 24, fontSize: 36, fontWeight: 'bold',
              borderRadius: 24, border: '4px solid #8ecae6', background: '#fff',
              cursor: feedback ? 'default' : 'pointer',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback === 'right' && <div style={{ fontSize: 48, marginTop: 16 }}>🎉 答对了！</div>}
      {feedback === 'wrong' && <div style={{ fontSize: 24, marginTop: 16, color: '#fb8500' }}>正确答案：{current.answer.pinyin}</div>}
    </div>
  );
}
```

- [ ] **Step 2: 创建 client/src/components/GameMemoryFlip.tsx**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { PINYIN_DATA } from '../data/pinyin';
import { useAudio } from '../hooks/useAudio';
import { pickN, shuffle, starsForScore } from './gameUtils';
import { StarRating } from './StarRating';

interface Card {
  uid: string;        // 唯一标识（用于 React key）
  pinyinId: string;   // 配对依据
  display: string;
  audioText: string;
}

const PAIRS_COUNT = 6; // 6 对 = 12 张

function buildDeck(): Card[] {
  const picks = pickN(PINYIN_DATA, PAIRS_COUNT);
  const cards: Card[] = picks.flatMap((p, i) => ([
    { uid: `${p.id}-a-${i}`, pinyinId: p.id, display: p.display, audioText: p.audioText },
    { uid: `${p.id}-b-${i}`, pinyinId: p.id, display: p.display, audioText: p.audioText },
  ]));
  return shuffle(cards);
}

interface Props {
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

export function GameMemoryFlip({ onFinish }: Props) {
  const [deck] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<string[]>([]);   // 当前翻开的 uid（最多 2 张）
  const [matched, setMatched] = useState<Set<string>>(new Set()); // 已配对的 uid 集合
  const [tries, setTries] = useState(0);
  const { play } = useAudio();

  const isDone = matched.size === deck.length;

  // 评分：尝试越少星越高（最少 PAIRS_COUNT 次）
  const stars = useMemo<0 | 1 | 2 | 3>(() => {
    if (!isDone) return 0;
    if (tries <= PAIRS_COUNT + 2) return 3;
    if (tries <= PAIRS_COUNT + 5) return 2;
    if (tries <= PAIRS_COUNT + 9) return 1;
    return 0;
  }, [isDone, tries]);

  useEffect(() => {
    if (isDone) onFinish(matched.size / 2, stars);
  }, [isDone, matched.size, stars, onFinish]);

  function flip(card: Card) {
    if (flipped.length === 2) return;
    if (flipped.includes(card.uid)) return;
    if (matched.has(card.uid)) return;

    void play(card.audioText);
    const next = [...flipped, card.uid];
    setFlipped(next);

    if (next.length === 2) {
      setTries(t => t + 1);
      const [a, b] = next.map(uid => deck.find(c => c.uid === uid)!);
      if (a.pinyinId === b.pinyinId) {
        setTimeout(() => {
          setMatched(m => new Set([...m, a.uid, b.uid]));
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#666' }}>
        翻牌次数：{tries}　已配对：{matched.size / 2} / {PAIRS_COUNT}　<StarRating stars={stars} size={20} />
      </div>
      <h2 style={{ fontSize: 28, marginTop: 16 }}>找出两张相同的拼音卡片 🃏</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
        {deck.map(card => {
          const open = flipped.includes(card.uid) || matched.has(card.uid);
          return (
            <button
              key={card.uid}
              onClick={() => flip(card)}
              style={{
                aspectRatio: '1', fontSize: 40, fontWeight: 'bold',
                borderRadius: 16, border: '3px solid #8ecae6',
                background: matched.has(card.uid) ? '#d8f3dc' : (open ? '#fff' : '#ffd166'),
                cursor: open ? 'default' : 'pointer',
              }}
            >
              {open ? card.display : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add client/src/components/GameImageChoose.tsx client/src/components/GameMemoryFlip.tsx
git commit -m "feat(client): add image-choose and memory-flip games"
```

---

## Task 18: GamePage（游戏选择 + 结算页）

**Files:**
- Create: `client/src/pages/GamePage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: 创建 client/src/pages/GamePage.tsx**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { GameListenChoose } from '../components/GameListenChoose';
import { GameImageChoose } from '../components/GameImageChoose';
import { GameMemoryFlip } from '../components/GameMemoryFlip';
import { StarRating } from '../components/StarRating';
import type { GameType } from '../types';

type Phase = 'select' | 'playing' | 'result';

interface Result {
  gameType: GameType;
  score: number;
  stars: 0 | 1 | 2 | 3;
  isNewBest: boolean;
}

export function GamePage() {
  const { user, logout } = useUser();
  const { gameScores, recordGame } = useProgress(user?.id);
  const [phase, setPhase] = useState<Phase>('select');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const navigate = useNavigate();
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  async function finish(type: GameType, score: number, stars: 0 | 1 | 2 | 3) {
    const r = await recordGame(type, score, stars);
    setResult({ gameType: type, score, stars, isNewBest: r?.isNewBest ?? false });
    setPhase('result');
  }

  function reset() {
    setPhase('select');
    setGameType(null);
    setResult(null);
  }

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      {phase === 'select' && (
        <div style={{ maxWidth: 720, margin: '24px auto', padding: 16, display: 'grid', gap: 16 }}>
          <h2 style={{ fontSize: 28, textAlign: 'center' }}>选个游戏来玩吧 🎮</h2>
          <GameButton emoji="🎧" label="听音选字母" color="#8ecae6" onClick={() => { setGameType('listen'); setPhase('playing'); }} />
          <GameButton emoji="🖼" label="看图选拼音" color="#fb8500" onClick={() => { setGameType('image'); setPhase('playing'); }} />
          <GameButton emoji="🃏" label="翻牌配对" color="#06d6a0" onClick={() => { setGameType('memory'); setPhase('playing'); }} />
          <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: 12, fontSize: 18, background: 'transparent', border: '2px solid #ccc', borderRadius: 12, cursor: 'pointer' }}>← 回首页</button>
        </div>
      )}

      {phase === 'playing' && gameType === 'listen' && <GameListenChoose onFinish={(s, st) => void finish('listen', s, st)} />}
      {phase === 'playing' && gameType === 'image' && <GameImageChoose onFinish={(s, st) => void finish('image', s, st)} />}
      {phase === 'playing' && gameType === 'memory' && <GameMemoryFlip onFinish={(s, st) => void finish('memory', s, st)} />}

      {phase === 'result' && result && (
        <div style={{ maxWidth: 480, margin: '40px auto', padding: 32, textAlign: 'center', background: '#fff', borderRadius: 24, border: '4px solid #ffd166' }}>
          <h2 style={{ fontSize: 36 }}>{result.isNewBest ? '🎉 新纪录！' : '游戏结束'}</h2>
          <div style={{ fontSize: 28, marginTop: 16 }}>得分：{result.score}</div>
          <div style={{ marginTop: 16 }}><StarRating stars={result.stars} size={56} /></div>
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button onClick={reset} style={{ flex: 1, padding: 16, fontSize: 20, borderRadius: 16, border: 'none', background: '#06d6a0', color: '#fff', cursor: 'pointer' }}>再玩一局</button>
            <button onClick={() => navigate('/')} style={{ flex: 1, padding: 16, fontSize: 20, borderRadius: 16, border: '2px solid #ccc', background: '#fff', cursor: 'pointer' }}>回首页</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GameButton({ emoji, label, color, onClick }: { emoji: string; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: 24, fontSize: 28, borderRadius: 24,
      border: `4px solid ${color}`, background: '#fff', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 48 }}>{emoji}</span>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: 修改 client/src/App.tsx 替换占位的 game 路由**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CardsPage } from './pages/CardsPage';
import { GamePage } from './pages/GamePage';
import { ProfilePage } from './pages/ProfilePage';
import { useUser } from './hooks/useUser';

function RequireUser({ children }: { children: JSX.Element }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireUser><HomePage /></RequireUser>} />
      <Route path="/cards" element={<RequireUser><CardsPage /></RequireUser>} />
      <Route path="/game" element={<RequireUser><GamePage /></RequireUser>} />
      <Route path="/profile" element={<RequireUser><ProfilePage /></RequireUser>} />
    </Routes>
  );
}
```

- [ ] **Step 3: 手工验证**

Run: `npm run dev`
- 进入"玩游戏"
- 三个游戏各玩一局，听到发音/看到图片/翻到卡片
- 看到结算页 ⭐ 数与"新纪录"提示
- 回首页头部 ⭐ 总数更新
- 进入"我的进度"看到游戏成绩

- [ ] **Step 4: 提交**

```bash
git add client/src/pages/GamePage.tsx client/src/App.tsx
git commit -m "feat(client): add GamePage with three games and result screen"
```

---

## Task 19: 端到端冒烟测试与最终验收

**Files:**
- Modify: `README.md`（补充手工验证清单）

- [ ] **Step 1: 全量测试**

Run: `npm test`
Expected: server 与 client 全部测试通过

- [ ] **Step 2: 全量启动一次**

Run: `npm run dev`
Expected: server 在 3001、client 在 5173 启动成功

- [ ] **Step 3: 手工冒烟（按下表逐项打勾）**

| 检查项 | 预期 |
|---|---|
| 首次访问 / | 跳到 /login |
| 输入昵称"小测"+选🐱 | 创建用户跳到 / |
| 刷新 | 仍在 / 登录态 |
| 学拼音 → 声母 → 点 b | 看到大字母 + 听到"波" + 示例字 |
| 学拼音 → 单韵母 → 点 a | 看到 ā á ǎ à 四个按钮，各自能点出声 |
| 学拼音 → 复韵母/整体认读 | 同上正常 |
| 玩游戏 → 听音选字母 | 10 题完成 → 结算 ⭐ |
| 玩游戏 → 看图选拼音 | 10 题完成 → 结算 ⭐ |
| 玩游戏 → 翻牌配对 | 6 对完成 → 结算 ⭐ |
| 我的进度 | 已学拼音网格高亮、游戏最高分 |
| 在另一浏览器用同昵称登录 | 看到相同进度 |
| 退出登录 | 跳回 /login，localStorage 被清 |

- [ ] **Step 4: 更新 README.md 添加手工验证清单**

在现有 README 末尾追加：

````markdown
## 手工验收清单（v1）

- [ ] 首次访问跳转 /login
- [ ] 创建/登录账号成功，刷新保持登录态
- [ ] 拼音卡片：声母、单韵母、复韵母、整体认读 4 个 tab 都能点开示例字并听到发音
- [ ] 韵母/整体认读音节的 4 个音调按钮各自能发音
- [ ] 三个游戏（听音选字母 / 看图选拼音 / 翻牌配对）完整玩通一局
- [ ] 结算页正确显示星数与"新纪录"
- [ ] 我的进度页显示已学拼音与游戏最高分
- [ ] 同昵称在另一浏览器登录看到相同进度
````

- [ ] **Step 5: 提交**

```bash
git add README.md
git commit -m "docs: add v1 manual acceptance checklist"
```

- [ ] **Step 6: 打 v0.1 标签**

```bash
git tag v0.1.0
```

---

## Self-Review

**1. Spec coverage check:**
- 昵称登录 + emoji 头像 → Task 5 + Task 13 ✓
- 完整 63 个拼音 → Task 8 + Task 9 ✓
- 三种游戏 → Task 16 + Task 17 + Task 18 ✓
- 进度同步（SQLite）→ Task 4 + Task 6 + Task 11 ✓
- edge-tts + 文件缓存 → Task 7 ✓
- 数据完整性测试 + 核心组件测试 → Task 8/9（数据） + Task 12（StarRating/ToneButtons） + Task 16（gameUtils） ✓
- TTS fallback 到 Web Speech API → Task 11（useAudio） ✓
- in-flight 去重 → Task 7 ✓
- 乐观更新 → Task 11 ✓
- 安全说明（昵称无密码） → Task 1（README） + Task 13（登录页提示） ✓

**2. Placeholder scan:** 无 TODO/TBD；所有代码块完整。

**3. Type consistency:** `User`、`PinyinItem`、`GameType` 等类型在 client/server 中一致；`AppDeps` 在 Task 5 引入后 Task 6/7 一直延用；service 与 route 工厂的命名（`UserService.upsertByNickname`、`ProgressService.recordPinyinLearned`）首尾一致。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-21-pinyin-learning-v1.md`.**

两种执行选项：

1. **Subagent-Driven (recommended)** — 每个任务派出独立 subagent 执行，任务间审查，迭代快
2. **Inline Execution** — 在当前 session 中按 executing-plans 模式批量执行，关键节点 checkpoint
