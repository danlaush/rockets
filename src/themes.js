import { signal, effect } from "@preact/signals";

// Ordered list so the toggle can cycle. Labels are UI-facing.
export const THEMES = [
  { id: "paper", label: "Paper" },
  { id: "tron",  label: "Tron"  },
];

const STORAGE_KEY = "rockets.theme";
const initial = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch { /* ignore */ }
  return "paper";
})();

export const theme = signal(initial);

// Keep <body data-theme> in sync so CSS tokens swap.
effect(() => {
  const id = theme.value;
  if (typeof document !== "undefined" && document.body) {
    document.body.dataset.theme = id;
  }
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
});

export function cycleTheme() {
  const i = THEMES.findIndex((t) => t.id === theme.value);
  theme.value = THEMES[(i + 1) % THEMES.length].id;
}

// Per-entity color identity. Used in the tron theme; paper theme keeps the
// uniform --launch token so the identity stays restrained.
const COUNTRY_COLORS = {
  RU: "#ef4444",
  US: "#3b82f6",
  CN: "#facc15",
  EU: "#22d3ee",
  JP: "#f472b6",
  IN: "#fb923c",
  FR: "#c084fc",
  GB: "#e5e7eb",
  IL: "#2dd4bf",
  IR: "#4ade80",
  KP: "#e879f9",
  KR: "#a3e635",
  AU: "#fbbf24",
};

const PAPER_LAUNCH = "var(--launch)";

export function colorFor(code) {
  if (theme.value === "tron") return COUNTRY_COLORS[code] || "#e5e7eb";
  return PAPER_LAUNCH;
}

// Static country color regardless of theme — used for UI chips where we always
// want the identity (e.g. a leading swatch on the country list, future use).
export function countryColor(code) {
  return COUNTRY_COLORS[code] || "#999999";
}
