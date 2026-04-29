# 字音预生成 POC：开源 TTS 横评

对应 spec：`docs/superpowers/specs/2026-04-29-tts-poc-design.md`

## 跑通流程

```bash
# 1. 抽 20 字 → charset.json
npx tsx poc/audio-tts/scripts/pick-charset.ts

# 2. 生成三家 mp3
npx tsx poc/audio-tts/scripts/gen-edge.ts

python3 -m venv poc/audio-tts/.venv-sovits
source poc/audio-tts/.venv-sovits/bin/activate
pip install -r poc/audio-tts/scripts/requirements-sovits.txt
python poc/audio-tts/scripts/gen-sovits.py
deactivate

python3 -m venv poc/audio-tts/.venv-coqui
source poc/audio-tts/.venv-coqui/bin/activate
pip install -r poc/audio-tts/scripts/requirements-coqui.txt
python poc/audio-tts/scripts/gen-coqui.py
deactivate

# 3. 生成打分页并打开
npx tsx poc/audio-tts/scripts/build-compare-page.ts
open poc/audio-tts/compare.html
```

## 系统依赖

- Node 20+（主项目 root 的 `tsx` 已可用）
- Python 3.10+
- ffmpeg（`brew install ffmpeg`）

## 任一引擎装不上

可只跑剩下两家。打分页只显示成功生成的列。结论判读规则同样适用，结论维度变少。

## 结论判读规则

| 情况 | 行动 |
|---|---|
| sovits 或 coqui 平均分 ≥ 4.0 且比 edge 高 ≥ 0.5 | 进入正式预生成方案（开新 design） |
| sovits/coqui 都 < edge | POC 否决；转向云童声 TTS |
| 三家平均分差 < 0.3 | 维持 edge baseline |
