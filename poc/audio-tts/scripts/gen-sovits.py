"""
读 ../charset.json，对每个汉字用 GPT-SoVITS 默认中文 demo 模型合成，
输出到 ../audio/sovits/<idx>-<char>.mp3。
"""
from __future__ import annotations
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHARSET = HERE.parent / "charset.json"
OUT_DIR = HERE.parent / "audio" / "sovits"


def ensure_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg not found; install via `brew install ffmpeg`")


def synth_wav(text: str, wav_out: Path) -> None:
    """调用 GPT-SoVITS 默认中文音色合成单字到 wav。

    若 gpt-sovits-tts 包接口在使用时变化，按其 README 调整 import 与调用方式。
    """
    from gpt_sovits_tts import GPTSoVITS  # type: ignore

    tts = GPTSoVITS(language="zh")  # 使用包内默认 demo 音色
    tts.synthesize(text=text, output_path=str(wav_out))


def to_mp3(wav: Path, mp3: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(wav),
            "-ar", "24000", "-ac", "1", "-b:a", "48k",
            str(mp3),
        ],
        check=True,
    )


def main() -> None:
    ensure_ffmpeg()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    charset = json.loads(CHARSET.read_text(encoding="utf-8"))
    for entry in charset["chars"]:
        idx = entry["idx"]
        char = entry["char"]
        fname = f"{idx:02d}-{char}.mp3"
        mp3 = OUT_DIR / fname
        if mp3.exists():
            print(f"SKIP {fname} (exists)")
            continue
        print(f"GEN  {fname}")
        with tempfile.TemporaryDirectory() as td:
            wav = Path(td) / "out.wav"
            synth_wav(char, wav)
            to_mp3(wav, mp3)
    print(f"Done. {len(charset['chars'])} files in {OUT_DIR}")


if __name__ == "__main__":
    main()
