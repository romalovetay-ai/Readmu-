#!/bin/bash
# wait for the voice pass, then render the master
while kill -0 480 2>/dev/null; do sleep 30; done
tail -3 voice.log
TTS=f5 VOICE_MODEL=podcaster python3 build.py > render.log 2>&1
tail -3 render.log
