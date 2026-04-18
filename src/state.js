import { signal, computed } from "@preact/signals";

export const YEAR_START = 1957;
export const YEAR_END   = 2026;

export const START_DATE = new Date(Date.UTC(YEAR_START, 9, 4));
export const END_DATE   = new Date(Date.UTC(YEAR_END,  11, 31));
export const TODAY      = new Date();

// Playback cursor.
export const virtualDate = signal(new Date(END_DATE.getTime()));

export const playing = signal(false);

// Virtual-days-per-real-second. Chips in the UI are 1x/2x/5x/10x, with base = 30 days/s.
export const SPEED_BASE = 30;
export const SPEEDS = [1, 2, 5, 10];
export const speedMult = signal(2);
export const speed = computed(() => SPEED_BASE * speedMult.value);

// Country visibility. `null` means "all".
const DEFAULT_VISIBLE = ["RU", "US", "CN", "EU", "JP", "IN", "IL", "IR", "KP", "KR", "FR", "GB", "AU"];
export const visibleCountries = signal(new Set(DEFAULT_VISIBLE));

// Orthographic rotation [lambda, phi, gamma].
export const rotation = signal([-90, -25, 0]);

// Active pulses for the LaunchLayer to render.
// Each: {id, code, createdAt (performance.now ms), bearing (rad), duration (ms)}.
export const activePulses = signal([]);
export const PULSE_DURATION = 2000;

let pulseId = 0;
export function emitPulse(code) {
  pulseId++;
  // Deterministic-ish bearing so re-plays look the same but feel varied.
  const bearing = ((pulseId * 137.508) % 360) * (Math.PI / 180);
  const p = {
    id: pulseId,
    code,
    createdAt: performance.now(),
    bearing,
    duration: PULSE_DURATION,
  };
  const next = activePulses.value.concat(p);
  activePulses.value = next.length > 40 ? next.slice(next.length - 40) : next;
}
export function dropPulse(id) {
  activePulses.value = activePulses.value.filter((p) => p.id !== id);
}

// A monotonically-increasing counter bumped each animation frame. Components
// that need per-frame re-render (e.g. the arc/tail positions) read this to
// subscribe to the rAF cadence without polling themselves.
export const frameTick = signal(0);

export function toggleCountry(code) {
  const next = new Set(visibleCountries.value);
  if (next.has(code)) next.delete(code); else next.add(code);
  visibleCountries.value = next;
}

// Controls the mobile settings modal (country picker). Not used on desktop,
// where the same list is always visible in the left sidebar.
export const settingsOpen = signal(false);
