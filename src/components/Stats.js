import { html } from "../html.js";
import { virtualDate, visibleCountries } from "../state.js";
import { cumulativeTotals } from "../playback.js";

export function Stats({ launches }) {
  const vd = virtualDate.value;
  const visible = visibleCountries.value;
  const { grand, currentYear, currentYearCount } =
    cumulativeTotals(launches, vd, visible);

  const rateNum = currentYearCount > 0
    ? (365.25 / currentYearCount).toFixed(1)
    : null;

  return html`
    <section class="panel stats">
      <h2>Stats</h2>
      <div class="stat stat-total">
        <div class="label">
          <span class="label-full">Total launches</span>
          <span class="label-short">Total</span>
        </div>
        <div class="big">${grand.toLocaleString()}</div>
      </div>
      <div class="stat stat-year">
        <div class="label">
          <span class="label-full">Current year (${currentYear})</span>
          <span class="label-short">${currentYear}</span>
        </div>
        <div class="big">${currentYearCount.toLocaleString()}</div>
      </div>
      <div class="stat stat-rate">
        <div class="label">
          <span class="label-full">Average launch rate</span>
          <span class="label-short">Rate</span>
        </div>
        <div class="small">
          ${rateNum === null
            ? "—"
            : html`1 every <span class="num">${rateNum}</span> days`}
        </div>
      </div>
    </section>
  `;
}
