# 汉语拼音字母背诵表 · 设计文档

- 日期：2026-04-29
- 范围：`client/` 前端新增页面，无后端、无数据库改动
- 不在范围：新增音频资产、修改 `pinyin.ts` 数据、修改 `/cards` / `/profile` / 游戏逻辑

## 目标

为 3-5 岁儿童增加一张"按小学拼音教学顺序排列的字母背诵表"，支持两种模式：

1. **挂图模式**（默认）：单页全表展示 4 个分组（声母 23 / 单韵母 6 / 复韵母 9 / 整体认读 16，共 54 个），点击任一字母可单独播放发音。
2. **跟读模式**：按选定范围（声母 / 单韵母 / 复韵母 / 整体认读 / 全部）从头到尾顺序自动播报，每个字母播完后停顿 1.5s 留给孩子跟读，到末尾自动停止。

非目标：

- 不记录"背诵"作为学习进度（不写后端、不影响 `/profile` 已学统计）
- 不提供速度档位（默认 1.5s 间隔已适合低龄）
- 不在背诵表内显示示例字 / emoji（保持挂图整齐感；详情查看仍走 `/cards`）

## 架构与文件清单

页面入口：在 `HomePage` 现有三个大按钮（学拼音 / 玩游戏 / 我的进度）后增加第 4 个大按钮 **📖 背诵表**，路由 `/recite`。

### 新增文件

```
client/src/
├── pages/
│   └── RecitePage.tsx          # 背诵表页面（挂图 + 跟读模式合一）
├── components/
│   ├── RecitationTable.tsx     # 挂图：4 个分组 + 锚点 + 字母网格
│   ├── RecitationCell.tsx      # 单个字母格子（高亮态 + 点击播放）
│   └── RecitationControls.tsx  # 跟读控制条：开始/暂停/重置 + 范围选择
└── hooks/
    └── useReciter.ts           # 跟读状态机
```

### 修改文件

```
client/src/
├── App.tsx                     # 注册 <Route path="/recite" .../>
└── pages/HomePage.tsx          # 新增第 4 个大按钮 "📖 背诵表"
```

不新增 npm 依赖；不动 `server/`；不动 `client/src/data/pinyin.ts`。

### 页面布局

```
TopBar
─────────────────────────────────
[锚点条]  声母 · 单韵母 · 复韵母 · 整体认读
─────────────────────────────────
[跟读控制条]
  范围: ( ) 全部  ( ) 声母  ( ) 单韵母  ( ) 复韵母  ( ) 整体认读
  [▶ 开始跟读]  [⏸ 暂停]  [↺ 重置]
─────────────────────────────────
[挂图]
  ## 声母 (23)        ← id="anchor-initial"
  [b] [p] [m] [f] [d] [t] [n] [l] ...
  ## 单韵母 (6)       ← id="anchor-simple-final"
  [a] [o] [e] [i] [u] [ü]
  ## 复韵母 (9)       ← id="anchor-compound-final"
  ...
  ## 整体认读 (16)    ← id="anchor-whole-syllable"
  ...
```

锚点条用 `<a href="#anchor-...">` 平滑滚动到对应分组。

## 组件契约

### `useReciter(items, options)` —— 跟读状态机

```ts
type ReciterStatus = 'idle' | 'playing' | 'paused' | 'finished';

interface UseReciterResult {
  status: ReciterStatus;
  currentIndex: number;        // -1 表示未开始
  start: () => void;           // idle/finished → playing；从 0 开始
  pause: () => void;           // playing → paused
  resume: () => void;          // paused → playing
  reset: () => void;           // → idle, currentIndex = -1
  playOne: (index: number) => void;  // 单击格子时单独播一个，不进入序列
}

interface ReciterOptions {
  gapMs?: number;              // 默认 1500：每字播完后停顿
  perItemTimeoutMs?: number;   // 默认 3000：单字播放硬超时（兜底）
  onItem?: (item, index) => Promise<void>;  // 实际播放函数，由外部注入
}
```

规则：

- `playing` 时再次调 `start` 是 no-op
- 到末尾 → `status = 'finished'`，`currentIndex` 停在最后一个
- `pause` 立即停止当前 timer 并暂停 audio；`resume` 从 `currentIndex` 继续，不重播当前字
- `reset` 在任何状态下都把 `status` 拉回 `idle`、`currentIndex` 拉回 `-1`
- 范围切换时，`RecitePage` 在 `useEffect` 里调 `reset()`

### 播放函数（外部注入）

```ts
async function playPinyinAudio(item: PinyinItem): Promise<void>;
```

- 复用现有 `pickAudio` 工具（与 `AudioButton` 一致）
- 监听 `<audio>.ended` 触发 resolve；`perItemTimeoutMs` 到期兜底 resolve
- 静态音频 404 / TTS 失败 / 网络错：内部 catch + warn，**resolve** 而不是 reject（不阻塞序列）

### `RecitationTable` Props

```ts
{
  groups: { category: PinyinCategory; label: string; items: PinyinItem[] }[];
  highlightId: string | null;       // 当前高亮的 item.id
  onCellClick: (item: PinyinItem) => void;  // 单击 = playOne
}
```

- 每个分组前挂 `id="anchor-{category}"`
- 高亮格子：橙色边框 + 浅黄背景 + 自动 `scrollIntoView({ block: 'center' })`
- 用 `React.memo` + 仅传 `isHighlight: boolean` 给 `RecitationCell`，避免跟读时整表重渲染

### `RecitationControls` Props

```ts
{
  status: ReciterStatus;
  scope: 'all' | PinyinCategory;
  onScopeChange: (scope) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}
```

按钮按 `status` 显示：

| status | 渲染 |
|---|---|
| idle / finished | [开始] |
| playing | [暂停] [重置] |
| paused | [继续] [重置] |

