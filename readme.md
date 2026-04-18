# Global Rocket Launch Tracker

A scrubbable timeline of humanity's orbital launches by country, from Sputnik 1 in 1957 to the present. Frontend-only, no build step, Preact + htm loaded straight from a CDN.

![Mockup](docs/mockup.png)

## Run it

```bash
python3 -m http.server 8123
```

Then open <http://localhost:8123/>.

Opening `index.html` directly via `file://` won't work on Chrome because of its local-file `fetch()` restrictions — a tiny static server avoids that.

## How it works

- `index.html` declares an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) so ES modules can import `preact`, `htm/preact`, `@preact/signals`, and `d3-geo` by name from [esm.sh](https://esm.sh).
- `app.js` is the Preact root. It loads two JSON files and mounts the UI.
- `src/playback.js` pre-computes a sorted list of per-launch events by distributing each country's annual launch count evenly across that year, then advances a virtual clock driven by `requestAnimationFrame`.
- `src/components/Globe.js` renders a draggable orthographic SVG globe with `d3-geo`.

## Data

Annual orbital-launch counts per launching entity, 1957 – 2026, in [`data/launches-by-country-year.json`](data/launches-by-country-year.json). Sourced from [Space Stats Online](https://spacestatsonline.com/launches/country) — captured 2026-04-18.

## Project history / docs

Planning and build docs live in [`docs/`](docs/). They're stage-gated and numbered; read them in order if you want to see how this came together:

- [`docs/0.5-planning-the-planning.md`](docs/0.5-planning-the-planning.md)
- [`docs/1-product-brief.md`](docs/1-product-brief.md)
- [`docs/2-data.md`](docs/2-data.md)
- [`docs/3-tech.md`](docs/3-tech.md)
- [`docs/4-design.md`](docs/4-design.md)
- [`docs/5-build-plan.md`](docs/5-build-plan.md)
- [`docs/6-build-log.md`](docs/6-build-log.md)
- [`docs/7-ship.md`](docs/7-ship.md)

## Dependencies (at runtime)

Pinned in the import map in `index.html`:

- [preact@10.22.0](https://esm.sh/preact@10.22.0)
- [htm@3.1.1](https://esm.sh/htm@3.1.1/preact)
- [@preact/signals@1.2.3](https://esm.sh/@preact/signals@1.2.3)
- [d3-geo@3.1.1](https://esm.sh/d3-geo@3.1.1)
- Google Fonts: Caveat, JetBrains Mono

Nothing to install. If esm.sh ever disappears the dependencies can be vendored locally by `curl`-ing those URLs into a `vendor/` folder and updating the import map.

## Licence

Code: do whatever. Data: © Space Stats Online / underlying sources; see their site.
