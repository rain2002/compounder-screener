import { useState, useMemo } from "react";
import EditableField from "./EditableField.jsx";
import Icon from "./Icon.jsx";
import { formatMoney } from "../utils/units.js";

function trimLeadingZeros(years, key) {
  const firstRealIndex = years.findIndex((y) => y[key] > 0);
  if (firstRealIndex <= 0) return years;
  return years.slice(firstRealIndex);
}

function stdDevOfGrowthRates(years, key) {
  const trimmed = trimLeadingZeros(years, key);
  const rates = [];
  for (let i = 1; i < trimmed.length; i++) {
    const prev = trimmed[i - 1][key];
    const curr = trimmed[i][key];
    if (prev > 0) rates.push(((curr - prev) / prev) * 100);
  }
  if (rates.length < 2) return { mean: 0, std: 0, rates, effectiveYears: trimmed.length, wasTrimmed: trimmed.length < years.length };
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
  return {
    mean,
    std: Math.sqrt(variance),
    rates,
    effectiveYears: trimmed.length,
    wasTrimmed: trimmed.length < years.length,
  };
}

const GUARDRAILS = {
  maxGrowthCap: 40,
  minGrowthFloor: -20,
  maxMarginCap: 60,
};

export default function GuardrailedForecast({ years, metricKey, metricLabel, forecastYears, onForecastYearsChange }) {
  const [manualOverride, setManualOverride] = useState(null);

  const { mean, std, rates, effectiveYears, wasTrimmed } = useMemo(
    () => stdDevOfGrowthRates(years, metricKey),
    [years, metricKey]
  );

  const rawForecastGrowth = manualOverride !== null ? manualOverride : mean;
  const guardrailedGrowth = Math.max(
    GUARDRAILS.minGrowthFloor,
    Math.min(GUARDRAILS.maxGrowthCap, rawForecastGrowth)
  );
  const wasCapped = rawForecastGrowth !== guardrailedGrowth;

  const volatility = mean !== 0 ? Math.abs(std / mean) : std > 10 ? 2 : 0;
  const confidence = rates.length < 3 ? "Insufficient Data" : volatility < 0.3 ? "High" : volatility < 0.7 ? "Moderate" : "Low";
  const confidenceColor = {
    "Insufficient Data": "text-slate-400",
    High: "text-buy",
    Moderate: "text-watch",
    Low: "text-avoid",
  }[confidence];

  const lastValue = years[years.length - 1][metricKey];
  const forecast = [];
  let running = lastValue;
  for (let i = 1; i <= forecastYears; i++) {
    running = running * (1 + guardrailedGrowth / 100);
    forecast.push({ year: i, value: running });
  }

  const lowGrowth = Math.max(GUARDRAILS.minGrowthFloor, guardrailedGrowth - std);
  const highGrowth = Math.min(GUARDRAILS.maxGrowthCap, guardrailedGrowth + std);
  let runningLow = lastValue;
  let runningHigh = lastValue;
  const forecastBand = [];
  for (let i = 1; i <= forecastYears; i++) {
    runningLow = runningLow * (1 + lowGrowth / 100);
    runningHigh = runningHigh * (1 + highGrowth / 100);
    forecastBand.push({ year: i, low: runningLow, high: runningHigh });
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="variance" size={16} className="text-accent2" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          {metricLabel} Forecast (Guardrailed)
        </h3>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        Rule-based stand-in for the pooled ML model (XGBoost/Random Forest, Phase 2+ — requires
        cross-sectional data from many companies, not available from a single company's history).
        Growth rate is the historical mean YoY growth, clipped to sane bounds so a single anomalous
        year can't produce an absurd forecast.
      </p>

      {wasTrimmed && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
          <Icon name="check" size={16} className="text-accent2 shrink-0" />
          <p className="text-accent2 text-xs">
            Detected {years.length - effectiveYears} leading year(s) with zero {metricLabel.toLowerCase()}
            (likely pre-founding or pre-IPO) — excluded from growth calculations. Using {effectiveYears}
            effective years instead of {years.length}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Historical Mean Growth</p>
          <p className="stat-value text-lg text-slate-200">{mean.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Growth Std Dev</p>
          <p className="stat-value text-lg text-slate-200">{std.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
            Guardrailed Growth {wasCapped && <span className="text-caution">(capped)</span>}
          </p>
          <p className="stat-value text-lg text-accent2">{guardrailedGrowth.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Forecast Confidence</p>
          <p className={`stat-value text-lg ${confidenceColor}`}>{confidence}</p>
        </div>
      </div>

      {wasCapped && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-caution/10 border border-caution/30">
          <Icon name="warn" size={16} className="text-caution shrink-0" />
          <p className="text-caution text-xs">
            Raw historical growth ({rawForecastGrowth.toFixed(1)}%) exceeded the guardrail bounds
            ({GUARDRAILS.minGrowthFloor}% to {GUARDRAILS.maxGrowthCap}%) and was clipped. This
            usually means one or two outlier years are skewing the average — check the history
            table above.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-5">
        <EditableField
          label="Override Growth Rate (blank = use historical mean)"
          value={manualOverride !== null ? manualOverride : ""}
          onChange={setManualOverride}
          suffix="%"
        />
        <EditableField
          label="Forecast Horizon"
          value={forecastYears}
          onChange={onForecastYearsChange}
          step="1"
          suffix="years"
        />
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
              <th className="px-2 py-2 font-medium sticky left-0 bg-surface">Year</th>
              {forecast.map((f) => (
                <th key={f.year} className="px-2 py-2 font-medium text-center">
                  +{f.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-2 text-slate-500 text-xs sticky left-0 bg-base">Forecast</td>
              {forecast.map((f, i) => (
                <td key={i} className="px-2 py-2 text-center text-accent2 font-semibold text-xs">
                  {formatMoney(f.value)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-2 text-slate-500 text-xs sticky left-0 bg-base">Range (±1σ)</td>
              {forecastBand.map((f, i) => (
                <td key={i} className="px-2 py-2 text-center text-slate-500 text-xs">
                  {formatMoney(f.low)}–{formatMoney(f.high)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
