# ASCII Demoscene

**Family:** Retro Digital · **id:** `ascii-render`

**Look.** A 90s demoscene intro on a near-black violet screen. Everything sits on a strict monospace character grid: a spinning torus built from ramp characters in a rainbow of hues, a sparse plasma of coloured glyphs behind it, half-block "figlet" titles with a purple drop shadow, and box-drawing panels with cyan borders.

**Motion.** The torus tumbles continuously and can be revealed top to bottom as a scan. The plasma backdrop ripples from summed sine waves. Titles and labels print in column by column or letter by letter, panels print row by row, and a rainbow sine scroller glides in and holds. The finish pass adds a soft phosphor bloom, faint scanlines, a vignette and light grain.

**How it explains.** Labels type out with a trailing underscore cursor. Arrows are strings of box-drawing dashes, pipes or diagonals stepped along the path, with a solid triangle head once complete. Boxes are single or double line panels with an optional bracketed title tab. Counters are big half-block figlet numerals. Emphasis is a double-line frame that flashes in reverse-video style around the number while star and plus sparks fly off. The scene change is a re-raster: a bright scan row sweeps down leaving static characters, then sweeps again to reveal the new page.

**Palette.** bg `#05040c`, text `#c8d4ff`, dim `#6a74a8`, cyan `#4ae0ff`, hot yellow `#ffd04a`, magenta `#e05ab0`, a 12-step hue ramp from `#2a1a6a` through `#7a3ad8`, `#ff6a7a`, `#ffd04a`, `#6aff8a` and `#4ae0ff` to `#c8d4ff`, copper bars in `#3a0a5a`, `#8a1a8a`, `#ff4a9a`, `#ffd0e0`, and a title gradient of `#ff3a5a` to `#ffc84a`.

**Fonts.** IBM Plex Mono 500/600 (labels, box-drawing, scroller), Press Start 2P (rasterised to a bitmap, then redrawn as half-block figlet titles and counters).

**Signature techniques.**
- A character atlas holds every ramp character in every hue, so the torus and plasma are drawn with `drawImage` blits instead of `fillText`.
- The torus is point-splatted with a z-buffer, lit by a fixed light, and mapped to the luminance ramp ` .,:;-=+*!#$@`.
- Figlet lettering reads the alpha bitmap of an 8px pixel font and draws two bitmap rows per character cell as half blocks, with a vertical colour gradient and offset shadow.
- Copper bars are stacked horizontal colour bands; the finish uses a quarter-res blur added with `lighter`.

**SFX.** bed `tape`, `swell` chord on the opening, rising `blip` notes on the hook, `type` on panels and labels, `riser` into the transition, `glitch` + `whoosh` at the page change, `count` for the numeral, `glitch` + `stamp` on the emphasis, `chime` to resolve.

**When to use it.** Tech-flavoured intros, product drops, "launch" reveals, or anything that should feel like a retro hacker or demo-party release.
