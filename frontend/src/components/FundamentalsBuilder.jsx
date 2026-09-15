import { useMemo } from "react";
import Icon from "./Icon.jsx";

function cagr(first, last, years) {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

const METRICS = [
  { key: "revenue", label: "Revenue", step: 10 },
  { key: "ebitda", label: "EBITDA", step: 5 },
  { key: "ebit", label: "EBIT", step: 5 },
  { key: "netProfit", label: "Net Profit", step: 5 },
];

export default function FundamentalsBuilder({ years, onYearsChange }) {
  function updateYear(index, field, value) {
    const next = years.map((y, i) => (i === index ? { ...y, [field]: value } : y));
    onYearsChange(next);
  }

  function addYear() {
    const last = years[years.length - 1];
    const nextYearLabel = (parseInt(last.year) + 1).toString();
    onYearsChange([...years, { ...last, year: nextYearLabel }]);
  }

  function removeYear() {
    if (years.length <= 2) return;
    onYearsChange(years.slice(0, -1));
  }

  const cagrs = useMemo(() => {
    const result = {};
    METRICS.forEach((m) => {
      result[m.key] = cagr(years[0][m.key], years[years.length - 1][m.key], years.length - 1);
    });
    return result;
  }, [years]);

  const margins = years.map((y) => ({
    year: y.year,
    ebitMargin: y.revenue ? (y.ebit / y.revenue) * 100 : 0,
    ebitdaMargin: y.revenue ? (y.ebitda / y.revenue) * 100 : 0,
    netMargin: y.revenue ? (y.netProfit / y.revenue) * 100 : 0,
  }));

  const marginTrend = margins.length >= 2
    ? margins[margins.length - 1].netMargin - margins[0].netMargin
    : 0;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon name="dcf" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Fundamentals History ({years.length}-Year)
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={removeYear}
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
        Revenue, EBITDA, EBIT, and Net Profit pulled from the income statement across up to 10
        years. Pre-filled with placeholder figures — replace with real 10-K numbers, or wait for
        the finance connector sync (Phase 2) to auto-populate. This feeds the growth-rate forecast
        below.
      </p>

      <div className="overflow-x-auto -mx-2 mb-5">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
              <th className="px-2 py-2 font-medium sticky left-0 bg-surface">Metric ($M)</th>
              {years.map((y, i) => (
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
            {METRICS.map((m) => (
              <tr key={m.key} className="border-b border-border/30">
                <td className="px-2 py-2 text-slate-500 text-xs sticky left-0 bg-base whitespace-nowrap">
                  {m.label}
                </td>
                {years.map((y, i) => (
                  <td key={i} className="px-1 py-1.5">
                    <input
                      type="number"
                      step={m.step}
                      value={y[m.key]}
                      onChange={(e) => updateYear(i, m.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/30 border border-border rounded px-1.5 py-1 text-slate-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60 mb-5">
        {METRICS.map((m) => (
          <div key={m.key}>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{m.label} CAGR</p>
            <p className="stat-value text-lg text-accent2">
              {cagrs[m.key] !== null ? `${cagrs[m.key].toFixed(1)}%` : "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border/60">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">
          Margin Trend (Net Margin: {margins[0]?.netMargin.toFixed(1)}% → {margins[margins.length - 1]?.netMargin.toFixed(1)}%)
        </p>
        <div className="flex items-center gap-2">
          <Icon
            name={marginTrend >= 0 ? "check" : "warn"}
            size={16}
            className={marginTrend >= 0 ? "text-buy" : "text-caution"}
          />
          <p className={`text-sm font-medium ${marginTrend >= 0 ? "text-buy" : "text-caution"}`}>
            {marginTrend >= 0
              ? `Margins expanded ${marginTrend.toFixed(1)} points over the period — a quality signal (Buffett favors expanding or stable margins).`
              : `Margins compressed ${Math.abs(marginTrend).toFixed(1)} points over the period — worth investigating why before assuming the growth trend continues.`}
          </p>
        </div>
      </div>
    </div>
  );
}
