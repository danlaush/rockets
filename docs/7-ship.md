# Stage 7 – Ship & Polish

## Deployment

Target: GitHub Pages, served from the repo root (`main` branch, `/`).

Steps to deploy:

1. Push the repo to GitHub (public).
2. In the repo's **Settings → Pages**, pick `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Wait ~1 minute; the URL will be `https://<user>.github.io/<repo>/`.

No build, no CI. Opening the Pages URL serves `index.html`, which loads ES modules, CSS, and the two JSON files from the same origin. Everything else (Preact, htm, signals, d3-geo, Google Fonts) is pulled from public CDNs by the browser.

## Running locally

```bash
# in the repo root
python3 -m http.server 8123
```

Then open `http://localhost:8123/`.

Opening `index.html` directly via `file://` will fail on Chrome because of its `fetch()` restrictions for local files. A one-liner local server avoids that.

## User-facing README

Replaced [`readme.md`](../readme.md) with a new version that introduces the project, points at the docs for build history, and has the local-dev incantation.

## Known issues at ship time

From Stage 6 build log, carried forward:

- UK highlight covers only England polygon due to the geojson source.
- EU has no polygon highlight (still pulses at the EU centroid).
- Mobile layout is not polished.
- "Latest launches" header dropdown was cut for time.
- Rocket Lab / NZ launches are attributed to USA by the data source.

## Ideas for v2

Ordered by ratio of delight to effort.

1. **Click-to-focus.** Clicking a country on the globe sets it as the focus country (populates the sparkline).
2. **Per-launch metadata.** Swap the annual-count dataset for something like [The Space Devs' Launch Library 2](https://thespacedevs.com/llapi) and show vehicle / payload tooltips.
3. **Milestone markers.** Pin a handful of iconic launches on the timeline (Sputnik 1, Apollo 11, Shuttle Columbia, Falcon 9 first reuse, etc.).
4. **Shareable state via URL hash.** e.g. `#year=1969&country=RU` sets scrub + focus on load.
5. **Tour mode.** A guided auto-play with narration beats.
6. **Better UK / EU polygon handling.** Upgrade the geojson source so these highlight correctly.
7. **Proper mobile layout.** Stacked panels, a drawer for the country list, touch-friendly scrubber.
8. **Offline mode.** Vendor all libraries into `/vendor/`, register a service worker. Would make `file://` work too.
9. **Launch sites instead of / in addition to country centroids.** Pulses at Baikonur, the Cape, Wenchang, etc.
10. **Sound.** A single, tasteful "tick" on each pulse, muted by default. Optional.

## Release checklist

- [x] All in-app attribution visible.
- [x] No console errors on load.
- [x] Pulses render on playback.
- [x] Scrub works forward and backward.
- [x] Play/pause + 4 speeds.
- [x] Country list reorders by cumulative total.
- [x] Stats update live.
- [x] README points at usage + docs.
- [ ] Push to GitHub and enable Pages (user action).
- [ ] Screenshot for repo banner (optional).

## Review

If this doc looks reasonable, I'm done for the weekend.
