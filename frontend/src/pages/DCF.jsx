import { useState, useEffect, useRef } from "react";
import EditableField from "../components/EditableField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import WaccCalculator from "../components/WaccCalculator.jsx";
import MonteCarloDCF from "../components/MonteCarloDCF.jsx";
import FcfHistoryBuilder from "../components/FcfHistoryBuilder.jsx";
import MLGrowthSuggestion from "../components/MLGrowthSuggestion.jsx";
import CompanyStateSelector from "../components/CompanyStateSelector.jsx";

const GDP_CAPS = { US: 2.5, INDIA: 7.0 };
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const MAX_HISTORY_YEARS = 10;

function defaultHistoryYears() {
  const startYear = 2016;
  const years = [];
  for (let i = 0; i < 10; i++) {
    const growthFactor = Math.pow(1.08, i);
    years.push({
      year: String(startYear + i),
      revenue: Math.round(3000 * growthFactor),
      ebitMargin: 22 + i * 0.3,
      taxRate: 21,
      depreciation: Math.round(150 * growthFactor),
      capex: Math.round(180 * growthFactor),
      deltaWorkingCapital: Math.round(20 * growthFactor),
    });
  }
  return years;
}

function computeScenario(fcf, growthRate, terminalGrowth, wacc, years = 5) {
  if (!fcf || !wacc || wacc <= terminalGrowth) return null;
  let pv = 0;
  let cf = fcf;
  for (let y = 1; y <= years; y++) {
    cf = cf * (1 + growthRate / 100);
    pv += cf / Math.pow(1 + wacc / 100, y);
  }
  const terminalValue = (cf * (1 + terminalGrowth / 100)) / (wacc / 100 - terminalGrowth / 100);
  const pvTerminal = terminalValue / Math.pow(1 + wacc / 100, years);
  return pv + pvTerminal;
}

function defaultDcfState() {
  return {
    market: "US",
    currentPrice: 150,
    fcf: 1000,
    wacc: 9,
    shares: 100,
    growth: { conservative: 5, normal: 10, optimistic: 15 },
    terminalGrowth: GDP_CAPS.US,
    marginOfSafety: 20,
    historyYears: defaultHistoryYears(),
    monteCarlo: null,
    balanceSheet: { totalDebt: 800, cash: 600, totalEquity: 4000 },
  };
}

