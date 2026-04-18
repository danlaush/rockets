import { html } from "../html.js";
import {
  visibleCountries, focusCountry, virtualDate, toggleCountry,
} from "../state.js";
import { cumulativeTotals } from "../playback.js";

export function CountryList({ launches }) {
  const vd = virtualDate.value;
  const visible = visibleCountries.value;
  const focus = focusCountry.value;

  // Cumulative across ALL entities (not just visible), so toggling visibility
  // doesn't make rows disappear. We just use "visible" for count styling.
  const allSet = new Set(launches.entities.map((e) => e.code));
  const { totals } = cumulativeTotals(launches, vd, allSet);

  const rows = launches.entities
    .map((e) => ({ ...e, count: totals[e.code] || 0 }))
    .sort((a, b) => b.count - a.count);

  return html`
    <section class="panel country-list">
      <h2>Country</h2>
      <ol>
        ${rows.map((r) => html`
          <li key=${r.code}
              class=${focus === r.code ? "focus" : ""}
              onClick=${() => (focusCountry.value = r.code)}>
            <span class=${"box" + (visible.has(r.code) ? " on" : "")}
                  onClick=${(e) => { e.stopPropagation(); toggleCountry(r.code); }}
                  role="checkbox"
                  aria-checked=${visible.has(r.code)}></span>
            <span>${r.name}</span>
            <span class="count">${r.count.toLocaleString()}</span>
          </li>
        `)}
      </ol>
    </section>
  `;
}
