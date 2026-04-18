# Stage 3 – Tech & Architecture

## Goals

- Zero build step. `open index.html` → works. No bundler, no transpiler, no `npm install`.
- Returnable: a year from now the page should still open cleanly.
- Small, legible codebase — one person can load the whole thing in their head.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| UI framework | [Preact](https://preactjs.com/) via [esm.sh](https://esm.sh/) | Tiny, Preact/htm is a familiar no-build combo. |
| Templating | [htm](https://github.com/developit/htm) | Tagged templates ≈ JSX without a compiler. |
| State | Preact `signals` (`@preact/signals`) | Cheap reactive state for timeline/playback without prop-drilling. |
| Geography | [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) | Orthographic projection + country polygons. Mature. |
| Map data | [world-atlas](https://github.com/topojson/world-atlas) 110m countries TopoJSON | ~100KB, well-known. |
| Rendering | SVG | Plays nicely with DOM events, easy to style, matches the sketchy mockup aesthetic. |
| Animation | CSS keyframes for pulses + `requestAnimationFrame` for the playback clock | Boring, performant, easy to tune. |
| Icons / typography | System fonts + an expressive handwritten/sketch font (e.g. Caveat or Shadows Into Light from Google Fonts) | Matches the mockup. Details in Stage 4. |

## External dependencies — pinning strategy

All CDN imports pinned to a specific version via `import map` in `index.html`. One place to bump.

```html
<script type="importmap">
{
  "imports": {
    "preact":             "https://esm.sh/preact@10.22.0",
    "preact/hooks":       "https://esm.sh/preact@10.22.0/hooks",
    "htm/preact":         "https://esm.sh/htm@3.1.1/preact",
    "@preact/signals":    "https://esm.sh/@preact/signals@1.2.3?deps=preact@10.22.0",
    "d3-geo":             "https://esm.sh/d3-geo@3.1.1",
    "topojson-client":    "https://esm.sh/topojson-client@3.1.0"
  }
}
</script>
```

Hedge against CDN bit-rot: we will _not_ vendor libraries in MVP (YAGNI), but we'll document the exact URLs in the README so a future us can curl them into `/vendor/` and swap the import map if esm.sh ever disappears.

The `world-atlas` TopoJSON is checked into the repo at `data/countries-110m.json` so the whole dataset is offline-resilient.

## File layout

```
rockets/
├── index.html                 # entry, import map, mount point, <link> to styles
├── app.js                     # Preact root component, wires everything together
├── styles.css                 # hand-drawn aesthetic; one file
├── src/
│   ├── components/
│   │   ├── Globe.js           # SVG orthographic globe + country paths + drag rotation
│   │   ├── LaunchLayer.js     # per-frame rendering of active launch pulses
│   │   ├── Timeline.js        # scrubber, play/pause, speed, year readout
│   │   ├── CountryList.js     # left panel: ranked countries with totals + visibility toggles
│   │   ├── Stats.js           # right panel: total, current-year count, cadence
│   │   └── LatestLaunches.js  # top-bar dropdown of recent pulses
│   ├── state.js               # signals: virtualDate, playing, speed, visibleCountries, etc.
│   ├── playback.js            # tick loop, event scheduling from annual counts
│   ├── data.js                # loads launches JSON + countries TopoJSON
│   └── geo.js                 # projection, rotation helpers, centroid lookups
├── data/
│   ├── launches-by-country-year.json   # Stage 2
│   └── countries-110m.json             # world-atlas 110m, vendored
├── docs/                      # stage docs
└── readme.md
```

Rationale:

- Keep the root clean: `index.html`, `app.js`, `styles.css` are the three files future-me will open first.
- `src/` holds everything else; flat-ish, no deeper than two levels.
- `data/` is the only place static assets live.

## Playback model

Per the product brief: annual launch counts played back as evenly-distributed events across the year.

State (all Preact signals):

- `virtualDate: Date` — the "playback cursor". Everything in the UI derives from this.
- `playing: boolean`
- `speed: number` — virtual-days-per-real-second, one of `{ 1, 2, 5, 10 }` (from the mockup).
- `visibleCountries: Set<string>` — which country codes are currently shown.

Tick loop (`playback.js`):

1. `requestAnimationFrame` drives a clock.
2. On each frame, compute `dt = (now - lastFrame) * speed / 1000` in virtual-days, advance `virtualDate`.
3. For the window `(prevDate, virtualDate]`, compute which scheduled launches fired and emit pulse events.
4. Clamp at `max(year_range)` (and respect the partial-year flag for 2026).

Event scheduling (pre-computed once at load):

- For each `(country, year, count)` with `count > 0` and `visible == true`, produce `count` timestamps distributed evenly across the year: day `i * 365/count` for `i in 0..count-1`. A tiny deterministic jitter (seeded by country+year) keeps simultaneous multi-country pulses from visually stacking.
- Full array is flat and sorted by timestamp: `[ { t, countryCode } ]`. A cursor index tracks "next unfired event".
- Scrubbing resets the cursor via binary search.

Active pulses:

- A pulse has a 1.2s CSS animation (scale + fade) and is removed from the DOM on `animationend`.
- Cap concurrent pulses (e.g. 60) by dropping the oldest — avoids pathological perf at peak years (US 2025 = 193/yr ≈ one every ~1.9 days; at 10x speed that's one every ~0.19s, fine).

## Globe rendering

- `d3-geo`'s `geoOrthographic()` projection.
- SVG `<g class="countries">` with one `<path>` per country; `d` recomputed on rotation.
- Drag to rotate: on pointer-drag, call `projection.rotate([λ0 + dx*k, φ0 - dy*k])`; re-render the paths. No need for rAF for rotation itself; throttling via `requestAnimationFrame` coalescing is fine.
- Launch pulses are absolutely-positioned SVG `<circle>` elements projected from the country's centroid. They do not rotate with the globe during playback — actually they do, via the same projection. Pulses hidden if their projected point is on the far side (`geoDistance` > π/2 from rotation centre).

Mockup compatibility: the sketchy aesthetic is achieved purely in CSS (`stroke-dasharray`, `filter: url(#roughen)` SVG filter, handwritten fonts). No dependency on rough.js needed for MVP.

## Data loading

- `data.js` fetches both JSONs via `fetch('./data/...')`. Works on GitHub Pages and from `file://` in most browsers (Chrome blocks `file://` fetch by default — we'll call this out in the README and suggest `python -m http.server` for local dev, or just use the deployed URL).
- No service worker for MVP.

## Deployment

- GitHub Pages from repo root. Push to `main`, enable Pages, done.
- No build. No CI.

## Performance budget

- First paint < 1s on a warm laptop.
- Steady 60fps during playback at 10x speed during peak US 2020s.
- Total transferred bytes on first load < ~500KB (world-atlas is the heaviest).

## What we're deliberately not doing

- No TypeScript (no build).
- No tests (weekend hack; manual smoke test in Stage 7).
- No router.
- No PWA, no service worker.
- No accessibility audit beyond sensible defaults.
- No WebGL globe (three.js / globe.gl) — SVG is enough for the polygon count and mockup aesthetic.

## Review

Approve to proceed to Stage 4 (design direction).
