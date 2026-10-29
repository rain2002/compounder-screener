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
  const confidenceColor = !hasResults ? "text-neutral-500" : relativeSpread < 40 ? "text-buy" : relativeSpread < 80 ? "text-watch" : "text-avoid";

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
    <div className="card p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ 05 // PROBABILISTIC DCF ]</span>
          <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
            MONTE CARLO UNCERTAINTY DISTRIBUTION
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="neo-tag">
            {trials.toLocaleString()} RANDOMIZED TRIALS
          </span>
        </div>
      </div>

      <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed max-w-3xl">
        Eliminates single-point-estimate bias by varying growth velocity and discount hurdle across a normal distribution. Yields a statistical probability curve (P10–P90) rather than an overly confident static target.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <EditableField label="Growth Std Dev (σ)" value={growthStd} onChange={setGrowthStd} suffix="%" />
        <EditableField label="WACC Std Dev (σ)" value={waccStd} onChange={setWaccStd} suffix="%" />
        <EditableField label="Simulation Trials" value={trials} onChange={setTrials} step="500" />
      </div>

      {!hasResults && (
        <div className="flex items-center gap-2 mb-6 p-4 rounded-xl bg-watch/10 border border-watch/30">
          <Icon name="warn" size={16} className="text-watch shrink-0" />
          <p className="font-mono text-xs text-watch">
            BASE YEAR FCF AND SHARES OUTSTANDING MUST BE POSITIVE TO COMMENCE MONTE CARLO RUN.
          </p>
        </div>
      )}

      {/* Distribution Track */}
      <div className="relative h-12 mb-14 mt-12 rounded-full bg-neutral-900 border border-white/10 px-4">
        {hasResults && (
          <div
            className="absolute inset-y-1.5 rounded-full bg-gradient-to-r from-avoid/30 via-white/20 to-buy/30 border border-white/10"
            style={{ left: `${p10Pct}%`, width: `${Math.max(1, p90Pct - p10Pct)}%` }}
          />
        )}
        
        {hasResults && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-neutral-400 z-10" style={{ left: `${p10Pct}%` }}>
            <div className="absolute top-full mt-2 -translate-x-1/2 text-center w-28">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">P10 (BEAR)</p>
              <p className="font-syne font-bold text-xs text-neutral-300">{cur}{sim.p10.toFixed(2)}</p>
            </div>
          </div>
        )}

        {hasResults && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_12px_rgba(255,255,255,0.8)]" style={{ left: `${p50Pct}%` }}>
            <div className="absolute top-full mt-2 -translate-x-1/2 text-center w-28">
              <p className="font-mono text-[9px] uppercase tracking-widest text-white">MEDIAN (P50)</p>
              <p className="font-syne font-bold text-sm text-white">{cur}{sim.p50.toFixed(2)}</p>
            </div>
          </div>
        )}

        {hasResults && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-buy z-10" style={{ left: `${p90Pct}%` }}>
            <div className="absolute top-full mt-2 -translate-x-1/2 text-center w-28">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">P90 (BULL)</p>
              <p className="font-syne font-bold text-xs text-neutral-300">{cur}{sim.p90.toFixed(2)}</p>
            </div>
          </div>
        )}

        {currentPct !== null && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20" style={{ left: `${currentPct}%` }}>
            <div className="absolute bottom-full mb-2 -translate-x-1/2 text-center w-32">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">MARKET PRICE</p>
              <p className="font-syne font-bold text-xs text-white">{cur}{currentPrice != null ? Number(currentPrice).toFixed(2) : "—"}</p>
            </div>
            <div className="absolute top-0 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-white rotate-45" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/10">
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">80% Confidence Interval</p>
          <p className="font-syne font-bold text-lg text-white">
            {hasResults ? `${cur}${sim.p10.toFixed(2)} – ${cur}${sim.p90.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Median Intrinsic Upside</p>
          <p className={`font-syne font-bold text-2xl ${upsideAtMedian !== null && upsideAtMedian >= 0 ? "text-buy" : "text-avoid"}`}>
            {upsideAtMedian !== null ? `${upsideAtMedian >= 0 ? "+" : ""}${upsideAtMedian.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/15">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">Model Precision Tier</p>
          <p className={`font-syne font-bold text-2xl ${confidenceColor}`}>{confidence.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
