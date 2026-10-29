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
    <div className="card p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ 01 // TRAILING CASH FLOWS ]</span>
          <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
            HISTORICAL FCF BUILD-UP ({years.length}-YEAR WINDOW)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => removeYear(0)}
            className="neo-btn-ghost text-xs py-1.5 px-3"
          >
            − DROP OLDEST
          </button>
          <button
            onClick={addYear}
            title={years.length >= MAX_YEARS ? "Rolling 10-year window: adds year and drops oldest" : "Add year"}
            className="neo-btn-primary text-xs py-1.5 px-4"
          >
            + ADD YEAR
          </button>
        </div>
      </div>

      <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed max-w-3xl">
        Rolling 10-year historical trajectory. EBIT is adjusted for statutory taxes, non-cash depreciation is restored, and capital expenditures plus balance sheet working capital requirements are deducted to derive True Owner Cash Flow.
      </p>

      {excludedYears > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <Icon name="check" size={14} className="text-white shrink-0" />
          <p className="font-mono text-xs text-neutral-300">
            {excludedYears} PRE-FOUNDING YEAR(S) EXCLUDED AUTOMATICALLY FROM CAGR CALCULATIONS.
          </p>
        </div>
      )}

      <div className="overflow-x-auto -mx-2 mb-6">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-400 sticky left-0 bg-[#111111] z-10">
                METRIC LINE
              </th>
              {fcfSeries.map((y, i) => (
                <th key={i} className="px-2 py-2 text-center min-w-[95px]">
                  <input
                    value={y.year}
                    onChange={(e) => updateYear(i, "year", e.target.value)}
                    className="w-16 bg-neutral-900 border border-white/10 rounded-full text-center text-white font-mono text-xs py-0.5 focus:outline-none focus:border-white"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-mono text-neutral-400 sticky left-0 bg-[#111111] z-10 whitespace-nowrap">
                  {f.label}
                </td>
                {fcfSeries.map((y, i) => (
                  <td key={i} className="px-1.5 py-1.5 text-center">
                    <input
                      type="number"
                      step={f.step}
                      value={y[f.key]}
                      onChange={(e) => updateYear(i, f.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-900/80 border border-white/5 rounded-full px-2 py-1 text-white font-mono text-xs text-center focus:outline-none focus:border-white transition-all"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-white/[0.03] border-t border-white/10">
              <td className="px-3 py-3 font-mono font-bold text-white uppercase sticky left-0 bg-[#161616] z-10">
                COMPUTED FREE CASH FLOW
              </td>
              {fcfSeries.map((y, i) => (
                <td key={i} className="px-2 py-3 text-center">
                  <span className={`font-mono text-xs font-bold ${i === fcfSeries.length - 1 ? "text-white underline decoration-white/40" : "text-neutral-300"}`}>
                    {formatMoney(y.fcf)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/10">
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Revenue Historical CAGR</p>
          <p className="font-syne font-bold text-2xl text-white">
            {revenueCagr !== null ? `${revenueCagr.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/15">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">FCF Historical CAGR (Baseline Growth)</p>
          <p className="font-syne font-bold text-2xl text-white">
            {fcfCagr !== null ? `${fcfCagr.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Base Year Free Cash Flow</p>
          <p className="font-syne font-bold text-2xl text-neutral-200">{formatMoney(baseFcf)}</p>
        </div>
      </div>
    </div>
  );
}
