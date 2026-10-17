# 我爱学习 · Pinyin Learning (iOS)

A standalone **Capacitor iOS offline app** built for young learners (ages 3–6), with preschool puzzle games designed for ages 5–6. All content — pinyin data, audio, and games — is bundled in the app; progress is stored locally on device.

## Features

- **Complete offline**: pinyin, audio, and games are bundled within the app
- **Local storage**: user profile and progress live in device storage only (Capacitor Preferences), no backend
- **Packaged audio**: static pinyin pronunciation MP3 files are shipped in the bundle
- **TTS with fallback**: Azure Speech synthesis (baked-in at build time) with native iOS TTS fallback
- **English alphabet**: 26-letter A–Z module — tap 🔊 to hear the letter name (native en-US TTS), open a letter for its intro, stroke-drawing animation, pinyin reading, example word, and a finger-tracing practice canvas
- **拼音学汉字 (Learn Chinese characters)**: ~1000 basic characters for pre–grade-3 (统编版 一/二年级 写字表 800 字 + 常用高频字 200)，按册浏览；每字详情页含拼音、朗读、**笔顺动画**、组词、造句。字表数据由 `scripts/gen-hanzi.mjs` 生成（拼音 pinyin-pro、组词 jieba 词频∩教材词汇、造句模板 + `scripts/overrides.mjs` 人工覆盖）；笔顺数据由 `scripts/gen-strokes.mjs` 从 hanzi-writer-data 抽取为离线 `public/hanzi-strokes.json`（约 2.2 MB，含全部 1000 字）
- **短文阅读**: 20 篇由易到难的原创低龄短文，每篇 80–120 字；所有汉字逐字注音，每篇最多 5 个生字并可点开查看，支持按句高亮朗读、暂停和继续
- **Nine games**: four pinyin/character games plus five preschool puzzle games, with separate best scores and stars in 我的进度

### Preschool puzzle games (ages 5–6)

Open **玩游戏 → 动脑小游戏** to play:

| Game | Activity and progression |
| --- | --- |
| 规律小火车 | 100 repeating fruit patterns, from alternating pairs to longer grouped patterns, 1–3 missing items, and up to 6 answer choices |
| 动物分类屋 | 100 animal groups: start with one attribute, then combine two or all three of species, color, and size, using 4–8 houses |
| 小兔找萝卜 | 100 connected mazes, from 5×5 to 9×13 boards; the added levels require 24–52 moves, with large direction buttons and backtracking throughout |
| 谁藏起来了 | 100 arrangements of 3–10 pictures; later levels hide 2–3 companions, rearrange the board, and add unfamiliar choices; start recalling only when ready and peek again when needed |
| 图形拼拼乐 | 100 original geometric pictures with 2–8 pieces; later levels combine rotation, reduced outlines, and matching different sizes of the same shape |

Each game has **100 self-paced levels**, in ten stages of ten levels. The original levels 1–50 are unchanged; levels 51–100 add five progressively harder challenge stages:

| Levels | Patterns | Sorting | Mazes | Memory | Shapes |
| --- | --- | --- | --- | --- | --- |
| 51–60 | Four-item cycles, 4 choices | Species + color, 6 animals | 7×7, 24–28 moves | 7 pictures, 1 hidden | 5 pieces, rotation |
| 61–70 | Five-item cycles, 2 gaps | Alternate size-based pairs of rules, 8 animals | 7×9, 30–34 moves | 8 pictures, 2 hidden | 6 pieces, rotation |
| 71–80 | Six-item cycles, 2 gaps, 5 choices | Switch between all pairs of rules, 10 animals | 9×9, 36–40 moves | 8 pictures, 2 hidden; shuffled positions and unfamiliar choices | 6 pieces; also match sizes |
| 81–90 | Six-item grouped cycles, 3 gaps | All three attributes, 12 animals | 9×11, 42–46 moves | 9 pictures, 3 hidden, 8 choices | 7 pieces; match sizes and rotation |
| 91–100 | Seven-item cycles, 3 gaps, 6 choices | All three attributes, 16 animals | 9×13, 48–52 moves | 10 pictures, 3 hidden, 9 choices | 8 pieces; match sizes and rotation |

