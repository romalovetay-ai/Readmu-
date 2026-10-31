# Glassmorphism UI

**Family:** Dimensional · **id:** `glassmorphism`

**Look.** A deep violet-to-black backdrop lit by big soft colour blobs (violet, magenta, orange, cyan, pink) and a few crisp glossy orbs with a white highlight. Frosted glass panels float over it, each with a pale tint, fine grain, a diagonal sheen and a 1px light border that is brightest at the top left. Text is white Inter, and the whole frame gets a dark vignette and light overlay grain.

**Motion.** The blobs and orbs drift on slow sine paths and the blobs breathe in size. The specular sheen on every glass surface slides slowly sideways. Titles fade up word by word, pills pop in with a back-ease, and cards rise into place from about 40px below.

**How it explains.** Labels are glass pills with a glowing colour dot. Arrows are gradient connectors with a soft additive glow and a small light dot travelling along them. Boxes are frosted cards, and a card drawn over another card frosts the one beneath it. The counter is a big white-to-pink number with a magenta glow, and emphasis is a conic-gradient progress ring that sweeps to full and then pings outward. The scene change is a full-frame frosted pane that slides across the screen and then slides away, with a bright edge line.

**Palette.** base `#12082e`, base2 `#070418`, magenta `#ff2bd6`, pink `#ff4fc1`, orange `#ff7a1a`, violet `#7a2bff`, cyan `#00d1ff`, blue `#3b6bff`, mint `#4dffa6`, white `#ffffff`.

**Fonts.** Inter 800 (titles and counter), Inter 600 (pill labels), Inter 400 (body size).

**Signature techniques.**
- Real backdrop blur: each panel downsamples the frame drawn so far to a tenth size, blurs and saturates it, and draws it clipped inside the panel.
- A cached 128px black and white speckle tile gives the frost grain.
- Additive (`lighter`) compositing for the background blobs and the connector glow.
- Soft drop shadow under each glass surface, plus a gradient stroke for the edge highlight.

**SFX.** Bed `hum`. Labels land with `blip`, emphasis uses `ding`, the transition uses `whoosh`. The demo score also adds a `swell` chord at the open, `click` ticks under the title, `pop`, `count` for the number and a closing `chime`.

**When to use it.** Product, SaaS and app explainers that want a polished modern UI feel, especially dashboards, feature tours and anything with layered cards and flows.
