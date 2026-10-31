import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import { formatMoney } from "../utils/units.js";

function trimLeadingZeros(years, key) {
  const firstRealIndex = years.findIndex((y) => y[key] > 0);
  if (firstRealIndex <= 0) return years;
  return years.slice(firstRealIndex);
}

function cagr(years, key) {
  const trimmed = trimLeadingZeros(years, key);
  if (trimmed.length < 2) return null;
  const first = trimmed[0][key];
  const last = trimmed[trimmed.length - 1][key];
  const n = trimmed.length - 1;
  if (first <= 0 || last <= 0 || n <= 0) return null;
  return (Math.pow(last / first, 1 / n) - 1) * 100;
}

const STATEMENTS = {
  income: {
    label: "Income Statement",
    metrics: [
      { key: "revenue", label: "Revenue", step: 10 },
      { key: "grossProfit", label: "Gross Profit", step: 10 },
      { key: "ebitda", label: "EBITDA", step: 5 },
      { key: "ebit", label: "EBIT (Operating Income)", step: 5 },
      { key: "interestExpense", label: "Interest Expense", step: 1 },
      { key: "netIncome", label: "Net Income", step: 5 },
      { key: "eps", label: "EPS ($)", step: 0.05, noScale: true },
    ],
  },
  balance: {
    label: "Balance Sheet",
    metrics: [
      { key: "totalDebt", label: "Total Debt", step: 10 },
      { key: "cash", label: "Cash & Equivalents", step: 10 },
      { key: "totalEquity", label: "Total Stockholders' Equity", step: 10 },
      { key: "currentAssets", label: "Current Assets", step: 10 },
      { key: "currentLiabilities", label: "Current Liabilities", step: 10 },
      { key: "inventory", label: "Inventory", step: 5 },
      { key: "accountsReceivable", label: "Accounts Receivable", step: 5 },
    ],
  },
  cashflow: {
    label: "Cash Flow Statement",
    metrics: [
      { key: "operatingCashFlow", label: "Operating Cash Flow", step: 10 },
      { key: "capex", label: "CapEx", step: 5 },
    ],
  },
};

const ALL_METRICS = Object.values(STATEMENTS).flatMap((s) => s.metrics);

function computeDerived(y) {
  const fcf = y.operatingCashFlow - y.capex;
  const roe = y.totalEquity ? (y.netIncome / y.totalEquity) * 100 : 0;
  const investedCapital = y.totalEquity + y.totalDebt - y.cash;
  const roic = investedCapital > 0 ? (y.ebit * 0.79 / investedCapital) * 100 : 0;
  const debtToEquity = y.totalEquity ? y.totalDebt / y.totalEquity : 0;
  const debtToEbitda = y.ebitda ? y.totalDebt / y.ebitda : 0;
  const currentRatio = y.currentLiabilities ? y.currentAssets / y.currentLiabilities : 0;
  const interestCoverage = y.interestExpense ? y.ebit / y.interestExpense : 0;
  const grossMargin = y.revenue ? (y.grossProfit / y.revenue) * 100 : 0;
  const operatingMargin = y.revenue ? (y.ebit / y.revenue) * 100 : 0;
  const netMargin = y.revenue ? (y.netIncome / y.revenue) * 100 : 0;
  const cashConversion = y.netIncome ? y.operatingCashFlow / y.netIncome : 0;
  return { fcf, roe, roic, debtToEquity, debtToEbitda, currentRatio, interestCoverage, grossMargin, operatingMargin, netMargin, cashConversion };
}