Level contents are deterministic: returning to a level does not reshuffle the problem. Spoken instructions, optional visual hints, unlimited retries, and an exit back to game selection are available throughout. Sorting and shape puzzles support both tap-to-select/tap-to-place and drag-and-drop; no precise dragging is required. Advanced sorting presents four waiting animals at a time, and larger mazes keep the same large direction controls. Patterns and memory rounds finish only after every missing item is found. Levels advance only when the child chooses; children do not need to complete all 100 in one sitting.

**Every completed level is saved locally**, separately for each nickname/profile and game. Leaving or reloading resumes at the first unfinished level, with earned points intact; an unfinished level starts over. The game cards and 我的进度 show completed levels. If saving fails, the completed board stays available with a retry button instead of advancing or claiming the progress was saved.

Each completed level earns 10–20 points (20 minus 2 per mistaken answer or use of help, with a floor of 10). Replaying the same visual hint does not cost additional points; peeking again in the memory game counts as help and restarts recall for that level. Finishing all 100 levels yields 1000–2000 points and at least one star; 1400 points earns two and 1800 earns three. The final checkpoint, best score, and best stars share one storage write, and retries cannot count a level twice. After completing all 100 levels, a child can view the result or explicitly start a new run; replaying preserves the best score and stars. There are no time bonuses, countdowns, or lives.

Existing 50-level saves continue without resetting: a finished course resumes at level 51, and an unfinished course resumes at its first unfinished level. Previously earned points, best scores, and stars are preserved, including after a later lower-star 100-level run. The original five-round best scores are also retained; completed levels are never inferred from a legacy best score.

All puzzle data and SVG artwork ship with the app. Instructions use the existing speech service and native TTS fallback; gameplay never waits for speech and remains playable without audio or a network connection. Difficulty increases within a session; these games are not assessments of a child's development or intelligence.

## Quick Start

```bash
npm install

# Run the web preview (Vite) for fast iteration
npm run dev

# Run tests
npm test

# Type-check + build the web assets
npm run build
```

### TTS (Azure Speech) config

Online TTS uses Azure Speech. Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
# set VITE_AZURE_SPEECH_KEY and VITE_AZURE_SPEECH_ENDPOINT
```

> ⚠️ The iOS build bakes these `VITE_*` values into the app bundle, so use a restricted/rotatable key. Without credentials the app still runs and falls back to native TTS and packaged audio.

### iOS build & run

```bash
# Build web assets and sync into the native iOS project
npm run cap:sync

# Open Xcode to run in a simulator/device
npm run cap:open
```

First-time only — initialize the iOS platform:

```bash
npx cap add ios
```

Then in Xcode set a valid **Bundle ID** matching your Apple team and configure the **signing certificate**.

## Project Structure

```
.
├── src/                  # React + TypeScript source
│   ├── api/              # Local storage adapters (users, progress)
│   ├── audio/            # Azure TTS client + SSML builder
│   ├── components/       # UI components
│   ├── data/             # Pinyin, Hanzi, letter & annotated reading datasets
│   ├── hooks/            # Custom hooks (useProgress, useUser, useAudio, useReciter, useKaraoke)
│   ├── pages/            # Route pages (login, cards, readings, recite, games, letters, profile)
│   ├── storage/          # Local persistence layer (Capacitor Preferences)
│   ├── styles/           # Global CSS and animations
│   ├── utils/            # Pure logic (pinyin, spell, tokenize, letterProgress)
│   ├── types.ts          # Shared TypeScript types
│   └── main.tsx          # React entry point
├── public/audio/pinyin/  # Packaged pinyin MP3 assets
├── ios/                  # Native iOS project (generated by Capacitor)
├── docs/superpowers/     # Historical specs & plans (background reference)
├── capacitor.config.ts   # Capacitor config (webDir: dist)
├── vite.config.ts        # Vite + Vitest config
├── tsconfig.json
└── index.html
```

## Architecture Notes

- **No backend**: user data and progress use device-local storage only
- **Packaged resources**: pinyin audio is served from `public/audio/` and bundled into the app
- **Capacitor bridge**: native TTS calls go through Capacitor's iOS plugin layer
- **Self-contained build**: `npm run build` + `npx cap sync` produces a complete, runnable Xcode project

## Building for Release

1. Increment the version in `package.json`
2. Run `npm run cap:sync`
3. In Xcode, update version/build number and select your provisioning profile
4. Archive and upload to the App Store (via Xcode or Transporter)

## Notes on Data & Safety

- Login is nickname-only, no password — the same nickname maps to the same local profile. Don't collect private information.
- Local storage persists between app sessions; clear app data via iOS Settings if needed.
