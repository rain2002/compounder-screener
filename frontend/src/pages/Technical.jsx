import { useState, useMemo, useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import FundamentalsBuilder from "../components/FundamentalsBuilder.jsx";
import GuardrailedForecast from "../components/GuardrailedForecast.jsx";
import FundamentalsChart from "../components/FundamentalsChart.jsx";
import CompanyStateSelector from "../components/CompanyStateSelector.jsx";

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

function defaultTechnicalState() {
  return {
    ticker: "AAPL",
    years: defaultFundamentalsYears(),
    selectedMetric: "revenue",
    forecastYears: 5,
    manualOverride: null,
    growthStats: null,
  };
}

function TechnicalCalculator({ initialState, onStateChange }) {
  const s = initialState || defaultTechnicalState();

  const [ticker, setTicker] = useState(s.ticker);
  const [years, setYears] = useState(s.years);
  const [selectedMetric, setSelectedMetric] = useState(s.selectedMetric);
  const [forecastYears, setForecastYears] = useState(s.forecastYears);
  const [manualOverride, setManualOverride] = useState(s.manualOverride);

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

  useEffect(() => {
    onStateChange({ ticker, years, selectedMetric, forecastYears, manualOverride, growthStats });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, years, selectedMetric, forecastYears, manualOverride, growthStats]);

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
        <label className="flex flex-col gap-1.5">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Ticker</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 w-40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>
      </div>

      <FundamentalsBuilder years={years} onYearsChange={setYears} />

      <div className="card p-4 mb-6 flex items-center gap-2 flex-wrap">
        <Icon name="check" size={16} className="text-accent2" />
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide mr-2">
          Forecast Metric
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
          <li>• Growth rate is clipped to −20% to +40% per year — no single outlier year can produce an absurd multi-year compounding forecast.</li>
          <li>• Confidence is derived from the coefficient of variation of historical YoY growth — volatile history automatically lowers trust in the forecast.</li>
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
        description="Fundamental trend analysis across all 3 financial statements, using the ratios Buffett and Lynch both check — ROE, ROIC, Debt/Equity, margins, FCF, and more. Select a company from your Watchlist to save and reload its inputs automatically."
      />
      <CompanyStateSelector pageName="technical">
        {({ companyId, loadedState, saveState }) => (
          <PersistedTechnical key={companyId} loadedState={loadedState} saveState={saveState} />
        )}
      </CompanyStateSelector>
    </div>
  );
}

function PersistedTechnical({ loadedState, saveState }) {
  const debounceRef = useRef(null);

  function handleStateChange(nextState) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveState(nextState), 1200);
  }

  return (
    <TechnicalCalculator
      initialState={loadedState || defaultTechnicalState()}
      onStateChange={handleStateChange}
    />
  );
}
