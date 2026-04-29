"""
读 ../charset.json，用 CoquiTTS `tts_models/zh-CN/baker/tacotron2-DDC-GST` 合成，
输出 ../audio/coqui/<idx>-<char>.mp3。
"""
from __future__ import annotations
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHARSET = HERE.parent / "charset.json"
OUT_DIR = HERE.parent / "audio" / "coqui"
MODEL_NAME = "tts_models/zh-CN/baker/tacotron2-DDC-GST"


def ensure_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg not found; install via `brew install ffmpeg`")


def make_tts():
    from TTS.api import TTS  # type: ignore
    return TTS(model_name=MODEL_NAME, progress_bar=False)


def synth_wav(tts, text: str, wav_out: Path) -> None:
    tts.tts_to_file(text=text, file_path=str(wav_out))


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
    tts = make_tts()
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
            synth_wav(tts, char, wav)
            to_mp3(wav, mp3)
    print(f"Done. {len(charset['chars'])} files in {OUT_DIR}")


if __name__ == "__main__":
    main()
