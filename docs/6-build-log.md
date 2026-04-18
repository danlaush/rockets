# Stage 6 – Build Log

What actually got built, plus where it deviated from the earlier plans.

## What shipped

Files added:

- [`index.html`](../index.html) – entry, import map, root SVG filter, mount.
- [`app.js`](../app.js) – Preact root; loads data, wires playback, mounts components.
- [`styles.css`](../styles.css) – palette, grid layout, component styles, pulse animation.
- [`src/html.js`](../src/html.js) – re-exports the preact-bound `html` tag from `htm/preact`.
- [`src/data.js`](../src/data.js) – `loadData()` + entity-code → geojson-name map.
- [`src/state.js`](../src/state.js) – signals for `virtualDate`, `playing`, `speedMult`, `visibleCountries`, `focusCountry`, `rotation`, `activePulses`.
- [`src/geo.js`](../src/geo.js) – configured d3-geo orthographic projection + `syncProjection` + `projectPoint`.
- [`src/playback.js`](../src/playback.js) – `buildEvents`, `startPlayback` (rAF loop + emit), `cumulativeTotals`.
- [`src/components/Globe.js`](../src/components/Globe.js) – SVG globe, pointer-drag rotation, country paths.
- [`src/components/LaunchLayer.js`](../src/components/LaunchLayer.js) – pulse rings and trajectory tails.
- [`src/components/Timeline.js`](../src/components/Timeline.js) – scrub, play/pause, speed chips, sparkline.
- [`src/components/CountryList.js`](../src/components/CountryList.js) – ranked entity list with visibility toggles.
- [`src/components/Stats.js`](../src/components/Stats.js) – right panel numbers.

Data files:

- [`data/launches-by-country-year.json`](../data/launches-by-country-year.json) – 13 entities, 1957-2026.
- [`data/countries.geojson`](../data/countries.geojson) – world polygons with `properties.name`.

## Deviations from the plans

### Topojson replaced with plain GeoJSON

The plan called for [`world-atlas`](https://github.com/topojson/world-atlas) 110m TopoJSON + `topojson-client`. The build environment couldn't reach the npm CDNs that actually host those JSON files (they're produced at publish time, not checked into the repo), so I vendored a GeoJSON copy from a well-known public source instead. This removed the `topojson-client` dependency entirely — one fewer import, simpler rendering path. See `data/countries.geojson` and [`src/data.js`](../src/data.js).

Cost: the geojson names are idiosyncratic (`"USA"` not `"United States"`, `"England"` not `"United Kingdom"`). Mapped explicitly via `CODE_TO_GEOJSON_NAME`. UK highlight covers only England. Acceptable for MVP; fixable later by swapping in a better source.

### `html.js` re-exports instead of binding

Initial implementation did `import htm from "htm"; htm.bind(h)`. The esm.sh build of `htm/preact` exposes only a named export `html`, not a default, so `html.js` now just re-exports it. One-line file, fine.

### Partial-year handling (stats)

First pass multiplied the current year's count by `yearFrac` even for partial-year data (2026). Since the dataset's 2026 value is already YTD, that double-discounted. Fixed in [`src/playback.js`](../src/playback.js) `cumulativeTotals` via a `partial_years` set loaded from the dataset.

### Initial Preact render didn't remove the boot `<p>`

Clearing `mount.innerHTML = ""` before `render(...)` removes the placeholder reliably across browsers. Minor nit.

### No "latest launches" dropdown

From the mockup header — parked as v2 per Stage 5's cut list, since the core loop was done and spending more time there would have cut into polish elsewhere.

### No roughen effect on pulse strokes

The SVG `feDisplacementMap` "roughen" filter is applied to country polygons (adds a hand-drawn wobble). It is NOT applied to pulses because the filter region calculation causes visual clipping on small, fast-animating shapes. Plain strokes look fine.

## Things I spot-checked

- Serve with `python3 -m http.server 8123` and open `http://localhost:8123/`. Loads cleanly, no console errors (beyond the unrelated "native dialog overrides" info from the dev tool).
- Clicked play: playhead reset from end to 1957, pulses begin.
- Scrubbed forward/backward: pulses emit only for forward motion (by design; backward scrub is instantaneous reseek).
- Switched 1x/2x/5x/10x: buttons toggle active style; speed changes take effect on the next frame.
- Paused mid-playback: clock stops; cumulative totals hold.
- Concurrent pulses at 5x in 2019: saw simultaneous RU/US/CN/IN pulses; no visible jank; well under the 60-pulse cap.
- Country list reorders as cumulative ranks change.
- Stats panel: total launches, current year count, rate match expectations at several scrub points.

## Known issues

- UK highlight covers only England due to the chosen geojson (see above).
- EU highlight not drawn at all — ESA pulses appear at the EU centroid over central Europe, which is fine.
- Mobile is untested and unfocused; the grid layout won't collapse nicely on narrow viewports.
- Keyboard scrub (arrows / shift-arrows) is wired but not heavily tested.
- No mouse-wheel zoom on the globe; intentional.
- The "Data: …" pill in the header isn't actually a dropdown (cut per Stage 5).
- Opening via `file://` directly will fail because of browser restrictions on `fetch('./data/…')`. Users must serve locally or view on the deployed URL.

## Smoke-test checklist for future self

1. `cd /path/to/rockets && python3 -m http.server 8123`.
2. Open `http://localhost:8123/`.
3. Expect the globe, country list (Russia top), stats panel (total ~7,200), timeline.
4. Click play. Expect playhead to advance from 1957 with pulses.
5. Click 10x. Expect visible pulse activity through 2020s.
6. Drag the playhead back to ~1969. Expect counts to drop accordingly.
7. Drag on the globe. Expect it to rotate.

## Review

Approve to move to Stage 7 (ship).
