import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const confidenceColor = {
  High: "text-buy border-buy/30 bg-buy/10",
  Moderate: "text-watch border-watch/30 bg-watch/10",
  Low: "text-avoid border-avoid/30 bg-avoid/10",
  Unavailable: "text-neutral-500 border-white/10 bg-white/5",
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
      <div className="card p-6 mb-8 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          QUERYING POOLED ML GROWTH ENGINE…
        </p>
      </div>
    );
  }

  const ensembleAvailable = result && result.ensemble_growth !== null && result.ensemble_growth !== undefined;

  if (!result || result.confidence === "Unavailable" || !ensembleAvailable) {
    return (
      <div className="card p-6 mb-8 border-dashed border-white/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="section-index text-[10px]">[ 02 // ML ENSEMBLE (STANDBY) ]</span>
        </div>
        <h4 className="font-syne font-bold text-sm text-neutral-300 uppercase mb-2">
          POOLED ML MODEL PREDICTION UNAVAILABLE
        </h4>
        <p className="text-neutral-400 font-sans text-xs max-w-2xl leading-relaxed">
          {result?.distribution_note || "Pooled non-financial growth models are training or awaiting broader financial telemetry. Historical FCF CAGR is currently utilized as the primary baseline."}
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-8 border border-white/15">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-white/5">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ 02 // PREDICTIVE ARCHITECTURE ]</span>
          <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
            MACHINE LEARNING GROWTH ENSEMBLE
          </h3>
        </div>
        <span className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border ${confidenceColor[result.confidence] || "text-neutral-400"}`}>
          ● {result.confidence} CONFIDENCE
        </span>
      </div>

      <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed max-w-3xl">
        Cross-sectional ensemble trained across 1,100+ public corporate filings. Models leverage capital turnover, leverage ratios, and reinvestment rates to estimate forward cash flow velocity.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Ridge Regression</p>
          <p className="font-syne font-bold text-xl text-white">
            {result.ridge_growth !== null && result.ridge_growth !== undefined ? `${result.ridge_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Random Forest</p>
          <p className="font-syne font-bold text-xl text-white">
            {result.rf_growth !== null && result.rf_growth !== undefined ? `${result.rf_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">XGBoost Gradient</p>
          <p className="font-syne font-bold text-xl text-white">
            {result.xgb_growth !== null && result.xgb_growth !== undefined ? `${result.xgb_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/15">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">Ensemble Output</p>
          <p className="font-syne font-bold text-xl text-white">{result.ensemble_growth.toFixed(1)}%</p>
        </div>
      </div>

      {result.distribution_note && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-watch/10 border border-watch/30">
          <Icon name="warn" size={14} className="text-watch shrink-0" />
          <p className="font-mono text-xs text-watch">{result.distribution_note}</p>
        </div>
      )}

      <button
        onClick={() => onApply(result.ensemble_growth)}
        className="neo-btn-primary text-xs py-2 px-5"
      >
        APPLY ENSEMBLE ({result.ensemble_growth.toFixed(1)}%) TO NORMAL SCENARIO
      </button>
    </div>
  );
}
