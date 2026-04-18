# Stage 2 – Data Source & Dataset

## Chosen source

[Space Stats Online](https://spacestatsonline.com/launches/country) — annual orbital-launch counts broken down by launching country/entity. Updated monthly; last updated 2026-04-01 at time of capture.

Why this source:

- Matches the granularity we need exactly (country + year + count).
- Already aggregated; no per-launch cleanup work.
- One place for all countries including "Europe" (ESA/Arianespace) as a single entity.
- Stable URL pattern: `/launches/country/<code>`.

Risks:

- Single-source; no cross-check in MVP. Acceptable for a weekend hack.
- Attribution of Rocket Lab launches rolls into USA, not New Zealand (Rocket Lab is US-incorporated). We'll note this in the UI rather than try to re-attribute.
- 2026 is in-flight (today is 2026-04-18) so current-year counts are partial. The playback engine will treat the current year as partial and render at partial-scale (see Stage 3).

## Bundled dataset scope

- Entities: Russia (incl. USSR pre-1992), United States, China, Japan, India, France, Europe (ESA/Arianespace), United Kingdom, Israel, Iran, North Korea, South Korea, Australia.
- Year range: 1957 – 2026 (2026 partial).
- Shape: annual orbital-launch counts.
- Format: single static JSON file shipped with the app. No fetch, no CORS.

## File

`data/launches-by-country-year.json`

```json
{
  "source": {
    "name": "Space Stats Online",
    "url": "https://spacestatsonline.com/launches/country",
    "captured_at": "2026-04-18",
    "source_last_updated": "2026-04-01"
  },
  "notes": [
    "USSR launches 1957-1991 are attributed to Russia for display continuity.",
    "Europe entity aggregates ESA/Arianespace launches.",
    "Rocket Lab NZ launches are attributed to the United States by the source.",
    "2026 is a partial year."
  ],
  "entities": [
    { "code": "RU", "name": "Russia", "centroid": [105.0, 61.0] },
    { "code": "US", "name": "United States", "centroid": [-98.0, 39.5] },
    { "code": "CN", "name": "China", "centroid": [105.0, 35.0] },
    { "code": "JP", "name": "Japan", "centroid": [138.0, 36.0] },
    { "code": "IN", "name": "India", "centroid": [78.0, 21.0] },
    { "code": "FR", "name": "France", "centroid": [2.5, 46.5] },
    { "code": "EU", "name": "Europe", "centroid": [10.0, 50.0] },
    { "code": "GB", "name": "United Kingdom", "centroid": [-2.0, 54.0] },
    { "code": "IL", "name": "Israel", "centroid": [35.0, 31.5] },
    { "code": "IR", "name": "Iran", "centroid": [53.0, 32.5] },
    { "code": "KP", "name": "North Korea", "centroid": [127.0, 40.0] },
    { "code": "KR", "name": "South Korea", "centroid": [128.0, 36.0] },
    { "code": "AU", "name": "Australia", "centroid": [135.0, -25.0] }
  ],
  "launches": {
    "RU": { "1957": 2, "1958": 5, "1959": 4, "1960": 9, "1961": 9 /* ... */ }
  }
}
```

(Full payload is written to `data/launches-by-country-year.json`.)

## Licensing / attribution

No explicit license on Space Stats Online. Aggregate launch counts are factual data and not individually copyrightable. The app's footer will credit the source with a visible link per standard good-citizenship practice:

> Data: [Space Stats Online](https://spacestatsonline.com/launches/country), captured 2026-04-18.

If the source author objects, we'll update or remove.

## How to refresh the dataset later

1. Run the (tiny) fetch script described in Stage 3, or manually update the JSON.
2. Bump `captured_at` and `source_last_updated` in the file.
3. Commit.

## Review

Approve to proceed to Stage 3 (tech & architecture).
