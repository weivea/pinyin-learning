# SSML Phoneme TTS — 精准声调发音改造

**日期：** 2026-04-21
**作者：** 建立伟 + Claude
**状态：** Approved, ready for planning

---

## 背景

当前拼音学习站的声调发音采用"用汉字代念"策略：对每个 `(拼音, 声调)` 组合在数据里配一个代表字，前端把该字传给后端 `/api/tts`，后端用 msedge-tts 合成 mp3。

这套方案有三个先天缺陷：

1. **普通话很多组合无常用字** — `én`、`éng`、`úng`、`ǎng`、`üé/üě`、`rí/rǐ` 等在普通话里没有常用字，只能"借"近似字，TTS 念出来不一定对。
2. **多音字不可控** — "为"既读 `wèi` 也读 `wéi`，TTS 的选音不可预测。
3. **整体认读音节 ri/zi/ci/si** — 非完整四声都没字，怎么选都不准。

用户反馈："韵母的声调发音还是有很多不对"——已在 `fix: expand pinyin examples and correct tone audio chars`（commit `d173b22`）里手工修过一轮，但因为上述是方案本身的限制，修不彻底。

## 目标

改用 Edge TTS 的 SSML `<phoneme>` 标签按音素合成，让 TTS 直接按指定 `(拼音, 声调)` 发音，绕过"找代表字"这一步，从根本上解决声调不准的问题。

## 非目标

- 不改 `pinyin.ts` 数据结构（`audioText` 字段保留作 fallback）
- 不做离线预生成音频（那是方案 B，作为本方案失败的后备）
- 不改声母（`initials` 的 `hasTones: false`，当前方案够用）

## 技术决策汇总

| 维度 | 决策 |
|---|---|
| TTS 技术 | Edge TTS + SAPI 拼音 phoneme 标签 (`<phoneme alphabet="sapi" ph="ma 1">妈</phoneme>`) |
| 升级范围 | 声调按钮 + 例字都走 SSML（例字也能修掉多音字问题） |
| 数据结构 | `tones[].audioText` 和 `examples[].hanzi` 字段保留，语义变为"fallback/显示字" |
| API 形态 | `GET /api/tts` 扩展 `pinyin` + `tone` 可选参数，向后兼容 |
| 前端 hook | `useAudio.playPinyin(pinyin, tone, fallback)` 新方法，与 `play` 并存 |
| 失败处理 | 服务端 phoneme 失败自动回落到纯文本，`X-TTS-Mode` header 标记实际路径 |
| 测试 | 后端 `buildSsml` 纯函数 + `/api/tts` 路由参数校验；前端手动验收 |

---

## 架构

### 数据流

```
ToneButtons.tsx                 useAudio.playPinyin            /api/tts
  ┌─────────────┐                ┌──────────────┐               ┌──────────┐
  │ 点 ǎ 按钮   │──('a', 3, '矮')→│ fetch(url)   │──?pinyin=a→──→│ buildSsml│
  └─────────────┘                │              │  &tone=3      │   ↓      │
                                 │ new Audio()  │  &text=矮     │  msedge- │
                                 │   .play()    │               │   tts    │
                                 │              │←──audio/mpeg──│          │
                                 │ check hdr    │←─X-TTS-Mode───│          │
                                 └──────────────┘               └──────────┘
                                                                     ↓
                                                                 文件缓存
                                                                 sha256(voice|pinyin|tone)
```

### 后端模块

**`EdgeTtsService.getOrGenerate` 签名升级：**

```ts
interface TtsRequest {
  text: string;
  pinyin?: string;              // 如 "ma"（前端已做 ü→v 转换）
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
}

interface TtsResult {
  path: string;
  fromCache: boolean;
  mode: 'phoneme' | 'text' | 'fallback-text';
}

getOrGenerate(req: TtsRequest): Promise<TtsResult>
```

**新增纯函数 `buildSsml`：**

```ts
function buildSsml(req: TtsRequest): string {
  const voice = req.voice ?? 'zh-CN-XiaoxiaoNeural';
  const text = escapeXml(req.text);
  if (req.pinyin && req.tone) {
    const ph = `${req.pinyin} ${req.tone}`;
    return `<speak version="1.0" xml:lang="zh-CN"><voice name="${voice}">`
         + `<phoneme alphabet="sapi" ph="${ph}">${text}</phoneme>`
         + `</voice></speak>`;
  }
  return `<speak version="1.0" xml:lang="zh-CN"><voice name="${voice}">${text}</voice></speak>`;
}
```

**缓存 key 规则：**

- `pinyin` + `tone` 均存在：`sha256(voice|pinyin|tone)` — 同拼音声调复用，与 fallback 字无关
- 否则：`sha256(voice|text)` — 现行行为

**msedge-tts 集成风险：**

