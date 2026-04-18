import { html } from "../html.js";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  virtualDate, playing, speedMult, SPEEDS,
  START_DATE, END_DATE, focusCountry,
} from "../state.js";

const MS_PER_DAY = 86_400_000;

function dateToFrac(d) {
  return (d.getTime() - START_DATE.getTime()) /
         (END_DATE.getTime() - START_DATE.getTime());
}
function fracToDate(f) {
  const clamped = Math.max(0, Math.min(1, f));
  const t = START_DATE.getTime() +
    clamped * (END_DATE.getTime() - START_DATE.getTime());
  return new Date(t);
}
function fmtDate(d) {
  const m = d.toLocaleString("en", { month: "short" });
  return `${m} ${d.getUTCFullYear()}`;
}

export function Timeline({ launches }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [w, setW] = useState(800);
  const h = 80;
  const padL = 10, padR = 10;
  const innerW = Math.max(200, w - padL - padR);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      setW(wrapRef.current.getBoundingClientRect().width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const vd = virtualDate.value;
  const play = playing.value;
  const sm = speedMult.value;
  const focus = focusCountry.value;

  // Year tick lines (every 5 years, labels every 10).
  const startYear = START_DATE.getUTCFullYear();
  const endYear = END_DATE.getUTCFullYear();
  const years = [];
  for (let y = Math.ceil(startYear / 5) * 5; y <= endYear; y += 5) {
    years.push(y);
  }

  function yearX(y) {
    const frac = dateToFrac(new Date(Date.UTC(y, 0, 1)));
    return padL + frac * innerW;
  }

  const playheadX = padL + dateToFrac(vd) * innerW;
  const axisY = h - 12;

  // Sparkline for focused country.
  const focusCounts = launches.launches[focus] || {};
  let maxCount = 1;
  for (const y of Object.keys(focusCounts)) maxCount = Math.max(maxCount, focusCounts[y]);
  const sparkH = 46;
  const sparkTop = 4;
  const sparkBase = sparkTop + sparkH;
  const sparkPoints = [];
  for (let y = startYear; y <= endYear; y++) {
    const c = focusCounts[String(y)] || 0;
    const px = yearX(y);
    const py = sparkBase - (c / maxCount) * sparkH;
    sparkPoints.push([px, py]);
  }
  const sparkPath =
    "M " + sparkPoints.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");

  // Scrub handling.
  const scrubbing = useRef(false);
  function positionToDate(clientX) {
    const rect = svgRef.current.getBoundingClientRect();
    const xRel = clientX - rect.left - padL;
    return fracToDate(xRel / innerW);
  }
  function onPointerDown(e) {
    scrubbing.current = true;
    playing.value = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    virtualDate.value = positionToDate(e.clientX);
  }
  function onPointerMove(e) {
    if (!scrubbing.current) return;
    virtualDate.value = positionToDate(e.clientX);
  }
  function onPointerUp(e) {
    scrubbing.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function togglePlay() {
    if (vd >= END_DATE && !play) {
      virtualDate.value = new Date(START_DATE);
    }
    playing.value = !play;
  }

  // Keyboard.
  useEffect(() => {
    function onKey(e) {
      if (e.target && e.target.matches && e.target.matches("input,textarea")) return;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const delta = (e.shiftKey ? 365 : 30) * MS_PER_DAY;
        virtualDate.value = new Date(
          Math.max(START_DATE.getTime(), vd.getTime() - delta)
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const delta = (e.shiftKey ? 365 : 30) * MS_PER_DAY;
        virtualDate.value = new Date(
          Math.min(END_DATE.getTime(), vd.getTime() + delta)
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vd, play]);

  return html`
    <div class="timeline">
      <div class="controls">
        <button class="play" onClick=${togglePlay}>
          ${play ? "▮▮" : "▶"}
        </button>
        ${SPEEDS.map((s) => html`
          <button
            key=${s}
            class=${s === sm ? "active" : ""}
            onClick=${() => (speedMult.value = s)}
          >${s}x</button>
        `)}
      </div>
      <div class="track-wrap" ref=${wrapRef}>
        <div class="focus-label">${focus} — ${fmtDate(vd)}</div>
        <svg ref=${svgRef}
             viewBox=${`0 0 ${w} ${h}`}
             onPointerDown=${onPointerDown}
             onPointerMove=${onPointerMove}
             onPointerUp=${onPointerUp}
             onPointerCancel=${onPointerUp}>

          <!-- sparkline baseline -->
          <line class="rule" x1=${padL} y1=${sparkBase}
                              x2=${padL + innerW} y2=${sparkBase}
                stroke-opacity="0.3" stroke-width="1" />

          <!-- sparkline path -->
          <path class="spark" d=${sparkPath} />

          <!-- year ticks -->
          ${years.map((y) => {
            const x = yearX(y);
            const isDecade = y % 10 === 0;
            return html`
              <g key=${y}>
                <line class="tick" x1=${x} y1=${axisY - 3}
                                   x2=${x} y2=${axisY + 3}
                      stroke-width=${isDecade ? 1.2 : 0.6} />
                ${isDecade ? html`
                  <text class="axis-label" x=${x} y=${axisY + 14}
                        text-anchor="middle">${y}</text>
                ` : null}
              </g>
            `;
          })}

          <!-- main axis rule -->
          <line class="rule" x1=${padL} y1=${axisY}
                              x2=${padL + innerW} y2=${axisY} />

          <!-- playhead -->
          <line class="playhead-line"
                x1=${playheadX} y1=${sparkTop}
                x2=${playheadX} y2=${axisY + 4} />
          <circle class="playhead" cx=${playheadX} cy=${axisY} r="6" />
        </svg>
      </div>
    </div>
  `;
}
