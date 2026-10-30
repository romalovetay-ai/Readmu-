# Скилы для видео, озвучки и анимации

Установлены 30.10.2026. Все бесплатные, без обязательных платных API.

| Папки | Источник | Лицензия | Для чего |
|---|---|---|---|
| `remotion-*` (12) | [remotion-dev/skills](https://github.com/remotion-dev/skills) | Remotion License (бесплатно для частных лиц и компаний до 3 человек) | Видео кодом на React, титры, рендер |
| `ds-ffmpeg`, `ds-moviepy`, `ds-playwright-recording`, `ds-remotion` | [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) | MIT | Монтаж, склейка, запись экрана |
| `ffmpeg-skill` | [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) | MIT | 42 инструмента FFmpeg, локально |
| `videoediting` | [blazerior/videoediting-claude-skill](https://github.com/blazerior/videoediting-claude-skill) | MIT | Монтаж по транскрипту |
| `video-editing` | [6missedcalls/video-editing-skill](https://github.com/6missedcalls/video-editing-skill) | MIT | Jump cut, субтитры, скорость |
| `animate` | [cth9191/animate](https://github.com/cth9191/animate) | MIT | Мультики в 7 стилях под музыку |
| `motion-design` | [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) | MIT | Моушн-дизайн на HTML + ffmpeg |
| `anidoodle` | [alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle) | Apache 2.0 | Рисованная анимация и фильмы |
| `video-shotcraft` | [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | Apache 2.0 | Кинематографичные ролики, экспорт в CapCut |
| `anything2explainer` | [Vincentwei1021/anything2explainer](https://github.com/Vincentwei1021/anything2explainer) | PolyForm Noncommercial (только некоммерческое) | Объясняющее видео с бесплатной озвучкой (edge-tts / Kokoro) |
| `blender-*` (22) | [EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills) | MIT | 3D: моделирование, риггинг, анимация |
| `remotion-motion-graphics` | [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) | MIT | Моушн-графика на Remotion |
| `video-engine` | [ninjasweb/video-engine-skill](https://github.com/ninjasweb/video-engine-skill) | MIT | Озвученные ролики; голос — ElevenLabs/Fish Audio (платно) или своя запись / наш `tts.py` |
| `short-drama*` (11) | [zenstory-ai/drama-skills](https://github.com/zenstory-ai/drama-skills) | MIT | Сценарий, персонажи, раскадровка |

## Подготовка

В новом облачном окружении (или на своём компьютере) один раз выполни:

```bash
bash .claude/setup.sh
```

Скрипт ставит Whisper (субтитры), бесплатную озвучку edge-tts и Piper с русскими голосами, moviepy, Playwright и npm-пакеты шаблонов Remotion. Повторный запуск ничего не переустанавливает.

## Инструменты в `.claude/tools/`

- `tts.py "Текст" out.mp3 [--voice ru-RU-DmitryNeural] [--engine piper]` — бесплатная озвучка. Голоса edge-tts: `ru-RU-SvetlanaNeural`, `ru-RU-DmitryNeural` (нужен интернет). Piper работает без интернета: `ru_RU-irina-medium`, `ru_RU-dmitri-medium`.
- `whisper` — команда, совместимая с openai-whisper, но на faster-whisper, без PyTorch. Нужна скилу `video-editing`.

## Что исправлено в скилах

- `animate`: распознавание времени слов работало только для английского. Теперь при модели без `.en` (например `--model small`) язык определяется сам, а слова сравниваются в любом алфавите.
- `video-editing`: добавлен заголовок SKILL.md, без которого Claude Code не видел скил.
- Remotion в облаке: `REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell`.

## Пример

`pieces/luchik/` — пробный мультик «Лучик» (скил `animate`, озвучка edge-tts). Готовое видео: `pieces/luchik/renders/share.mp4`.
