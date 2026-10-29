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
    label: "INCOME STATEMENT",
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
    label: "BALANCE SHEET",
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
    label: "CASH FLOW STATEMENT",
    metrics: [
      { key: "operatingCashFlow", label: "Operating Cash Flow", step: 10 },
      { key: "capex", label: "Capital Expenditures (CapEx)", step: 5 },
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
    <div className="card p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ 01 // FINANCIAL STATEMENTS ]</span>
          <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
            10-YEAR HISTORICAL FUNDAMENTALS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={removeYear} className="neo-btn-ghost text-xs py-1.5 px-3">
            − REMOVE YEAR
          </button>
          <button onClick={addYear} className="neo-btn-primary text-xs py-1.5 px-4">
            + ADD YEAR
          </button>
        </div>
      </div>

      <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed max-w-3xl">
        Buffett and Lynch compounder framework across 10 fiscal cycles. Ingests EDGAR 10-K / 10-Q reports, normalizes working capital, and auto-calculates ROE, ROIC, and Cash Conversion.
      </p>

      {excludedYears > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <Icon name="check" size={14} className="text-white shrink-0" />
          <p className="font-mono text-xs text-neutral-300">
            {excludedYears} PRE-FOUNDING REPORTING YEAR(S) OMITTED FROM COMPOUND ANNUAL GROWTH RATES.
          </p>
        </div>
      )}

      {/* Statement Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(STATEMENTS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`font-mono text-xs uppercase px-4 py-2 rounded-full transition-all ${
              activeTab === key
                ? "bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                : "border border-white/10 bg-transparent text-neutral-400 hover:text-white hover:border-white/30"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Statement Table */}
      <div className="overflow-x-auto -mx-2 mb-6">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-400 sticky left-0 bg-[#111111] z-10">
                LINE ITEM
              </th>
              {years.map((y, i) => (
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
            {activeMetrics.map((m) => (
              <tr key={m.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-mono text-neutral-400 sticky left-0 bg-[#111111] z-10 whitespace-nowrap">
                  {m.label} {!m.noScale && <span className="text-neutral-500">($M)</span>}
                </td>
                {years.map((y, i) => (
                  <td key={i} className="px-1.5 py-1.5 text-center">
                    <input
                      type="number"
                      step={m.step}
                      value={y[m.key]}
                      onChange={(e) => updateYear(i, m.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-900/80 border border-white/5 rounded-full px-2 py-1 text-white font-mono text-xs text-center focus:outline-none focus:border-white transition-all"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {activeTab === "cashflow" && (
              <tr className="bg-white/[0.03] border-t border-white/10">
                <td className="px-3 py-3 font-mono font-bold text-white uppercase sticky left-0 bg-[#161616] z-10">
                  FREE CASH FLOW (OCF − CAPEX)
                </td>
                {derived.map((d, i) => (
                  <td key={i} className="px-2 py-3 text-center">
                    <span className="font-mono text-xs font-bold text-white">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-5 border-t border-white/10">
        {activeMetrics.slice(0, 4).map((m) => (
          <div key={m.key} className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">{m.label} CAGR</p>
            <p className="font-syne font-bold text-xl text-white">
              {cagrs[m.key] !== null ? `${cagrs[m.key].toFixed(1)}%` : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Buffett + Lynch Checklist */}
      <div className="pt-6 border-t border-white/10">
        <span className="section-index text-[10px] mb-3 block">[ 01.1 // MOAT &amp; CAPITAL ALLOCATION CHECKLIST ]</span>
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
          <RatioCell label="FCF Generative" value={formatMoney(lastDerived.fcf)} good={lastDerived.fcf > 0} />
          <RatioCell label="FCF 10-Yr CAGR" value={cagrs.fcf !== null ? `${cagrs.fcf.toFixed(1)}%` : "—"} good={cagrs.fcf > 0} />
        </div>
      </div>
    </div>
  );
}

function RatioCell({ label, value, good }) {
  return (
    <div className={`p-3 rounded-xl border ${good ? "border-buy/20 bg-buy/[0.04]" : "border-watch/20 bg-watch/[0.04]"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${good ? "bg-buy" : "bg-watch"}`} />
      </div>
      <p className={`font-syne font-bold text-base ${good ? "text-buy" : "text-watch"}`}>{value}</p>
    </div>
  );
}
