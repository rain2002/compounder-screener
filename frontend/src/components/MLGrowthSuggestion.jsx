import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const confidenceColor = {
  High: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10",
  Moderate: "text-amber-400 border-amber-500/25 bg-amber-500/10",
  Low: "text-rose-400 border-rose-500/25 bg-rose-500/10",
  Unavailable: "text-zinc-500 border-white/10 bg-white/5",
};

export default function MLGrowthSuggestion({ historyYears, totalDebt, cash, totalEquity, targetMetric = "fcf", onApply }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/ml-growth/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historyYears, totalDebt, cash, totalEquity, targetMetric }),
        });
        const data = await res.json();
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);

    return () => { 
      cancelled = true; 
      clearTimeout(timer);
    };
  }, [historyYears, totalDebt, cash, totalEquity, targetMetric]);

  if (loading) {
    return (
      <div className="card p-5 mb-6 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-xs text-zinc-400">
          Querying machine learning growth model…
        </p>
      </div>
    );
  }

  const ensembleAvailable = result && result.ensemble_growth !== null && result.ensemble_growth !== undefined;

  if (!result || result.confidence === "Unavailable" || !ensembleAvailable) {
    return (
      <div className="card p-5 mb-6 border-dashed border-white/10">
        <h4 className="text-sm font-semibold text-zinc-300 mb-1">
          ML Growth Suggestion (Standby)
        </h4>
        <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
          {result?.distribution_note || "Cross-sectional growth ensemble model is awaiting broader filings data. Historical FCF CAGR is currently utilized as the primary baseline."}
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-semibold text-white">
            Machine Learning Growth Ensemble
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cross-sectional ensemble trained across 1,100+ public corporate filings.
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${confidenceColor[result.confidence] || "text-zinc-400"}`}>
          {result.confidence} Confidence
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Ridge Regression</p>
          <p className="text-lg font-semibold text-zinc-200 tabular-nums">
            {result.ridge_growth !== null && result.ridge_growth !== undefined ? `${result.ridge_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Random Forest</p>
          <p className="text-lg font-semibold text-zinc-200 tabular-nums">
            {result.rf_growth !== null && result.rf_growth !== undefined ? `${result.rf_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">XGBoost</p>
          <p className="text-lg font-semibold text-zinc-200 tabular-nums">
            {result.xgb_growth !== null && result.xgb_growth !== undefined ? `${result.xgb_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-white/[0.04] border border-white/10">
          <p className="text-xs text-zinc-200 font-medium mb-1">Ensemble Output</p>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">{result.ensemble_growth.toFixed(1)}%</p>
        </div>
      </div>

      {result.distribution_note && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <Icon name="warn" size={14} className="text-amber-400 shrink-0" />
          <span>{result.distribution_note}</span>
        </div>
      )}

      <button
        onClick={() => onApply(result.ensemble_growth)}
        className="btn-primary text-xs"
      >
        Apply Ensemble ({result.ensemble_growth.toFixed(1)}%) to Normal Scenario
      </button>
    </div>
  );
}
