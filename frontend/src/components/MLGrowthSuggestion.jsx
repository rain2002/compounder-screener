import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const confidenceColor = {
  High: "text-buy",
  Moderate: "text-watch",
  Low: "text-avoid",
  Unavailable: "text-slate-500",
};

export default function MLGrowthSuggestion({ historyYears, totalDebt, cash, totalEquity, onApply }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrediction() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/ml-growth/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historyYears, totalDebt, cash, totalEquity }),
        });
        const data = await res.json();
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPrediction();
    return () => { cancelled = true; };
  }, [historyYears, totalDebt, cash, totalEquity]);

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <p className="text-slate-500 text-xs">Checking pooled ML growth model...</p>
      </div>
    );
  }

  if (!result || result.confidence === "Unavailable") {
    return (
      <div className="card p-6 mb-6 border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="dcf" size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            ML Growth Suggestion (Unavailable)
          </h3>
        </div>
        <p className="text-slate-500 text-xs">
          {result?.distribution_note || "Pooled US FCF-growth models aren't trained yet, or the backend can't reach them."}
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6 border-2 border-accent/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon name="dcf" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            ML Growth Suggestion (Pooled US Model)
          </h3>
        </div>
        <span className={`text-xs font-semibold ${confidenceColor[result.confidence]}`}>
          {result.confidence} Confidence
        </span>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Trained on 1,100+ US non-financial companies' historical fundamentals to predict next-year
        FCF growth. This is a reference suggestion, not an override -- your guardrailed growth
        assumption above still drives the DCF unless you manually apply this.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ridge</p>
          <p className="stat-value text-lg text-slate-200">
            {result.ridge_growth !== null ? `${result.ridge_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Random Forest</p>
          <p className="stat-value text-lg text-slate-200">
            {result.rf_growth !== null ? `${result.rf_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">XGBoost</p>
          <p className="stat-value text-lg text-slate-200">
            {result.xgb_growth !== null ? `${result.xgb_growth.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ensemble (weighted)</p>
          <p className="stat-value text-lg text-accent2">{result.ensemble_growth.toFixed(1)}%</p>
        </div>
      </div>

      {result.distribution_note && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-caution/10 border border-caution/30">
          <Icon name="warn" size={14} className="text-caution shrink-0" />
          <p className="text-caution text-xs">{result.distribution_note}</p>
        </div>
      )}

      <button
        onClick={() => onApply(result.ensemble_growth)}
        className="text-xs px-3 py-1.5 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors font-medium"
      >
        Apply ensemble ({result.ensemble_growth.toFixed(1)}%) to Normal growth
      </button>
    </div>
  );
}
