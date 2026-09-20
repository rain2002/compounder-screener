import { useState, useEffect, useRef } from "react";
import EditableField from "../components/EditableField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import WaccCalculator from "../components/WaccCalculator.jsx";
import MonteCarloDCF from "../components/MonteCarloDCF.jsx";
import FcfHistoryBuilder from "../components/FcfHistoryBuilder.jsx";
import MLGrowthSuggestion from "../components/MLGrowthSuggestion.jsx";
import CompanyStateSelector from "../components/CompanyStateSelector.jsx";
import { apiClient } from "../api/client";


const GDP_CAPS = { US: 2.5, INDIA: 7.0 };
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";


function useLivePrice(symbol) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    let active = true;

    const fetchPrice = async () => {
      try {
        const res = await apiClient.get(`/quote/${symbol}`);
        if (active) setPrice(res.data.current_price);
      } catch (err) {
        console.error("Price fetch failed", err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return price;
}

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


const scenarioStyle = {
  conservative: "border-avoid/30",
  normal: "border-accent/30",
  optimistic: "border-buy/30",
};


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


function DcfCalculator({ initialState, onStateChange, ticker }) {
  const s = initialState || defaultDcfState();

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

  // Live price from Finnhub via backend /quote/{symbol}
  const livePrice = useLivePrice(ticker);

  useEffect(() => {
    if (livePrice !== null && livePrice !== undefined) {
      setCurrentPrice(livePrice);
    }
  }, [livePrice]);

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
          const mapped = data.years.map((y) => ({
            year: y.year,
            revenue: y.revenue ? Math.round(y.revenue / 1e6) : 0,
            ebitMargin: y.revenue && y.operatingIncome ? (y.operatingIncome / y.revenue) * 100 : 0,
            taxRate: 21,
            depreciation: 0,
            capex: y.capex ? Math.round(y.capex / 1e6) : 0,
            deltaWorkingCapital: 0,
          }));
          setHistoryYears(mapped);

          const last = data.years[data.years.length - 1];
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
    if (!hydrated) return;
    onStateChange({
      market, currentPrice, fcf, wacc, shares, growth, terminalGrowth, marginOfSafety,
      historyYears, monteCarlo, balanceSheet,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, market, currentPrice, fcf, wacc, shares, growth, terminalGrowth, marginOfSafety, historyYears, monteCarlo, balanceSheet]);


  const cap = GDP_CAPS[market];
  const exceedsCap = terminalGrowth > cap;


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
    <div>
      {!hydrated && (
        <div className="card p-4 mb-4 text-slate-400 text-sm">
          Loading company financials...
        </div>
      )}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
              Current Share Price {livePrice !== null && <span className="text-buy">(live)</span>}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="bg-transparent text-3xl font-bold text-white w-40 focus:outline-none border-b border-transparent focus:border-accent"
              />
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Market</span>
            <select
              value={market}
              onChange={(e) => {
                setMarket(e.target.value);
                setTerminalGrowth(GDP_CAPS[e.target.value]);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
            >
              <option value="US">US</option>
              <option value="INDIA">India</option>
            </select>
          </label>
        </div>
      </div>


      <FcfHistoryBuilder
        years={historyYears}
        onYearsChange={setHistoryYears}
        onBaseFcfChange={setFcf}
        onSuggestedGrowthChange={(g) => setGrowth((prev) => ({ ...prev, normal: g }))}
      />


      {market === "US" && (
        <MLGrowthSuggestion
          historyYears={historyYears}
          totalDebt={balanceSheet.totalDebt}
          cash={balanceSheet.cash}
          totalEquity={balanceSheet.totalEquity}
          onApply={(g) => setGrowth((prev) => ({ ...prev, normal: g }))}
        />
      )}


      <WaccCalculator market={market} onWaccChange={setWacc} />


      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">DCF Inputs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="Base Year FCF (from history above)" value={fcf} onChange={setFcf} step="10" suffix="$M" />
          <EditableField label="WACC (auto-synced, editable)" value={wacc} onChange={setWacc} suffix="%" />
          <EditableField label="Shares Outstanding" value={shares} onChange={setShares} step="1" suffix="M" />
        </div>
      </div>


      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Balance Sheet (for ML growth features)
        </h3>
        <p className="text-slate-500 text-xs mb-4">
          Total Debt, Cash, and Total Equity feed the ROIC and leverage ratios the pooled ML model
          uses above. Not used anywhere else in the DCF math.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <EditableField
            label="Total Debt"
            value={balanceSheet.totalDebt}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, totalDebt: v })}
            step="10"
            suffix="$M"
          />
          <EditableField
            label="Cash & Equivalents"
            value={balanceSheet.cash}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, cash: v })}
            step="10"
            suffix="$M"
          />
          <EditableField
            label="Total Equity"
            value={balanceSheet.totalEquity}
            onChange={(v) => setBalanceSheet({ ...balanceSheet, totalEquity: v })}
            step="10"
            suffix="$M"
          />
        </div>
      </div>


      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Growth Assumptions
        </h3>
        <p className="text-slate-500 text-xs mb-4">
          "Normal" is pre-filled from your historical FCF CAGR above — override any of the three
          if you think the trend won't hold, or apply the ML ensemble suggestion above.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <EditableField
            label="Conservative"
            value={growth.conservative}
            onChange={(v) => setGrowth({ ...growth, conservative: v })}
            suffix="%"
          />
          <EditableField
            label="Normal (from FCF CAGR or ML)"
            value={growth.normal}
            onChange={(v) => setGrowth({ ...growth, normal: v })}
            suffix="%"
          />
          <EditableField
            label="Optimistic"
            value={growth.optimistic}
            onChange={(v) => setGrowth({ ...growth, optimistic: v })}
            suffix="%"
          />
        </div>


        <EditableField
          label={`Terminal growth — capped to ${market} GDP growth ~${cap}%`}
          value={terminalGrowth}
          onChange={setTerminalGrowth}
          suffix="%"
        />
        {exceedsCap && (
          <div className="flex items-center gap-2 mt-2.5">
            <Icon name="warn" size={16} className="text-caution" />
            <p className="text-caution text-xs font-medium">
              Exceeds the {market} long-term GDP growth cap of {cap}%
            </p>
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((s2) => (
          <div key={s2.key} className={`card ${scenarioStyle[s2.key]} p-5`}>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
              {s2.key}
            </p>
            <p className="text-slate-400 text-xs mb-3">{s2.growth.toFixed(1)}% growth</p>
            <p className="stat-value text-2xl text-white mb-1">
              {s2.perShare ? `$${s2.perShare.toFixed(2)}` : "—"}
            </p>
            <p className="text-slate-500 text-sm mb-2">
              {s2.value ? `$${s2.value.toFixed(0)}M total` : "—"}
            </p>
            {s2.upside !== null && (
              <p className={`text-sm font-semibold ${s2.upside >= 0 ? "text-buy" : "text-avoid"}`}>
                {s2.upside >= 0 ? "+" : ""}{s2.upside.toFixed(1)}% {s2.upside >= 0 ? "upside" : "downside"}
              </p>
            )}
          </div>
        ))}
      </div>


      <MonteCarloDCF
        fcf={fcf}
        waccMean={wacc}
        terminalGrowth={terminalGrowth}
        shares={shares}
        growthMean={growth.normal}
        currentPrice={currentPrice}
        onMedianChange={setMedianIntrinsicValue}
        onSimulationChange={setMonteCarlo}
      />


      <div className="card p-6 border-2 border-accent/30">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="check" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Evaluation Summary
          </h3>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Current Price</p>
            <p className="stat-value text-xl text-slate-200">${currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Raw Intrinsic Value (Median)</p>
            <p className="stat-value text-xl text-accent2">
              {medianIntrinsicValue ? `$${medianIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <EditableField
              label="Margin of Safety"
              value={marginOfSafety}
              onChange={setMarginOfSafety}
              suffix="%"
            />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
              Adjusted Intrinsic Value (Intrinsic × (1 − MOS))
            </p>
            <p className="stat-value text-xl text-buy">
              {adjustedIntrinsicValue ? `$${adjustedIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
        </div>


        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
              Current Price vs. Raw Intrinsic Value
            </p>
            <p className={`stat-value text-2xl ${meetsTargetCushion ? "text-buy" : "text-avoid"}`}>
              {currentDiscount !== null ? `${currentDiscount >= 0 ? "+" : ""}${currentDiscount.toFixed(1)}% below intrinsic` : "—"}
            </p>
          </div>
          <div className="text-right max-w-sm">
            <p className="text-slate-400 text-sm leading-relaxed">
              {medianIntrinsicValue === null
                ? "Waiting on Monte Carlo simulation to compute intrinsic value."
                : meetsTargetCushion
                ? `Current price ($${currentPrice.toFixed(2)}) sits below the MOS-adjusted intrinsic value ($${adjustedIntrinsicValue.toFixed(2)}) — even after discounting for model uncertainty, the price looks attractive.`
                : currentDiscount >= 0
                ? `Current price is below raw intrinsic value but hasn't cleared your ${marginOfSafety}% cushion. Adjusted intrinsic value: $${adjustedIntrinsicValue.toFixed(2)}.`
                : `Current price exceeds raw intrinsic value — no cushion at this price even before applying margin of safety.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function DCF() {
  return (
    <div>
      <PageHeader
        title="DCF Calculator"
        description="Historical FCF trend feeds growth assumptions (or use the pooled ML growth suggestion for US companies), then flows through WACC, 3 scenarios, and Monte Carlo uncertainty — ending in an MOS-adjusted intrinsic value."
      />
      <CompanyStateSelector pageName="dcf">
        {({ companyId, selectedCompany, loadedState, saveState }) => (
          <PersistedDcf
            key={companyId}
            ticker={selectedCompany?.ticker}
            loadedState={loadedState}
            saveState={saveState}
          />
        )}
      </CompanyStateSelector>
    </div>
  );
}


function PersistedDcf({ loadedState, saveState, ticker }) {
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
    />
  );
}
