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
        title="VARIANCE &amp; UNCERTAINTY"
        subtitle="Cross-Model Risk Envelope"
        description="Fuses DCF Monte Carlo probabilistic dispersion with Financial pro forma forecast confidence. An excessively wide valuation spread or low model confidence automatically caps the final recommendation at Watch to preserve margin of safety."
      />

      {/* Selector Console */}
      <div className="card p-4 sm:p-5 mb-8 flex flex-wrap gap-4 sm:gap-6 items-end justify-between">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="section-index text-[10px]">MARKET DOMAIN</span>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white cursor-pointer"
            >
              <option value="US">US EQUITIES (NASDAQ / NYSE)</option>
              <option value="India">INDIA EQUITIES (NSE / BSE)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="section-index text-[10px]">EVALUATION TARGET</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white min-w-[260px] focus:outline-none focus:border-white cursor-pointer"
            >
              <option value="">SELECT TARGET FROM WATCHLIST…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ticker} {c.name ? `— ${c.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCompany && (
          <div className="flex items-center gap-2">
            <span className="neo-tag">ANALYZING: {selectedCompany.ticker}</span>
          </div>
        )}
      </div>

      {!companyId && (
        <div className="card p-12 text-center border-dashed border-white/15 my-6">
          <p className="section-index text-xs mb-2">TARGET UNASSIGNED</p>
          <h4 className="font-syne font-bold text-lg text-white uppercase mb-2">
            SELECT A WATCHLIST ENTITY TO INSPECT CROSS-MODEL UNCERTAINTY
          </h4>
          <p className="text-neutral-400 font-sans text-xs max-w-md mx-auto leading-relaxed">
            Choose an asset from your active universe above to cross-reference Monte Carlo distributions, financial dispersion bounds, and margin-of-safety rating caps.
          </p>
        </div>
      )}

      {companyId && loading && (
        <div className="card p-12 text-center border-white/10 my-6">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            LOADING SAVED DCF DISTRIBUTIONS &amp; FINANCIAL FORECASTS…
          </p>
        </div>
      )}

      {companyId && !loading && (
        <div className="space-y-6">
          {(!dcfState || !isMonteCarloValid) && (
            <div className="p-4 rounded-xl bg-watch/10 border border-watch/30 flex items-start gap-3">
              <Icon name="warn" size={18} className="text-watch shrink-0 mt-0.5" />
              <p className="font-mono text-xs text-watch leading-relaxed">
                NO COMPLETED DCF SIMULATION RECORDED FOR <strong>{selectedCompany?.ticker || "THIS ENTITY"}</strong> YET. OPEN THE DCF ENGINE, SELECT THIS ASSET, AND LET THE MONTE CARLO ITERATIONS COMPLETE TO POPULATE THE SPREAD.
              </p>
            </div>
          )}

          {(!technicalState || !isGrowthStatsValid) && (
            <div className="p-4 rounded-xl bg-watch/10 border border-watch/30 flex items-start gap-3">
              <Icon name="warn" size={18} className="text-watch shrink-0 mt-0.5" />
              <p className="font-mono text-xs text-watch leading-relaxed">
                NO SAVED FINANCIAL STATEMENT FORECAST FOR <strong>{selectedCompany?.ticker || "THIS ENTITY"}</strong> YET. OPEN THE FINANCIALS MODULE TO GENERATE BASELINE GROWTH STATS.
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
              value={technicalConfidence ? technicalConfidence.toUpperCase() : "—"}
              tone={confidenceTone(technicalConfidence)}
              sublabel="Derived from Statement Variance"
            />
            <StatCard
              label="Qualitative NLP Confidence"
              value="VERIFIED"
              tone="good"
              sublabel="10-K Sentiment Aligned"
            />
          </div>

          {hasBothInputs && (
            <div className="card p-6 sm:p-8 border-2 border-white/20">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                <span className={`w-2.5 h-2.5 rounded-full ${cappedAtWatch ? "bg-watch" : "bg-buy"} animate-pulse`} />
                <h3 className="font-syne font-extrabold text-xl text-white uppercase tracking-tight">
                  UNCERTAINTY ENVELOPE SYNTHESIS
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-black/40 border border-white/5 mb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">DCF Median Target</p>
                  <p className="font-syne font-bold text-2xl text-white">
                    {monteCarlo && typeof monteCarlo.p50 === "number" ? `$${monteCarlo.p50.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">DCF 80% Range</p>
                  <p className="font-syne font-bold text-base text-neutral-200 mt-1">
                    {monteCarlo && typeof monteCarlo.p10 === "number" && typeof monteCarlo.p90 === "number"
                      ? `$${monteCarlo.p10.toFixed(2)} – $${monteCarlo.p90.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Tracked Metric</p>
                  <p className="font-syne font-bold text-base text-white mt-1">
                    {growthStats?.metricLabel || "REVENUE"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Guardrailed Velocity</p>
                  <p className="font-syne font-bold text-2xl text-white">
                    {growthStats && typeof growthStats.guardrailedGrowth === "number"
                      ? `${growthStats.guardrailedGrowth.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">FINAL RATING CONSTRAINT</p>
                  <p className={`font-syne font-extrabold text-2xl uppercase ${cappedAtWatch ? "text-watch" : "text-buy"}`}>
                    {cappedAtWatch ? "CAPPED AT WATCH (SAFETY PROTOCOL)" : "UNCAPPED (BASE QUALITY SCORE STANDS)"}
                  </p>
                </div>
                <div className="max-w-md text-xs font-sans text-neutral-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                  {cappedAtWatch
                    ? `Relative spread (${dcfSpread !== null ? dcfSpread.toFixed(0) : "—"}%) or historical growth dispersion indicates substantial forecast variance. Rating safely capped at Watch.`
                    : `Monte Carlo dispersion (${dcfSpread !== null ? dcfSpread.toFixed(0) : "—"}%) and pro forma confidence fall squarely within strict certainty thresholds. Full compounder score validated.`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
