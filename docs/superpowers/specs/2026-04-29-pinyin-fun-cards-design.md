# 拼音趣味卡片设计

日期：2026-04-29
作者：（brainstorming session）

## 背景与目标

现有拼音学习卡片（`CardsPage` + `PinyinCard`）只展示大号字符、音调按钮和示例汉字，对 3-5 岁儿童偏单调。本设计为每个声母、韵母、整体认读条目增加：

1. **形象化记忆**：emoji 形似图 + 一句"形似提示"
2. **口诀朗读**：经典/原创口诀 + 卡拉 OK 式高亮跟读
3. **轻动画**：入场弹入、emoji 晃头、字符弹跳

覆盖范围：**全量 63 个条目一次到位**（声母 23 / 单韵母 6 / 复韵母 18 / 整体认读 16）。

跳过项：角色昵称/性格、迷你故事、粒子奖励特效。

## 数据模型

在 `client/src/types.ts` 的 `PinyinItem` 上新增两个**可选**字段（向后兼容，未填的条目不影响渲染）。

```ts
export interface MnemonicAsset {
  emoji: string;          // 形象 emoji，如 '📻'
  hint: string;           // 形似提示文字（≤8 字），如 '像小喇叭'
  svgKey?: string;        // 预留：未来通过 svgKey 查内置 SVG 表替换 emoji
}

export interface RhymeData {
  text: string;            // 口诀文本，如 '听广播 b b b'
  tokens?: string[];       // 可选：人工指定节奏切片，覆盖默认切分
  audioText?: string;      // 可选：TTS 朗读用文本（与 text 不同时启用）
}

export interface PinyinItem {
  // ...现有字段
  mnemonic?: MnemonicAsset;
  rhyme?: RhymeData;
}
```

### Token 切分规则

`tokenize(text, override?)` 纯函数（位于 `client/src/utils/tokenize.ts`）：

1. 若 `override` 提供，直接返回 `override`
2. 否则按以下规则切分 `text`：
   - 中文字符（CJK Unified Ideographs）每字一个 token
   - ASCII 字母/数字按空白切分（`split(/\s+/)` 后过滤空串）
   - 标点和空白被跳过（不进 tokens 数组）
3. 返回顺序与原文一致

示例：
- `'听广播 b b b'` → `['听','广','播','b','b','b']`
- `'两扇门 m m m'` → `['两','扇','门','m','m','m']`
- override `['广播','广播','b','b','b']` → 直接返回

## 组件结构

### 新增文件

```
client/src/components/
  MnemonicSection.tsx     ← 形象 + 口诀 + 动画的容器
  RhymeKaraoke.tsx        ← 口诀文本卡拉 OK 高亮
client/src/hooks/
  useKaraoke.ts           ← 管理高亮节拍
client/src/utils/
  tokenize.ts             ← 默认切分规则
  tokenize.test.ts        ← 单元测试
```

### 改动文件

`client/src/components/PinyinCard.tsx` 仅追加一行挂载：

```tsx
<MnemonicSection mnemonic={item.mnemonic} rhyme={item.rhyme} pinyinId={item.id} />
```

放置位置：在 `ToneButtons` / `AudioButton` 之后、"试着读这些字"标题之前。

`client/src/types.ts`：扩展 `PinyinItem` 类型。

`client/src/data/pinyin.ts`：为 63 条逐一填入 `mnemonic` 和 `rhyme`（草稿见末尾附录）。

### 职责划分

- **`MnemonicSection`**（纯展示）
  - props：`{ mnemonic?: MnemonicAsset; rhyme?: RhymeData; pinyinId: string }`
  - 若 `mnemonic` 与 `rhyme` 均缺失 → 整段不渲染（兼容未填条目）
  - 顶部：大号 emoji（80px）+ 一行 hint 文字
  - 底部：`<RhymeKaraoke />` + "听口诀"按钮
  - 入场动画：以 `pinyinId` 作 `key`，强制重挂载触发 fade+slide 动画
  - 用 `prefers-reduced-motion` 媒体查询关闭动效

- **`RhymeKaraoke`**
  - props：`{ text: string; tokens?: string[]; isPlaying: boolean; durationMs: number }`
  - 内部调用 `tokenize(text, tokens)` 得到展示用 token 列表
  - 调用 `useKaraoke(tokens.length, isPlaying, durationMs)` 拿当前 index
  - 渲染：每个 token 一个 `<span>`，根据 index 给 active / past / future 三类样式

- **`useKaraoke(total, isPlaying, durationMs)`** hook
  - `isPlaying=true` 时启动 `requestAnimationFrame` 循环
  - 每帧计算 `elapsed = now - startTime`，`currentIndex = floor(elapsed / (durationMs / total))`，clamp 到 `[0, total-1]`
  - `isPlaying=false` 时取消 RAF 并复位 `currentIndex = -1`
  - 卸载时清理
  - 返回 `{ currentIndex }`

- **`tokenize(text, override?)`** 纯函数（带单测）
  - 用例：纯中文、纯英文、中英混合、含标点、含全角空格、override 五类

### 触发流程（口诀朗读）

```
用户点击「听口诀」按钮
  ↓
取 rhyme.audioText ?? rhyme.text，调 TTS 接口播放
  ↓
audio 元素 loadedmetadata → 取 duration*1000 作 durationMs
  ↓ （若取不到，兜底：300 * tokens.length）
setIsPlaying(true) → useKaraoke 推进高亮
  ↓
audio ended → setIsPlaying(false) → 高亮复位
```

