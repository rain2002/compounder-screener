import { useMemo } from "react";
import Icon from "./Icon.jsx";
import { formatMoney } from "../utils/units.js";


function computeFcf(row) {
  const ebit = row.revenue * (row.ebitMargin / 100);
  const nopat = ebit * (1 - row.taxRate / 100);
  return nopat + row.depreciation - row.capex - row.deltaWorkingCapital;
}


function trimLeadingZeros(series) {
  const firstRealIndex = series.findIndex((v) => v > 0);
  if (firstRealIndex <= 0) return series;
  return series.slice(firstRealIndex);
}


function cagr(series) {
  const trimmed = trimLeadingZeros(series);
  if (trimmed.length < 2) return null;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const n = trimmed.length - 1;
  if (first <= 0 || last <= 0 || n <= 0) return null;
  return (Math.pow(last / first, 1 / n) - 1) * 100;
}


function resequenceYears(years, index, newYearValue) {
  const parsed = parseInt(newYearValue, 10);
  if (Number.isNaN(parsed)) {
    return years.map((y, i) => (i === index ? { ...y, year: newYearValue } : y));
  }
  return years.map((y, i) => {
    if (i < index) return y;
    return { ...y, year: String(parsed + (i - index)) };
  });
}


export default function FcfHistoryBuilder({ years, onYearsChange, onBaseFcfChange, onSuggestedGrowthChange }) {
  const fcfSeries = years.map((y) => ({ ...y, fcf: computeFcf(y) }));


  const revenues = fcfSeries.map((y) => y.revenue);
  const fcfs = fcfSeries.map((y) => y.fcf);


  const revenueCagr = useMemo(() => cagr(revenues), [years]);
  const fcfCagr = useMemo(() => cagr(fcfs), [years]);


  const excludedYears = useMemo(() => {
    const firstReal = revenues.findIndex((v) => v > 0);
    return firstReal > 0 ? firstReal : 0;
  }, [years]);


  const baseFcf = fcfSeries[fcfSeries.length - 1]?.fcf ?? 0;


  useMemo(() => {
    onBaseFcfChange(Math.round(baseFcf));
    if (fcfCagr !== null && Number.isFinite(fcfCagr)) {
      onSuggestedGrowthChange(Number(fcfCagr.toFixed(1)));
    }
  }, [baseFcf, fcfCagr]);


  function updateYear(index, field, value) {
    if (field === "year") {
      onYearsChange(resequenceYears(years, index, value));
      return;
    }
    const next = years.map((y, i) => (i === index ? { ...y, [field]: value } : y));
    onYearsChange(next);
  }


  const MAX_YEARS = 10;


  function addYear() {
    const last = years[years.length - 1];
    const nextYearLabel = (parseInt(last.year, 10) + 1).toString();
    const updated = [...years, { ...last, year: nextYearLabel }];


    if (updated.length > MAX_YEARS) {
      onYearsChange(updated.slice(updated.length - MAX_YEARS));
    } else {
      onYearsChange(updated);
    }
  }


  function removeYear(index) {
    if (years.length <= 2) return;
    onYearsChange(years.filter((_, i) => i !== index));
  }


  const fields = [
    { key: "revenue", label: "Revenue ($M)", step: 10 },
    { key: "ebitMargin", label: "EBIT Margin (%)", step: 0.5 },
    { key: "taxRate", label: "Tax Rate (%)", step: 0.5 },
    { key: "depreciation", label: "D&A ($M)", step: 5 },
    { key: "capex", label: "CapEx ($M)", step: 5 },
    { key: "deltaWorkingCapital", label: "Δ Working Capital ($M)", step: 5 },
  ];


  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon name="dcf" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Historical FCF Build-Up ({years.length}-Year)
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => removeYear(0)}
            className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
          >
            − Remove Year
          </button>
          <button
            onClick={addYear}
            title={years.length >= MAX_YEARS ? "Adding a new year will drop the oldest year (rolling 10-year window)" : "Add a new year"}
            className="text-xs px-2.5 py-1 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors font-medium"
          >
            + Add Year
          </button>
        </div>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Rolling 10-year window: once at 10 years, adding a new year automatically drops the oldest
        one so the trend always reflects the most recent decade. "Remove Year" always removes the
        oldest year. Growth rate below is derived from this trend (CAGR), not guessed. Values
        entered in $M — displayed as K/M/B/T automatically. Editing any year header auto-resequences
        every year after it to stay consecutive. Pre-filled with placeholder figures — replace with
        real 10-K numbers, or wait for the finance connector sync (Phase 2) to auto-populate.
      </p>


      {excludedYears > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
          <Icon name="check" size={16} className="text-accent2 shrink-0" />
          <p className="text-accent2 text-xs">
            {excludedYears} leading year(s) with zero revenue detected (pre-founding) — CAGR
            calculations automatically exclude these and use only real reporting years.
          </p>
        </div>
      )}


      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
              <th className="px-2 py-2 font-medium sticky left-0 bg-surface">Field</th>
              {fcfSeries.map((y, i) => (
                <th key={i} className="px-2 py-2 font-medium text-center min-w-[90px]">
                  <input
                    value={y.year}
                    onChange={(e) => updateYear(i, "year", e.target.value)}
                    className="w-16 bg-transparent text-center text-slate-200 font-semibold focus:outline-none focus:bg-black/30 rounded px-1"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-b border-border/30">
                <td className="px-2 py-2 text-slate-500 text-xs sticky left-0 bg-base whitespace-nowrap">
                  {f.label}
                </td>
                {fcfSeries.map((y, i) => (
                  <td key={i} className="px-1 py-1.5">
                    <input
                      type="number"
                      step={f.step}
                      value={y[f.key]}
                      onChange={(e) => updateYear(i, f.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/30 border border-border rounded px-1.5 py-1 text-slate-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-accent/5">
              <td className="px-2 py-2.5 text-slate-200 text-xs font-semibold sticky left-0 bg-accent/5">
                Computed FCF
              </td>
              {fcfSeries.map((y, i) => (
                <td key={i} className="px-2 py-2.5 text-center">
                  <span className={`text-xs font-semibold ${i === fcfSeries.length - 1 ? "text-accent2" : "text-slate-300"}`}>
                    {formatMoney(y.fcf)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>


      <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/60">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Revenue CAGR</p>
          <p className="stat-value text-lg text-slate-200">
            {revenueCagr !== null ? `${revenueCagr.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">FCF CAGR (suggested growth rate)</p>
          <p className="stat-value text-lg text-accent2">
            {fcfCagr !== null ? `${fcfCagr.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Base Year FCF (most recent)</p>
          <p className="stat-value text-lg text-white">{formatMoney(baseFcf)}</p>
        </div>
      </div>
    </div>
  );
}
