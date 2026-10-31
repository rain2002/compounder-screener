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
    "Insufficient Data": "text-zinc-400",
    High: "text-emerald-400",
    Moderate: "text-amber-400",
    Low: "text-rose-400",
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
      <div className="mb-4 pb-3 border-b border-white/[0.06]">
        <h3 className="text-base font-semibold text-white">
          {metricLabel} Guardrailed Forecast
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Clips historical average growth to a −20% floor and +40% ceiling to prevent outlier distortion.
        </p>
      </div>

      {wasTrimmed && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300">
          <Icon name="check" size={14} className="text-emerald-400 shrink-0" />
          <span>
            {years.length - effectiveYears} pre-founding zero-revenue year(s) excluded. Using {effectiveYears} reporting years.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Historical Mean Growth</p>
          <p className="text-lg font-semibold text-zinc-200 tabular-nums">{mean.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Growth Std Dev (σ)</p>
          <p className="text-lg font-semibold text-zinc-300 tabular-nums">{std.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
          <p className="text-xs text-zinc-200 font-medium mb-1">
            Guardrailed Growth {wasCapped && <span className="text-amber-400">(Capped)</span>}
          </p>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">{guardrailedGrowth.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Model Confidence</p>
          <p className={`text-lg font-bold ${confidenceColor}`}>{confidence}</p>
        </div>
      </div>

      {wasCapped && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <Icon name="warn" size={16} className="text-amber-400 shrink-0" />
          <span>
            Raw historical growth ({rawForecastGrowth.toFixed(1)}%) exceeded guardrail bounds ({GUARDRAILS.minGrowthFloor}% to {GUARDRAILS.maxGrowthCap}%) and was clipped.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <EditableField
          label="Manual Growth Rate Override (Blank = Use Historical Mean)"
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
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.02]">
              <th className="px-3 py-2 text-left font-medium sticky left-0 bg-[#111114] z-10">
                Projection Horizon
              </th>
              {forecast.map((f) => (
                <th key={f.year} className="px-2 py-2 text-center text-zinc-200 font-semibold">
                  +{f.year} Yr
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.04]">
              <td className="px-3 py-2 text-zinc-200 sticky left-0 bg-[#111114] z-10 font-medium">
                Baseline Estimate
              </td>
              {forecast.map((f, i) => (
                <td key={i} className="px-2 py-2 text-center font-semibold text-emerald-400 tabular-nums">
                  {formatMoney(f.value)}
                </td>
              ))}
            </tr>
            <tr className="bg-white/[0.02]">
              <td className="px-3 py-2 text-zinc-400 sticky left-0 bg-[#111114] z-10">
                Range (±1σ)
              </td>
              {forecastBand.map((f, i) => (
                <td key={i} className="px-2 py-2 text-center text-zinc-400 tabular-nums">
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
