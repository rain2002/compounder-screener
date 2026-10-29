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
    "Insufficient Data": "text-neutral-400",
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
    <div className="card p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ 03.2 // RISK CONSTRAINTS ]</span>
          <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
            {metricLabel} STATISTICAL FORECAST &amp; ENVELOPE
          </h3>
        </div>
      </div>

      <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed max-w-3xl">
        Applies a −20% floor and +40% ceiling to historical average velocity, guarding against single-year non-recurring windfalls from biasing terminal expectations.
      </p>

      {wasTrimmed && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <Icon name="check" size={14} className="text-white shrink-0" />
          <p className="font-mono text-xs text-neutral-300">
            {years.length - effectiveYears} PRE-FOUNDING ZERO-REPORTING YEARS EXCLUDED. USING {effectiveYears} ACTIVE YEARS.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Historical Mean Growth</p>
          <p className="font-syne font-bold text-xl text-white">{mean.toFixed(1)}%</p>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Growth Std Dev (σ)</p>
          <p className="font-syne font-bold text-xl text-neutral-300">{std.toFixed(1)}%</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/15">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">
            Guardrailed Growth {wasCapped && <span className="text-watch">(CAPPED)</span>}
          </p>
          <p className="font-syne font-bold text-xl text-white">{guardrailedGrowth.toFixed(1)}%</p>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Model Precision Tier</p>
          <p className={`font-syne font-bold text-xl ${confidenceColor}`}>{confidence.toUpperCase()}</p>
        </div>
      </div>

      {wasCapped && (
        <div className="flex items-center gap-2 mb-6 p-4 rounded-xl bg-watch/10 border border-watch/30">
          <Icon name="warn" size={16} className="text-watch shrink-0" />
          <p className="font-mono text-xs text-watch">
            UNCONSTRAINED VELOCITY ({rawForecastGrowth.toFixed(1)}%) EXCEEDED SAFETY GUARDRAILS ({GUARDRAILS.minGrowthFloor}% TO {GUARDRAILS.maxGrowthCap}%) AND WAS AUTOMATICALLY TRUNCATED.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <EditableField
          label="Manual Velocity Override (Blank = Use Historical Mean)"
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
        <table className="w-full text-xs min-w-[540px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-400 sticky left-0 bg-[#111111] z-10">
                PROJECTION TIERS
              </th>
              {forecast.map((f) => (
                <th key={f.year} className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-white">
                  +{f.year} YR
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="px-3 py-2.5 font-mono text-white sticky left-0 bg-[#111111] z-10">
                BASE ESTIMATE
              </td>
              {forecast.map((f, i) => (
                <td key={i} className="px-2 py-2.5 text-center font-mono font-bold text-white">
                  {formatMoney(f.value)}
                </td>
              ))}
            </tr>
            <tr className="bg-white/[0.02]">
              <td className="px-3 py-2.5 font-mono text-neutral-400 sticky left-0 bg-[#111111] z-10">
                UNCERTAINTY ENVELOPE (±1σ)
              </td>
              {forecastBand.map((f, i) => (
                <td key={i} className="px-2 py-2.5 text-center font-mono text-neutral-400">
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
