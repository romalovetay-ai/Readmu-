---
name: motion-styles
description: Claude Motion style suite: 74 animated-explainer looks (whiteboard, chalkboard, watercolor, stained glass, risograph, shadow puppet, claymation, manga, ukiyo-e, CRT terminal, Game Boy, Win95, synthwave, isometric, voxel, film noir, neon sign, transit map, isotype, kinetic type, psychedelic and more) built as code-drawn canvas animations with a synthesized sound score, rendered to MP4 at 16:9 or 9:16. Use when the user asks for an animated explainer, a motion graphic or B-roll "in the style of" a medium, a "<style> version" of a topic or to compare looks for a video.
---

# Motion styles (74 explainer looks, one engine)

Every style is original code: a canvas renderer + synthesized sound, rendered frame by frame in headless Chrome.

## Layout

| Path | What |
|---|---|
| `index.json` | every style: id, name, family, one-line look, built flag |
| `styles/<id>.js` | the style module (`MS.register`): surface, finishing pass, lettering, arrows, boxes, counters, emphasis, transition, sound palette, and a 12 s demo |
| `styles/<id>.md` | the style card: look, motion, how it explains, palette, fonts, signature techniques, when to use it |
| `STYLE_CONTRACT.md` | the module API every style implements (read before writing or editing a style) |
| `engine/kit.js` | `K`: seeded rng/noise, easing + beat timing, camera, paper/grain textures, wobble + draw-on paths, arrows, text, counters, portrait layout |
| `engine/sound.js` | `SND`: synthesized SFX (pop, stamp, thud, whoosh, tick, click, blip, pluck, chime, ding, wrong, riser, glitch, paper, swell, scribble[marker/chalk/pencil/brush/pen/spray], type, count) + beds (room, tape, hum, vinyl, space, ocean, crowd), limiter on the master |
| `engine/player.html` | live preview with scrub + sound (`?style=<id>&scene=<file>&w=&h=`) |
| `engine/render.mjs` | MP4 / stills renderer (Chrome -> ffmpeg, audio via OfflineAudioContext) |
| `engine/gallery.mjs` | contact sheet of every built style |
| `templates/scene.js` | starting point for a custom explainer on any topic |

Setup once: `cd engine && npm i` (puppeteer-core; uses the installed Google Chrome, override with `CHROME_PATH`). Needs `ffmpeg` on PATH.

## Families

Popular Explainer Looks, Hand-Drawn, Painterly, Print, Paper & Craft, Illustration, Art & Design Movements,
Retro Digital, Retro UI & Neon, Dimensional, Light & Imaging, Data & Information, Generative & Type, Cosmic & Psychedelic.
Pick by the story: data and process explainers read best in Hand-Drawn, Data & Information, Dimensional and the
Popular looks; nostalgia and humour in Retro Digital / Retro UI; premium launches in Light & Imaging / product-launch;
culture and history in Illustration / Art movements. When the user names a look loosely ("make it look like an old
newspaper"), search `index.json` names and looks and offer the 2 or 3 closest.

## Make an explainer

1. **Pick the style** and read its `styles/<id>.md`. Watch its demo first:
   `node engine/render.mjs --style <id> --out /tmp/<id>.mp4` (or open `engine/player.html?style=<id>`).
2. **Write the scene** for the topic: copy `templates/scene.js` into the project
   (e.g. `projects/<slug>/scene.js`) and fill `SCENE = { duration, draw(ctx, W, H, t, S), score(k, S) }` using
   the style's primitives (`S.background`, `S.title`, `S.label`, `S.arrow`, `S.box`, `S.counter`, `S.emphasis`,
   `S.transition`, `S.finish`). Beats: a hook out of the way within ~2 s, something changing every 1 to 2 s, arrows that
   draw on to show cause, labels landing on what they label, one medium-true scene change, an emphasis on the key
   number, a held takeaway (~1 s). Keep elements continuous between beats (move, grow, morph) and cut only when the
   story really moves on.
   With a voiceover: time beats to the Whisper word stamps of the narration, never to guessed pacing.
3. **Storyboard check:** render stills at every beat and look at them before the full render:
   `node engine/render.mjs --style <id> --scene /abs/path/scene.js --stills 1,3,5,7,9,11 --out /tmp/sb`
4. **Render:** `node engine/render.mjs --style <id> --scene /abs/path/scene.js --out renders/<slug>.mp4`
   Vertical: add `--size 1080x1920` (layouts must read on a phone: use `K.layout(W, H)`, fractions of W/H in portrait).
   A 12 s 720p explainer renders in a few seconds.
5. **Narration:** render with `--voiceover` (SFX sit lower, beds and music drop out) and mux the narration on top
   with ffmpeg (`-filter_complex amix=inputs=2:normalize=0`).
6. Save finished videos with a readable name the user can find (e.g. `~/Downloads/<Readable Name>.mp4`).

## Rules

- **Frames are pure functions of t.** Seeded `K.rng` / `K.noise` only, never `Math.random`. Cache static textures.
- **The finishing pass sells the medium** (grain, ink pooling, misregistration, scanlines, glow). Never skip it.
- **Phone legible:** headlines >= 44px, labels >= 28px, key numbers >= 64px at 1280x720 (scaled by `K.layout`).
- **No em or en dashes** in on-screen text (they read as AI-written).
- **Facts on screen must be right.** Draw the real subject for the topic, not the demo's props.
- Write original code for every look; never paste third-party source into a style.

## Adding or fixing a style

Follow `STYLE_CONTRACT.md`, keep the primitive signatures identical so scenes can swap styles, verify with landscape
and portrait stills, then set `built: true` in `index.json`. Run renders one at a time on smaller machines.
