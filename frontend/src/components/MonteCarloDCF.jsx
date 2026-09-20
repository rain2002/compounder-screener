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


export default function MonteCarloDCF({ fcf, waccMean, terminalGrowth, shares, growthMean, currentPrice, onMedianChange, onSimulationChange }) {
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
  const confidenceColor = !hasResults ? "text-slate-500" : relativeSpread < 40 ? "text-buy" : relativeSpread < 80 ? "text-watch" : "text-avoid";


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


      {!hasResults && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-caution/10 border border-caution/30">
          <Icon name="warn" size={14} className="text-caution shrink-0" />
          <p className="text-caution text-xs">
            Not enough data to run a simulation — Base Year FCF and Shares Outstanding must both be
            non-zero. Fill in real figures above (or the DCF Inputs section) to see results here.
          </p>
        </div>
      )}


      <div className="relative h-10 mb-3 rounded-lg overflow-hidden bg-black/30">
        <div
          className="absolute inset-y-0 bg-gradient-to-r from-avoid/30 via-watch/30 to-buy/30"
          style={{ left: "5%", right: "5%" }}
        />
        <div className="absolute inset-y-0 w-0.5 bg-accent2" style={{ left: "50%" }} />
      </div>


      <div className="grid grid-cols-5 gap-2 text-center mb-5">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">P10</p>
          <p className="text-sm font-semibold text-avoid">{sim.p10 !== null ? `$${sim.p10.toFixed(2)}` : "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Median (P50)</p>
          <p className="text-sm font-semibold text-accent2">{sim.p50 !== null ? `$${sim.p50.toFixed(2)}` : "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">P90</p>
          <p className="text-sm font-semibold text-buy">{sim.p90 !== null ? `$${sim.p90.toFixed(2)}` : "—"}</p>
        </div>
      </div>


      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">80% Confidence Range</p>
          <p className="text-sm font-semibold text-slate-200">
            {hasResults ? `$${sim.p10.toFixed(2)} – $${sim.p90.toFixed(2)} / share` : "—"}
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
