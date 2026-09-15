import { useMemo, useState, useEffect } from "react";
import EditableField from "./EditableField.jsx";
import Icon from "./Icon.jsx";

function randNormal(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stdDev;
}

function runSimulation({ fcf, growthMean, growthStd, waccMean, waccStd, terminalGrowth, shares, trials = 3000, years = 5 }) {
  const results = [];
  for (let i = 0; i < trials; i++) {
    const g = randNormal(growthMean, growthStd);
    const w = Math.max(randNormal(waccMean, waccStd), terminalGrowth + 0.5);
    let cf = fcf;
    let pv = 0;
    for (let y = 1; y <= years; y++) {
      cf = cf * (1 + g / 100);
      pv += cf / Math.pow(1 + w / 100, y);
    }
    const terminalValue = (cf * (1 + terminalGrowth / 100)) / (w / 100 - terminalGrowth / 100);
    const pvTerminal = terminalValue / Math.pow(1 + w / 100, years);
    const total = pv + pvTerminal;
    if (total > 0 && Number.isFinite(total)) results.push(total / shares);
  }
  results.sort((a, b) => a - b);
  const pct = (p) => results[Math.floor(results.length * p)] || 0;
  return {
    p10: pct(0.1),
    p25: pct(0.25),
    p50: pct(0.5),
    p75: pct(0.75),
    p90: pct(0.9),
    count: results.length,
  };
}

export default function MonteCarloDCF({ fcf, waccMean, terminalGrowth, shares, growthMean, currentPrice, onMedianChange }) {
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

  useEffect(() => {
    if (onMedianChange) onMedianChange(sim.p50);
  }, [sim.p50]);

  const spreadWidth = sim.p90 - sim.p10;
  const relativeSpread = sim.p50 ? (spreadWidth / sim.p50) * 100 : 0;
  const confidence = relativeSpread < 40 ? "High" : relativeSpread < 80 ? "Moderate" : "Low";
  const confidenceColor = relativeSpread < 40 ? "text-buy" : relativeSpread < 80 ? "text-watch" : "text-avoid";

  const upsideAtMedian = currentPrice ? ((sim.p50 - currentPrice) / currentPrice) * 100 : null;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="variance" size={16} className="text-accent2" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Monte Carlo Simulation
        </h3>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        Runs {trials.toLocaleString()} randomized trials varying growth rate and WACC around your
        Normal scenario inputs. This removes single-point-estimate bias — instead of one "confident"
        number, you get a probability-weighted range of outcomes.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <EditableField label="Growth Std Dev" value={growthStd} onChange={setGrowthStd} suffix="%" />
        <EditableField label="WACC Std Dev" value={waccStd} onChange={setWaccStd} suffix="%" />
        <EditableField label="Trials" value={trials} onChange={setTrials} step="500" />
      </div>

      <div className="relative h-10 mb-3 rounded-lg overflow-hidden bg-black/30">
        <div
          className="absolute inset-y-0 bg-gradient-to-r from-avoid/30 via-watch/30 to-buy/30"
          style={{ left: "5%", right: "5%" }}
        />
        <div className="absolute inset-y-0 w-0.5 bg-accent2" style={{ left: "50%" }} />
      </div>

      <div className="grid grid-cols-5 gap-2 text-center mb-5">
        {[
          ["P10", sim.p10],
          ["P25", sim.p25],
          ["P50 (Median)", sim.p50],
          ["P75", sim.p75],
          ["P90", sim.p90],
        ].map(([label, val]) => (
          <div key={label}>
            <p className="text-slate-500 text-xs mb-1">{label}</p>
            <p className={`font-semibold ${label.startsWith("P50") ? "text-accent2 text-base" : "text-slate-300 text-sm"}`}>
              ${val.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">P10–P90 Range</p>
          <p className="text-slate-200 text-sm font-medium">
            ${sim.p10.toFixed(2)} – ${sim.p90.toFixed(2)} / share
          </p>
        </div>
        {upsideAtMedian !== null && (
          <div className="text-right">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Upside at Median</p>
            <p className={`text-sm font-semibold ${upsideAtMedian >= 0 ? "text-buy" : "text-avoid"}`}>
              {upsideAtMedian >= 0 ? "+" : ""}{upsideAtMedian.toFixed(1)}%
            </p>
          </div>
        )}
        <div className="text-right">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Forecast Confidence</p>
          <p className={`text-sm font-semibold ${confidenceColor}`}>{confidence}</p>
        </div>
      </div>
    </div>
  );
}
