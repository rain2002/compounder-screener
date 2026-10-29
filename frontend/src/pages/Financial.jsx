import { useState, useMemo, useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import FundamentalsBuilder from "../components/FundamentalsBuilder.jsx";
import GuardrailedForecast from "../components/GuardrailedForecast.jsx";
import FundamentalsChart from "../components/FundamentalsChart.jsx";
import FinancialForecast from "../components/FinancialForecast.jsx";
import CompanyStateSelector from "../components/CompanyStateSelector.jsx";
import MLGrowthSuggestion from "../components/MLGrowthSuggestion.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const MAX_HISTORY_YEARS = 10;

function defaultFundamentalsYears() {
  const startYear = 2016;
  const years = [];
  for (let i = 0; i < 10; i++) {
    const g = Math.pow(1.09, i);
    const revenue = Math.round(3000 * g);
    const ebitda = Math.round(revenue * (0.24 + i * 0.005));
    const ebit = Math.round(revenue * (0.18 + i * 0.004));
    const netIncome = Math.round(revenue * (0.12 + i * 0.003));
    years.push({
      year: String(startYear + i),
      revenue,
      grossProfit: Math.round(revenue * 0.55),
      ebitda,
      ebit,
      interestExpense: Math.round(20 * g),
      netIncome,
      eps: Math.round((netIncome / 500) * 100) / 100,
      totalDebt: Math.round(800 * g * 0.9),
      cash: Math.round(600 * g),
      totalEquity: Math.round(4000 * g),
      currentAssets: Math.round(2200 * g),
      currentLiabilities: Math.round(1100 * g),
      inventory: Math.round(500 * g),
      accountsReceivable: Math.round(450 * g),
      operatingCashFlow: Math.round(netIncome * 1.25),
      capex: Math.round(revenue * 0.09),
    });
  }
  return years;
}

function mapApiYearsToFundamentals(apiYears) {
  return apiYears.map((y) => {
    const revenue = y.revenue ? Math.round(y.revenue / 1e6) : 0;
    const netIncome = y.netIncome ? Math.round(y.netIncome / 1e6) : 0;
    const ebit = y.operatingIncome ? Math.round(y.operatingIncome / 1e6) : 0;
    return {
      year: y.year,
      revenue,
      grossProfit: 0,
      ebitda: ebit,
      ebit,
      interestExpense: 0,
      netIncome,
      eps: y.sharesOutstanding ? Math.round((netIncome * 1e6 / y.sharesOutstanding) * 100) / 100 : 0,
      totalDebt: y.totalDebt ? Math.round(y.totalDebt / 1e6) : 0,
      cash: y.cash ? Math.round(y.cash / 1e6) : 0,
      totalEquity: y.totalEquity ? Math.round(y.totalEquity / 1e6) : 0,
      currentAssets: 0,
      currentLiabilities: 0,
      inventory: 0,
      accountsReceivable: 0,
      operatingCashFlow: y.operatingCashFlow ? Math.round(y.operatingCashFlow / 1e6) : 0,
      capex: y.capex ? Math.round(y.capex / 1e6) : 0,
    };
  });
}

const METRIC_OPTIONS = [
  { key: "revenue", label: "REVENUE" },
  { key: "grossProfit", label: "GROSS PROFIT" },
  { key: "ebitda", label: "EBITDA" },
  { key: "ebit", label: "EBIT" },
  { key: "netIncome", label: "NET INCOME" },
  { key: "operatingCashFlow", label: "OPERATING CASH FLOW" },
];

const GUARDRAILS = { maxGrowthCap: 40, minGrowthFloor: -20 };

function trimLeadingZeros(years, key) {
  const firstRealIndex = years.findIndex((y) => y[key] > 0);
  if (firstRealIndex <= 0) return years;
  return years.slice(firstRealIndex);
}

function computeGrowthStats(years, key) {
  const trimmed = trimLeadingZeros(years, key);
  const rates = [];
  for (let i = 1; i < trimmed.length; i++) {
    const prev = trimmed[i - 1][key];
    const curr = trimmed[i][key];
    if (prev > 0) rates.push(((curr - prev) / prev) * 100);
  }
  if (rates.length < 2) return { mean: 0, std: 0, count: rates.length };
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
  return { mean, std: Math.sqrt(variance), count: rates.length };
}

function defaultScenarios() {
  return {
    conservative: { growth: 5, margins: { grossMargin: 50, ebitdaMargin: 20, ebitMargin: 15, netMargin: 10, ocfMargin: 15 } },
    normal: { growth: 10, margins: { grossMargin: 55, ebitdaMargin: 25, ebitMargin: 19, netMargin: 13, ocfMargin: 18 } },
    optimistic: { growth: 15, margins: { grossMargin: 60, ebitdaMargin: 30, ebitMargin: 23, netMargin: 16, ocfMargin: 22 } },
  };
}

function defaultFinancialState() {
  return {
    ticker: "AAPL",
    years: defaultFundamentalsYears(),
    selectedMetric: "revenue",
    forecastYears: 5,
    manualOverride: null,
    growthStats: null,
    financialForecast: {
      sector: "general",
      scenarios: defaultScenarios(),
      forecastYears: 5,
      fadeFactor: 0.25,
      displayScenario: "normal",
    },
  };
}

function FinancialCalculator({ initialState, onStateChange, ticker }) {
  const s = initialState || defaultFinancialState();
  const ffDefaults = defaultFinancialState().financialForecast;
  const ff = s.financialForecast || ffDefaults;

  const [years, setYears] = useState(s.years);
  const [selectedMetric, setSelectedMetric] = useState(s.selectedMetric);
  const [forecastYears, setForecastYears] = useState(s.forecastYears);
  const [manualOverride, setManualOverride] = useState(s.manualOverride);

  const [ffSector, setFfSector] = useState(ff.sector ?? ffDefaults.sector);
  const [ffScenarios, setFfScenarios] = useState(ff.scenarios ?? ffDefaults.scenarios);
  const [ffForecastYears, setFfForecastYears] = useState(ff.forecastYears ?? ffDefaults.forecastYears);
  const [ffFadeFactor, setFfFadeFactor] = useState(ff.fadeFactor ?? ffDefaults.fadeFactor);
  const [ffDisplayScenario, setFfDisplayScenario] = useState(ff.displayScenario ?? ffDefaults.displayScenario);

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
          setYears(mapApiYearsToFundamentals(data.years.slice(-MAX_HISTORY_YEARS)));
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

  const metricLabel = METRIC_OPTIONS.find((m) => m.key === selectedMetric)?.label;

  const { mean, std, count } = useMemo(() => computeGrowthStats(years, selectedMetric), [years, selectedMetric]);

  const rawGrowth = manualOverride !== null ? manualOverride : mean;
  const guardrailedGrowth = Math.max(GUARDRAILS.minGrowthFloor, Math.min(GUARDRAILS.maxGrowthCap, rawGrowth));

  const volatility = mean !== 0 ? Math.abs(std / mean) : std > 10 ? 2 : 0;
  const confidence = count < 3 ? "Insufficient Data" : volatility < 0.3 ? "High" : volatility < 0.7 ? "Moderate" : "Low";

  const growthStats = useMemo(
    () => ({ mean, std, guardrailedGrowth, confidence, metric: selectedMetric, metricLabel }),
    [mean, std, guardrailedGrowth, confidence, selectedMetric, metricLabel]
  );

  const financialForecast = useMemo(
    () => ({
      sector: ffSector,
      scenarios: ffScenarios,
      forecastYears: ffForecastYears,
      fadeFactor: ffFadeFactor,
      displayScenario: ffDisplayScenario,
      savedAt: new Date().toISOString(),
    }),
    [ffSector, ffScenarios, ffForecastYears, ffFadeFactor, ffDisplayScenario]
  );

  useEffect(() => {
    if (!hydrated) return;
    onStateChange({ ticker, years, selectedMetric, forecastYears, manualOverride, growthStats, financialForecast });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ticker, years, selectedMetric, forecastYears, manualOverride, growthStats, financialForecast]);

  const { forecast, forecastBand } = useMemo(() => {
    const lastValue = years[years.length - 1][selectedMetric];
    const lowGrowth = Math.max(GUARDRAILS.minGrowthFloor, guardrailedGrowth - std);
    const highGrowth = Math.min(GUARDRAILS.maxGrowthCap, guardrailedGrowth + std);
    const f = [];
    const b = [];
    let running = lastValue;
    let runningLow = lastValue;
    let runningHigh = lastValue;
    for (let i = 1; i <= forecastYears; i++) {
      running = running * (1 + guardrailedGrowth / 100);
      runningLow = runningLow * (1 + lowGrowth / 100);
      runningHigh = runningHigh * (1 + highGrowth / 100);
      f.push({ year: i, value: running });
      b.push({ year: i, low: runningLow, high: runningHigh });
    }
    return { forecast: f, forecastBand: b };
  }, [years, selectedMetric, guardrailedGrowth, std, forecastYears]);

  return (
    <div className="space-y-8">
      {!hydrated && (
        <div className="card p-4 text-neutral-400 font-mono text-xs">
          SYNCING AUDITED FINANCIAL STATEMENTS FROM EDGAR…
        </div>
      )}

      {/* Target Asset Banner */}
      <div className="card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ CURRENT ASSET SYMBOL ]</span>
          <p className="font-syne font-extrabold text-4xl text-white tracking-tight">{ticker || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="neo-tag">10 FISCAL YEARS RECORDED</span>
        </div>
      </div>

      <FundamentalsBuilder years={years} onYearsChange={setYears} />

      <FinancialForecast
        years={years}
        sector={ffSector}
        onSectorChange={setFfSector}
        scenarios={ffScenarios}
        onScenariosChange={setFfScenarios}
        forecastYears={ffForecastYears}
        onForecastYearsChange={setFfForecastYears}
        fadeFactor={ffFadeFactor}
        onFadeFactorChange={setFfFadeFactor}
        displayScenario={ffDisplayScenario}
        onDisplayScenarioChange={setFfDisplayScenario}
      />

      {/* Single-Metric Selection Shelf */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 03 // STATISTICAL PROJECTION ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              SINGLE-METRIC DECOMPOSITION
            </h3>
          </div>
          <span className="neo-tag">DISPERSION ENVELOPE</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`font-mono text-xs uppercase px-4 py-2 rounded-full transition-all ${
                selectedMetric === m.key
                  ? "bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  : "border border-white/10 bg-transparent text-neutral-400 hover:text-white hover:border-white/30"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <MLGrowthSuggestion
        historyYears={years}
        totalDebt={0}
        cash={0}
        totalEquity={0}
        targetMetric={selectedMetric}
        onApply={(g) => setManualOverride(g)}
      />

      <FundamentalsChart
        years={years}
        metricKey={selectedMetric}
        metricLabel={metricLabel}
        forecast={forecast}
        forecastBand={forecastBand}
      />

      <GuardrailedForecast
        years={years}
        metricKey={selectedMetric}
        metricLabel={metricLabel}
        forecastYears={forecastYears}
        onForecastYearsChange={setForecastYears}
      />

      {/* Methodological Guardrails Footer */}
      <div className="card p-6 sm:p-8 border border-white/15">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-white" />
          <h3 className="font-syne font-extrabold text-lg text-white uppercase tracking-tight">
            METHODOLOGICAL GUARDRAILS &amp; CONSTRAINTS
          </h3>
        </div>
        <ul className="text-neutral-400 font-sans text-xs space-y-2.5 leading-relaxed">
          <li>• <strong className="text-white">EDGAR Ingestion:</strong> Revenue, Operating Income (EBIT), Net Income, Operating Cash Flow, and CapEx are ingested from SEC filings across up to 10 reporting periods.</li>
          <li>• <strong className="text-white">Asymptotic Deceleration:</strong> Topline growth is computed via weighted multi-cycle CAGRs and decayed toward a statutory steady state using exponential fading.</li>
          <li>• <strong className="text-white">Volatility Bounds:</strong> Single-metric velocity is bounded between −20% and +40% per year to eliminate anomalous non-operating windfall distortion.</li>
          <li>• <strong className="text-white">Minimum History Requirement:</strong> Entities with fewer than 3 reporting years produce an "Insufficient Data" flag to prevent spurious confidence scores.</li>
          <li>• <strong className="text-white">Widening Confidence Envelopes:</strong> Dispersion spreads naturally expand as the forecast horizon extends, enforcing discipline against false distant precision.</li>
        </ul>
      </div>
    </div>
  );
}

export default function Financial() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="FINANCIAL ANALYSIS"
        subtitle="10-Yr Statement Telemetry"
        description="Rule-based pro forma statement generator combining weighted revenue CAGR, margin scenario matrices, and asymptotic growth decay with Buffett & Lynch quality metrics."
      />
      <CompanyStateSelector pageName="financial">
        {({ companyId, selectedCompany, loadedState, saveState }) => (
          <PersistedFinancial
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

function PersistedFinancial({ loadedState, saveState, ticker }) {
  const debounceRef = useRef(null);

  function handleStateChange(nextState) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveState(nextState), 1200);
  }

  return (
    <FinancialCalculator
      initialState={loadedState || null}
      onStateChange={handleStateChange}
      ticker={ticker}
    />
  );
}
