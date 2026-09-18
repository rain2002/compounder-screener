import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import StatCard from "../components/StatCard.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const CONFIDENCE_RANK = { "Insufficient Data": 0, Low: 1, Moderate: 2, High: 3 };

function dcfSpreadTone(relativeSpread) {
  if (relativeSpread === null) return "neutral";
  return relativeSpread < 40 ? "good" : relativeSpread < 80 ? "neutral" : "bad";
}

function confidenceTone(confidence) {
  if (!confidence || confidence === "Insufficient Data") return "neutral";
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
      setDcfState(dcfData.state || null);
      setTechnicalState(techData.state || null);
    } catch {
      setDcfState(null);
      setTechnicalState(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedCompany = companies.find((c) => String(c.id) === String(companyId));

  const monteCarlo = dcfState?.monteCarlo || null;
  const dcfSpread = monteCarlo?.relativeSpread ?? null;
  const dcfConfidence = monteCarlo?.confidence ?? null;

  const growthStats = technicalState?.growthStats || null;
  const technicalConfidence = growthStats?.confidence ?? null;

  const sentimentConsistency = null; // Sentiment page has no computed output yet (Phase 5)

  const confidenceValues = [dcfConfidence, technicalConfidence].filter(Boolean);
  const worstConfidence = confidenceValues.length
    ? confidenceValues.reduce((worst, c) => (CONFIDENCE_RANK[c] < CONFIDENCE_RANK[worst] ? c : worst))
    : null;

  const hasBothInputs = dcfState && technicalState && monteCarlo && growthStats;
  const cappedAtWatch = hasBothInputs && (dcfSpread >= 80 || worstConfidence === "Low" || worstConfidence === "Insufficient Data");

  return (
    <div>
      <PageHeader
        title="Variance Analysis"
        description={'Wraps DCF Monte Carlo spread and Technical forecast confidence to measure overall uncertainty. Wide DCF spread or low Technical confidence caps the read at "Watch" regardless of base-case numbers. Sentiment Consistency stays blank until the Sentiment pipeline (Phase 5) is live.'}
      />

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Market</span>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="US">US</option>
            <option value="India">India</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Company</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm min-w-[220px]"
          >
            <option value="">Select a company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.ticker} {c.name ? `- ${c.name}` : ""}</option>
            ))}
          </select>
        </label>
      </div>

      {!companyId && (
        <div className="card p-8 text-center text-slate-400 text-sm mb-6">
          Select a company from your Watchlist above to see its combined DCF + Technical uncertainty read.
        </div>
      )}

      {companyId && loading && (
        <div className="card p-8 text-center text-slate-400 text-sm mb-6">Loading saved DCF and Technical state…</div>
      )}

      {companyId && !loading && (
        <>
          {(!dcfState || !monteCarlo) && (
            <div className="card border-caution/30 bg-caution/5 p-4 mb-6 flex items-start gap-3">
              <Icon name="warn" size={16} className="text-caution shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">
                No saved DCF results for {selectedCompany?.ticker || "this company"} yet. Open the DCF page,
                select this company, and let the Monte Carlo simulation run — its spread will show up here.
              </p>
            </div>
          )}
          {(!technicalState || !growthStats) && (
            <div className="card border-caution/30 bg-caution/5 p-4 mb-6 flex items-start gap-3">
              <Icon name="warn" size={16} className="text-caution shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">
                No saved Technical results for {selectedCompany?.ticker || "this company"} yet. Open the
                Technical page and select this company to generate a forecast confidence reading.
              </p>
            </div>
          )}

          <div className="flex gap-4 flex-wrap mb-6">
            <StatCard
              label="DCF Spread (P10–P90, relative)"
              value={dcfSpread !== null ? `${dcfSpread.toFixed(0)}%` : "—"}
              tone={dcfSpreadTone(dcfSpread)}
            />
            <StatCard
              label="Technical Confidence"
              value={technicalConfidence || "—"}
              tone={confidenceTone(technicalConfidence)}
            />
            <StatCard label="Sentiment Consistency" value="—" tone="neutral" />
          </div>

          {hasBothInputs && (
            <div className="card p-6 border-2 border-accent/30">
              <div className="flex items-center gap-2 mb-4">
                <Icon name={cappedAtWatch ? "warn" : "check"} size={16} className={cappedAtWatch ? "text-caution" : "text-accent2"} />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Uncertainty Read
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">DCF Median Value</p>
                  <p className="stat-value text-lg text-accent2">
                    {monteCarlo?.p50 ? `$${monteCarlo.p50.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">DCF 80% Range</p>
                  <p className="stat-value text-sm text-slate-200">
                    {monteCarlo ? `$${monteCarlo.p10.toFixed(2)} – $${monteCarlo.p90.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                    Technical Metric Tracked
                  </p>
                  <p className="stat-value text-lg text-slate-200">{growthStats?.metricLabel || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                    Guardrailed Growth
                  </p>
                  <p className="stat-value text-lg text-slate-200">
                    {growthStats ? `${growthStats.guardrailedGrowth.toFixed(1)}%` : "—"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Dashboard Rating Cap</p>
                  <p className={`stat-value text-2xl ${cappedAtWatch ? "text-watch" : "text-buy"}`}>
                    {cappedAtWatch ? "Capped at Watch" : "No cap applied"}
                  </p>
                </div>
                <div className="text-right max-w-md">
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {cappedAtWatch
                      ? `Uncertainty is too wide to trust a Buy/Avoid call outright — DCF spread is ${dcfSpread.toFixed(0)}% and/or Technical confidence is "${worstConfidence}". Whatever the base-case score says elsewhere, this stock should show as Watch on the Dashboard until the range narrows.`
                      : `DCF spread (${dcfSpread.toFixed(0)}%) and Technical confidence ("${worstConfidence}") are both within acceptable bounds — the base-case rating from other pages can stand uncapped.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
