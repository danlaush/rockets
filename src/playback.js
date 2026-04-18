import { effect } from "@preact/signals";
import {
  virtualDate, playing, speed,
  emitPulse, activePulses, frameTick,
  START_DATE, END_DATE,
} from "./state.js";

const MS_PER_DAY = 86_400_000;

// Simple deterministic hash → [0,1). Used so simultaneous launches from
// different countries don't pile onto the exact same virtual instant.
function jitter(code, year, i) {
  let h = 2166136261;
  const s = `${code}-${year}-${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = (h * 16777619) >>> 0;
  }
  return (h % 10000) / 10000; // 0..1
}

// Build a flat, sorted `events` array from the launches dataset.
// Each event: { t: number (unix ms), code: string }.
export function buildEvents(launches) {
  const events = [];
  const entries = launches.launches;
  for (const code of Object.keys(entries)) {
    const years = entries[code];
    for (const year of Object.keys(years)) {
      const n = years[year];
      if (!n) continue;
      const y = Number(year);
      const yStart = Date.UTC(y, 0, 1);
      const yEnd   = Date.UTC(y + 1, 0, 1);
      const yLen   = yEnd - yStart;
      for (let i = 0; i < n; i++) {
        // Evenly distribute within the year, with a small deterministic jitter
        // so inter-country timing feels organic rather than lock-stepped.
        const base  = (i + 0.5) / n;
        const jit   = (jitter(code, y, i) - 0.5) * (0.4 / n);
        const frac  = Math.max(0, Math.min(0.9999, base + jit));
        events.push({ t: yStart + frac * yLen, code });
      }
    }
  }
  events.sort((a, b) => a.t - b.t);
  return events;
}

// Binary search for the index of the first event with t > target.
function upperBound(events, target) {
  let lo = 0, hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (events[mid].t <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Wire the rAF loop + event emission into the app. Pass the pre-built `events`.
export function startPlayback(events) {
  // Cursor always points to the first event with t > virtualDate.
  let cursor = upperBound(events, virtualDate.value.getTime());

  // If the user scrubs, re-seek. We detect scrubs by tracking the date
  // separately from what the tick loop writes.
  let lastTickValue = virtualDate.value.getTime();

  // Re-seek whenever virtualDate changes from outside the tick loop.
  effect(() => {
    const t = virtualDate.value.getTime();
    if (Math.abs(t - lastTickValue) > 1) {
      // External change (scrub, jump). Move cursor, emit nothing.
      cursor = upperBound(events, t);
      lastTickValue = t;
    }
  });

  let lastFrame = performance.now();

  function tick(now) {
    const dt = (now - lastFrame) / 1000; // seconds
    lastFrame = now;

    if (playing.value) {
      const prev = virtualDate.value.getTime();
      const deltaDays = dt * speed.value;
      const nextT = Math.min(END_DATE.getTime(), prev + deltaDays * MS_PER_DAY);

      // Emit pulses for [prev, nextT]. Globe shows every launch; the checkbox
      // list scopes stats + chart aggregates, not the globe animation.
      while (cursor < events.length && events[cursor].t <= nextT) {
        const e = events[cursor++];
        emitPulse(e.code);
      }

      // Update the signal AFTER emitting so effect-observers see one update.
      lastTickValue = nextT;
      virtualDate.value = new Date(nextT);

      if (nextT >= END_DATE.getTime()) playing.value = false;
    }

    // Drive per-frame animation for arc tails whenever pulses are in flight.
    // We also retire pulses whose lifetime has elapsed here, rather than via
    // setTimeout, so scrubbing/pausing doesn't leak stray setTimeouts.
    const pulses = activePulses.value;
    if (pulses.length) {
      const live = pulses.filter((p) => now - p.createdAt < p.duration);
      if (live.length !== pulses.length) activePulses.value = live;
      frameTick.value = (frameTick.value + 1) | 0;
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Cumulative launches by country up to `date`, summed across visible entities.
export function cumulativeTotals(launches, date, visible) {
  const year = date.getUTCFullYear();
  const dayOfYear = (date.getTime() - Date.UTC(year, 0, 1)) / MS_PER_DAY;
  const yearFrac = Math.max(0, Math.min(1, dayOfYear / 365.25));
  const partialYears = new Set(launches.partial_years || []);

  function yearValue(y, n) {
    if (y < year) return n;
    if (y > year) return 0;
    // y === year
    if (partialYears.has(y)) return n; // dataset value is YTD, not projected
    return n * yearFrac;
  }

  const totals = {};
  let grand = 0;
  let currentYearSum = 0;
  const entries = launches.launches;
  for (const code of Object.keys(entries)) {
    const years = entries[code];
    let t = 0;
    for (const yStr of Object.keys(years)) {
      t += yearValue(Number(yStr), years[yStr]);
    }
    totals[code] = Math.floor(t);
    if (visible.has(code)) {
      grand += totals[code];
      currentYearSum += yearValue(year, years[String(year)] || 0);
    }
  }
  return { totals, grand, currentYear: year, currentYearCount: Math.floor(currentYearSum) };
}
