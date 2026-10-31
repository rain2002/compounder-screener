import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const LABEL_STYLES = {
  Positive: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  Negative: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/25", dot: "bg-rose-400" },
  Neutral: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25", dot: "bg-amber-400" },
};

function ExcerptCard({ excerpt }) {
  const normLabel = excerpt.label.charAt(0).toUpperCase() + excerpt.label.slice(1).toLowerCase();
  const style = LABEL_STYLES[normLabel] || LABEL_STYLES.Neutral;
  return (
    <div className={`card p-5 border ${style.border} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span>{normLabel}</span>
        </span>
        <span className="text-[11px] text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 font-medium">
          {(excerpt.score * 100).toFixed(0)}% Confidence
        </span>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed italic">
        "{excerpt.text}"
      </p>
      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-3 pt-3 border-t border-white/[0.06]">
        <span>Source:</span>
        <span className="text-zinc-400 font-medium truncate">{excerpt.source_file}</span>
      </div>
    </div>
  );
}

export default function Sentiment() {
  const [market, setMarket] = useState("US");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompanies();
    setCompanyId("");
    setResult(null);
  }, [market]);

  useEffect(() => {
    if (companyId) fetchCachedResult(companyId);
    else setResult(null);
  }, [companyId]);

  async function fetchCompanies() {
    const res = await fetch(`${BASE_URL}/sentiment/companies/${market}`);
    const data = await res.json();
    setCompanies(Array.isArray(data) ? data : []);
  }

  async function fetchCachedResult(id) {
    const res = await fetch(`${BASE_URL}/sentiment/${id}`);
    const data = await res.json();
    setResult(data);
  }

  async function runAnalysis() {
    if (!companyId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/sentiment/${companyId}/analyze`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCompany = companies.find((c) => String(c.id) === String(companyId));
  const overallStyle = result ? (LABEL_STYLES[result.overall_label] || LABEL_STYLES.Neutral) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="10-K Filing Sentiment Analysis"
        subtitle="FinBERT NLP Transformer"
        description="Sentence-level financial sentiment analysis on uploaded annual reports. Scans MD&amp;A and Risk Factors disclosures to detect tone shifts, hedging, and executive consistency."
      />

      {/* Control Strip */}
      <div className="card p-4 sm:p-5 flex flex-wrap gap-4 items-end justify-between">
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

        <button
          onClick={runAnalysis}
          disabled={!companyId || loading}
          className="btn-primary text-xs disabled:opacity-40"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span>Analyzing 10-K Filings…</span>
            </>
          ) : (
            <span>Run FinBERT Analysis</span>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {error}
        </div>
      )}

      {!companyId && (
        <div className="card p-12 text-center border-dashed border-white/15">
          <h4 className="text-base font-semibold text-zinc-200 mb-1">
            Select a Stock to Inspect 10-K Sentiment
          </h4>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Choose an asset from your active watchlist above to review executive tone trajectories and sentence-level sentiment scores.
          </p>
        </div>
      )}

      {companyId && !result && !loading && (
        <div className="card p-12 text-center border-dashed border-white/15">
          <h4 className="text-base font-semibold text-zinc-200 mb-2">
            No Sentiment Analysis Run Yet
          </h4>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-4 leading-relaxed">
            Upload 10-K annual report PDFs in the Watchlist module, then click "Run FinBERT Analysis" above.
          </p>
          <button onClick={runAnalysis} className="btn-primary text-xs">
            Run Analysis Now
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Overall Score Banner */}
          <div className="card p-6 border border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Composite Tone Score</span>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl sm:text-4xl font-bold tracking-tight ${overallStyle?.text}`}>
                    {result.overall_label}
                  </span>
                  <span className="text-xs font-medium text-zinc-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 tabular-nums">
                    {(result.overall_score * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Total Sentences</span>
                  <span className="text-xl font-bold text-white tabular-nums">{result.sentences_analyzed}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Positive Ratio</span>
                  <span className="text-xl font-bold text-emerald-400 tabular-nums">
                    {result.positive_pct ? `${result.positive_pct.toFixed(0)}%` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Negative Ratio</span>
                  <span className="text-xl font-bold text-rose-400 tabular-nums">
                    {result.negative_pct ? `${result.negative_pct.toFixed(0)}%` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {result.summary && (
              <p className="text-sm text-zinc-300 leading-relaxed pt-5 max-w-3xl">
                {result.summary}
              </p>
            )}
          </div>

          {/* Excerpts Grid */}
          {result.excerpts && result.excerpts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300">
                Key Sentence Excerpts from Filings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.excerpts.map((ex, i) => (
                  <ExcerptCard key={i} excerpt={ex} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
