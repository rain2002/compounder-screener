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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-semibold text-white">
            Historical Free Cash Flow ({years.length}-Year Build-Up)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deducts tax-adjusted operating expenses, restores non-cash D&amp;A, and deducts CapEx to calculate Owner Earnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => removeYear(0)}
            className="btn-secondary text-xs py-1 px-3"
          >
            − Drop Oldest
          </button>
          <button
            onClick={addYear}
            title={years.length >= MAX_YEARS ? "Rolling 10-year window: adds year and drops oldest" : "Add year"}
            className="btn-primary text-xs py-1 px-3"
          >
            + Add Year
          </button>
        </div>
      </div>

      {excludedYears > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300">
          <Icon name="check" size={14} className="text-emerald-400 shrink-0" />
          <span>
            {excludedYears} pre-founding year(s) with zero revenue omitted from CAGR calculations.
          </span>
        </div>
      )}

      <div className="overflow-x-auto -mx-2 mb-5">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.02]">
              <th className="px-3 py-2 text-left font-medium sticky left-0 bg-[#111114] z-10">
                Line Item
              </th>
              {fcfSeries.map((y, i) => (
                <th key={i} className="px-2 py-2 text-center min-w-[90px]">
                  <input
                    value={y.year}
                    onChange={(e) => updateYear(i, "year", e.target.value)}
                    className="w-16 bg-zinc-900 border border-white/10 rounded text-center text-zinc-200 font-semibold py-0.5 focus:outline-none focus:border-white/30"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-3 py-2 text-zinc-400 sticky left-0 bg-[#111114] z-10 whitespace-nowrap">
                  {f.label}
                </td>
                {fcfSeries.map((y, i) => (
                  <td key={i} className="px-1.5 py-1 text-center">
                    <input
                      type="number"
                      step={f.step}
                      value={y[f.key]}
                      onChange={(e) => updateYear(i, f.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900/80 border border-white/5 rounded px-2 py-1 text-zinc-200 text-xs text-center focus:outline-none focus:border-white/30 tabular-nums transition-all"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-white/[0.03] border-t border-white/10 font-semibold">
              <td className="px-3 py-2.5 text-zinc-100 sticky left-0 bg-[#151518] z-10">
                Computed Free Cash Flow
              </td>
              {fcfSeries.map((y, i) => (
                <td key={i} className="px-2 py-2.5 text-center">
                  <span className={`text-xs tabular-nums ${i === fcfSeries.length - 1 ? "text-emerald-400 font-bold" : "text-zinc-200"}`}>
                    {formatMoney(y.fcf)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Revenue Historical CAGR</p>
          <p className="text-lg font-semibold text-zinc-100 tabular-nums">
            {revenueCagr !== null ? `${revenueCagr.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-white/[0.04] border border-white/10">
          <p className="text-xs text-zinc-200 font-medium mb-1">FCF Historical CAGR (Suggested Baseline)</p>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">
            {fcfCagr !== null ? `${fcfCagr.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Base Year Free Cash Flow</p>
          <p className="text-lg font-semibold text-zinc-100 tabular-nums">{formatMoney(baseFcf)}</p>
        </div>
      </div>
    </div>
  );
}
