# 拼音学习网站 - 第一版设计文档

**日期：** 2026-04-21
**目标用户：** 学龄前儿童（3-5 岁）零基础学习拼音
**形态：** Web 前端 + Node 后端

---

## 1. 概述

一个面向学龄前儿童的拼音学习网站，包含**拼音卡片浏览**和**三种小游戏**两大核心功能，使用昵称登录记录学习进度，发音由后端通过 edge-tts 生成并缓存。

### 1.1 第一版交付范围

✅ **包含：**
- 昵称登录 + emoji 头像（无密码）
- 完整拼音卡片浏览（63 个拼音）
- 三种游戏：听音选字母、看图选拼音、翻牌配对
- 进度同步（SQLite）
- edge-tts 后端发音 + 文件缓存
- 数据完整性测试 + 核心组件测试

❌ **不做（留给后续迭代）：**
- 录音跟读 / 发音评测
- 家长后台 / 学习报告
- 拼读训练（声母+韵母拼合）
- 国际化、暗色模式
- 部署脚本（仅本地跑通）
- PWA / 离线支持

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite + React + TypeScript |
| 后端 | Express + TypeScript |
| 数据库 | SQLite（`better-sqlite3`） |
| TTS | edge-tts 开源项目（npm 包，如 `msedge-tts`） |
| 图片素材 | Twemoji（SVG emoji，CC-BY 4.0） |
| 测试 | Vitest + React Testing Library + supertest |
| Monorepo | npm workspaces |

---

## 3. 项目结构

```
pinyin-learning/
├── client/                      # 前端
│   ├── src/
│   │   ├── pages/              # Login / Home / Cards / Game / Profile
│   │   ├── components/         # PinyinCard, ToneButtons, AudioButton, ...
│   │   ├── data/pinyin.ts      # 拼音静态数据
│   │   ├── hooks/              # useUser, useAudio, useProgress
│   │   ├── api/                # fetch 封装
│   │   └── styles/
│   ├── vite.config.ts          # /api 代理到 server
│   └── package.json
│
├── server/                      # 后端
│   ├── src/
│   │   ├── index.ts            # Express 启动
│   │   ├── routes/
│   │   │   ├── tts.ts
│   │   │   ├── users.ts
│   │   │   └── progress.ts
│   │   ├── services/
│   │   │   ├── edgeTts.ts
│   │   │   └── db.ts
│   │   └── db/schema.sql
│   ├── cache/                  # 音频缓存（gitignore）
│   ├── data/pinyin.db          # SQLite（gitignore）
│   └── package.json
│
├── docs/superpowers/specs/
├── package.json                 # workspaces + 并发启动脚本
└── README.md
```

---

## 4. 数据模型

### 4.1 SQLite 数据库

```sql
-- 用户表（昵称无密码）
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE NOT NULL,
  avatar TEXT,                  -- emoji 头像
  created_at INTEGER NOT NULL
);

-- 拼音学习进度
CREATE TABLE pinyin_progress (
  user_id INTEGER NOT NULL,
  pinyin TEXT NOT NULL,
  learned_count INTEGER DEFAULT 0,
  last_learned_at INTEGER,
  PRIMARY KEY (user_id, pinyin),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 游戏得分
CREATE TABLE game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL,      -- 'listen' | 'image' | 'memory'
  score INTEGER NOT NULL,
  stars INTEGER NOT NULL,       -- 0-3
  played_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.2 前端拼音数据结构

```ts
export type PinyinCategory = 'initial' | 'simple-final' | 'compound-final' | 'whole-syllable';

export interface PinyinItem {
  id: string;                   // 'b', 'a', 'ai', 'zhi'
  display: string;              // 卡片正面文本
  category: PinyinCategory;
  hasTones: boolean;            // 声母 false；韵母/整体认读 true
  tones?: ToneVariant[];        // 4 个声调
  audioText: string;            // 用什么汉字读出此拼音（如 b → "波"）
  examples: ExampleWord[];      // 2-3 个示例字
}

export interface ToneVariant {
  tone: 1 | 2 | 3 | 4;
  text: string;                 // 'ā' / 'á' / 'ǎ' / 'à'
  audioText: string;            // 对应单字（如 ā → "啊"）
}

