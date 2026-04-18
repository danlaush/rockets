# Stage 4 – Design Direction

## Reference

[`docs/mockup.png`](mockup.png) — hand-drawn sketch of the app in a monitor frame. That image is the north star for this stage.

## Aesthetic

A hand-drawn, blueprint-ish feel. Everything looks like it was sketched with a black marker on slightly warm paper. The globe is a wireframe with drawn coastlines; launches are little ink pulses.

Why: it matches the playful hack-project vibe, it hides imperfection (sketchy strokes read as "intentional"), and it's cheap to implement (SVG `stroke-dasharray`, a roughen filter, handwritten fonts).

## Palette

| Role | Token | Value | Notes |
| --- | --- | --- | --- |
| Paper | `--bg` | `#f2efe8` | Warm off-white. |
| Ink | `--fg` | `#1a1a1a` | Near-black for strokes & text. |
| Muted ink | `--fg-muted` | `#5a5a5a` | Secondary text, axis labels. |
| Faint rule | `--rule` | `#c9c3b5` | Thin lines, dividers. |
| Launch glow | `--launch` | `#c84a2d` | Single warm accent. Used _only_ for launch pulses and the play head. |
| Highlight | `--highlight` | `#e9e2cf` | Hover / selected row bg. |

Single accent colour by design — it's the one thing that moves and we want the eye to go straight to it.

## Typography

- Headings / labels: **Caveat** (Google Fonts) or similar handwritten display face. Used for UI chrome: "GLOBAL ROCKET LAUNCH TRACKER", country names, panel titles.
- Numbers / data: a monospace like **JetBrains Mono** or system `ui-monospace`. Consistent digit widths make the big counters feel stable when they tick.
- Body: system sans (`ui-sans-serif`) for anything long-form (attribution footer).

Two web fonts max. Preloaded; we accept a brief FOUT.

## Layout

Matches the mockup, with semantic regions:

```
┌────────────────────────────────────────────────────────────┐
│  [rocket] GLOBAL ROCKET LAUNCH TRACKER  [latest dropdown]  │  <- header
├───────────────┬────────────────────────┬───────────────────┤
│ COUNTRY       │                        │ TOTAL LAUNCHES    │
│ ─────────     │                        │ 6,229             │
│ RU  2,908 ☑   │                        │ CURRENT YEAR 2023 │
│ US  2,104 ☑   │        GLOBE           │ 190               │
│ CN    712 ☐   │    (drag to rotate)    │ AVERAGE RATE      │
│ EU    411 ☐   │                        │ 1 every 1.9 days  │
│ ...           │                        │                   │
│               │                        │                   │
├───────────────┴────────────────────────┴───────────────────┤
│  [country] sparkline of yearly counts                      │
│  1960 ────────────●──────────────────── 2026               │  <- timeline
│  ▶ 1x 2x 5x 10x                                            │
└────────────────────────────────────────────────────────────┘
```

Three columns on desktop, stacked on narrow viewports (not a primary target; just don't break).

## Components & interaction

### Globe
- Orthographic projection, filled with `--bg`, stroked with `--fg`.
- Countries: thin strokes; fill is transparent by default. A faint `--highlight` fill appears behind visible countries during playback.
- Graticule (5° or 10° lines) in `--rule` at 0.5px.
- Drag anywhere on the globe to rotate. Mouse wheel does nothing in MVP (zoom is a v2 temptation).

### Launch pulse
- A small concentric ring expanding from the country's projected centroid.
- 1.2s animation: scale 0→3.5, opacity 1→0.
- Colour `--launch`. A 1px stroke circle, no fill.
- Plus a short tangent line ("trajectory arc" from the mockup) drawn at a random-but-deterministic angle. 4–12px long. This is the detail that sells the aesthetic.

### Timeline
- Horizontal rule spanning the full width.
- Year ticks every 5 years; labels every decade.
- A drawn, slightly-rough "playhead" (circle on the line) in `--launch`.
- Drag to scrub. Clicking the bar jumps there. Keyboard: `←` / `→` step a month; `Shift + ←/→` step a year.
- Above the bar: a sparkline of the **selected** country's annual counts, anchored to the timeline's year axis. Matches the mockup's "Russia" chart.
- Below/left of the bar: play/pause + 1x / 2x / 5x / 10x speed chips.

### Country list (left panel)
- Header: "COUNTRY".
- Rows sorted by cumulative launches to date at `virtualDate` (so they reshuffle as you scrub — a nice secondary bit of motion).
- Each row: visibility checkbox, flag-ish glyph (sketched rectangle), name, running total.
- Clicking a row name sets it as the "focus country" for the sparkline.
- Clicking the checkbox toggles pulses for that country.
- Cap list at ~12 entities (our dataset). Scroll if more.

### Stats panel (right)
- "TOTAL LAUNCHES" — cumulative across all visible countries up to `virtualDate`.
- "CURRENT YEAR (YYYY)" — count for the year `virtualDate` is in (or prorated for the current partial year).
- "AVERAGE LAUNCH RATE" — derived from the current-year count: "1 every X.Y days". At 0 launches, hides with a dash.

### Header
- Rocket glyph (SVG), title.
- "LATEST LAUNCH" dropdown: shows the 3 most recent pulses in the current playback window with country + virtual date. Mostly decorative; if it's fiddly to implement, cut for v2.

### Footer
- Attribution: "Data: Space Stats Online (captured 2026-04-18) · Built for fun".

## Animation rules

- Globe drag rotation: no easing, 1:1 with pointer.
- Scrubber drag: snap-free, 1:1 with pointer.
- Play-head advance: linear.
- Pulses: `cubic-bezier(0.2, 0.8, 0.2, 1)` ease-out.
- Big-number counters: don't animate (don't want a slot-machine effect during scrubbing; instant updates feel responsive).
- Row reorder in country list: CSS `transition: transform 300ms` using FLIP or just position transitions.

## Accessibility baseline

- Globe has role=img with a short alt description; decorative.
- Timeline is a `role="slider"` with `aria-valuemin/max/now`.
- Keyboard: tab order is header → country list → timeline → stats. Enter / Space toggles country visibility. Play/pause is `Space` when timeline is focused.
- Colour contrast: ink-on-paper palette is ~13:1.

## Deferred to v2

- Mobile layout polish.
- Zoom / click-to-focus-country on the globe.
- Per-launch detail tooltip.
- Tour mode (auto-play with narration beats at Sputnik, Apollo 11, Challenger, Falcon 9 reuse, etc).

## Review

Approve to proceed to Stage 5 (build plan).