function DcfCalculator({ initialState, onStateChange, ticker, selectedCompany }) {
  const initialMarket = initialState?.market || (selectedCompany?.market?.toUpperCase() === "INDIA" ? "INDIA" : "US");
  const s = initialState || { ...defaultDcfState(), market: initialMarket };

  const [market, setMarket] = useState(s.market);
  const [currentPrice, setCurrentPrice] = useState(s.currentPrice);
  const [fcf, setFcf] = useState(s.fcf);
  const [wacc, setWacc] = useState(s.wacc);
  const [shares, setShares] = useState(s.shares);
  const [growth, setGrowth] = useState(s.growth);
  const [terminalGrowth, setTerminalGrowth] = useState(s.terminalGrowth);
  const [marginOfSafety, setMarginOfSafety] = useState(s.marginOfSafety);
  const [medianIntrinsicValue, setMedianIntrinsicValue] = useState(null);
  const [historyYears, setHistoryYears] = useState(s.historyYears);
  const [monteCarlo, setMonteCarlo] = useState(s.monteCarlo);
  const [balanceSheet, setBalanceSheet] = useState(s.balanceSheet || defaultDcfState().balanceSheet);

  const [hydrated, setHydrated] = useState(!!initialState);

  useEffect(() => {
    if (initialState) {
      setHydrated(true);
      return;
    }
    if (!ticker) {
      setHydrated(true);
      return;
    }

    let cancelled = false;

    fetch(`${BASE_URL}/companies/${ticker}/financials`)
      .then((res) => {
        if (!res.ok) throw new Error("financials fetch failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        if (data.years && data.years.length > 0) {
          const recentYears = data.years.slice(-MAX_HISTORY_YEARS);
          const mapped = recentYears.map((y) => ({
            year: y.year,
            revenue: y.revenue ? Math.round(y.revenue / 1e6) : 0,
            ebitMargin: y.revenue && y.operatingIncome ? (y.operatingIncome / y.revenue) * 100 : 0,
            taxRate: 21,
            depreciation: 0,
            capex: y.capex ? Math.round(y.capex / 1e6) : 0,
            deltaWorkingCapital: 0,
          }));
          setHistoryYears(mapped);

          const last = recentYears[recentYears.length - 1];
          if (last.fcf) setFcf(Math.round(last.fcf / 1e6));
          setBalanceSheet({
            totalDebt: last.totalDebt ? Math.round(last.totalDebt / 1e6) : 0,
            cash: last.cash ? Math.round(last.cash / 1e6) : 0,
            totalEquity: last.totalEquity ? Math.round(last.totalEquity / 1e6) : 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    fetch(`${BASE_URL}/quote/${ticker}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.current_price) {
          setCurrentPrice(data.current_price);
          if (data.market_cap) {
            const computedShares = Math.round(data.market_cap / data.current_price / 1e6);
            if (computedShares > 0) setShares(computedShares);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  useEffect(() => {
    if (!hydrated) return;
    onStateChange({
      market, currentPrice, fcf, wacc, shares, growth, terminalGrowth, marginOfSafety,
      historyYears, monteCarlo, balanceSheet,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, market, currentPrice, fcf, wacc, shares, growth, terminalGrowth, marginOfSafety, historyYears, monteCarlo, balanceSheet]);

  const mKey = market?.toUpperCase() === "INDIA" ? "INDIA" : "US";
  const cap = GDP_CAPS[mKey] ?? 2.5;
  const exceedsCap = terminalGrowth > cap;
  const cur = mKey === "INDIA" ? "₹" : "$";

  const scenarios = ["conservative", "normal", "optimistic"].map((key) => {
    const value = computeScenario(fcf, growth[key], terminalGrowth, wacc);
    const perShare = value && shares ? value / shares : null;
    const upside = perShare && currentPrice ? ((perShare - currentPrice) / currentPrice) * 100 : null;
    return { key, growth: growth[key], value, perShare, upside };
  });

  const adjustedIntrinsicValue = medianIntrinsicValue ? medianIntrinsicValue * (1 - marginOfSafety / 100) : null;
  const currentDiscount = medianIntrinsicValue && currentPrice
    ? ((medianIntrinsicValue - currentPrice) / medianIntrinsicValue) * 100
    : null;
  const meetsTargetCushion = currentDiscount !== null && currentDiscount >= marginOfSafety;

  return (
    <div className="space-y-6">
      {!hydrated && (
        <div className="card p-4 text-zinc-400 text-xs">
          Loading company financials and capital structure…
        </div>
      )}

      {/* Hero Quote Header */}
      <div className="card p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs font-medium text-zinc-400 block mb-1">Current Share Price</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-zinc-500">{cur}</span>
            <input
              type="number"
              step="0.01"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
              className="bg-transparent text-3xl sm:text-4xl font-bold text-white w-40 sm:w-52 focus:outline-none border-b border-white/20 focus:border-white transition-all tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400">Market &amp; Terminal Cap</span>
          <select
            value={market}
            onChange={(e) => {
              setMarket(e.target.value);
              setTerminalGrowth(GDP_CAPS[e.target.value]);
            }}
            className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="US">US Market (2.5% Long-Term GDP Cap)</option>
            <option value="INDIA">India Market (7.0% Long-Term GDP Cap)</option>
          </select>
        </div>
      </div>

      <FcfHistoryBuilder
        years={historyYears}
        onYearsChange={setHistoryYears}
        onBaseFcfChange={setFcf}
        onSuggestedGrowthChange={(g) => setGrowth((prev) => ({ ...prev, normal: g }))}
      />

      <MLGrowthSuggestion
        historyYears={historyYears}
        totalDebt={balanceSheet.totalDebt}
        cash={balanceSheet.cash}
        totalEquity={balanceSheet.totalEquity}
        onApply={(g) => setGrowth((prev) => ({ ...prev, normal: g }))}
      />

      <WaccCalculator market={market} onWaccChange={setWacc} />

      {/* Core Model Parameters */}
      <div className="card p-6">
        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">
            Core DCF Inputs
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Base year cash flow, hurdle discount rate, and total share count.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditableField label="Base Year FCF" value={fcf} onChange={setFcf} step="10" suffix={`${cur}M`} />
          <EditableField label="WACC Hurdle" value={wacc} onChange={setWacc} suffix="%" />
          <EditableField label="Diluted Shares" value={shares} onChange={setShares} step="1" suffix="M" />
        </div>
      </div>

      {/* Balance Sheet Telemetry */}
      <div className="card p-6">
        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">
            Balance Sheet &amp; Capital Structure
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Feeds leverage ratios and invested capital into the pooled ML growth model.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditableField
            label="Total Debt"
            value={balanceSheet.totalDebt}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, totalDebt: v })}
            step="10"
            suffix={`${cur}M`}
          />
          <EditableField
            label="Cash &amp; Equivalents"
            value={balanceSheet.cash}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, cash: v })}
            step="10"
            suffix={`${cur}M`}
          />
          <EditableField
            label="Total Stockholders' Equity"
            value={balanceSheet.totalEquity}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, totalEquity: v })}
            step="10"
            suffix={`${cur}M`}
          />
        </div>
      </div>

      {/* Growth Assumptions */}
      <div className="card p-6">
        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">
            Growth Assumptions
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Normal growth defaults to historical FCF CAGR or can be seeded using the ML ensemble above.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <EditableField
            label="Conservative Growth"
            value={growth.conservative}
            onChange={(v) => setGrowth({ ...growth, conservative: v })}
            suffix="%"
          />
          <EditableField
            label="Normal Baseline Growth"
            value={growth.normal}
            onChange={(v) => setGrowth({ ...growth, normal: v })}
            suffix="%"
          />
          <EditableField
            label="Optimistic Growth"
            value={growth.optimistic}
            onChange={(v) => setGrowth({ ...growth, optimistic: v })}
            suffix="%"
          />
        </div>

        <div className="pt-3 border-t border-white/[0.06]">
          <EditableField
            label={`Terminal Growth Rate (Capped to ${market} GDP ~${cap}%)`}
            value={terminalGrowth}
            onChange={setTerminalGrowth}
            suffix="%"
          />
          {exceedsCap && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <Icon name="warn" size={16} className="text-amber-400 shrink-0" />
              <span>
                Exceeds statutory {market} long-term GDP cap of {cap}%. Perpetuity may overstate value.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Scenario Cards */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-300">Valuation Scenarios</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s2) => (
            <div key={s2.key} className="card p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {s2.key} Case
                  </span>
                  <span className="text-xs font-medium text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04]">
                    {s2.growth.toFixed(1)}% Growth
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mb-1 tabular-nums">
                  {s2.perShare ? `${cur}${s2.perShare.toFixed(2)}` : "—"}
                </p>
                <p className="text-xs text-zinc-400 mb-4 tabular-nums">
                  {s2.value ? `${cur}${s2.value.toFixed(0)}M Enterprise Value` : "—"}
                </p>
              </div>
              {s2.upside !== null && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className={`text-xs font-semibold tabular-nums ${s2.upside >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {s2.upside >= 0 ? "+" : ""}{s2.upside.toFixed(1)}% {s2.upside >= 0 ? "Upside" : "Downside"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <MonteCarloDCF
        market={market}
        fcf={fcf}
        waccMean={wacc}
        terminalGrowth={terminalGrowth}
        shares={shares}
        growthMean={growth.normal}
        currentPrice={currentPrice}
        onMedianChange={setMedianIntrinsicValue}
        onSimulationChange={setMonteCarlo}
      />

      {/* Synthesis Card */}
      <div className="card p-6 border border-white/15">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.08]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h3 className="text-base font-semibold text-white">
            Valuation Summary &amp; Margin of Safety
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">Current Trading Price</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {currentPrice != null ? `${cur}${Number(currentPrice).toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">Raw Median Intrinsic Value</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {medianIntrinsicValue ? `${cur}${medianIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <EditableField
              label="Margin of Safety (MOS)"
              value={marginOfSafety}
              onChange={setMarginOfSafety}
              suffix="%"
            />
          </div>
          <div className="p-3.5 rounded-lg bg-white/[0.04] border border-white/10">
            <p className="text-xs text-zinc-300 font-medium mb-1">Adjusted Target (Intrinsic × [1 - MOS])</p>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {adjustedIntrinsicValue ? `${cur}${adjustedIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
        </div>

        <div className="pt-5 border-t border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Current Valuation Spread</p>
            <p className={`text-2xl font-bold tabular-nums ${meetsTargetCushion ? "text-emerald-400" : "text-rose-400"}`}>
              {currentDiscount !== null ? `${currentDiscount >= 0 ? "+" : ""}${currentDiscount.toFixed(1)}% below intrinsic` : "—"}
            </p>
          </div>
          <div className="max-w-md text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-4 rounded-lg border border-white/[0.06]">
            {medianIntrinsicValue === null
              ? "Awaiting Monte Carlo randomized iteration cycle to compute intrinsic valuation range."
              : meetsTargetCushion
              ? `Current price (${currentPrice != null ? `${cur}${Number(currentPrice).toFixed(2)}` : "—"}) trades below the strict MOS-adjusted hurdle (${adjustedIntrinsicValue ? `${cur}${adjustedIntrinsicValue.toFixed(2)}` : "—"}). Attractive risk-reward.`
              : currentDiscount >= 0
              ? `Trading at a discount to raw intrinsic value (${medianIntrinsicValue ? `${cur}${medianIntrinsicValue.toFixed(2)}` : "—"}), but hasn't satisfied the full ${marginOfSafety}% safety cushion.`
              : `Current market price exceeds raw median intrinsic value — no margin of safety available at present levels.`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DCF() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="DCF Valuation Model"
        subtitle="10-Year Cash Flow Simulation"
        description="Historical FCF trend feeds growth assumptions, flows through CAPM WACC hurdle calculations, and computes an MOS-adjusted intrinsic target through 3,000-trial Monte Carlo uncertainty modeling."
      />
      <CompanyStateSelector pageName="dcf">
        {({ companyId, selectedCompany, loadedState, saveState }) => (
          <PersistedDcf
            key={companyId}
            ticker={selectedCompany?.ticker}
            selectedCompany={selectedCompany}
            loadedState={loadedState}
            saveState={saveState}
          />
        )}
      </CompanyStateSelector>
    </div>
  );
}

function PersistedDcf({ loadedState, saveState, ticker, selectedCompany }) {
  const debounceRef = useRef(null);

  function handleStateChange(nextState) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveState(nextState), 1200);
  }

  return (
    <DcfCalculator
      initialState={loadedState || null}
      onStateChange={handleStateChange}
      ticker={ticker}
      selectedCompany={selectedCompany}
    />
  );
}