function fcfCagr(years) {
  const withFcf = years.map((y) => ({ ...y, __fcf: y.operatingCashFlow - y.capex }));
  return cagr(withFcf, "__fcf");
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

export default function FundamentalsBuilder({ years, onYearsChange }) {
  const [activeTab, setActiveTab] = useState("income");

  function updateYear(index, field, value) {
    if (field === "year") {
      onYearsChange(resequenceYears(years, index, value));
      return;
    }
    const next = years.map((y, i) => (i === index ? { ...y, [field]: value } : y));
    onYearsChange(next);
  }

  function addYear() {
    const first = years[0];
    const prevYearLabel = (parseInt(first.year, 10) - 1).toString();
    onYearsChange([{ ...first, year: prevYearLabel }, ...years]);
  }

  function removeYear() {
    if (years.length <= 2) return;
    onYearsChange(years.slice(1));
  }

  const derived = years.map(computeDerived);
  const lastDerived = derived[derived.length - 1];
  const firstDerived = derived[0];

  const cagrs = useMemo(() => {
    const result = {};
    ALL_METRICS.forEach((m) => {
      result[m.key] = cagr(years, m.key);
    });
    result.fcf = fcfCagr(years);
    return result;
  }, [years]);

  const revenueFoundingIndex = years.findIndex((y) => y.revenue > 0);
  const excludedYears = revenueFoundingIndex > 0 ? revenueFoundingIndex : 0;

  const activeMetrics = STATEMENTS[activeTab].metrics;

  return (
    <div className="card p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-semibold text-white">
            10-Year Historical Fundamentals
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Normalized statements from SEC EDGAR / BSE filings. Values entered in $M.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={removeYear} className="btn-secondary text-xs py-1 px-3">
            − Remove Year
          </button>
          <button onClick={addYear} className="btn-primary text-xs py-1 px-3">
            + Add Year
          </button>
        </div>
      </div>

      {excludedYears > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300">
          <Icon name="check" size={14} className="text-emerald-400 shrink-0" />
          <span>
            {excludedYears} pre-founding reporting year(s) omitted from compound annual growth rates.
          </span>
        </div>
      )}

      {/* Statement Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(STATEMENTS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === key
                ? "bg-white/[0.12] text-white shadow-sm border border-white/15"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Statement Table */}
      <div className="overflow-x-auto -mx-2 mb-5">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.02]">
              <th className="px-3 py-2 text-left font-medium sticky left-0 bg-[#111114] z-10">
                Line Item
              </th>
              {years.map((y, i) => (
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
            {activeMetrics.map((m) => (
              <tr key={m.key} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-3 py-2 text-zinc-400 sticky left-0 bg-[#111114] z-10 whitespace-nowrap">
                  {m.label} {!m.noScale && <span className="text-zinc-500">($M)</span>}
                </td>
                {years.map((y, i) => (
                  <td key={i} className="px-1.5 py-1 text-center">
                    <input
                      type="number"
                      step={m.step}
                      value={y[m.key]}
                      onChange={(e) => updateYear(i, m.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900/80 border border-white/5 rounded px-2 py-1 text-zinc-200 text-xs text-center focus:outline-none focus:border-white/30 tabular-nums transition-all"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {activeTab === "cashflow" && (
              <tr className="bg-white/[0.03] border-t border-white/10 font-semibold">
                <td className="px-3 py-2.5 text-zinc-100 sticky left-0 bg-[#151518] z-10">
                  Free Cash Flow (OCF − CapEx)
                </td>
                {derived.map((d, i) => (
                  <td key={i} className="px-2 py-2.5 text-center">
                    <span className="text-xs text-emerald-400 font-semibold tabular-nums">
                      {formatMoney(d.fcf)}
                    </span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CAGR Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 pt-4 border-t border-white/[0.06]">
        {activeMetrics.slice(0, 4).map((m) => (
          <div key={m.key} className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{m.label} CAGR</p>
            <p className="text-lg font-semibold text-zinc-100 tabular-nums">
              {cagrs[m.key] !== null ? `${cagrs[m.key].toFixed(1)}%` : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Buffett + Lynch Checklist */}
      <div className="pt-4 border-t border-white/[0.06]">
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Buffett &amp; Lynch Quality Moat Checklist (Latest Year)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <RatioCell label="ROE (>15%)" value={`${lastDerived.roe.toFixed(1)}%`} good={lastDerived.roe >= 15} />
          <RatioCell label="ROIC (>15%)" value={`${lastDerived.roic.toFixed(1)}%`} good={lastDerived.roic >= 15} />
          <RatioCell label="Debt / Equity (<0.5)" value={lastDerived.debtToEquity.toFixed(2)} good={lastDerived.debtToEquity <= 0.5} />
          <RatioCell label="Debt / EBITDA (<3.0)" value={lastDerived.debtToEbitda.toFixed(2)} good={lastDerived.debtToEbitda <= 3} />
          <RatioCell label="Current Ratio (>1.0)" value={lastDerived.currentRatio.toFixed(2)} good={lastDerived.currentRatio > 1} />
          <RatioCell label="Interest Coverage (>5x)" value={`${lastDerived.interestCoverage.toFixed(1)}x`} good={lastDerived.interestCoverage >= 5} />
          <RatioCell label="Gross Margin Trend" value={`${lastDerived.grossMargin.toFixed(1)}%`} good={lastDerived.grossMargin >= firstDerived.grossMargin} />
          <RatioCell label="Operating Margin" value={`${lastDerived.operatingMargin.toFixed(1)}%`} good={lastDerived.operatingMargin >= firstDerived.operatingMargin} />
          <RatioCell label="Net Margin Trend" value={`${lastDerived.netMargin.toFixed(1)}%`} good={lastDerived.netMargin >= firstDerived.netMargin} />
          <RatioCell label="Cash Conversion (>1.0x)" value={`${lastDerived.cashConversion.toFixed(2)}x`} good={lastDerived.cashConversion >= 1} />
          <RatioCell label="FCF Positive" value={formatMoney(lastDerived.fcf)} good={lastDerived.fcf > 0} />
          <RatioCell label="FCF 10-Yr CAGR" value={cagrs.fcf !== null ? `${cagrs.fcf.toFixed(1)}%` : "—"} good={cagrs.fcf > 0} />
        </div>
      </div>
    </div>
  );
}

function RatioCell({ label, value, good }) {
  return (
    <div className={`p-2.5 rounded-lg border ${good ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-amber-500/20 bg-amber-500/[0.04]"}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-zinc-400">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${good ? "bg-emerald-400" : "bg-amber-400"}`} />
      </div>
      <p className={`text-sm font-semibold tabular-nums ${good ? "text-emerald-400" : "text-amber-400"}`}>{value}</p>
    </div>
  );
}
