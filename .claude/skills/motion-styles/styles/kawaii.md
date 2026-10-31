# Kawaii Anime

**Family:** Popular Explainer Looks · **id:** `kawaii`

**Look.** Flat 2D kawaii illustration on a strawberry-milk pink background covered in staggered polka dots and soft white clouds. Shapes are pastel (pink, mint, butter, lavender, sky) with an even plum outline, one cel-shadow tone and a small white highlight. The demo mascot has a big glossy anime eye with a lash line, blush marks, a heart antenna and a tiny chest panel. Sparkles twinkle and hearts float up.

**Motion.** Everything animates "on twos" at 12 steps per second. Items pop in with squash and stretch (elastic overshoot, then settle), title letters pop in one at a time with a slight tilt, arrow dots hop on one by one, and counter digits hop in a sine wave. The mascot bobs, sways and blinks.

**How it explains.** Titles are chunky white letters with a thick pink outline and a plum drop edge. Labels are pastel pills with plum outline, cel shade, highlight dot and an optional colour icon. Arrows are dotted candy trails of alternating pink and mint dots finishing in a heart. Boxes are rounded pastel cards with a soft ground shadow. The counter is bouncing outlined numerals, and emphasis is a burst of stars and hearts in five pastel colours plus white sparkles. The scene change is a rotating star iris that closes to a point, then a heart iris opens the next scene, in pink.

**Palette.** bg `#ffe3ec`, dot `#ffd0de`, pink `#ff8fb5`, pinkD `#f06c9b`, mint `#9eecd0`, butter `#ffe79a`, lav `#cdb6ff`, sky `#a9dcff`, plum `#5d3a5f`, white `#ffffff`, cream `#fff7f0`, blush `#ff9bb8`.

**Fonts.** Mochiy Pop One (titles and counter), Fredoka 600 (pill labels).

**Signature techniques.**
- A `cel()` helper fills a darker version of the colour, redraws the base colour shifted inside a clip to leave a crescent shadow, then strokes the plum outline.
- A cached background of offset polka dots and overlapping-circle clouds.
- Star and heart paths used for confetti, arrow ends and the iris wipe.
- Time quantised with `twos(t)` for sparkles, grain and bobbing.

**SFX.** Bed `room`. Labels land with `pop`, emphasis uses `ding`, the transition uses `whoosh`. The demo score adds `blip` runs, `pluck` notes, `count` for the number and a closing `chime`.

**When to use it.** Friendly, cute, playful explainers for a young or casual audience, product tours with a mascot, and anything that should feel soft and upbeat.
