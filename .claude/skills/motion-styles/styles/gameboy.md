# Pocket Monochrome

**Family:** Retro Digital · **id:** `gameboy`

**Look.** An original DMG-style handheld. A true 160 by 144 pixel LCD in exactly four pea-soup greens is blown up with nearest-neighbour scaling inside a purple-grey bezel with a big rounded lower-right corner, a striped magenta and blue label reading "DOT MATRIX WITH CREATOR SOUND", and a glowing red battery LED. Portrait adds the rest of the device on a warm grey body: a "Creator OS POCKET" logo, D-pad, A and B buttons, Select and Start, and a speaker grille.

**Motion.** All scene drawing happens on a tiny 160 by 144 buffer using only four shade inks, so motion is chunky and pixel-stepped: titles drop in two pixels per frame, windows slide up in 8px steps, text types out, and a small hero sprite walks along the bottom. Each dark pixel casts a faint offset shadow onto the reflective backing, and a visible pixel grid sits over the glass with a soft sheen and an inner edge shade.

**How it explains.** Titles, labels and counters use Press Start 2P at 8px, 8px double height, or 16px depending on the requested size. Arrows are dotted, marching pixel lines (Bresenham) with a pixel head. Boxes are the classic text window: white fill, dark double rule with rounded corners. Counters are 16px numerals. Emphasis is a battle-intro flash that inverts the band around the number on alternate frames, then wipes out in stripes. The scene change steps the palette toward white (a door transition) via a shade remap.

**Palette.** screen shades `#c7d38a`, `#8fa860`, `#4d6b3a`, `#1f3a26` (drawn as multiply inks `#ffffff`, `#b8cbb2`, `#63816b`, `#284646`), bezel `#6d6c84`, body `#d9d6cf`, label stripes `#8c2f5a` and `#2f3a8c`, button magenta `#c2386e` to `#7c1c46`, logo blue `#2b2e7a`.

**Fonts.** Press Start 2P (all LCD text), Inter 700/800 plus italic (bezel and body printing).

**Signature techniques.**
- Glyphs are rasterised from the pixel font, thresholded on alpha so they land in a single shade ink, then cached (optionally stretched to double height).
- The LCD buffer is composited with `multiply` over a green backing, once offset at low alpha for the pixel shadow and once crisp.
- Palette remapping by nearest of the four shades, used for inversion and for the fade transition.
- The demo draws an overworld with dithered grass, tree sprites, a TV and a house, then a status screen.

**SFX.** bed `tape`, square-wave `blip` notes, `pop` and `click` for the window, `tick` as arrows march, `whoosh` for the fade, `count` for the numeral, `glitch` + `ding` on the emphasis, rapid `blip` typing, `chime` to resolve.

**When to use it.** Nostalgic gaming-flavoured explainers, level-up and progress stories, and anything where "press start" energy and a strict four-colour look suit the message.
