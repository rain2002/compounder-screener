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
    <div className="space-y-8">
      {!hydrated && (
        <div className="card p-4 text-neutral-400 font-mono text-xs">
          SYNCING INGESTED FILINGS &amp; CAPITAL TELEMETRY…
        </div>
      )}

      {/* Hero Quote Header */}
      <div className="card p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ CURRENT TICKER VALUE ]</span>
          <div className="flex items-center gap-3">
            <span className="font-syne font-bold text-3xl text-neutral-500">{cur}</span>
            <input
              type="number"
              step="0.01"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
              className="bg-transparent text-4xl sm:text-5xl font-syne font-extrabold text-white w-48 sm:w-64 focus:outline-none border-b border-white/20 focus:border-white transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="section-index text-[10px]">MACRO JURISDICTION</span>
          <select
            value={market}
            onChange={(e) => {
              setMarket(e.target.value);
              setTerminalGrowth(GDP_CAPS[e.target.value]);
            }}
            className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white cursor-pointer"
          >
            <option value="US">US (2.5% Long-Term GDP Cap)</option>
            <option value="INDIA">India (7.0% Long-Term GDP Cap)</option>
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
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 03 // BASE PARAMETERS ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              DCF CORE VALUATION INPUTS
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditableField label="Base Year FCF" value={fcf} onChange={setFcf} step="10" suffix={`${cur}M`} />
          <EditableField label="WACC Hurdle" value={wacc} onChange={setWacc} suffix="%" />
          <EditableField label="Diluted Shares" value={shares} onChange={setShares} step="1" suffix="M" />
        </div>
      </div>

      {/* Balance Sheet Telemetry */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 03.1 // BALANCE SHEET TELEMETRY ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              CAPITAL STRUCTURE &amp; LEVERAGE (FOR ML ENSEMBLE)
            </h3>
          </div>
        </div>
        <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed">
          Feeds invested capital, cash cushion, and net leverage into the pooled predictive ensemble.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditableField
            label="Total Outstanding Debt"
            value={balanceSheet.totalDebt}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, totalDebt: v })}
            step="10"
            suffix={`${cur}M`}
          />
          <EditableField
            label="Cash & Equivalents"
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
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 04 // GROWTH ASSUMPTIONS ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              MULTI-SCENARIO VELOCITY &amp; TERMINAL CAP
            </h3>
          </div>
        </div>
        <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed">
          Normal growth defaults to your historical 10-Yr FCF CAGR or can be seeded via the ML Ensemble above.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
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

        <div className="pt-4 border-t border-white/5">
          <EditableField
            label={`Terminal Growth Rate (Capped to ${market} GDP ~${cap}%)`}
            value={terminalGrowth}
            onChange={setTerminalGrowth}
            suffix="%"
          />
          {exceedsCap && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-watch/10 border border-watch/30">
              <Icon name="warn" size={16} className="text-watch shrink-0" />
              <p className="font-mono text-xs text-watch">
                EXCEEDS {market} STATUTORY LONG-TERM GDP CAP OF {cap}%. PERPETUITY WILL OVERSTATE VALUE.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3 Scenario Cards */}
      <div>
        <span className="section-index text-[10px] mb-3 block">[ 04.1 // SCENARIO VALUATION MATRIX ]</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s2) => (
            <div key={s2.key} className="card p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    {s2.key} CASE
                  </span>
                  <span className="neo-tag">{s2.growth.toFixed(1)}% CAGR</span>
                </div>
                <p className="font-syne font-extrabold text-3xl text-white mb-1">
                  {s2.perShare ? `${cur}${s2.perShare.toFixed(2)}` : "—"}
                </p>
                <p className="font-mono text-xs text-neutral-400 mb-4">
                  {s2.value ? `${cur}${s2.value.toFixed(0)}M ENTERPRISE VALUE` : "—"}
                </p>
              </div>
              {s2.upside !== null && (
                <div className="pt-3 border-t border-white/5">
                  <p className={`font-mono text-xs font-bold uppercase tracking-wide ${s2.upside >= 0 ? "text-buy" : "text-avoid"}`}>
                    {s2.upside >= 0 ? "+" : ""}{s2.upside.toFixed(1)}% {s2.upside >= 0 ? "UPSIDE" : "DOWNSIDE"}
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
      <div className="card p-6 sm:p-8 border-2 border-white/20">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <h3 className="font-syne font-extrabold text-xl text-white uppercase tracking-tight">
            FINAL VALUATION SYNTHESIS &amp; MARGIN OF SAFETY
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Current Trading Price</p>
            <p className="font-syne font-bold text-2xl text-white">
              {currentPrice != null ? `${cur}${Number(currentPrice).toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Raw Median Intrinsic Value</p>
            <p className="font-syne font-bold text-2xl text-white">
              {medianIntrinsicValue ? `${cur}${medianIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <EditableField
              label="Margin of Safety (MOS)"
              value={marginOfSafety}
              onChange={setMarginOfSafety}
              suffix="%"
            />
          </div>
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/15">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">Adjusted Target (Intrinsic × [1 - MOS])</p>
            <p className="font-syne font-bold text-2xl text-buy">
              {adjustedIntrinsicValue ? `${cur}${adjustedIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
              CURRENT VALUATION SPREAD
            </p>
            <p className={`font-syne font-extrabold text-3xl ${meetsTargetCushion ? "text-buy" : "text-avoid"}`}>
              {currentDiscount !== null ? `${currentDiscount >= 0 ? "+" : ""}${currentDiscount.toFixed(1)}% BELOW INTRINSIC` : "—"}
            </p>
          </div>
          <div className="max-w-md text-xs font-sans text-neutral-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
            {medianIntrinsicValue === null
              ? "Awaiting Monte Carlo randomized iteration cycle to synthesize target intrinsic envelope."
              : meetsTargetCushion
              ? `Current price (${currentPrice != null ? `${cur}${Number(currentPrice).toFixed(2)}` : "—"}) trades below the strict MOS-adjusted hurdle (${adjustedIntrinsicValue ? `${cur}${adjustedIntrinsicValue.toFixed(2)}` : "—"}). Attractive quantitative risk-reward.`
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
        title="DCF VALUATION ENGINE"
        subtitle="10-Yr Cash Flow Simulation"
        description="Historical FCF trend seeds forward growth velocity, flows through CAPM WACC hurdle calculations, and computes an MOS-adjusted intrinsic target through 3,000-trial Monte Carlo uncertainty modeling."
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
