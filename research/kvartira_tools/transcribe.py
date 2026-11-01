import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2] if len(sys.argv) > 2 else "small", device="cpu", compute_type="int8")
for f in sys.argv[1].split(","):
    segs, info = m.transcribe(f, language="ru", word_timestamps=True, vad_filter=True)
    out = []
    for s in segs:
        out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                    "words": [[round(w.start, 2), round(w.end, 2), w.word] for w in s.words]})
    json.dump(out, open(f.rsplit(".", 1)[0] + ".json", "w"), ensure_ascii=False)
    print(f, len(out), flush=True)