## 动画与节拍

### 入场动画（`MnemonicSection` 容器）

- 切换条目时通过 React `key={item.id}` 强制重挂载
- CSS keyframes：240ms `cubic-bezier(.34,1.56,.64,1)`，从 `opacity:0; translateY(12px)` 到 `opacity:1; translateY(0)`

### Emoji 形象动画

- 静态：`font-size: 80px`，下方 hint 字号 18px
- 悬停（桌面）/ touchstart（移动）：`transform: rotate(-6deg) scale(1.08)`，过渡 200ms
- 点击 emoji：触发"晃头"keyframes（rotate -8°→8°→-4°→4°→0°，共 600ms），同时 TTS 朗读 `hint` 文本

### 主拼音字符弹跳（已有大字符）

- 复用 `useBumpKey` 思路：在 `PinyinCard` 给大字符 `<div>` 加一个 `key={bumpKey}`
- 切换条目或 `onLearned` 时 `setBumpKey(k => k+1)`，触发 250ms scale 1→1.15→1 弹跳
- （可选优化项，不阻塞主线 — 实施时可一起加）

### 卡拉 OK 高亮（口诀）

- active token：`color: #fb8500; transform: scale(1.15); text-shadow: 0 0 8px rgba(251,133,0,.4)`
- past token：`color: #999`
- future token：`color: #333`
- 每个 token `<span>` 加 `transition: all 120ms ease-out`，避免硬切

### 性能与可访问性

- 所有动画用 `transform` / `opacity`，避免布局回流
- 检测 `prefers-reduced-motion: reduce`：关闭入场、晃头、弹跳，仅保留高亮变色（不缩放/位移）
- RAF 循环在 `isPlaying=false` 或组件卸载时取消

## 测试

### 单元测试（vitest）

- `tokenize.test.ts`
  - 纯中文：`'听广播'` → `['听','广','播']`
  - 中英混合：`'听广播 b b b'` → `['听','广','播','b','b','b']`
  - 标点：`'你好，世界！'` → `['你','好','世','界']`
  - 多空格：`'b   b   b'` → `['b','b','b']`
  - override：传入 `['ab','cd']` 直接返回

- `RhymeKaraoke.test.tsx`
  - 给定 tokens 与 mocked currentIndex=2，验证 token 0/1 是 past 类、token 2 是 active 类、token 3+ 是 future 类
  - `isPlaying=false` 时所有 token 是 future（未激活）

- `MnemonicSection.test.tsx`
  - `mnemonic` 与 `rhyme` 均为 undefined → 渲染空（容器不存在）
  - 仅有 `mnemonic` → emoji + hint 渲染，"听口诀"按钮不渲染
  - 仅有 `rhyme` → 口诀区渲染，emoji 块不渲染

### 手工验收

更新 `README.md` 验收清单，新增：

- [ ] 拼音卡片：每个条目（声母/韵母/整体认读）都有 emoji + hint + 口诀
- [ ] 点击"听口诀"按钮，能听到 TTS 朗读，且口诀文字按节拍依次高亮
- [ ] 切换条目时，emoji 区块有弹入动画
- [ ] 点击 emoji，emoji 摇头并朗读 hint
- [ ] 启用系统"减少动画"时，动画关闭但高亮变色仍工作

## 内容草稿（63 条）

按"经典口诀优先 + 原创补齐"原则。审 spec 时如对个别条目不满意，直接在该条标注换词即可，无需返工设计。

### 声母（23）

| id | emoji | hint | rhyme |
|----|-------|------|-------|
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

### 单韵母（6）

| id | emoji | hint | rhyme |
|----|-------|------|-------|
| a | 👶 | 张大嘴巴 | 医生检查 a a a |
| o | 🐔 | 像鸡蛋圆 | 公鸡打鸣 o o o |
| e | 🦢 | 像白鹅游 | 白鹅水中 e e e |
| i | 🕯️ | 像小蜡烛 | 蜡烛点亮 i i i |
| u | 🥣 | 像小碗口 | 一只小碗 u u u |
| ü | 🐟 | 像小鱼吐泡 | 小鱼吐泡 ü ü ü |

### 复韵母（18）

| id | emoji | hint | rhyme |
|----|-------|------|-------|
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

### 整体认读（16）

| id | emoji | hint | rhyme |
|----|-------|------|-------|
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

## YAGNI / 非范围

- ❌ 角色昵称、个性化人设、迷你故事
- ❌ 粒子特效、撒花奖励、声调对应背景色
- ❌ SVG 插画（仅在数据模型预留 `svgKey` 字段，未来扩展）
- ❌ 改造游戏页（GamePage）—— 本设计仅作用于 CardsPage 的卡片详情

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| TTS 时长无法获取，节拍漂移 | 兜底 300ms × token 数；监听 `loadedmetadata` 事件优先取真实时长 |
| 个别 emoji 在某些系统渲染为空白方框 | hint 文字始终伴随显示，不依赖 emoji 单独表意 |
| 口诀文案中有用户觉得不合适的 | 表格集中存放，单独修改不波及组件 |
| 动画对低端设备性能压力 | 仅用 `transform`/`opacity`；尊重 `prefers-reduced-motion` |
