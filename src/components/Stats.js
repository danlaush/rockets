import { html } from "../html.js";
import { virtualDate, visibleCountries } from "../state.js";
import { cumulativeTotals } from "../playback.js";

export function Stats({ launches }) {
  const vd = virtualDate.value;
  const visible = visibleCountries.value;
  const { grand, currentYear, currentYearCount } =
    cumulativeTotals(launches, vd, visible);

  const rate = currentYearCount > 0
    ? `1 every ${(365.25 / currentYearCount).toFixed(1)} days`
    : "—";

  return html`
    <section class="panel stats">
      <h2>Stats</h2>
      <div class="stat">
        <div class="label">Total launches</div>
        <div class="big">${grand.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="label">Current year (${currentYear})</div>
        <div class="big">${currentYearCount.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="label">Average launch rate</div>
        <div class="small">${rate}</div>
      </div>
    </section>
  `;
}
