# AGENTS.md

本文件用于指导 AI coding agents 在本仓库内工作。适用范围为仓库根目录及所有子目录。

## 项目概览

这是一个面向 3-5 岁儿童的拼音学习 **iOS 离线 App**，基于 Capacitor 打包，本地存储 + 打包音频 + TTS：

- 仓库根目录即为该 App 的 web 层（React 18 + Vite + TypeScript）。
- `src/`：React 前端源码（页面、组件、hooks、数据、工具、本地存储层）。
- `public/audio/pinyin/`：打包进 App 的静态拼音 mp3。
- `ios/`：Capacitor 生成的原生 iOS 工程。
- `capacitor.config.ts`：Capacitor 配置（`webDir: dist`）。
- `docs/superpowers/specs/` 与 `docs/superpowers/plans/`：历史需求、设计和实现计划，可作为功能背景参考。

核心产品功能包括昵称登录、拼音卡片、拼读/跟读、三个游戏、英文字母 A–Z 模块、学习进度和 TTS/静态音频播放。数据全部存储在设备本地，无后端。

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
npm run dev        # Vite 开发预览，便于快速迭代
npm run build      # tsc 类型检查 + vite build
npm test           # vitest run

npm run cap:sync   # build 后 npx cap sync ios，同步到原生工程
npm run cap:open   # 打开 Xcode
```

首次初始化 iOS 平台（仅一次）：

```bash
npx cap add ios
```

开发端口：

- Vite 开发预览：`http://localhost:5173`

构建期环境变量（`.env`，会被打进 app bundle，注意 key 安全）：

- `VITE_AZURE_SPEECH_KEY`：Azure Speech 资源 key（联网 TTS 必需）。
- `VITE_AZURE_SPEECH_ENDPOINT`：Azure Speech 资源端点 URL（联网 TTS 必需）。
- `VITE_AZURE_SPEECH_VOICE`：可选，覆盖默认音色（默认 `zh-CN-XiaoxiaoNeural`）。

## 架构约定

- 页面入口在 `src/pages/`，路由定义在 `src/App.tsx`。
- 可复用 UI 与交互组件在 `src/components/`。
- 业务 hooks 在 `src/hooks/`，例如 `useUser`、`useAudio`、`useProgress`、`useReciter`、`useKaraoke`。
- 本地存储适配层在 `src/api/`（`users`、`progress`），底层持久化在 `src/storage/`（基于 Capacitor Preferences）。
- TTS 相关：`src/audio/`（Azure Speech 客户端 `azureTts.ts` 与 SSML 构造 `ssml.ts`）。
- 拼音与字母数据集中在 `src/data/`（`pinyin.ts`、`letters.ts`、`letterStrokes.ts`），相关类型在 `src/types.ts`。
- 拼音、拆音、分词、进度等纯逻辑放在 `src/utils/`，优先给这些纯函数补测试。
- 音频优先使用 `public/audio/pinyin/` 静态 mp3；缺失时回退到 Azure Speech，再回退到原生 iOS TTS。

## 代码风格

- 使用 TypeScript strict 模式，尽量保持类型边界清晰。
- 项目为 ESM。
- 优先复用现有 hooks、本地存储 helper、类型和工具函数，不要为小改动引入新框架或大抽象。
- 对儿童学习界面，保持文案短、直观、温和；交互要适合低龄儿童和家长陪伴使用。
- 样式优先沿用现有 CSS 和组件风格；注意移动端、可点击区域、动画降级和文本不溢出。
- 涉及音频播放时，同时考虑静态拼音音频、Azure TTS fallback、原生 TTS fallback、WebView 自动播放限制和失败降级。

## 测试与验证

- 根目录 `npm test` 运行 Vitest。
- 前端测试使用 Vitest + React Testing Library + jsdom，测试文件通常与源码同目录。
- 修改纯逻辑、本地存储行为、音频 URL 规则或关键 UI 交互时，应补充或更新对应测试。
- 修改共享类型或构建配置后，运行 `npm run build`。
- 修改视觉或交互体验后，除自动测试外，还应手动跑 `npm run dev` 检查主要流程；涉及原生能力（TTS、打包音频）时需 `npm run cap:sync` 后在 Xcode 模拟器/真机验证。

优先级参考：

- 只改文档：检查文档内容即可，一般不需要跑测试。
- 只改纯函数：跑 `npm test`。
- 改组件/hook：跑 `npm test`，必要时跑 `npm run build`。
- 改数据/构建配置：跑 `npm test` 和 `npm run build`。
- 改原生/音频/TTS 链路：额外 `npm run cap:sync` 并在 Xcode 中验证。

## 数据与安全

- 当前登录方式是昵称无密码登录；相同昵称会访问同一本地账号进度。不要在存储或 UI 中引导用户输入隐私信息。
- 本地生成音频、缓存和临时文件不应提交，除非用户明确要求保存特定资产。
- `.env` 中的 `VITE_AZURE_*` 会被打进 app bundle，存在被逆向提取的风险；使用受限/可轮换的 key，不要提交 `.env`。
- TTS 输入会进入 SSML/合成路径；改动时必须保留输入校验和失败 fallback（Azure → 原生 TTS → 静态音频）。

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
- 英文字母 A–Z 模块可听读字母名、查看笔顺动画、例词与描红练习。
- 三个游戏均能完整玩一局，结算页显示星数和新纪录。
- `/profile` 能看到已学拼音与游戏最高分。
- 启用系统“减少动画”时，界面仍可用，关键高亮反馈仍保留。
