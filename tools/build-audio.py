#!/usr/bin/env python3
"""
Pre-generate Latvian audio files (MP3) for all flashcards using gTTS.

We do this because Google Translate's TTS endpoint blocks browser-context
requests (returns HTML instead of audio), making in-browser TTS unreliable.
Pre-generating from Python with gTTS works because gTTS calls Google with
a non-browser User-Agent.

Output:
    audio/lv/<sha1-prefix>.mp3   — one MP3 per unique Latvian string
    audio/manifest.json          — { "sha1": true } lookup of what exists

Run after editing flashcards/*.csv:
    python3 tools/build-audio.py
"""
import hashlib
import json
import sys
import time
from pathlib import Path

try:
    from gtts import gTTS
    from gtts.tts import gTTSError
except ImportError:
    sys.exit("Install gTTS first: pip install gTTS")

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio" / "lv"
MANIFEST_PATH = ROOT / "audio" / "manifest.json"

EXTRA_TEXTS = [
    "Sveiki! Mani sauc Latvisky. Es mācu latviešu valodu.",
    "Labrīt", "Labdien", "Labvakar",
    "Paldies", "Lūdzu", "Atvainojiet",
]


def hash_id(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]


def parse_csv(path: Path):
    text = path.read_text(encoding="utf-8")
    lines = [l for l in text.strip().split("\n") if l.strip()]
    header = [h.strip() for h in lines[0].split(";")]
    out = []
    for line in lines[1:]:
        cells = line.split(";")
        row = {header[i]: cells[i].strip() if i < len(cells) else "" for i in range(len(header))}
        out.append(row)
    return out


def collect_texts():
    texts = set()
    for csv in sorted(ROOT.glob("flashcards/*.csv")):
        rows = parse_csv(csv)
        for row in rows:
            for key in ("letón", "ejemplo_letón"):
                v = (row.get(key) or "").strip()
                if v:
                    texts.add(v)
    for t in EXTRA_TEXTS:
        texts.add(t)
    return texts


def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)

    if MANIFEST_PATH.exists():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text())
        except Exception:
            manifest = {}
    else:
        manifest = {}

    texts = sorted(collect_texts())
    total = len(texts)
    new, skipped, failed = 0, 0, 0

    print(f"🎙  Generating audio for {total} unique Latvian strings…")

    for i, text in enumerate(texts, 1):
        hid = hash_id(text)
        out_path = AUDIO_DIR / f"{hid}.mp3"
        if out_path.exists() and manifest.get(hid):
            skipped += 1
            continue
        try:
            gTTS(text, lang="lv", slow=False).save(str(out_path))
            manifest[hid] = True
            new += 1
            if new % 20 == 0:
                MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False))
                print(f"  [{i}/{total}] {new} new so far…")
            time.sleep(0.15)  # gentle throttle to avoid rate-limits
        except gTTSError as e:
            failed += 1
            print(f"  [{i}/{total}] ❌ {text[:60]!r}: {e}", file=sys.stderr)
            time.sleep(2)
        except Exception as e:
            failed += 1
            print(f"  [{i}/{total}] ❌ {text[:60]!r}: {e}", file=sys.stderr)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False))
    total_size = sum(p.stat().st_size for p in AUDIO_DIR.glob("*.mp3"))
    print(
        f"\n✅ Done.\n"
        f"   new:     {new}\n"
        f"   skipped: {skipped} (already existed)\n"
        f"   failed:  {failed}\n"
        f"   total:   {len(manifest)} files in manifest\n"
        f"   size:    {total_size/1024/1024:.1f} MB"
    )


if __name__ == "__main__":
    main()
