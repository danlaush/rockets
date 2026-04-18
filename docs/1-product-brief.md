# Stage 1 – Product Brief & MVP Scope

## Vision

A calm, beautiful, scrubbable visualisation of humanity's journey into space, country by country. Drag a timeline from October 1957 to today and watch the rhythm of rocket launches light up across the globe.

## Target user

One archetype: the curious browser. They land on the page, get the idea in under 10 seconds, scrub the timeline, go "huh, cool", and share the link.

Not building for: researchers who need exact per-launch detail, educators who need annotated tours, or anyone who wants to edit the data in-app.

## Core loop

1. Page loads on a globe framed around present day.
2. User drags a scrubber back in time.
3. As virtual time advances, pulses bloom over launching countries at the right cadence.
4. User changes speed, plays forward, or jumps to a decade.

If that loop is satisfying, the MVP is done.

## MVP scope (in)

- 3D-feeling globe (orthographic SVG projection, draggable to rotate).
- Country polygons rendered from a static world-atlas topojson.
- Static, bundled dataset of annual orbital launch counts by launching-entity country, from 1957 to the last complete year.
- Playback engine that converts annual counts into evenly-distributed events across the year.
- Timeline scrubber with:
  - drag to any date
  - play / pause
  - three speeds (e.g. 1x / 4x / 16x virtual-days-per-real-second)
  - visible year/date readout
- Launch pulse animation at country centroid on every event.
- Running counter (e.g. "launches in view year: 42 — total to date: 1,284").
- Data attribution visible in the UI.
- Works offline by opening `index.html` directly in a modern desktop browser.

## Non-goals (out)

- Per-launch detail (rocket, payload, success/failure).
- Exact historical dates of individual launches (we use annual averages, per the seed).
- Live data updates; dataset is a static file refreshed manually.
- Backend, API, user accounts.
- Editing data in the UI.
- Comparisons view, charts, leaderboards.
- Polished mobile experience; MVP targets desktop. Should not be broken on mobile but interaction fidelity is desktop-first.
- i18n; English only.
- Accessibility beyond sensible defaults (keyboard scrubber, readable contrast). Full a11y audit is a v2 concern.

## Key product decisions

| Question | Decision | Why |
| --- | --- | --- |
| Globe or map? | Globe (orthographic SVG). | Matches the "space" vibe, draggable rotation is a cheap delight, no build-step pain. |
| Per-launch vs annual average? | Annual average, evenly distributed across the year. | Matches the seed; massively reduces data acquisition cost; plays well at all speeds. |
| Date range | 1957-10-04 to end of last complete calendar year. | First-orbit bookend is iconic; complete-year bound keeps counts honest. |
| Country granularity | Launching entity's country (operator/program), with one simplifying rule: USSR pre-1992 maps to Russia for display. ESA launches attributed to France (CSG Kourou / ESA HQ convention). | Keeps the map joinable to ISO-2 codes, keeps the story legible. |
| Launch metadata | None in MVP. | Weekend scope. |
| Controls | Drag-scrub, play/pause, 3 speeds, "jump to decade" chips. | Covers the core loop with minimal surface area. |
| Mobile | Not a target; don't break it. | Weekend scope. Globe dragging conflicts with page scroll on touch. |
| Hosting | GitHub Pages from the repo root. | Free, zero-config for a single `index.html`. |
| Offline behaviour | Fully offline; data and libraries load from static files except for esm.sh imports (optional local fallback noted in Stage 3). | Matches "easy to return to" principle. |
| Attribution | Small footer: data source + link, library credits. | Good citizenship; required for some sources. |

## Success criteria

The MVP is "done" when, on my laptop in a fresh browser profile:

1. Opening `index.html` (or the GitHub Pages URL) shows the globe and timeline within ~1s.
2. Dragging the scrubber feels smooth at 60fps on a 2020-era laptop.
3. Playback at medium speed produces a visible launch pulse at an appropriate cadence (e.g. at peak US years, roughly one pulse every second or two).
4. No console errors; no missing attributions; no placeholder data.
5. A non-technical friend can get the idea unprompted.

Nice-to-have if time allows:

- Hover a country to see that year's count for that country.
- A "compare years" marker pair.
- URL-encoded state (e.g. `#year=1969`) so you can share a moment.

## Risks & mitigations

- Data quality / sourcing cost → use one well-known source, cite it, accept small gaps. Bundle as a single JSON so updating is a one-file PR.
- Globe rendering perf with SVG at high pulse counts → cap concurrent pulses; reuse DOM; test at peak-density years early in Stage 6.
- "No build" fragility (CDN outage, version drift) → pin esm.sh versions in the import map; optionally vendor libraries to `/vendor/` as a hedge (decide in Stage 3).
- Scope creep into per-launch detail → explicitly out in this doc; v2 section in Stage 7.

## Review

Approve this brief to proceed to Stage 2 (data sourcing).
