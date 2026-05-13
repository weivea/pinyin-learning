# AGENTS.md

本文件用于指导 AI coding agents 在本仓库内工作。适用范围为仓库根目录及所有子目录。

## 项目概览

这是一个面向 3-5 岁儿童的拼音学习网站，采用 npm workspaces 管理前后端：

- `client/`：React 18 + Vite + TypeScript 前端。
- `server/`：Express + TypeScript 后端。
- `server/src/db/schema.sql`：SQLite 表结构，运行时由 `better-sqlite3` 初始化。
- `server/audio/pinyin/`：静态拼音 mp3，供 `/api/audio/pinyin/*` 使用。
- `docs/superpowers/specs/` 与 `docs/superpowers/plans/`：历史需求、设计和实现计划，可作为功能背景参考。
- `poc/audio-tts/`：TTS 音频生成/对比实验，不要和主产品逻辑混在一起。

核心产品功能包括昵称登录、拼音卡片、拼读/跟读、三个游戏、学习进度和 TTS/静态音频播放。

## Web Search Policy

以下规则仅适用于 Claude/Copilot 等配置了 `WebSearch` deny hook 的环境，**不适用于 Codex**。

Codex 中需要联网检索时，按 Codex 当前会话的可用工具和上层指令执行。

在 Claude/Copilot 环境中，**禁止使用内置 `WebSearch` 工具。** 所有网络搜索必须通过 Copilot CLI 完成。

当需要搜索网络信息时，使用以下 Bash 命令：

```bash
copilot -p "Search the web for: <你的搜索查询>" --allow-all-tools
```

示例：

```bash
# 搜索最新的 Python 3.13 特性
copilot -p "Search the web for: Python 3.13 new features 2026" --allow-all-tools

# 搜索某个库的文档
copilot -p "Search the web for: LangGraph documentation agent orchestration" --allow-all-tools

# 搜索错误信息
copilot -p "Search the web for: TypeError cannot unpack non-sequence NoneType Python fix" --allow-all-tools
```

规则：

- 在 Claude/Copilot 环境中，**永远不要** 调用 `WebSearch` 工具。
- 在 Claude/Copilot 环境中，**始终** 使用 `copilot -p` 命令来执行网络搜索。
- 在 Codex 环境中，不要套用本节的 Copilot CLI 限制。
- 搜索查询优先使用英文以获得更好的结果。
- 将搜索结果整理后呈现给用户。

## 常用命令

在仓库根目录执行：

```bash
npm install
npm run dev
npm run build
npm test
```

工作区命令：

```bash
npm --workspace client run dev
npm --workspace client run build
npm --workspace client run test
npm --workspace server run dev
npm --workspace server run build
npm --workspace server run test
```

默认开发端口：

- 前端 Vite：`http://localhost:5173`
- 后端 Express：`http://localhost:3001`
- Vite 将 `/api` 代理到后端。

后端运行时环境变量：

- `PORT`：后端端口，默认 `3001`。
- `DB_PATH`：SQLite 数据库路径，默认 `./data/pinyin.db`。
- `TTS_CACHE_DIR`：Edge TTS mp3 缓存目录，默认 `./cache`。
- `PINYIN_AUDIO_DIR`：静态拼音音频目录，默认 `./audio/pinyin`。

## 架构约定

### 前端

- 页面入口在 `client/src/pages/`，路由定义在 `client/src/App.tsx`。
- 可复用 UI 与交互组件在 `client/src/components/`。
- 业务 hooks 在 `client/src/hooks/`，例如 `useUser`、`useAudio`、`useProgress`、`useReciter`。
- API 客户端放在 `client/src/api/`，统一通过 `apiFetch` 处理 JSON 请求和错误。
- 拼音数据集中在 `client/src/data/pinyin.ts`，相关类型在 `client/src/types.ts`。
- 拼音、拆音、分词等纯逻辑放在 `client/src/utils/`，优先给这些纯函数补测试。

### 后端

