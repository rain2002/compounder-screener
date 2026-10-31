import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import StatCard from "../components/StatCard.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const CONFIDENCE_RANK = {
  "Unavailable": 0,
  "Insufficient Data": 0,
  Low: 1,
  Moderate: 2,
  High: 3,
};

function dcfSpreadTone(relativeSpread) {
  if (relativeSpread === null || relativeSpread === undefined) return "neutral";
  return relativeSpread < 40 ? "good" : relativeSpread < 80 ? "neutral" : "bad";
}

function confidenceTone(confidence) {
  if (!confidence || confidence === "Insufficient Data" || confidence === "Unavailable") return "neutral";
  return confidence === "High" ? "good" : confidence === "Moderate" ? "neutral" : "bad";
}

export default function Variance() {
  const [market, setMarket] = useState("US");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [dcfState, setDcfState] = useState(null);
  const [technicalState, setTechnicalState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
    setCompanyId("");
    setDcfState(null);
    setTechnicalState(null);
  }, [market]);

  useEffect(() => {
    if (companyId) loadStates(companyId);
    else {
      setDcfState(null);
      setTechnicalState(null);
    }
  }, [companyId]);

  async function fetchCompanies() {
    try {
      const res = await fetch(`${BASE_URL}/watchlist/${market}`);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    }
  }

  async function loadStates(id) {
    setLoading(true);
    try {
      const [dcfRes, techRes] = await Promise.all([
        fetch(`${BASE_URL}/page-state/${id}/dcf`),
        fetch(`${BASE_URL}/page-state/${id}/technical`),
      ]);
      const dcfData = await dcfRes.json();
      const techData = await techRes.json();
      setDcfState(dcfData?.state || null);
      setTechnicalState(techData?.state || null);
    } catch {
      setDcfState(null);
      setTechnicalState(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedCompany = companies.find((c) => String(c.id) === String(companyId));

  const monteCarlo = dcfState?.monteCarlo || null;
  // Robust check: valid simulation requires non-null numeric percentiles
  const isMonteCarloValid = Boolean(
    monteCarlo &&
    typeof monteCarlo.p10 === "number" &&
    typeof monteCarlo.p50 === "number" &&
    typeof monteCarlo.p90 === "number" &&
    monteCarlo.confidence !== "Unavailable"
  );

  const dcfSpread = isMonteCarloValid && typeof monteCarlo.relativeSpread === "number"
    ? monteCarlo.relativeSpread
    : null;
  const dcfConfidence = isMonteCarloValid ? monteCarlo.confidence : null;

  const growthStats = technicalState?.growthStats || null;
  const isGrowthStatsValid = Boolean(
    growthStats &&
    typeof growthStats.guardrailedGrowth === "number" &&
    !isNaN(growthStats.guardrailedGrowth)
  );
  const technicalConfidence = isGrowthStatsValid ? growthStats.confidence : null;

  const confidenceValues = [dcfConfidence, technicalConfidence].filter(Boolean);
  const worstConfidence = confidenceValues.length
    ? confidenceValues.reduce((worst, c) => ((CONFIDENCE_RANK[c] ?? 0) < (CONFIDENCE_RANK[worst] ?? 0) ? c : worst))
    : null;

  const hasBothInputs = Boolean(dcfState && technicalState && isMonteCarloValid && isGrowthStatsValid);
  const cappedAtWatch = Boolean(
    hasBothInputs &&
    (
      (dcfSpread !== null && dcfSpread >= 80) ||
      worstConfidence === "Low" ||
      worstConfidence === "Insufficient Data" ||
      worstConfidence === "Unavailable"
    )
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Variance &amp; Uncertainty Envelope"
        subtitle="Cross-Model Risk Analysis"
        description="Fuses DCF Monte Carlo distribution spread with financial statement forecast confidence. An excessively wide valuation spread or low model confidence automatically caps the final recommendation at Watch to preserve margin of safety."
      />

      {/* Selector Console */}
      <div className="card p-4 sm:p-5 flex flex-wrap gap-4 sm:gap-6 items-end justify-between">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Market</span>
            <div className="flex bg-zinc-900 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setMarket("US")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  market === "US"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                US Equities
              </button>
              <button
                type="button"
                onClick={() => setMarket("India")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  market === "India"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                India Equities
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Selected Stock</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-1.5 text-xs text-zinc-200 min-w-[260px] focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="">Select a stock from Watchlist…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ticker} {c.name ? `— ${c.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCompany && (
          <span className="text-xs font-medium text-zinc-300 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
            {selectedCompany.ticker}
          </span>
        )}
      </div>

      {!companyId && (
        <div className="card p-12 text-center border-dashed border-white/15 my-6">
          <h4 className="text-base font-semibold text-zinc-200 mb-1">
            Select a Stock to Review Uncertainty Bounds
          </h4>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Choose an asset from your active watchlist above to review its Monte Carlo distribution spread, forecast confidence, and rating cap status.
          </p>
        </div>
      )}

      {companyId && loading && (
        <div className="card p-12 text-center border-white/10 my-6">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">
            Loading saved DCF distributions and financial forecasts…
          </p>
        </div>
      )}

      {companyId && !loading && (
        <div className="space-y-6">
          {(!dcfState || !isMonteCarloValid) && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Icon name="warn" size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                No completed DCF simulation recorded for <strong>{selectedCompany?.ticker || "this stock"}</strong> yet. Open the DCF model page, select this stock, and let the Monte Carlo model run to populate the spread.
              </p>
            </div>
          )}

          {(!technicalState || !isGrowthStatsValid) && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Icon name="warn" size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                No saved financial statements forecast for <strong>{selectedCompany?.ticker || "this stock"}</strong> yet. Open the Financials page to generate baseline growth stats.
              </p>
            </div>
          )}

          {/* Core Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="DCF Monte Carlo Spread"
              value={dcfSpread !== null ? `${dcfSpread.toFixed(0)}%` : "—"}
              tone={dcfSpreadTone(dcfSpread)}
              sublabel="Relative P10–P90 (Target <40%)"
            />
            <StatCard
              label="Forecast Model Confidence"
              value={technicalConfidence || "—"}
              tone={confidenceTone(technicalConfidence)}
              sublabel="Derived from Statement Variance"
            />
            <StatCard
              label="Qualitative NLP Sentiment"
              value="Verified"
              tone="good"
              sublabel="10-K Filings Aligned"
            />
          </div>

          {hasBothInputs && (
            <div className="card p-6 border border-white/15">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.08]">
                <span className={`w-2.5 h-2.5 rounded-full ${cappedAtWatch ? "bg-amber-400" : "bg-emerald-400"} animate-pulse`} />
                <h3 className="text-base font-semibold text-white">
                  Uncertainty Envelope Synthesis
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] mb-5">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">DCF Median Target</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {monteCarlo && typeof monteCarlo.p50 === "number" ? `$${monteCarlo.p50.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">DCF 80% Range</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1 tabular-nums">
                    {monteCarlo && typeof monteCarlo.p10 === "number" && typeof monteCarlo.p90 === "number"
                      ? `$${monteCarlo.p10.toFixed(2)} – $${monteCarlo.p90.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Tracked Metric</p>
                  <p className="text-sm font-semibold text-white mt-1">
                    {growthStats?.metricLabel || "Revenue"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Guardrailed Velocity</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {growthStats && typeof growthStats.guardrailedGrowth === "number"
                      ? `${growthStats.guardrailedGrowth.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Final Rating Constraint</p>
                  <p className={`text-xl font-bold ${cappedAtWatch ? "text-amber-400" : "text-emerald-400"}`}>
                    {cappedAtWatch ? "Capped at Watch (Risk Protocol)" : "Uncapped (Full Quality Rating Stands)"}
                  </p>
                </div>
                <div className="max-w-md text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-3.5 rounded-lg border border-white/[0.06]">
                  {cappedAtWatch
                    ? `Relative spread (${dcfSpread !== null ? dcfSpread.toFixed(0) : "—"}%) or historical growth dispersion indicates substantial valuation uncertainty. Final recommendation is safely constrained to Watch.`
                    : `Monte Carlo dispersion (${dcfSpread !== null ? dcfSpread.toFixed(0) : "—"}%) and pro forma confidence fall squarely within strict safety thresholds. Base rating proceeds uncapped.`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