## 数据流

```
pinyin.ts (静态)
   │
   │ getByCategory(cat)
   ▼
RecitePage
  ├─ groups: 4 组数组（按教学顺序）
  ├─ scope state ('all' | category)
  └─ 派生 reciteItems = scope === 'all'
       ? [...声母, ...单韵母, ...复韵母, ...整体认读]
       : groups[scope]
            │
            ▼
       useReciter(reciteItems, { onItem: playPinyinAudio })
            │
            ├──► RecitationControls
            └──► RecitationTable (highlightId = reciteItems[currentIndex]?.id)
```

单一数据源：`reciteItems` 由 `scope` 派生；`useReciter` 只看一维数组，不感知分组。

### 跟读时序（单字周期）

```
t=0       高亮第 i 个 → scrollIntoView → playPinyinAudio(item) 开始
t=?       audio.ended OR perItemTimeoutMs(3000ms) 兜底 → 等 gapMs(1500ms)
t=?+gap   i++；若 i >= length 则 status='finished'；否则下一周期
```

### 单击 vs 跟读 并发

- `status === 'playing'` 时点击格子：忽略
- 其他状态点击格子：执行 `playOne`，独立播放，不影响序列状态

### 范围切换

- `scope` 改变 → `useEffect` 调 `reset()`
- 用户必须再点"开始"才会按新范围播放
- 范围 = "声母" 时，跟读高亮只会落在声母组；其他组的格子仍可单击 `playOne`

### 持久化

- 不写后端进度；不调 `learnPinyin`
- `scope` 选择不持久化（仅页面 state）

## 错误处理

| 场景 | 行为 |
|---|---|
| 静态音频 404 | `pickAudio` 兜底 → 走 TTS |
| TTS 失败 / 网络断 | catch + warn，`playPinyinAudio` resolve，序列继续 |
| `audio.ended` 不触发 | `perItemTimeoutMs = 3000ms` 强制 resolve |
| iOS Safari 自动播放限制 | "开始跟读"是用户手势，后续序列复用同手势链；首次进入页不自动播 |

核心原则：序列绝不卡死，单字失败即跳过。

### 组件卸载清理

`useReciter` 在 unmount 时：

- 清除 `setTimeout`
- 暂停当前 `<audio>` 并解绑 `ended`
- 设置 `cancelled` 标志防止 unmount 后 setState

实现：用 `useRef` 持有 timer id 和 audio 实例，`useEffect` 返回 cleanup。

### 边界情况

| 情况 | 行为 |
|---|---|
| 切范围时正在暂停 | `reset` → idle |
| 连续快速单击同格子 | `playOne` 内部停掉上一个再播下一个（ref 持有"单击播放"的 audio） |
| 跟读中按浏览器后退 | 路由卸载触发 cleanup |
| `finished` 后再点"开始" | 从头开始（不是从最后一个） |

### 无障碍 / 儿童友好

- 按钮 `aria-label` 中文（"开始跟读" / "暂停" / "重置"）
- 高亮格子 `aria-current="true"`
- 按钮最小点击区域 ≥ 56×56px（沿用现有 UI 尺寸）
- `prefers-reduced-motion` 时 `scrollIntoView` 用 `'auto'`

## 测试策略

沿用项目现有 `*.test.ts(x)` 风格（参考 `GameListenChoose.test.tsx` / `pickAudio.test.ts`）。

### `useReciter.test.ts`（必测）

`vi.useFakeTimers()` + mock `onItem` 立即 resolve：

| 用例 | 断言 |
|---|---|
| 初始状态 | `status='idle'`, `currentIndex=-1` |
| `start()` 从 0 开始 | `status='playing'`, `currentIndex=0`, `onItem` 收到 `(items[0], 0)` |
| 播完 + gap → 下一个 | advance `gapMs` → `currentIndex=1` |
| 到末尾自动 finished | `status='finished'`，不再调 `onItem` |
| `pause` 中止 timer | `playing` → `pause()` → advance → `currentIndex` 不变 |
| `resume` 从当前位置继续 | 不重播当前字 |
| `reset` 任何状态 → idle | `currentIndex=-1` |
| `playOne` 不影响序列 | playing 中：忽略；idle 中：独立播放，`currentIndex` 不变 |
| `onItem` reject | 序列继续推进 |
| `perItemTimeoutMs` 兜底 | `onItem` 永不 resolve，超时后照样推进 |
| unmount 清理 | 卸载后 advance，`onItem` 不再被调用 |

### `RecitationControls.test.tsx`（必测）

- status → 按钮渲染映射（见上表）
- 点击按钮触发对应回调
- 范围切换触发 `onScopeChange`

### 集成层（可选）

`RecitePage` + RTL + mock `playPinyinAudio`：

- 切换 scope → 渲染对应分组 + 重置状态
- 点"开始跟读" → 第一个字母获得高亮态

实现成本高就跳过，靠 hook 单测保底。

### 不测

- 真实音频播放（依赖浏览器）
- `scrollIntoView` 行为
- 视觉样式

## 验收清单

- [ ] 首页出现第 4 个大按钮"📖 背诵表"，点击进入 `/recite`
- [ ] 挂图模式下，54 个字母按 4 组完整展示，点击任一格子能听到发音
- [ ] 顶部锚点点击能平滑滚动到对应分组
- [ ] 跟读模式下，选择范围后点"开始"，字母按顺序高亮 + 播报，播完后停顿 1.5s
- [ ] 跟读到末尾自动停止，再点"开始"从头重来
- [ ] 暂停 / 继续 / 重置 行为符合状态机契约
- [ ] 范围切换时自动重置当前播放
- [ ] TTS / 音频失败时跟读不卡住，跳过继续
- [ ] 退出页面无残留音频
