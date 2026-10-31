#!/usr/bin/env bash
# Installs everything the video skills in .claude/skills need. Safe to re-run: finished steps are skipped.
#   bash .claude/setup.sh
# In a fresh cloud session run it once before making videos (or ask Claude to).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SK="$ROOT/.claude/skills"
log() { echo "[video-skills] $*"; }

# Behind a TLS-inspecting proxy (Claude Code cloud) Python and Node must trust its CA.
if [ -f /root/.ccr/ca-bundle.crt ]; then
  export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt REQUESTS_CA_BUNDLE=/root/.ccr/ca-bundle.crt NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
  [ -n "${CLAUDE_ENV_FILE:-}" ] && echo "export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt" >> "$CLAUDE_ENV_FILE"
fi

command -v ffmpeg >/dev/null || log "ffmpeg is missing: install it (Ubuntu: sudo apt install ffmpeg, macOS: brew install ffmpeg)"
command -v node >/dev/null || log "Node.js 18+ is missing: https://nodejs.org"

# Python: transcription (Whisper), free voices (edge-tts, Piper), moviepy, Playwright for motion-design.
# av<16: faster-whisper 1.2 passes metadata_errors to av.open, which newer PyAV removed.
if ! python3 -c "import faster_whisper, edge_tts, moviepy, imageio_ffmpeg, playwright, yt_dlp" 2>/dev/null; then
  log "installing Python packages"
  PIP="pip install -q"
  python3 -m pip install --help 2>/dev/null | grep -q break-system-packages && PIP="$PIP --break-system-packages"
  PW=""
  node -e "require('playwright')" 2>/dev/null && PW="==$(node -p "require('playwright/package.json').version")"
  $PIP faster-whisper edge-tts piper-tts yt-dlp moviepy imageio-ffmpeg "av>=13,<16" "playwright$PW" || log "pip install failed"
fi

# Russian Piper voices (offline TTS)
PD="$HOME/.local/share/piper"; mkdir -p "$PD"
for v in irina dmitri; do
  f="ru_RU-$v-medium"
  [ -s "$PD/$f.onnx" ] && continue
  log "downloading Piper voice $f"
  for ext in onnx onnx.json; do
    curl -sSfL -o "$PD/$f.$ext" "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/$v/medium/$f.$ext" || log "failed: $f.$ext"
  done
done

# `whisper` command (video-editing skill) backed by faster-whisper, without PyTorch
if ! command -v whisper >/dev/null; then
  BIN=/usr/local/bin; [ -w "$BIN" ] || { BIN="$HOME/.local/bin"; mkdir -p "$BIN"; }
  ln -sf "$ROOT/.claude/tools/whisper" "$BIN/whisper"
fi

# Node packages for the Remotion / canvas templates (--ignore-scripts: no install scripts are run)
for d in anything2explainer/template video-shotcraft/template anidoodle/engine short-drama-edit/assets/remotion; do
  [ -d "$SK/$d/node_modules" ] && continue
  log "npm install: $d"
  (cd "$SK/$d" && npm install --ignore-scripts --no-audit --no-fund --no-package-lock >/dev/null 2>&1) || log "npm install failed: $d"
done

# Herk Edit Kit (HyperFrames, GSAP) for the edit-video / hyperframes / short-form-edit skills
if [ ! -d "$ROOT/kits/herk-edit-kit/node_modules" ]; then
  log "npm install: kits/herk-edit-kit"
  (cd "$ROOT/kits/herk-edit-kit" && npm install --ignore-scripts --no-audit --no-fund >/dev/null 2>&1) || log "npm install failed: herk-edit-kit"
fi

# Remotion: use an already installed Chromium when there is one (cloud image), instead of downloading its own
HS=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)
if [ -n "$HS" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export REMOTION_BROWSER_EXECUTABLE=$HS" >> "$CLAUDE_ENV_FILE"
fi

log "ready"
