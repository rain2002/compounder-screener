import { useMemo, useState, useEffect } from "react";
import EditableField from "./EditableField.jsx";
import Icon from "./Icon.jsx";

function randNormal(mean, std) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function percentile(sorted, p) {
  if (!sorted || sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function runSimulation({ fcf, growthMean, growthStd, waccMean, waccStd, terminalGrowth, shares, trials, years = 5 }) {
  const results = [];
  if (fcf && shares) {
    for (let t = 0; t < trials; t++) {
      const g = randNormal(growthMean, growthStd);
      const w = Math.max(0.5, randNormal(waccMean, waccStd));
      if (w <= terminalGrowth) continue;
      let pv = 0;
      let cf = fcf;
      for (let y = 1; y <= years; y++) {
        cf = cf * (1 + g / 100);
        pv += cf / Math.pow(1 + w / 100, y);
      }
      const terminalValue = (cf * (1 + terminalGrowth / 100)) / (w / 100 - terminalGrowth / 100);
      const pvTerminal = terminalValue / Math.pow(1 + w / 100, years);
      const total = pv + pvTerminal;
      results.push(total / shares);
    }
  }
  results.sort((a, b) => a - b);
  return {
    p10: percentile(results, 0.1),
    p50: percentile(results, 0.5),
    p90: percentile(results, 0.9),
    all: results,
  };
}

export default function MonteCarloDCF({
  market = "US",
  fcf,
  waccMean,
  terminalGrowth,
  shares,
  growthMean,
  currentPrice,
  onMedianChange,
  onSimulationChange,
}) {
  const cur = market?.toUpperCase() === "INDIA" ? "₹" : "$";
  const [growthStd, setGrowthStd] = useState(4);
  const [waccStd, setWaccStd] = useState(1.5);
  const [trials, setTrials] = useState(3000);

  const sim = useMemo(
    () =>
      runSimulation({
        fcf,
        growthMean,
        growthStd,
        waccMean,
        waccStd,
        terminalGrowth,
        shares,
        trials,
      }),
    [fcf, growthMean, growthStd, waccMean, waccStd, terminalGrowth, shares, trials]
  );

  const hasResults = sim.p10 !== null && sim.p50 !== null && sim.p90 !== null;
  const spreadWidth = hasResults ? sim.p90 - sim.p10 : 0;
  const relativeSpread = hasResults && sim.p50 ? (spreadWidth / sim.p50) * 100 : 0;
  const confidence = !hasResults ? "Unavailable" : relativeSpread < 40 ? "High" : relativeSpread < 80 ? "Moderate" : "Low";
  const confidenceColor = !hasResults ? "text-zinc-500" : relativeSpread < 40 ? "text-emerald-400" : relativeSpread < 80 ? "text-amber-400" : "text-rose-400";

  useEffect(() => {
    if (onMedianChange) onMedianChange(hasResults ? sim.p50 : null);
    if (onSimulationChange) {
      onSimulationChange({
        p10: sim.p10,
        p50: sim.p50,
        p90: sim.p90,
        relativeSpread,
        confidence,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.p10, sim.p50, sim.p90, relativeSpread, confidence]);

  const upsideAtMedian = currentPrice && hasResults ? ((sim.p50 - currentPrice) / currentPrice) * 100 : null;

  const minBound = hasResults ? Math.min(sim.p10, currentPrice || sim.p10) * 0.9 : 0;
  const maxBound = hasResults ? Math.max(sim.p90, currentPrice || sim.p90) * 1.1 : 100;
  const range = maxBound - minBound;

  function toPct(val) {
    if (!hasResults || !range) return 0;
    return Math.max(0, Math.min(100, ((val - minBound) / range) * 100));
  }

  const p10Pct = toPct(sim.p10);
  const p50Pct = toPct(sim.p50);
  const p90Pct = toPct(sim.p90);
  const currentPct = currentPrice ? toPct(currentPrice) : null;

  return (
    <div className="card p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-semibold text-white">
            Monte Carlo Uncertainty Distribution
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Runs {trials.toLocaleString()} randomized trials varying growth and WACC to produce a probability curve of intrinsic value.
          </p>
        </div>
        <span className="text-xs font-medium text-zinc-400 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
          {trials.toLocaleString()} Trials
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <EditableField label="Growth Std Dev (σ)" value={growthStd} onChange={setGrowthStd} suffix="%" />
        <EditableField label="WACC Std Dev (σ)" value={waccStd} onChange={setWaccStd} suffix="%" />
        <EditableField label="Simulation Trials" value={trials} onChange={setTrials} step="500" />
      </div>

      {!hasResults && (
        <div className="flex items-center gap-2 mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <Icon name="warn" size={16} className="text-amber-400 shrink-0" />
          <span>
            Base year FCF and shares outstanding must both be non-zero to execute Monte Carlo trials.
          </span>
        </div>
      )}

      {/* Distribution Track */}
      <div className="relative h-11 mb-12 mt-10 rounded-xl bg-zinc-950 border border-white/10 px-4">
        {hasResults && (
          <div
            className="absolute inset-y-1.5 rounded-lg bg-gradient-to-r from-rose-500/20 via-zinc-200/20 to-emerald-500/20 border border-white/10"
            style={{ left: `${p10Pct}%`, width: `${Math.max(1, p90Pct - p10Pct)}%` }}
          />
        )}
        
        {hasResults && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 z-10" style={{ left: `${p10Pct}%` }}>
            <div className="absolute top-full mt-1.5 -translate-x-1/2 text-center w-24">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">P10 (Bear)</p>
              <p className="text-xs font-semibold text-zinc-300 tabular-nums">{cur}{sim.p10.toFixed(2)}</p>
            </div>
          </div>
        )}

        {hasResults && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_8px_rgba(255,255,255,0.7)]" style={{ left: `${p50Pct}%` }}>
            <div className="absolute top-full mt-1.5 -translate-x-1/2 text-center w-24">
              <p className="text-[10px] text-white uppercase tracking-wider font-semibold">Median (P50)</p>
              <p className="text-xs font-bold text-white tabular-nums">{cur}{sim.p50.toFixed(2)}</p>
            </div>
          </div>
        )}

        {hasResults && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10" style={{ left: `${p90Pct}%` }}>
            <div className="absolute top-full mt-1.5 -translate-x-1/2 text-center w-24">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">P90 (Bull)</p>
              <p className="text-xs font-semibold text-emerald-400 tabular-nums">{cur}{sim.p90.toFixed(2)}</p>
            </div>
          </div>
        )}

        {currentPct !== null && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-20" style={{ left: `${currentPct}%` }}>
            <div className="absolute bottom-full mb-1.5 -translate-x-1/2 text-center w-28">
              <p className="text-[10px] text-blue-300 uppercase tracking-wider font-medium">Market Price</p>
              <p className="text-xs font-bold text-white tabular-nums">{cur}{currentPrice != null ? Number(currentPrice).toFixed(2) : "—"}</p>
            </div>
            <div className="absolute top-0 -translate-x-1/2 -mt-1 w-2 h-2 bg-blue-400 rotate-45" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">80% Confidence Interval</p>
          <p className="text-base font-semibold text-zinc-200 tabular-nums">
            {hasResults ? `${cur}${sim.p10.toFixed(2)} – ${cur}${sim.p90.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Median Intrinsic Upside</p>
          <p className={`text-xl font-bold tabular-nums ${upsideAtMedian !== null && upsideAtMedian >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {upsideAtMedian !== null ? `${upsideAtMedian >= 0 ? "+" : ""}${upsideAtMedian.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-white/[0.04] border border-white/10">
          <p className="text-xs text-zinc-300 font-medium mb-1">Forecast Precision</p>
          <p className={`text-xl font-bold ${confidenceColor}`}>{confidence}</p>
        </div>
      </div>
    </div>
  );
}
