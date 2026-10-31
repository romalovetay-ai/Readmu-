# Style contract

Every style is one file, `styles/<id>.js`, that calls `MS.register({...})`, plus a card `styles/<id>.md`.
The engine (`engine/kit.js` = `K`, `engine/sound.js` = `SND`) is shared; a style never redefines it.

## Rules (all styles)

- **Pure function of t.** Every frame is drawn from scratch from `t`. Randomness only from `K.rng(seed)` /
  `K.noise(seed)` with fixed seeds; never `Math.random`, never `Date`. Static textures may be cached with `K.cached`.
- **The medium is the point.** The surface texture and finishing pass (paper grain, ink pooling, misregistration,
  scanlines, film grain, glow, halftone dots...) are what make it read as the real thing. Run them every frame at
  full strength. Do not ship a flat vector look with a filter on top.
- **Phone legible.** Authored at 1280x720 and scaled with `const L = K.layout(W, H)` (`L.s` multiplies sizes,
  `L.portrait` for 1080x1920). Headlines >= 44px, labels >= 28px, key numbers >= 64px (before scaling).
- **Fast.** Under ~60 ms a frame at 1280x720. Pre-render textures once; no per-pixel loops per frame on the full
  canvas (use cached tiles, patterns, compositing).
- **No em or en dashes** in any on-screen text.
- **Original work.** Study a medium's technique, then write your own code for the look; never paste third-party source.

## The object

```js
MS.register({
  id: 'whiteboard',                      // = filename
  name: 'Whiteboard Explainer',
  family: 'Hand-Drawn',                  // one of the 14 families in index.json
  fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=block',
            specs: ['700 48px "Kalam"'] }],
  palette: { bg: '#f6f7f4', ink: '#1d2733', accent: '#d23a2f', ... },
  setup(W, H) {},                        // optional: build cached textures for this size

  // drawing API (sizes are 1280x720-authored; multiply by K.layout(W, H).s yourself)
  background(ctx, W, H, t),              // the medium's surface
  finish(ctx, W, H, t),                  // texture / finishing pass, LAST thing every frame
  title(ctx, text, x, y, p, o),          // headline in the medium's lettering, p = reveal 0..1
  label(ctx, text, x, y, p, o),          // caption >= 28px
  arrow(ctx, from, to, p, o),            // connector drawn on with p ([x,y] points)
  box(ctx, x, y, w, h, p, o),            // container / card / node
  counter(ctx, value, x, y, p, o),       // big number (value already interpolated by the caller)
  emphasis(ctx, x, y, r, p, o),          // circle, underline, burst, stamp... on the key moment
  transition(ctx, W, H, p, o),           // the medium's own scene change, drawn over the frame (p 0..1, 0.5 = covered)

  sfx: { draw: 'marker', land: 'pop', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },
  // draw = SND scribble medium (marker|chalk|pencil|brush|pen|spray) or null; land/emphasis/transition = SND voices; bed = SND bed

  demo: { duration: 12, draw(ctx, W, H, t, S), score(k, S) },   // the shared demo below, told in this medium
});
```

`o` options every primitive accepts: `color`, `size` (px before scaling), `align`, `seed`, plus anything the style
needs. Keep signatures exactly as above so scenes can swap styles.

## The shared demo (every style tells this story, 12 s)

**"How Creator OS posts one video everywhere."** Built with the style's own primitives and the medium's own
staging (a whiteboard draws it, a shadow play acts it, a terminal types it, a stained-glass window lights it).

| Time | Beat |
|---|---|
| 0.0 to 2.0 | Hook title: **One video. Every platform.** |
| 2.0 to 5.0 | A video card ("your video") appears, an arrow draws to a **Creator OS** node. |
| 5.0 to 8.0 | Arrows fan out from Creator OS to 7 labels: Instagram, TikTok, YouTube, X, LinkedIn, Threads, Facebook (text labels in the medium's lettering, pop on one by one). |
| 8.0 to 10.5 | Counter **views** rolls 0 to 1,000,000 (`K.count`), emphasis lands as it settles. |
| 10.5 to 12.0 | Takeaway held: **Post once. Reach everywhere.** |

Continuity matters more than cuts: keep the Creator OS node on screen and move/scale it between beats, use the
style's `transition` once (before the counter or the takeaway) the way the medium would.
Score: draw noises the length of each draw-on, a `land` on every label, `count` ticks while the counter rolls,
the `emphasis` hit as it lands, a resolving `chime` on the takeaway, the style's `bed` underneath.

Must work at 1280x720 and 1080x1920 (portrait: stack the fan-out as two columns under the node).

## Checking a style

```bash
cd skills/motion-styles/engine
node render.mjs --style <id> --stills 1.5,4,6.5,9.5,11.5 --out /tmp/<id>-stills          # look at every still
node render.mjs --style <id> --size 1080x1920 --stills 6.5,11.5 --out /tmp/<id>-portrait
node render.mjs --style <id> --out /tmp/<id>.mp4                                          # full demo with sound
```
