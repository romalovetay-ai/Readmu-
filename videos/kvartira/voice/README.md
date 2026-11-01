# Голос рассказчика

- Синтез: [ESpeech-TTS-1 podcaster](https://huggingface.co/ESpeech/ESpeech-TTS-1_podcaster) (F5-TTS, Apache-2.0), ударения — [RUAccent](https://github.com/Den4ikAI/ruaccent).
- Образец голоса `ref.wav` (8 с) и запасной `ref_alt.wav` — записи из [Mozilla Common Voice 17](https://commonvoice.mozilla.org) (русский, dev), лицензия **CC0**: участник сам передал запись в общественное достояние. Подобраны автоматически: молодой мужской голос, чистая запись, живая интонация.
- Сборка с этим голосом: `TTS=f5 SCRIPT=script_18 python3 build.py` → `out/kvartira_18_f5.mp4`.
- Другой голос: `VOICE_REF=voice/ref_alt.wav ...`, или положи свою запись 6–9 с в `voice/ref.wav` и её точный текст в `voice/ref.wav.txt`.
