import { useMemo } from "react";
import Icon from "./Icon.jsx";

function computeFcf(row) {
  const ebit = row.revenue * (row.ebitMargin / 100);
  const nopat = ebit * (1 - row.taxRate / 100);
  return nopat + row.depreciation - row.capex - row.deltaWorkingCapital;
}

function cagr(first, last, years) {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

export default function FcfHistoryBuilder({ years, onYearsChange, onBaseFcfChange, onSuggestedGrowthChange }) {
  const fcfSeries = years.map((y) => ({ ...y, fcf: computeFcf(y) }));

  const revenueCagr = useMemo(() => {
    if (fcfSeries.length < 2) return null;
    return cagr(fcfSeries[0].revenue, fcfSeries[fcfSeries.length - 1].revenue, fcfSeries.length - 1);
  }, [fcfSeries]);

  const fcfCagr = useMemo(() => {
    if (fcfSeries.length < 2) return null;
    const first = fcfSeries[0].fcf;
    const last = fcfSeries[fcfSeries.length - 1].fcf;
    return cagr(first, last, fcfSeries.length - 1);
  }, [fcfSeries]);

  const baseFcf = fcfSeries[fcfSeries.length - 1]?.fcf ?? 0;

  useMemo(() => {
    onBaseFcfChange(Math.round(baseFcf));
    if (fcfCagr !== null && Number.isFinite(fcfCagr)) {
      onSuggestedGrowthChange(Number(fcfCagr.toFixed(1)));
    }
  }, [baseFcf, fcfCagr]);

  function updateYear(index, field, value) {
    const next = years.map((y, i) => (i === index ? { ...y, [field]: value } : y));
    onYearsChange(next);
  }

  function addYear() {
    const last = years[years.length - 1];
    const nextYearLabel = (parseInt(last.year) + 1).toString();
    onYearsChange([...years, { ...last, year: nextYearLabel }]);
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
            onClick={() => removeYear(years.length - 1)}
            className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
          >
            − Remove Year
          </button>
          <button
            onClick={addYear}
            className="text-xs px-2.5 py-1 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors font-medium"
          >
            + Add Year
          </button>
        </div>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        Rule of thumb: 10 years of history gives the most reliable trend, but younger companies
        won't have that much — use however many years of real filings exist. Growth rate below is
        derived from this trend (CAGR), not guessed. Pre-filled with placeholder figures — replace
        with real 10-K numbers, or wait for the finance connector sync (Phase 2) to auto-populate.
      </p>

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
                Computed FCF ($M)
              </td>
              {fcfSeries.map((y, i) => (
                <td key={i} className="px-2 py-2.5 text-center">
                  <span className={`text-xs font-semibold ${i === fcfSeries.length - 1 ? "text-accent2" : "text-slate-300"}`}>
                    ${y.fcf.toFixed(0)}
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
          <p className="stat-value text-lg text-white">${baseFcf.toFixed(0)}M</p>
        </div>
      </div>
    </div>
  );
}
