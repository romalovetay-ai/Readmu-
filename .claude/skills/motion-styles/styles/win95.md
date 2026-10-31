# Win95 Desktop

**Family:** Retro UI & Neon · **id:** `win95`

**Look.** A mid-90s beige-box desktop drawn on a 2x pixel grid and scaled up nearest-neighbour. A teal wallpaper carries desktop icons, a grey taskbar with a Start button, task buttons and a clock, and windows have 2-pixel bevelled grey chrome with navy-to-blue title bars. All system text is aliased (alpha-thresholded, never smoothed), and a faint CRT row pattern sits over the top.

**Motion.** Windows open with dotted zoom-outline rectangles before appearing whole. Progress bars fill in blocks, checkboxes tick one by one, the mouse pointer appears at the action and an hourglass shows while the system is busy. In the demo, a Next button depresses on click and the story plays as a setup wizard.

**How it explains.** Titles and labels are bold or regular Arimo system text typed out character by character. Arrows are dotted pixel lines with a solid triangle head. Boxes are full Windows-style windows (title bar, icon, close, maximise and minimise buttons). Counters are bold system numerals, and emphasis flashes a navy frame around the number in alternating steps. The scene change is a hung-app smear: a frozen "This program is not responding" dialog is dragged across the screen, leaving a stair of copies, then repaints.

**Palette.** teal `#008080`, face `#c0c0c0`, highlight `#ffffff`, light `#dfdfdf`, shadow `#808080`, black `#000000`, navy `#000080`, title blue `#1084d0`, red `#ff0000`, yellow `#ffff00`, blue `#0000ff`, green `#008000`.

**Fonts.** Arimo, regular and bold (all system text).

**Signature techniques.**
- A half-size buffer canvas is drawn at integer coordinates and blown up with smoothing disabled, and the finish snaps the frame back to the 2x grid.
- `raised()` and `sunken()` build bevels from stacked black, white, light and shadow rectangles; `window95()`, `button()` and a dotted focus rectangle compose the widgets.
- `glyphs()` renders each string to a small canvas and thresholds its alpha so text is hard-edged, cached by string, size and colour.
- Icons, the cursor and the hourglass are hand-coded from rectangles and a pixel-row table.

**SFX.** beds `hum` + `room`, an opening `swell` + `chime`, `click` on every button press and chip, `tick` for progress blocks, `pop` as windows open, `wrong` + `glitch` with fast low clicks for the hung-app smear, `count`, `ding` on the flash, `pop` + `chime` for the message box.

**When to use it.** Nostalgic, tongue-in-cheek software stories: installers, "setup wizard" walkthroughs, error and crash humour, and anything about old-school computing.
