# 字音预生成 POC：开源 TTS 横评

- 日期：2026-04-29
- 状态：设计待评审
- 背景：当前 `server/src/services/edgeTts.ts` 在合成**单个汉字**时质量不稳定。`server/audio/pinyin/` 下的 218 个 mp3 只覆盖拼音音节，无法直接当作汉字读音使用。本 POC 用于评估"用开源 TTS 离线预生成单字音库"是否值得作为正式方案推进。

## 1. 目标与非目标

### 目标

回答一个问题：**用开源 TTS 离线预生成单字音库，质量是否明显优于现有 edge-tts？** 通过 20 字 × 3 引擎的盲听打分得出有数据支撑的结论。

### 非目标

- **不**改动 `server/src/**`、`client/src/**` 任何运行时代码。
- **不**切换默认 TTS、**不**修改 `EdgeTtsService`。
- **不**向主项目 `package.json` 引入新依赖。
- 所有产物隔离在 `poc/audio-tts/` 目录下。

## 2. 决策记录

| 项 | 决策 | 备选 |
|---|---|---|
| 路线 | 先做 POC 再决定正式方案 | 直接上云童声 |
| 字表 | 脚本随机抽 20 个常用字（固定 seed） | 项目实际字 / 教材首课字 / 手指清单 |
| 对比引擎 | edge-tts (baseline) + GPT-SoVITS + CoquiTTS | 加入云方案 |
| 模型 | 各自官方默认中文预训练模型 | 社区童声 / 零样本克隆 |
| 产出 | 打分网页 + CSV 导出 | 纯文件夹对比 |

## 3. 字表

- 由 `scripts/pick-charset.ts` 从"现代汉语常用字表前 500"中**带 seed=42** 随机抽 20 字，结果落盘到 `poc/audio-tts/charset.json`。
- 三家引擎读同一份 `charset.json`，确保发的是同一组字。
- 抽完后人工瞄一眼，需要时微调 seed，刻意覆盖：单韵母、多音字、轻声字、卷舌音。最终 charset 提交到仓库以保证可复现。

`charset.json` 结构：

```json
{
  "seed": 42,
  "generated_at": "2026-04-29T...",
  "chars": [
    { "idx": 1, "char": "妈" },
    { "idx": 2, "char": "爱" },
    ...
  ]
}
```

## 4. 目录结构

```
poc/audio-tts/
├── README.md                    # 怎么跑、怎么打分、结论判读规则
├── charset.json                 # 20 字（含 seed、生成时间）
├── .gitignore                   # 忽略 audio/ 和 results/*.csv
├── scripts/
│   ├── pick-charset.ts
│   ├── gen-edge.ts              # 调 msedge-tts；不 import 主项目代码
│   ├── gen-sovits.py
│   ├── gen-coqui.py
│   ├── requirements-sovits.txt
│   ├── requirements-coqui.txt
│   └── build-compare-page.ts
├── audio/                       # gitignore
│   ├── edge/01-妈.mp3 ...
│   ├── sovits/01-妈.mp3 ...
│   └── coqui/01-妈.mp3 ...
├── compare.html                 # 静态打分页，由 build-compare-page.ts 生成
└── results/
    └── scores-<timestamp>.csv   # gitignore（手动整理后另存）
```

要点：
- Python 脚本与主项目独立。各自 `requirements-*.txt` 用各自 venv。
- edge baseline 用主项目已装的 `msedge-tts`，但通过独立 ts 脚本调用，**不 import `EdgeTtsService`**。
- 三家 mp3 文件名相同（`<两位序号>-<字>.mp3`），便于对比页拼路径。
- `audio/` 整个目录写进 `.gitignore`（可重新生成，不污染仓库）；只提交脚本与 `charset.json`。

## 5. 引擎与模型

| 引擎 | 调用方 | 模型 | 输出 |
|---|---|---|---|
| Edge TTS | Node + msedge-tts | `zh-CN-XiaoxiaoNeural`（与主项目默认一致） | mp3 24kHz |
| GPT-SoVITS | Python | release 自带中文 demo 音色 | wav → 转 mp3 |
| CoquiTTS | Python | `tts_models/zh-CN/baker/tacotron2-DDC-GST` | wav → 转 mp3 |

输出统一为 mp3 / 24kHz / 单声道 / 48kbps，最大限度对齐主项目 edgeTts 的格式（避免因为格式差异影响主观感受）。转码用 `ffmpeg`（README 写明依赖）。

## 6. 打分对比页面 `compare.html`

形态：纯静态 HTML，由 `build-compare-page.ts` 在 mp3 生成后产出。`open compare.html` 即可使用，无后端。

布局：

```
┌─────────────────────────────────────────────────────────────────┐
│  字音 TTS 横评 (20 字 × 3 引擎)         [导出 CSV] [清空打分]   │
│  [✓] 盲听模式（按字打乱列顺序）                                 │
├─────────────────────────────────────────────────────────────────┤
│  序号  字   A             B              C                      │
│  01   妈   ▶ ① ② ③ ④ ⑤   ▶ ① ② ③ ④ ⑤    ▶ ① ② ③ ④ ⑤          │
│  02   爱   ▶ ① ② ③ ④ ⑤   ▶ ① ② ③ ④ ⑤    ▶ ① ② ③ ④ ⑤          │
│  ...                                                            │
├─────────────────────────────────────────────────────────────────┤
│  汇总：edge 平均 X.X | sovits 平均 X.X | coqui 平均 X.X         │
└─────────────────────────────────────────────────────────────────┘
```

关键设计：

- **盲听模式**（默认开）：列名显示 A/B/C，每行的引擎顺序**独立打乱**，seed = 字序号，避免先入为主。导出 CSV 时还原真实引擎名。
- **1-5 星打分**：1 = 听不出是这个字，3 = 能听出但别扭，5 = 自然如真人。支持键盘 `1-5`。
- **打分实时写 localStorage**，刷新不丢。
- **导出 CSV**：列 = `idx, char, edge_score, sovits_score, coqui_score, notes`，浏览器下载后用户手动放入 `results/`。
- **完全离线**，不上传任何数据。

## 7. 结论判读规则（写进 README）

| 情况 | 行动 |
|---|---|
| sovits 或 coqui 平均分 ≥ 4.0 且比 edge 高 ≥ 0.5 | 进入正式预生成方案（开新 design） |
| sovits/coqui 都 < edge | POC 否决；转向云童声 TTS，开新一轮 brainstorm |
| 三家平均分差 < 0.3 | 工作量优先：维持 edge baseline |

## 8. 范围、风险、兜底

- **零运行时影响**：全程不动 `server/`、`client/`。
- **机器要求**：sovits / coqui 首跑下载模型（几百 MB ~ 1 GB），CPU 推理 20 字数分钟可接受。
- **license**：POC 产物仅本地试听打分，不分发。
- **失败回退**：任一引擎装不上，README 允许只跑其余两家。两家对比仍能给出方向性结论。

## 9. 后续

POC 跑完得出方向后：

- 若进入正式方案 → 重新进入 brainstorming（确定字表来源、cache 目录布局、运行时查表与 edge fallback 的接入方式），写一份单独的"字音预生成"design。
- 若否决 → brainstorm 云 TTS 方案。

POC 本身不在主代码上落地任何改动。