msedge-tts 2.0.5 目前调用方式为 `tts.toStream(text)`，库内部自行拼装 SSML。要直接喂自构 SSML 可能需要：
- 库提供的 `rawToStream` / `customSSML` 入口（需查库 API）
- 或直接操作底层 WebSocket 发送 SSML 帧（fork/inline 握手逻辑）

**实现计划首步是 spike**：1 小时内写最小 Node 脚本验证 msedge-tts 能否处理自构 SSML with `<phoneme>`；不行则 fallback 到方案 B（预生成）。

### 路由

**`GET /api/tts`：**

```
# 向后兼容
GET /api/tts?text=妈

# 新增 phoneme 路径
GET /api/tts?text=妈&pinyin=ma&tone=1
GET /api/tts?text=妈&pinyin=ma&tone=1&voice=zh-CN-XiaoxiaoNeural
```

**参数校验：**
- `text` 必填；空 → 400（沿用现行）
- `pinyin` 非空但 `tone` 缺失 → 400 `{ error: { code: 'INVALID_TONE', message: '...' } }`
- `tone` 非 1-4 → 400 `INVALID_TONE`

**响应 headers：**
- `Content-Type: audio/mpeg`
- `X-TTS-Mode: phoneme | text | fallback-text`
- `X-TTS-Cache: hit | miss`

**服务端失败回落：**

```ts
try {
  ({ path } = await tts.getOrGenerate({ text, pinyin, tone, voice }));
  mode = 'phoneme';
} catch (err) {
  console.warn('[tts] phoneme failed, fallback to text', err);
  ({ path } = await tts.getOrGenerate({ text, voice }));
  mode = 'fallback-text';
}
```

### 前端模块

**`client/src/utils/pinyin.ts`（新文件）：**

```ts
const TONE_MAP: Record<string, string> = {
  ā:'a',á:'a',ǎ:'a',à:'a',
  ō:'o',ó:'o',ǒ:'o',ò:'o',
  ē:'e',é:'e',ě:'e',è:'e',
  ī:'i',í:'i',ǐ:'i',ì:'i',
  ū:'u',ú:'u',ǔ:'u',ù:'u',
  ǖ:'ü',ǘ:'ü',ǚ:'ü',ǜ:'ü',
};

/** 去掉声调符号，返回 base pinyin（保留 ü，不转 v） */
export function stripTone(pinyin: string): string {
  return [...pinyin].map(ch => TONE_MAP[ch] ?? ch).join('');
}
```

**`client/src/api/tts.ts` 升级：**

```ts
export interface TtsOptions {
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
}

export function ttsUrl(text: string, opts?: TtsOptions): string {
  const params = new URLSearchParams({ text });
  if (opts?.pinyin) {
    // SAPI 拼音用 v 代替 ü
    params.set('pinyin', opts.pinyin.replace(/ü/g, 'v'));
  }
  if (opts?.tone) params.set('tone', String(opts.tone));
  if (opts?.voice) params.set('voice', opts.voice);
  return `/api/tts?${params}`;
}
```

**`client/src/hooks/useAudio.ts` 新增 `playPinyin`：**

```ts
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = () => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
  };

  const play = useCallback(async (text: string) => { /* 现状不变 */ }, []);

  const playPinyin = useCallback(async (
    pinyin: string,
    tone: 1 | 2 | 3 | 4,
    fallback: string,
  ) => {
    stopCurrent();
    try {
      const url = ttsUrl(fallback, { pinyin, tone });
      // 先 fetch 拿 header，再播放
      const res = await fetch(url);
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const mode = res.headers.get('X-TTS-Mode');
      if (import.meta.env.DEV && mode === 'fallback-text') {
        console.warn(`[useAudio] phoneme fallback for ${pinyin}${tone}`);
      }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio.playPinyin] failed, fallback to speechSynthesis', err);
      try {
        const utter = new SpeechSynthesisUtterance(fallback);
        utter.lang = 'zh-CN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (e2) {
        console.error('[useAudio] speech fallback also failed', e2);
      }
    }
  }, []);

  return { play, playPinyin };
}
```

**调用点改动：**

1. **`ToneButtons.tsx`**：
   ```tsx
   // before: play(t.audioText)
   // after:
   const basePinyin = stripTone(t.text);  // ǎ → a, üē → üe
   playPinyin(basePinyin, t.tone, t.audioText);
   ```

2. **`ExampleWord.tsx` + `AudioButton.tsx`**：
   - `AudioButton` props 增加可选 `pinyin?: string; tone?: 0 | 1 | 2 | 3 | 4`
   - 存在且 `tone ≥ 1` 时调 `playPinyin(stripTone(pinyin), tone, text)`，否则调 `play(text)`
   - `tone === 0`（轻声）保持老行为——SAPI 没有轻声 SSML 标准表达，交给 TTS 多音字判断

### 数据层

