import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const LABEL_STYLES = {
  Positive: { bg: "bg-buy/15", text: "text-buy", border: "border-buy/30" },
  Negative: { bg: "bg-avoid/15", text: "text-avoid", border: "border-avoid/30" },
  Neutral: { bg: "bg-watch/15", text: "text-watch", border: "border-watch/30" },
};

function ExcerptCard({ excerpt }) {
  const style = LABEL_STYLES[excerpt.label.charAt(0).toUpperCase() + excerpt.label.slice(1).toLowerCase()] || LABEL_STYLES.Neutral;
  const labelDisplay = excerpt.label.charAt(0).toUpperCase() + excerpt.label.slice(1).toLowerCase();
  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>{labelDisplay}</span>
        <span className="text-xs text-slate-500">{(excerpt.score * 100).toFixed(0)}% confidence</span>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">"{excerpt.text}"</p>
      <p className="text-xs text-slate-500 mt-2">Source: {excerpt.source_file}</p>
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
    <div>
      <PageHeader
        title="Sentiment Analysis"
        description="FinBERT-powered sentiment scoring of uploaded 10-Ks/annual reports. Select a market and company from your Watchlist to analyze tone. Results are cached until the company is removed from the Watchlist."
      />

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Market</span>
          <select value={market} onChange={(e) => setMarket(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm">
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
              <option key={c.id} value={c.id} disabled={c.filings_count === 0}>
                {c.ticker} {c.name ? `- ${c.name}` : ""} ({c.filings_count} filings)
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={runAnalysis}
          disabled={!companyId || loading || (selectedCompany && selectedCompany.filings_count === 0)}
          className="px-4 py-2 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Analyzing..." : result ? "Re-analyze" : "Analyze"}
        </button>
      </div>

      {selectedCompany && selectedCompany.filings_count === 0 && (
        <p className="text-watch text-sm mb-4">This company has no uploaded 10-Ks yet. Upload filings on the Watchlist page first.</p>
      )}

      {error && <p className="text-avoid text-sm mb-4">{error}</p>}

      {loading && (
        <div className="card p-8 text-center text-slate-400 text-sm mb-6">
          Running FinBERT sentiment model on uploaded filings... this can take a bit on first run while the model loads.
        </div>
      )}

      {result && !loading && (
        <>
          <div className={`card p-6 mb-6 border ${overallStyle.border}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Overall Sentiment</p>
                <p className={`text-3xl font-bold ${overallStyle.text}`}>{result.overall_label}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Score {result.overall_score.toFixed(2)} · {result.filings_analyzed} filing(s) analyzed · {new Date(result.analyzed_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-buy">{result.positive_pct}%</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Positive</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-watch">{result.neutral_pct}%</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Neutral</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-avoid">{result.negative_pct}%</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Negative</p>
                </div>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex mt-5 bg-slate-800">
              <div className="bg-buy h-full" style={{ width: `${result.positive_pct}%` }} />
              <div className="bg-watch h-full" style={{ width: `${result.neutral_pct}%` }} />
              <div className="bg-avoid h-full" style={{ width: `${result.negative_pct}%` }} />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Highlighted Excerpts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.excerpts.map((excerpt, idx) => (
              <ExcerptCard key={idx} excerpt={excerpt} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Excerpts show the strongest positive and negative statements FinBERT found. Open the source PDF from the Watchlist page to read the full context.
          </p>
        </>
      )}

      {!result && !loading && companyId && !error && (
        <div className="card p-8 text-center text-slate-400 text-sm">
          No cached sentiment result yet for this company. Click Analyze to run FinBERT on its uploaded filings.
        </div>
      )}
    </div>
  );
}
