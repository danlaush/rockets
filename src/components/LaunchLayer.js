import { html } from "../html.js";
import { activePulses, frameTick } from "../state.js";
import { projectElevated, destination } from "../geo.js";
import { colorFor } from "../themes.js";

// Module-level map of code -> centroid [lon, lat]; seeded once at boot.
let centroidByCode = {};
export function registerCentroids(entities) {
  centroidByCode = Object.fromEntries(entities.map((e) => [e.code, e.centroid]));
}

// Arc tuning.
const MAX_ARC_DEG   = 30;    // great-circle sweep over full lifetime
const PEAK_ALT      = 1.12;  // peak altitude above surface
const TAIL_SEGMENTS = 20;    // line segments per tail
const TAIL_SPAN_S   = 0.55;  // fraction of lifetime visible as tail

// Ease-out: altitude climbs sharply then flattens.
function alt(s) {
  const e = 1 - (1 - s) * (1 - s);
  return 1 + (PEAK_ALT - 1) * e;
}

// Arc position at parametric time s in [0, 1]. Returns projected + visibility.
function arcPoint(centroid, bearing, s) {
  const angle = s * MAX_ARC_DEG * Math.PI / 180;
  const latLon = destination(centroid, bearing, angle);
  return projectElevated(latLon, alt(s));
}

export function LaunchLayer() {
  // Subscribe to the rAF cadence so arcs update every frame.
  frameTick.value;
  const pulses = activePulses.value;
  const now = performance.now();

  return html`
    <g class="launch-layer">
      ${pulses.map((p) => {
        const c = centroidByCode[p.code];
        if (!c) return null;
        const lifeFrac = Math.min(1, (now - p.createdAt) / p.duration);
        if (lifeFrac <= 0) return null;

        const color = colorFor(p.code);

        // Head + N segments trailing behind.
        const sHead = lifeFrac;
        const sTail = Math.max(0, sHead - TAIL_SPAN_S);
        const step  = (sHead - sTail) / TAIL_SEGMENTS;

        // Collect segment endpoints once.
        const pts = [];
        for (let i = 0; i <= TAIL_SEGMENTS; i++) {
          const s = sTail + i * step;
          pts.push(arcPoint(c, p.bearing, s));
        }

        // Head-fade as the pulse ends (last 25% of life).
        const endFade = lifeFrac > 0.75 ? (1 - (lifeFrac - 0.75) / 0.25) : 1;

        const segments = [];
        for (let i = 0; i < TAIL_SEGMENTS; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          if (a.occluded && b.occluded) continue;
          // Tail opacity ramps from near-zero at the back to full near the head.
          const f = (i + 1) / TAIL_SEGMENTS;
          const opacity = f * f * endFade;
          if (opacity < 0.02) continue;
          segments.push(html`
            <line
              key=${`s${p.id}-${i}`}
              class="pulse-arc-seg"
              x1=${a.sx} y1=${a.sy}
              x2=${b.sx} y2=${b.sy}
              stroke=${color}
              stroke-opacity=${opacity}
            />
          `);
        }

        const head = pts[pts.length - 1];
        const headNode = head.occluded ? null : html`
          <circle
            key=${`h${p.id}`}
            class="pulse-head"
            cx=${head.sx} cy=${head.sy}
            r=${1.8}
            fill=${color}
            opacity=${endFade}
          />
        `;

        return html`
          <g key=${p.id}>
            ${segments}
            ${headNode}
          </g>
        `;
      })}
    </g>
  `;
}

// Compute the currently active country codes + their peak intensity (0..1).
// Used by Globe to tint country paths while launches are in flight.
export function activeCountryTints() {
  frameTick.value; // subscribe
  const pulses = activePulses.value;
  const now = performance.now();
  const out = new Map();
  for (const p of pulses) {
    const life = (now - p.createdAt) / p.duration;
    if (life < 0 || life > 1) continue;
    // Intensity: quick rise, linear fall.
    const intensity = life < 0.15
      ? life / 0.15
      : 1 - (life - 0.15) / 0.85;
    const prev = out.get(p.code) || 0;
    if (intensity > prev) out.set(p.code, intensity);
  }
  return out;
}
