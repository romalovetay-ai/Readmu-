#!/bin/bash
# wait for the voice pass, then render the master, cut the shorts and the <30 MB full file
while kill -0 480 2>/dev/null; do sleep 30; done
tail -3 voice.log
export TTS=f5 VOICE_MODEL=podcaster
python3 build.py > render.log 2>&1 && python3 shorts.py >> render.log 2>&1 && python3 deliver.py full >> render.log 2>&1
echo "ALL DONE"
tail -8 render.log