export interface ExampleWord {
  hanzi: string;                // '爸'
  pinyin: string;               // 'bà'（带音调）
  tone: 1 | 2 | 3 | 4 | 0;      // 0 = 轻声
  emoji: string;                // '👨'
}
```

### 4.3 内容范围（约 63 个拼音）

| 类别 | 数量 | 内容 |
|---|---|---|
| 声母 initial | 23 | b p m f d t n l g k h j q x zh ch sh r z c s y w |
| 单韵母 simple-final | 6 | a o e i u ü |
| 复韵母 compound-final | 18 | ai ei ui ao ou iu ie üe er an en in un ün ang eng ing ong |
| 整体认读 whole-syllable | 16 | zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying |

每个拼音配 2-3 个示例字 + Twemoji。

### 4.4 音调说明

- 声母（b/p/m...）本身不带音调
- 韵母 / 整体认读音节有 4 个音调：ā á ǎ à
- 复韵母音调标在主元音上（ai → āi/ái/ǎi/ài）
- 示例字必带音调

---

## 5. 页面与组件

### 5.1 页面（5 个）

| 路由 | 名称 | 内容 |
|---|---|---|
| `/login` | Login | 昵称输入 + emoji 头像选择（8-12 个候选） |
| `/` | Home | 头像/昵称/⭐总数 + 三个大按钮（学拼音/玩游戏/我的进度） |
| `/cards` | Cards | Tab 切换 4 类 → 网格 → 详情大卡片，带 ⭐ 已学标记 |
| `/game` | Game | 选游戏 → 进入对应玩法（10 题/局，0-3 ⭐评分） |
| `/profile` | Profile | 已学拼音网格、各游戏最高分、退出登录 |

### 5.2 核心组件

| 组件 | 职责 |
|---|---|
| `<NicknameLogin>` | 昵称 + 头像表单 |
| `<TopBar>` | 顶部用户栏（头像/昵称/星数） |
| `<PinyinCard>` | 详情大卡片（声母/韵母两种变体） |
| `<PinyinGrid>` | 网格列出某类别拼音 |
| `<ToneButtons>` | 4 个音调按钮 ā á ǎ à |
| `<AudioButton>` | 🔊 按钮，封装 useAudio |
| `<ExampleWord>` | emoji + 汉字 + 拼音 |
| `<EmojiTile>` | Twemoji 渲染 |
| `<StarRating>` | 0-3 ⭐ |
| `<GameListenChoose>` | 听音选字母游戏 |
| `<GameImageChoose>` | 看图选拼音游戏 |
| `<GameMemoryFlip>` | 翻牌配对游戏 |

### 5.3 自定义 Hooks

- `useUser()` — localStorage 读写当前 userId/nickname/avatar
- `useAudio(text)` — 调 `/api/tts`，带 Blob 缓存
- `useProgress()` — 与 server 同步进度，支持本地乐观更新
- `usePinyinData(category?)` — 读静态拼音数据

### 5.4 视觉风格（学龄前友好）

- 大圆角（24px+）、大字体（拼音卡 100px+、按钮文字 28px+）
- 明亮配色（黄/粉/蓝），白底 + 卡片彩色边框
- 按钮点击有缩放/弹跳动画
- 答对 🎉 粒子效果，答错给温和的"再试一次"提示

---

## 6. API 设计

所有接口位于 `/api/*`，前端通过 Vite 代理转发到 server。

### 6.1 用户

```
POST /api/users
Body: { nickname: string, avatar: string }
- 昵称存在则返回该用户；不存在则创建
Response: { id, nickname, avatar }

GET /api/users/:id
Response: { id, nickname, avatar }
```

### 6.2 进度

```
GET /api/progress/:userId
Response: {
  pinyinProgress: [{ pinyin, learnedCount, lastLearnedAt }],
  gameScores: [{ gameType, bestScore, bestStars }]
}

POST /api/progress/:userId/pinyin
Body: { pinyin: string }
Response: { pinyin, learnedCount }

POST /api/progress/:userId/game
Body: { gameType, score, stars }
Response: { id, gameType, score, stars, isNewBest: boolean }
```

### 6.3 TTS

```
GET /api/tts?text=<urlencoded>&voice=zh-CN-XiaoxiaoNeural
- 默认 voice: zh-CN-XiaoxiaoNeural
- 流程：
  1. hash = sha256(text + voice)
  2. 检查 server/cache/{hash}.mp3
  3. 不存在则调 edge-tts 生成、写入缓存
  4. 返回 mp3 流，Content-Type: audio/mpeg
  5. Cache-Control: public, max-age=31536000
- 错误：
  - text 为空 → 400
  - edge-tts 失败 → 503，前端 fallback Web Speech API
```

### 6.4 错误响应统一格式

```json
{ "error": { "code": "INVALID_INPUT", "message": "..." } }
```

---

## 7. 关键交互流

### 7.1 首次访问

1. 进入 → 检测 localStorage 无 userId → 跳 `/login`
2. 用户输入昵称、选 emoji 头像 → POST `/api/users`
3. 拿到 userId → 写 localStorage → 跳 `/`
4. 顶部 GET `/api/progress/:userId` 拉取已有进度

### 7.2 浏览拼音卡片

1. 进入 `/cards` → 默认显示"声母"Tab
2. 点击某拼音卡片 → 详情大卡片
3. 点击 🔊 → 前端调 `/api/tts?text=波`（声母用 audioText）
4. 浏览结束（点 ✓ 或下一个）→ POST `/api/progress/:userId/pinyin` 累加学习次数

### 7.3 玩游戏（以"听音选字母"为例）

1. 选游戏 → 随机抽 10 题
2. 每题：播放某拼音发音 → 显示 4 个选项 → 用户点选
3. 答对 🎉 +分；答错温和提示，不扣分但记录正确率
4. 10 题结束 → 计算 ⭐（≥9 对 = 3⭐, ≥7 对 = 2⭐, ≥5 对 = 1⭐, 其他 0⭐）
5. POST `/api/progress/:userId/game`，若是新高显示"新纪录！"

### 7.4 TTS 缓存

- 同一段文本第二次请求直接读磁盘缓存
- 服务端用 in-flight Map 去重，避免并发请求打爆 edge-tts

---

## 8. 错误处理与边界情况

| 场景 | 处理 |
|---|---|
| TTS 服务不可用 | 前端 catch 后 fallback `window.speechSynthesis` |
| 网络中断 | 进度操作"乐观更新"：本地先更新，请求失败入队重试 |
| 昵称冲突 | 不视为错误，提示"该昵称已被使用，进入会看到 ta 的进度，是否继续？" |
| localStorage 被清 | 自动跳回 `/login` |
| 同一 mp3 并发请求 | server in-flight Map 去重 |
| 游戏中切走页面 | 暂停音频和倒计时，回来后不自动恢复 |

---

## 9. 测试策略

### 9.1 Server 测试

- **单元测试**：`edgeTts.ts` 缓存逻辑（mock edge-tts）
- **集成测试**：supertest 测试 routes，使用 SQLite `:memory:` 临时库
- **框架**：Vitest

### 9.2 Client 测试

- **组件测试**：Vitest + React Testing Library 覆盖：
  - `<PinyinCard>` 两种变体
  - `<ToneButtons>` 点击触发回调
  - 三个游戏组件的判分逻辑
- **数据完整性测试**：遍历 `pinyin.ts`，断言：
  - 每个 `PinyinItem` 满足 schema
  - id 全局唯一
  - 示例字数量 ≥ 1
  - `hasTones=true` 时必须有 `tones`

### 9.3 手工验证清单（README 中说明）

- Chrome / Safari 打开 OK
- 扬声器能听到拼音和示例字发音
- 三个游戏都能玩通一局
- 同昵称在不同设备登录看到相同进度

---

## 10. 安全说明（写入 README 与登录页）

> 本网站为儿童学习工具，**昵称无密码登录**。任何人输入相同昵称即可访问该账号下的进度记录。请勿存储隐私信息。

---

## 11. 启动方式（README 摘要）

```bash
# 安装依赖
npm install

# 同时启动前后端（开发模式）
npm run dev
# - 前端: http://localhost:5173
# - 后端: http://localhost:3001

# 单独启动
npm run dev:client
npm run dev:server

# 测试
npm test
```
