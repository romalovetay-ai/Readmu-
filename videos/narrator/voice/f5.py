"""Lively Russian TTS: ESpeech-TTS-1 podcaster (F5-TTS, Apache-2.0) + RUAccent stress marks.

  f5.py --ref ref.wav --ref-text "текст образца" --text "что сказать" --out out.wav [--speed 1.0] [--nfe 32]
  As a module: Voice(ref_wav, ref_text).say(text, out_wav, speed)
The output copies timbre and manner of the reference clip, so the reference decides how 'alive' it sounds.
"""
import argparse, os, sys
import numpy as np
import soundfile as sf
import torch

torch.set_num_threads(os.cpu_count() or 4)

import torchaudio  # noqa: E402  the CPU wheel's torchcodec backend needs CUDA libs: read audio with soundfile instead


def _sf_load(path, *a, **k):
    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return torch.from_numpy(data.T.copy()), sr


torchaudio.load = _sf_load

import onnxruntime as _ort  # noqa: E402  some RUAccent ONNX models expect token_type_ids, which newer code omits

_orig_run = _ort.InferenceSession.run


def _run(self, output_names, input_feed, *a, **k):
    names = {i.name for i in self.get_inputs()}
    if "token_type_ids" in names and "token_type_ids" not in input_feed and "input_ids" in input_feed:
        input_feed = dict(input_feed, token_type_ids=np.zeros_like(input_feed["input_ids"]))
    return _orig_run(self, output_names, input_feed, *a, **k)


_ort.InferenceSession.run = _run
MODELS = {
    "podcaster": ("ESpeech/ESpeech-TTS-1_podcaster", "espeech_tts_podcaster.pt", "vocab.txt"),       # Apache-2.0
    "emotional": ("Andreevai/f5-tts-russian-emotional", "model.safetensors", "vocab.txt"),           # MIT, theatrical
}
REPO, CKPT, VOCAB = MODELS["podcaster"]
CFG = dict(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4)


class Voice:
    def __init__(self, ref_wav, ref_text, accent=True, model="podcaster"):
        from huggingface_hub import hf_hub_download
        from f5_tts.infer.utils_infer import load_model, load_vocoder, preprocess_ref_audio_text
        from f5_tts.model import DiT
        repo, ckpt, vocab = MODELS[model]
        ck = hf_hub_download(repo, ckpt)
        vo = hf_hub_download(repo, vocab)
        self.model = load_model(DiT, CFG, ck, vocab_file=vo, device="cpu")
        self.vocoder = load_vocoder(device="cpu")
        self.acc = None
        if accent:
            from ruaccent import RUAccent
            self.acc = RUAccent()
            self.acc.load(omograph_model_size="turbo3", use_dictionary=True, tiny_mode=False)
        self.set_ref(ref_wav, ref_text)

    def set_ref(self, ref_wav, ref_text):
        from f5_tts.infer.utils_infer import preprocess_ref_audio_text
        self.ref_audio, self.ref_text = preprocess_ref_audio_text(ref_wav, self.stress(ref_text))

    def stress(self, text):
        return self.acc.process_all(text) if self.acc else text

    def say(self, text, out, speed=1.0, nfe=32):
        from f5_tts.infer.utils_infer import infer_process
        wav, sr, _ = infer_process(self.ref_audio, self.ref_text, self.stress(text), self.model, self.vocoder,
                                   nfe_step=nfe, speed=speed, device="cpu")
        sf.write(out, np.asarray(wav, dtype=np.float32), sr)
        return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True)
    ap.add_argument("--ref-text", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--nfe", type=int, default=32)
    a = ap.parse_args()
    v = Voice(a.ref, a.ref_text)
    print("stressed:", v.stress(a.text))
    v.say(a.text, a.out, a.speed, a.nfe)
