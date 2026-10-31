# Wood Type Letterpress

**Family:** Print · **id:** `letterpress`

**Look.** A two-ink broadside on cream cotton stock, black and brick red only. Display type is mixed wood faces set letter by letter, each sort inked slightly differently with horizontal wood grain, worn specks and darker squeezed rims, and each letter is bitten into the paper with a shadowed and a lifted edge. Red and black brass rules run along the head and foot, and a faint blind deboss frames the sheet.

**Motion.** Letters land one after another from a slightly oversized size down to 1, each fading in quickly. Rule borders lock up side by side in order, and arrow pieces appear one at a time. The counter is re-set at six steps a second. In the demo the whole sheet gets a tiny platen squeeze on each landing beat.

**How it explains.** Titles are Anton caps (with Abril Fatface for a contrasting second line), labels are Bebas Neue caps, both in black or red. Arrows are built from short rule pieces with a cast triangle head. Boxes are thick plus thin rule borders with red diamond ornaments in the corners. The counter is Anton numerals. Emphasis is a red rubber stamp ("SMASH HIT" by default) in a double ring, slapped down at an angle with a patchy rubber look. The scene change lifts the printed sheet off the press upwards with a shadow and tilt, then a fresh sheet is revealed as the platen comes down top to bottom.

**Palette.** paper `#efe3c8`, ink `#1c1a17`, red `#c4362b`, rim `#0b0a09` (plus darker red `#8e2219` for stamp edges).

**Fonts.** Anton (headlines and numerals), Abril Fatface (serif contrast line), Bebas Neue (labels), Rubik Mono One (stamp word).

**Signature techniques.**
- A cached 256px per-sort ink tile with noise-based wood grain, worn specks and mottled alpha, used as a pattern fill at a random offset per letter.
- Each letter is drawn three times: a shadow, a light lifted edge, then the inked glyph with a faint darker outline.
- Stamp drawn with `multiply` composite using the same patchy ink pattern.
- Background is cached paper texture with rag flecks, deboss strokes and the red/black rules.

**SFX.** Bed `room`. Landings use `thud`, emphasis uses `stamp`, the transition uses `paper`. The demo score adds many soft `click` sorts, `count` stamps and a closing `chime`.

**When to use it.** Bold statements, announcements and credibility-heavy stats where a crafted, old-print broadside tone suits, such as launches, manifestos and "wanted" style callouts.
