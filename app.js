import { render } from "preact";
import { useEffect } from "preact/hooks";
import { html } from "./src/html.js";

import { loadData } from "./src/data.js";
import { buildEvents, startPlayback } from "./src/playback.js";
import { registerCentroids } from "./src/components/LaunchLayer.js";

import { Globe } from "./src/components/Globe.js";
import { Timeline } from "./src/components/Timeline.js";
import { CountryList } from "./src/components/CountryList.js";
import { Stats } from "./src/components/Stats.js";
import { theme, cycleTheme, THEMES } from "./src/themes.js";
import { settingsOpen } from "./src/state.js";

function Rocket() {
  return html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 20 L9 15" />
      <path d="M13 3 C17 3 21 7 21 11 L14 18 L6 18 L6 10 C6 6 10 3 13 3 Z" />
      <circle cx="14" cy="10" r="2" />
      <path d="M7 18 L4 21" />
    </svg>
  `;
}

function ThemeToggle() {
  const current = theme.value;
  const next = THEMES[(THEMES.findIndex((t) => t.id === current) + 1) % THEMES.length];
  return html`
    <button class="theme-toggle"
            title=${`Switch to ${next.label} theme`}
            onClick=${cycleTheme}>Theme</button>
  `;
}

function SettingsModal({ launches }) {
  const open = settingsOpen.value;

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") settingsOpen.value = false;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  function close() { settingsOpen.value = false; }

  return html`
    <div class="modal-backdrop" onClick=${close}>
      <div class="modal-dialog"
           role="dialog"
           aria-modal="true"
           aria-label="Chart country settings"
           onClick=${(e) => e.stopPropagation()}>
        <button class="modal-close" type="button" aria-label="Close" onClick=${close}>×</button>
        <${CountryList} launches=${launches} />
      </div>
    </div>
  `;
}

function App({ launches, countries }) {
  return html`
    <div class="app">
      <header class="header">
        <div class="brand">
          <${Rocket} />
          <span class="brand-full">GLOBAL ROCKET LAUNCH TRACKER</span>
          <span class="brand-short">ROCKETS</span>
        </div>
        <a class="latest"
           href=${launches.source.url}
           target="_blank"
           rel="noopener noreferrer">
          <span class="latest-full">Data: ${launches.source.name} · captured ${launches.source.captured_at}</span>
          <span class="latest-short">Data</span>
        </a>
        <div class="spacer"></div>
        <${ThemeToggle} />
      </header>

      <aside class="left">
        <${CountryList} launches=${launches} />
      </aside>

      <main class="center">
        <${Globe} countries=${countries} />
      </main>

      <aside class="right">
        <${Stats} launches=${launches} />
      </aside>

      <footer class="footer panel">
        <${Timeline} launches=${launches} />
      </footer>

      <${SettingsModal} launches=${launches} />
    </div>
  `;
}

loadData().then(({ launches, countries }) => {
  registerCentroids(launches.entities);
  const events = buildEvents(launches);
  startPlayback(events);
  const mount = document.getElementById("app");
  mount.innerHTML = "";
  render(html`<${App} launches=${launches} countries=${countries} />`, mount);
}).catch((err) => {
  console.error(err);
  document.getElementById("app").innerHTML =
    `<p class="boot">Failed to load data: ${err.message}.
      Serve this folder via <code>python -m http.server</code> and reload.</p>`;
});
