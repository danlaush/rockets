# Stage 8 — Iteration 1

Three tickets building on the MVP. Treat `docs/mockup2.png` as directional inspiration, not a pixel target.

## T1 — Orbital-ish launch arcs

**Problem.** The MVP pulse + straight tail reads as "ping on a map". It doesn't land the *space* part of rocket launches.

**Want.** Each launch draws a curving arc out from the globe into the atmosphere. The rocket is a dot at the leading edge with a short, fading tail behind it. Arc length and globe zoom are tuned so rockets launched near the limb can still be seen poking off the edge of the globe.

**Details.**

- Altitude profile: climb away from the surface (~10–12% of the globe radius) over the arc lifetime; don't fall back down — we want "going to space", not "coming home".
- Direction: a deterministic bearing per pulse so restarts look the same, but varied enough across countries that arcs don't all stack up.
- Visibility: a point is "visible" if either its depth puts it on the near side, *or* its radial 2D position exceeds the globe silhouette (i.e. it's already climbed past the horizon line). Arcs that originate just behind the limb can peek over the edge as they climb.
- Padding: the globe no longer fills the whole square; leave room around it so arcs can poke into the space around the sphere without being clipped.
- Duration: ~1.8–2.2s per pulse. After that, the arc fades and the pulse is dropped.
- Performance: keep < ~40 concurrent pulses on screen; segment count per tail stays small (≤ 24).

**Non-goals.** Realistic ballistic trajectories, re-entry, orbital insertion visuals.

## T2 — Theming system

**Problem.** The paper aesthetic is the default vibe, but it's not the only one I want to try. I'd like to prototype a bolder look — something in the Tron / fluorescent cold-war UI direction (close to mockup2, not War-Games CRT green).

**Want.** A theme abstraction that makes it cheap to add and swap looks.

**Details.**

- Two themes to start: `paper` (current) and `tron` (bold, dark, neon).
- Implementation: all colors flow through CSS custom properties on `:root`. A `body[data-theme="tron"]` override swaps the token values. No per-component conditional logic in components unless strictly necessary.
- Toggle: a small control in the header that cycles / switches theme. Choice persists in `localStorage` so reloads keep it.
- Both themes preserve the core layout, typography scale, and interaction model. Theme is *only* colors, weights, and glow.
- Tron theme specifics: dark blue-black background, neon strokes, optional glow via `filter: drop-shadow(...)` or an SVG blur filter. No gradients on map fills — flat areas.

**Non-goals.** Light/dark auto-detection, user-authored themes, motion preferences (already handled implicitly).

## T3 — Per-country color identity

**Problem.** In a bold/neon theme, one uniform launch color makes it hard to read *who* is launching.

**Want.** Each country/entity has a signature color. In the tron theme, that color is applied to:

1. The rocket dot + arc + tail during a launch.
2. The country's border and interior fill while at least one of its launches is active.

**Details.**

- Color palette: one color per entity, chosen for contrast against the tron background and distinctness from neighbours on the globe (e.g. RU red, US blue, CN yellow, EU cyan, JP pink, IN orange…).
- Active highlight decays with the pulse lifetime — bright at t=0, fading back toward the base country style as the last active pulse ends.
- Paper theme stays monochromatic on launches by design — keep the restraint.
- Accessibility: palette should avoid pure R/G collisions; add flags/icons later as a follow-up if it becomes a problem.

**Non-goals.** Country flag badges in the list (could be a later polish), user-configurable country colors.

## Out of scope for this iteration

- Real launch-event names in "latest launch" chip (still showing source/captured date).
- Mobile layout.
- Sound.