- `server/src/index.ts` 只负责读取环境变量、创建依赖并启动服务。
- `server/src/app.ts` 负责组装 Express app 和路由，测试中优先调用 `createApp`。
- 路由放在 `server/src/routes/`，业务逻辑放在 `server/src/services/`。
- 数据库连接和 schema 放在 `server/src/db/`。
- 后端接口统一挂在 `/api/*`：
  - `GET /api/health`
  - `/api/users`
  - `/api/progress`
  - `/api/tts`
  - `/api/audio/pinyin/:filename`

## 代码风格

- 使用 TypeScript strict 模式，尽量保持类型边界清晰。
- 前后端均为 ESM；导入本地后端 TS 模块时遵循现有 `.js` 后缀写法。
- 优先复用现有 hooks、API helper、类型和工具函数，不要为小改动引入新框架或大抽象。
- 对儿童学习界面，保持文案短、直观、温和；交互要适合低龄儿童和家长陪伴使用。
- 前端样式优先沿用现有 CSS 和组件风格；注意移动端、可点击区域、动画降级和文本不溢出。
- 涉及音频播放时，同时考虑静态拼音音频、Edge TTS fallback、浏览器自动播放限制和失败降级。
- 不要把实验性 POC 代码直接搬进主流程；需要迁移时先提炼成小而清晰的模块。

## 测试与验证

- 根目录 `npm test` 会先跑 server 测试，再跑 client 测试。
- 前端测试使用 Vitest + React Testing Library + jsdom，测试文件通常与源码同目录。
- 后端测试使用 Vitest + Supertest，测试文件在 `server/tests/`。
- 修改纯逻辑、API 参数校验、数据库行为、音频 URL 规则或关键 UI 交互时，应补充或更新对应测试。
- 修改共享类型或构建配置后，运行 `npm run build`。
- 修改视觉或交互体验后，除自动测试外，还应手动跑 `npm run dev` 检查主要流程。

优先级参考：

- 只改文档：检查文档内容即可，一般不需要跑测试。
- 只改纯函数：跑相关 workspace 测试。
- 改前端组件/hook：跑 `npm --workspace client run test`，必要时跑前端 build。
- 改后端路由/service/db：跑 `npm --workspace server run test`，必要时跑后端 build。
- 改跨端 API 合约：跑 `npm test` 和 `npm run build`。

## 数据与安全

- 当前登录方式是昵称无密码登录；相同昵称会访问同一账号进度。不要在数据库或 UI 中引导用户输入隐私信息。
- 本地数据库、TTS 缓存、生成音频和临时文件不应提交，除非用户明确要求保存特定资产。
- `/api/audio/pinyin/:filename` 只允许安全的 mp3 文件名；改动该路由时保持目录穿越防护。
- `/api/tts` 的 query 参数会进入 SSML/TTS 生成路径；改动时必须保留输入校验和失败 fallback。

## 工作流程建议

- 开始任务前先读相关文件和现有测试，避免凭猜测改动。
- 尽量把改动限制在用户要求涉及的模块内，不顺手重构无关代码。
- 在脏工作区中工作时，不要覆盖或回滚用户已有改动。
- 提交前说明改了哪些文件、跑了哪些验证命令，以及未验证的原因。
- 如果需要新增依赖，先确认现有依赖无法覆盖该需求，并说明引入原因。

## 手工验收重点

面向完整产品流程时，优先检查：

- 首次访问跳转 `/login`，昵称登录后刷新仍保持登录态。
- `/cards` 中声母、单韵母、复韵母、整体认读均可浏览、播放和显示口诀/形象提示。
- 拼音音调按钮和例字播放正常；静态音频缺失时有合理 fallback。
- `/recite` 跟读/拼读流程可完成，播放状态和高亮同步。
- 三个游戏均能完整玩一局，结算页显示星数和新纪录。
- `/profile` 能看到已学拼音与游戏最高分。
- 启用系统“减少动画”时，界面仍可用，关键高亮反馈仍保留。