**不改 `pinyin.ts`。** 字段语义变化：
- `tones[].audioText`：从"TTS 输入"变为"SSML fallback 字 + 失败后备朗读字"
- `examples[].hanzi` + `.pinyin` + `.tone`：`pinyin` 和 `tone` 现在会被前端消费

现有值都兼容，无迁移工作。

## 测试计划

### 后端

**`server/tests/edgeTts.test.ts` 扩展：**

1. `buildSsml({ text:'妈', pinyin:'ma', tone:1 })` 返回正确的 phoneme SSML 字符串
2. `buildSsml({ text:'妈' })` 返回纯 voice 包裹 SSML（无 phoneme）
3. `buildSsml({ text:'A & B', pinyin:'a', tone:1 })` 把 `&` 转义为 `&amp;`
4. `getOrGenerate` 缓存 key：同 pinyin+tone 不同 fallback text → 同 cache hit
5. `getOrGenerate` 缓存 key：同 text 不同 pinyin+tone → 不同 cache

**`server/tests/tts.test.ts` 扩展：**

6. `GET /api/tts?text=妈&pinyin=ma&tone=1` → 200, header `X-TTS-Mode: phoneme`
7. `GET /api/tts?text=妈&pinyin=ma` → 400, `error.code === 'INVALID_TONE'`
8. `GET /api/tts?text=妈&pinyin=ma&tone=9` → 400, `INVALID_TONE`
9. `GET /api/tts?text=妈` → 200, `X-TTS-Mode: text`（现有行为保持）
10. mock TTS 在 phoneme 模式抛错 → 自动 fallback，`X-TTS-Mode: fallback-text`, 状态 200

### 前端

不加单元测试（`stripTone` 纯函数太简单；`playPinyin` 走 fetch+Audio，mock 成本高于价值）。

**手工验收：**
- 点 `a` 的二声 `á` → 听到标准 á 音（不再是"啊"的一声）
- 点 `üe` 的三声 `üě` → 能听到清晰的第三声调形
- 点例字 `马` → 念出 `mǎ` 而不是可能的多音字误读
- 点 `ri` 的二声 → 能听到接近 rí 的音（即使普通话没此字，phoneme 合成也应该比"日"更准）
- DevTools Network 面板：响应 header 含 `X-TTS-Mode`
- 断网 → 回落到 Web Speech API

### 回归

- 现有 13 (client) + 17 (server) 测试全部保持通过
- 现有 `play('妈')` 调用点（目前只有 `AudioButton` 无 pinyin 时）继续工作

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| msedge-tts 2.0.5 不支持自构 SSML | 中 | 高（方案无法实施） | 实现第 1 步就是 spike；不行则切换到方案 B（预生成） |
| Edge TTS zh-CN 神经声音对 SAPI phoneme 支持度不完美 | 低 | 中（部分声调仍不准） | spike 时抽查 a/o/e/üe/ri 等最难的几个；不满足接受度再评估方案 B |
| SSML 转义漏掉某个字符 | 低 | 低（个别字符合成失败） | `escapeXml` 处理 `& < > " '` 五个；测试覆盖 |
| `ü → v` 转换在前端还是后端易混淆 | 低 | 低（bug） | **固定在前端 `ttsUrl` 里做**；后端 `buildSsml` 不做转换；文档明确 |

## 实现顺序（预览）

1. **Spike**：验证 msedge-tts 能否处理自构 SSML with phoneme（1h，blocker）
2. 后端：`buildSsml` + 单测
3. 后端：`EdgeTtsService.getOrGenerate` 升级签名 + 缓存 key
4. 后端：`/api/tts` 路由参数 + 失败回落 + 单测
5. 前端：`stripTone` utility + `ttsUrl` 升级
6. 前端：`useAudio.playPinyin`
7. 前端：`ToneButtons` + `AudioButton`/`ExampleWord` 切换
8. 手工验收清单 + commit

具体步骤与 TDD 节奏由 writing-plans 阶段产出。

---

## Self-Review

1. **Placeholder scan**：无 TODO/TBD。
2. **Internal consistency**：
   - `ü → v` 转换统一在前端 `ttsUrl`，后端 `buildSsml` 只收到 `v`，一致
   - `tone === 0`（轻声）在 `AudioButton` 统一退回 `play`，`ToneButtons` 的 tones 定义为 `1|2|3|4`，不触及 0，一致
3. **Scope check**：单一主题（TTS 发音精准化），后端 3 处 + 前端 4 处变更，可在一个 plan 内完成
4. **Ambiguity check**：
   - `X-TTS-Mode` 三个值定义明确（`phoneme` / `text` / `fallback-text`）
   - 缓存 key 规则明确（有 pinyin+tone 走一种，否则走另一种）
   - 失败回落只在服务端做 phoneme→text；前端 `playPinyin` 失败后走 Web Speech
