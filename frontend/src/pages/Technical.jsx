import { useState, useMemo, useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import FundamentalsBuilder from "../components/FundamentalsBuilder.jsx";
import GuardrailedForecast from "../components/GuardrailedForecast.jsx";
import FundamentalsChart from "../components/FundamentalsChart.jsx";
import FinancialForecast from "../components/FinancialForecast.jsx";
import CompanyStateSelector from "../components/CompanyStateSelector.jsx";


const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";


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


// Maps the /companies/{ticker}/financials API response (raw $ values, EDGAR
// field names) into the shape FundamentalsBuilder/FundamentalsChart expect
// ($M values, camelCase names used throughout this page). EBITDA is
// approximated as operatingIncome since EDGAR has no dedicated EBITDA tag --
// flagged in the UI note below so it's not mistaken for a precise figure.
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
  { key: "revenue", label: "Revenue" },
  { key: "grossProfit", label: "Gross Profit" },
  { key: "ebitda", label: "EBITDA" },
  { key: "ebit", label: "EBIT" },
  { key: "netIncome", label: "Net Income" },
  { key: "operatingCashFlow", label: "Operating Cash Flow" },
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


function defaultTechnicalState() {
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


function TechnicalCalculator({ initialState, onStateChange, ticker }) {
  const s = initialState || defaultTechnicalState();
  const ffDefaults = defaultTechnicalState().financialForecast;
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


  // Auto-populate real financials from EDGAR-derived data when this company
  // has no saved Technical inputs yet. Never overwrites existing saved state.
  useEffect(() => {
    if (initialState) return;
    if (!ticker) return;

    fetch(`${BASE_URL}/companies/${ticker}/financials`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.years || data.years.length === 0) return;
        setYears(mapApiYearsToFundamentals(data.years));
      })
      .catch(() => {});
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
    onStateChange({ ticker, years, selectedMetric, forecastYears, manualOverride, growthStats, financialForecast });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, years, selectedMetric, forecastYears, manualOverride, growthStats, financialForecast]);


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
    <div>
      <div className="card p-6 mb-6">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Ticker</p>
        <p className="text-lg font-semibold text-slate-100">{ticker || "—"}</p>
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


      <div className="card p-4 mb-6 flex items-center gap-2 flex-wrap">
        <Icon name="check" size={16} className="text-accent2" />
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide mr-2">
          Single-Metric Forecast (legacy view)
        </span>
        <div className="flex gap-2 flex-wrap">
          {METRIC_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedMetric === m.key
                  ? "bg-accent/20 text-accent2"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>


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


      <div className="card p-6 border-2 border-accent/30">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="warn" size={16} className="text-caution" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Guardrails In Place
          </h3>
        </div>
        <ul className="text-slate-400 text-sm space-y-1.5 leading-relaxed">
          <li>• Revenue, EBIT, Net Income, OCF, and Capex are auto-populated from ingested EDGAR financials when available. Gross Profit, EBITDA, interest expense, and balance-sheet working-capital lines are not in the current extraction — EBITDA shown is approximated as EBIT (operating income) since EDGAR has no dedicated EBITDA tag. Edit any field directly if you have more precise figures.</li>
          <li>• Financial Forecast above blends 3Y/5Y/10Y revenue CAGR, forecasts margins directly (not derived from raw profit growth), and fades growth toward a long-run rate — this is the primary rule-based forecast (Stage 1).</li>
          <li>• The single-metric forecast below is the legacy view: growth rate is clipped to −20% to +40% per year, confidence derived from YoY growth volatility. It still drives the confidence reading used on the Variance page.</li>
          <li>• Fewer than 3 years of history returns "Insufficient Data" instead of a false-confidence number.</li>
          <li>• The ±1σ range widens with forecast horizon, same principle as the DCF Monte Carlo band — further-out years get less certainty, not more.</li>
          <li>• Ratio checklist (ROE, ROIC, Debt/Equity, margins, FCF) flags red/green against the actual thresholds Buffett and Lynch used, not arbitrary cutoffs.</li>
        </ul>
      </div>
    </div>
  );
}


export default function Technical() {
  return (
    <div>
      <PageHeader
        title="Technical Analysis"
        description="Financial Forecast (Stage 1, rule-based) projects Revenue, EBITDA, EBIT, Net Income, and OCF via weighted CAGR + margin scenarios + growth fade. Ratio checklist and legacy single-metric forecast remain below. Select a company from your Watchlist to save and reload its inputs automatically."
      />
      <CompanyStateSelector pageName="technical">
        {({ companyId, selectedCompany, loadedState, saveState }) => (
          <PersistedTechnical
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


function PersistedTechnical({ loadedState, saveState, ticker }) {
  const debounceRef = useRef(null);


  function handleStateChange(nextState) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveState(nextState), 1200);
  }


  return (
    <TechnicalCalculator
      initialState={loadedState || null}
      onStateChange={handleStateChange}
      ticker={ticker}
    />
  );
}
