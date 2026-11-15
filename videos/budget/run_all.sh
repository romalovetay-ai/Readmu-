#!/bin/bash
# wait for the voice, then render, cut shorts and the <30 MB full file
while pgrep -f "build.py --voice" >/dev/null; do sleep 30; done
export TTS=f5 VOICE_MODEL=podcaster
python3 build.py > render.log 2>&1 && python3 shorts.py >> render.log 2>&1 && python3 deliver.py full >> render.log 2>&1
echo "ALL DONE"
tail -8 render.log
