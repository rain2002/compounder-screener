import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";

function cagr(first, last, years) {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

const STATEMENTS = {
  income: {
    label: "Income Statement",
    metrics: [
      { key: "revenue", label: "Revenue", step: 10 },
      { key: "grossProfit", label: "Gross Profit", step: 10 },
      { key: "ebitda", label: "EBITDA", step: 5 },
      { key: "ebit", label: "EBIT", step: 5 },
      { key: "interestExpense", label: "Interest Expense", step: 1 },
      { key: "netIncome", label: "Net Income", step: 5 },
      { key: "eps", label: "EPS ($)", step: 0.05 },
    ],
  },
  balance: {
    label: "Balance Sheet",
    metrics: [
      { key: "totalDebt", label: "Total Debt", step: 10 },
      { key: "cash", label: "Cash & Equivalents", step: 10 },
      { key: "totalEquity", label: "Total Equity", step: 10 },
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

export default function FundamentalsBuilder({ years, onYearsChange }) {
  const [activeTab, setActiveTab] = useState("income");

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

  const derived = years.map(computeDerived);
  const lastDerived = derived[derived.length - 1];
  const firstDerived = derived[0];

  const cagrs = useMemo(() => {
    const result = {};
    ALL_METRICS.forEach((m) => {
      result[m.key] = cagr(years[0][m.key], years[years.length - 1][m.key], years.length - 1);
    });
    result.fcf = cagr(firstDerived.fcf, lastDerived.fcf, years.length - 1);
    return result;
  }, [years]);

  const activeMetrics = STATEMENTS[activeTab].metrics;

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
          <button onClick={removeYear} className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
            − Remove Year
          </button>
          <button onClick={addYear} className="text-xs px-2.5 py-1 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors font-medium">
            + Add Year
          </button>
        </div>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Covers the metrics Buffett and Lynch both check across all 3 statements — not just income
        statement basics. Pre-filled with placeholder figures — replace with real 10-K numbers, or
        wait for the finance connector sync (Phase 2).
      </p>

      <div className="flex gap-2 mb-4">
        {Object.entries(STATEMENTS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === key ? "bg-accent/20 text-accent2" : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

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
            {activeMetrics.map((m) => (
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
            {activeTab === "cashflow" && (
              <tr className="bg-accent/5">
                <td className="px-2 py-2.5 text-slate-200 text-xs font-semibold sticky left-0 bg-accent/5">
                  Free Cash Flow (OCF − CapEx)
                </td>
                {derived.map((d, i) => (
                  <td key={i} className="px-2 py-2.5 text-center text-accent2 font-semibold text-xs">
                    ${d.fcf.toFixed(0)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60 mb-5">
        {activeMetrics.slice(0, 4).map((m) => (
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
          Buffett + Lynch Ratio Checklist (Most Recent Year)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RatioCell label="ROE" value={`${lastDerived.roe.toFixed(1)}%`} good={lastDerived.roe >= 15} />
          <RatioCell label="ROIC" value={`${lastDerived.roic.toFixed(1)}%`} good={lastDerived.roic >= 15} />
          <RatioCell label="Debt/Equity" value={lastDerived.debtToEquity.toFixed(2)} good={lastDerived.debtToEquity <= 0.5} />
          <RatioCell label="Debt/EBITDA" value={lastDerived.debtToEbitda.toFixed(2)} good={lastDerived.debtToEbitda <= 3} />
          <RatioCell label="Current Ratio" value={lastDerived.currentRatio.toFixed(2)} good={lastDerived.currentRatio > 1} />
          <RatioCell label="Interest Coverage" value={`${lastDerived.interestCoverage.toFixed(1)}x`} good={lastDerived.interestCoverage >= 5} />
          <RatioCell label="Gross Margin" value={`${lastDerived.grossMargin.toFixed(1)}%`} good={lastDerived.grossMargin >= firstDerived.grossMargin} />
          <RatioCell label="Operating Margin" value={`${lastDerived.operatingMargin.toFixed(1)}%`} good={lastDerived.operatingMargin >= firstDerived.operatingMargin} />
          <RatioCell label="Net Margin" value={`${lastDerived.netMargin.toFixed(1)}%`} good={lastDerived.netMargin >= firstDerived.netMargin} />
          <RatioCell label="Cash Conversion" value={`${lastDerived.cashConversion.toFixed(2)}x`} good={lastDerived.cashConversion >= 1} />
          <RatioCell label="FCF" value={`$${lastDerived.fcf.toFixed(0)}M`} good={lastDerived.fcf > 0} />
          <RatioCell label="FCF CAGR" value={cagrs.fcf !== null ? `${cagrs.fcf.toFixed(1)}%` : "—"} good={cagrs.fcf > 0} />
        </div>
      </div>
    </div>
  );
}

function RatioCell({ label, value, good }) {
  return (
    <div className={`rounded-lg border p-2.5 ${good ? "border-buy/30 bg-buy/5" : "border-caution/30 bg-caution/5"}`}>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${good ? "text-buy" : "text-caution"}`}>{value}</p>
    </div>
  );
}
