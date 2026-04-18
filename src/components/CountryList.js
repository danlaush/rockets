import { html } from "../html.js";
import {
  visibleCountries, virtualDate, toggleCountry,
} from "../state.js";
import { cumulativeTotals } from "../playback.js";

export function CountryList({ launches }) {
  const vd = virtualDate.value;
  const visible = visibleCountries.value;

  // Cumulative across ALL entities (not just visible), so toggling visibility
  // doesn't make rows disappear. We just use "visible" for count styling.
  const allSet = new Set(launches.entities.map((e) => e.code));
  const { totals } = cumulativeTotals(launches, vd, allSet);

  const rows = launches.entities
    .map((e) => ({ ...e, count: totals[e.code] || 0 }))
    .sort((a, b) => b.count - a.count);

  // Focus is derived state: a row is "focused" when it's the only country in
  // the visible set. This keeps the name-click UX and the checkbox UX in sync
  // without a separate focusCountry signal.
  const soleFocus = visible.size === 1 ? [...visible][0] : null;

  // Clicking a country name:
  //   - if it's already the sole focus → clear focus by selecting every
  //     country (chart returns to the worldwide total).
  //   - otherwise → make this country the sole visible one (chart zooms to
  //     that country's series).
  function focusOrClear(code) {
    const v = visibleCountries.value;
    if (v.size === 1 && v.has(code)) {
      visibleCountries.value = new Set(launches.entities.map((e) => e.code));
    } else {
      visibleCountries.value = new Set([code]);
    }
  }

  return html`
    <section class="panel country-list">
      <h2>Country</h2>
      <ol>
        ${rows.map((r) => html`
          <li key=${r.code}
              class=${soleFocus === r.code ? "focus" : ""}
              onClick=${() => focusOrClear(r.code)}>
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
