#!/usr/bin/env python3
"""Free text-to-speech: Microsoft Edge voices (edge-tts, needs internet) or Piper (offline).

  tts.py "Текст" out.mp3 [--voice ru-RU-SvetlanaNeural] [--rate=-10%] [--engine edge|piper]

Edge voices for Russian: ru-RU-SvetlanaNeural (female), ru-RU-DmitryNeural (male).
List all: edge-tts --list-voices. Piper voices: ~/.local/share/piper/<name>.onnx
(ru_RU-irina-medium, ru_RU-dmitri-medium); --voice takes the name without .onnx.
If edge-tts fails (no network), falls back to Piper automatically.
"""
import argparse, asyncio, os, subprocess, sys

PIPER_DIR = os.path.expanduser("~/.local/share/piper")

def edge(text, out, voice, rate):
    import certifi
    ca = os.environ.get("SSL_CERT_FILE")
    if ca and os.path.exists(ca):  # behind a TLS-inspecting proxy edge-tts must trust its CA
        certifi.where = lambda: ca
    import edge_tts, time
    for attempt in range(5):   # the service sometimes returns no audio for a request; a retry usually gets it
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(out))
            return
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 4:
                raise
            time.sleep(2 * (attempt + 1))

def piper(text, out, voice):
    model = os.path.join(PIPER_DIR, voice + ".onnx")
    wav = out if out.endswith(".wav") else out + ".tmp.wav"
    subprocess.run(["piper", "-m", model, "-f", wav], input=text.encode(), check=True, capture_output=True)
    if wav != out:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, out], check=True)
        os.remove(wav)

p = argparse.ArgumentParser()
p.add_argument("text"); p.add_argument("out")
p.add_argument("--voice", default=None)
p.add_argument("--rate", default="+0%")
p.add_argument("--engine", choices=["edge", "piper"], default="edge")
a = p.parse_args()

if a.engine == "edge":
    try:
        edge(a.text, a.out, a.voice or "ru-RU-SvetlanaNeural", a.rate)
        sys.exit(0)
    except Exception as e:
        print(f"edge-tts failed ({e}); falling back to Piper", file=sys.stderr)
        a.voice = None
piper(a.text, a.out, a.voice or "ru_RU-irina-medium")
