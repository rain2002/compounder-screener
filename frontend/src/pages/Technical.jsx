import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import FundamentalsBuilder from "../components/FundamentalsBuilder.jsx";
import GuardrailedForecast from "../components/GuardrailedForecast.jsx";

function defaultFundamentalsYears() {
  const startYear = 2016;
  const years = [];
  for (let i = 0; i < 10; i++) {
    const growthFactor = Math.pow(1.09, i);
    const revenue = Math.round(3000 * growthFactor);
    years.push({
      year: String(startYear + i),
      revenue,
      ebitda: Math.round(revenue * (0.24 + i * 0.005)),
      ebit: Math.round(revenue * (0.18 + i * 0.004)),
      netProfit: Math.round(revenue * (0.12 + i * 0.003)),
    });
  }
  return years;
}

const METRIC_OPTIONS = [
  { key: "revenue", label: "Revenue" },
  { key: "ebitda", label: "EBITDA" },
  { key: "ebit", label: "EBIT" },
  { key: "netProfit", label: "Net Profit" },
];

export default function Technical() {
  const [ticker, setTicker] = useState("AAPL");
  const [years, setYears] = useState(defaultFundamentalsYears());
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [forecastYears, setForecastYears] = useState(5);

  const metricLabel = METRIC_OPTIONS.find((m) => m.key === selectedMetric)?.label;

  return (
    <div>
      <PageHeader
        title="Technical Analysis"
        description="Fundamental trend analysis across Revenue, EBITDA, EBIT, and Net Profit — historical growth rates feed a guardrailed forecast. Full ML model (Phase 2+) will replace the rule-based growth estimate below with a pooled cross-sectional prediction."
      />

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

      <div className="card p-4 mb-6 flex items-center gap-2">
        <Icon name="check" size={16} className="text-accent2" />
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide mr-2">
          Forecast Metric
        </span>
        <div className="flex gap-2">
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
        </ul>
      </div>
    </div>
  );
}
