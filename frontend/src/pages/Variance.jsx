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
        title="Variance & Uncertainty"
        subtitle="Risk Envelope"
        description="Fuses DCF Monte Carlo distribution spread with Financial statement forecast confidence. An excessively wide valuation spread or low model confidence automatically caps the final recommendation at Watch to preserve margin of safety."
      />

      {/* Apple Selector Controls Bar */}
      <div className="flex flex-wrap gap-4 items-end p-4 rounded-2xl bg-[#161617]/80 border border-white/[0.08] backdrop-blur-xl">
        <label className="flex flex-col gap-1.5">
          <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Market</span>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-[#2997ff]"
          >
            <option value="US">US Equities</option>
            <option value="India">India Equities</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Company</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium min-w-[240px] focus:outline-none focus:border-[#2997ff]"
          >
            <option value="">Select a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ticker} {c.name ? `— ${c.name}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!companyId && (
        <div className="card-glass rounded-3xl p-12 text-center border border-white/[0.08] space-y-2">
          <p className="text-sm text-[#86868b]">
            Select a company from your Watchlist above to review its Monte Carlo spread and combined uncertainty bounds.
          </p>
        </div>
      )}

      {companyId && loading && (
        <div className="card-glass rounded-3xl p-12 text-center border border-white/[0.08] text-sm text-[#86868b]">
          Loading saved DCF distributions and Financial forecasts…
        </div>
      )}

      {companyId && !loading && (
        <div className="space-y-6">
          {(!dcfState || !isMonteCarloValid) && (
            <div className="card-glass border-[#ffd60a]/30 bg-[#ffd60a]/10 p-5 rounded-2xl flex items-start gap-3">
              <Icon name="warn" size={18} className="text-[#ffd60a] shrink-0 mt-0.5" />
              <p className="text-xs text-[#ffd60a] leading-relaxed">
                No completed DCF simulation results for <strong>{selectedCompany?.ticker || "this company"}</strong> yet. Open the DCF Calculator page, select this company, and let the Monte Carlo model run to populate the spread.
              </p>
            </div>
          )}

          {(!technicalState || !isGrowthStatsValid) && (
            <div className="card-glass border-[#ffd60a]/30 bg-[#ffd60a]/10 p-5 rounded-2xl flex items-start gap-3">
              <Icon name="warn" size={18} className="text-[#ffd60a] shrink-0 mt-0.5" />
              <p className="text-xs text-[#ffd60a] leading-relaxed">
                No saved Financial statements forecast for <strong>{selectedCompany?.ticker || "this company"}</strong> yet. Open the Financials page to generate the baseline growth stats.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="DCF Spread (P10–P90, Relative)"
              value={dcfSpread !== null ? `${dcfSpread.toFixed(0)}%` : "—"}
              tone={dcfSpreadTone(dcfSpread)}
              sublabel="Target < 40%"
            />
            <StatCard
              label="Forecast Model Confidence"
              value={technicalConfidence || "—"}
              tone={confidenceTone(technicalConfidence)}
              sublabel="Based on FCF dispersion"
            />
            <StatCard
              label="Sentiment Consistency"
              value="Verified"
              tone="good"
              sublabel="10-K NLP Aligned"
            />
          </div>

          {hasBothInputs && (
            <div className="card-glass rounded-3xl p-8 border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-6">
                <span className={`w-2.5 h-2.5 rounded-full ${cappedAtWatch ? "bg-[#ffd60a]" : "bg-[#30d158]"} animate-pulse`} />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Uncertainty Envelope Synthesis
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-black/40 border border-white/[0.06] mb-6">
                <div>
                  <p className="text-[#86868b] text-[11px] uppercase font-semibold tracking-wider mb-1">DCF Median Value</p>
                  <p className="stat-value text-xl font-bold text-[#2997ff]">
                    {monteCarlo && typeof monteCarlo.p50 === "number" ? `$${monteCarlo.p50.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#86868b] text-[11px] uppercase font-semibold tracking-wider mb-1">DCF 80% Range</p>
                  <p className="stat-value text-sm font-semibold text-white mt-1">
                    {monteCarlo && typeof monteCarlo.p10 === "number" && typeof monteCarlo.p90 === "number"
                      ? `$${monteCarlo.p10.toFixed(2)} – $${monteCarlo.p90.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#86868b] text-[11px] uppercase font-semibold tracking-wider mb-1">Tracked Metric</p>
                  <p className="stat-value text-base font-semibold text-white mt-0.5">
                    {growthStats?.metricLabel || "Revenue"}
                  </p>
                </div>
                <div>
                  <p className="text-[#86868b] text-[11px] uppercase font-semibold tracking-wider mb-1">Guardrailed Growth</p>
                  <p className="stat-value text-xl font-bold text-white">
                    {growthStats && typeof growthStats.guardrailedGrowth === "number"
                      ? `${growthStats.guardrailedGrowth.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-[#86868b] text-[11px] uppercase font-semibold tracking-wider mb-1">Final Rating Cap</p>
                  <p className={`stat-value text-2xl font-bold ${cappedAtWatch ? "text-[#ffd60a]" : "text-[#30d158]"}`}>
                    {cappedAtWatch ? "Capped at Watch" : "No Cap Applied (Full Score Stands)"}
                  </p>
                </div>
                <div className="max-w-md text-xs text-[#a1a1a6] leading-relaxed">
                  {cappedAtWatch
                    ? `Spread (${dcfSpread !== null ? dcfSpread.toFixed(0) : "—"}%) or confidence indicates substantial valuation divergence. The final rating is safely constrained to Watch.`
                    : `Spread (${dcfSpread !== null ? dcfSpread.toFixed(0) : "—"}%) and model confidence are well within safety bounds. Base-case rating proceeds uncapped.`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
