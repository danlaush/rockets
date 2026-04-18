import { html } from "../html.js";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  syncProjection, path, geoGraticule10,
} from "../geo.js";
import { rotation, visibleCountries } from "../state.js";
import { CODE_TO_GEOJSON_NAME } from "../data.js";
import { LaunchLayer, activeCountryTints } from "./LaunchLayer.js";
import { theme, countryColor } from "../themes.js";

// geojson name -> entity code (reverse of CODE_TO_GEOJSON_NAME).
const NAME_TO_CODE = {};
for (const [c, n] of Object.entries(CODE_TO_GEOJSON_NAME)) NAME_TO_CODE[n] = c;

// Overlay that only renders paths for currently-active countries, with per-
// country color tint. Kept as a separate component so it can re-render every
// animation frame WITHOUT touching the ~180-path base countries layer.
function ActiveCountryOverlay({ countries }) {
  const themeId = theme.value;
  const tints = activeCountryTints();
  rotation.value; // subscribe so paths follow globe drags
  if (themeId !== "tron" || tints.size === 0) return null;

  const paths = [];
  for (const f of countries.features) {
    const code = NAME_TO_CODE[f.properties.name];
    if (!code) continue;
    const t = tints.get(code);
    if (!t) continue;
    const d = path(f);
    if (!d) continue;
    const col = countryColor(code);
    const strokeA = (0.55 + 0.45 * t).toFixed(2);
    const fillA   = (0.22 * t).toFixed(2);
    paths.push(html`
      <path key=${code}
            d=${d}
            stroke=${col}
            stroke-opacity=${strokeA}
            fill=${col}
            fill-opacity=${fillA}
            stroke-width="1.4"
            stroke-linejoin="round"
            stroke-linecap="round" />
    `);
  }

  return html`<g class="globe-active-overlay">${paths}</g>`;
}

export function Globe({ countries }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 600 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const r = wrapRef.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // This component deliberately does NOT read activePulses/frameTick so the
  // ~180 country paths don't diff on every rAF while pulses fly. The active
  // tinting is handled by ActiveCountryOverlay which renders on its own cadence.
  const rot = rotation.value;
  // Map focus = the country when exactly one is visible; null otherwise.
  const visible = visibleCountries.value;
  const focus = visible.size === 1 ? [...visible][0] : null;
  const themeId = theme.value;
  void rot;

  syncProjection(size.w, size.h);

  const graticule = path(geoGraticule10());
  const sphere = path({ type: "Sphere" });

  const dragState = useRef(null);
  function onPointerDown(e) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragState.current = {
      x: e.clientX,
      y: e.clientY,
      rot: rotation.value.slice(),
    };
  }
  function onPointerMove(e) {
    const d = dragState.current;
    if (!d) return;
    const k = 0.35;
    const dx = (e.clientX - d.x) * k;
    const dy = (e.clientY - d.y) * k;
    const lam = d.rot[0] + dx;
    const phi = Math.max(-89, Math.min(89, d.rot[1] - dy));
    rotation.value = [lam, phi, d.rot[2]];
  }
  function onPointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragState.current = null;
  }

  return html`
    <div class="globe-wrap" ref=${wrapRef}>
      <svg
        class="globe-svg"
        viewBox=${`0 0 ${size.w} ${size.h}`}
        onPointerDown=${onPointerDown}
        onPointerMove=${onPointerMove}
        onPointerUp=${onPointerUp}
        onPointerCancel=${onPointerUp}
      >
        <path class="globe-ocean" d=${sphere} />
        <path class="globe-graticule" d=${graticule} />

        <g class="globe-countries" filter=${themeId === "paper" ? "url(#roughen)" : undefined}>
          ${countries.features.map((f) => {
            const d = path(f);
            if (!d) return null;
            const name = f.properties.name;
            const code = NAME_TO_CODE[name];
            const isFocus = code && focus === code;
            const cls = [
              "globe-country",
              isFocus ? "focus" : "",
            ].filter(Boolean).join(" ");
            return html`<path key=${name} class=${cls} d=${d} />`;
          })}
        </g>

        <${ActiveCountryOverlay} countries=${countries} />
        <${LaunchLayer} />
      </svg>
    </div>
  `;
}
