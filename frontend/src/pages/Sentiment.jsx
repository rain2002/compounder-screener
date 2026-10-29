import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const LABEL_STYLES = {
  Positive: { bg: "bg-[#30d158]/10", text: "text-[#30d158]", border: "border-[#30d158]/30", dot: "bg-[#30d158]" },
  Negative: { bg: "bg-[#ff453a]/10", text: "text-[#ff453a]", border: "border-[#ff453a]/30", dot: "bg-[#ff453a]" },
  Neutral: { bg: "bg-[#ffd60a]/10", text: "text-[#ffd60a]", border: "border-[#ffd60a]/30", dot: "bg-[#ffd60a]" },
};

function ExcerptCard({ excerpt }) {
  const normLabel = excerpt.label.charAt(0).toUpperCase() + excerpt.label.slice(1).toLowerCase();
  const style = LABEL_STYLES[normLabel] || LABEL_STYLES.Neutral;
  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {normLabel}
        </span>
        <span className="text-[11px] font-semibold text-[#86868b] px-2 py-0.5 rounded-full bg-white/[0.06]">
          {(excerpt.score * 100).toFixed(0)}% confidence
        </span>
      </div>
      <p className="text-sm text-white leading-relaxed font-serif italic">
        “{excerpt.text}”
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-[#86868b] mt-3 pt-2 border-t border-white/[0.06]">
        <span>Source:</span>
        <span className="font-mono text-white/80">{excerpt.source_file}</span>
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
        title="Sentiment Analysis"
        subtitle="Transformer NLP Engine"
        description="FinBERT-powered sentence-level tone scoring of uploaded SEC 10-K and annual report filings. Evaluates executive MD&A tone trajectory, risk phrasing, and managerial transparency."
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
          <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Target Company</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium min-w-[260px] focus:outline-none focus:border-[#2997ff]"
          >
            <option value="">Select a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id} disabled={c.filings_count === 0}>
                {c.ticker} {c.name ? `— ${c.name}` : ""} ({c.filings_count} filings)
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={runAnalysis}
          disabled={!companyId || loading || (selectedCompany && selectedCompany.filings_count === 0)}
          className="apple-btn-white px-6 py-2.5 text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <Icon name="refresh" size={14} className="animate-spin" />
              <span>Running FinBERT…</span>
            </>
          ) : result ? (
            <>
              <Icon name="refresh" size={14} />
              <span>Re-analyze Filings</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" size={14} />
              <span>Analyze Filings</span>
            </>
          )}
        </button>
      </div>

      {selectedCompany && selectedCompany.filings_count === 0 && (
        <div className="card-glass border-[#ffd60a]/30 bg-[#ffd60a]/10 p-5 rounded-2xl flex items-center gap-3">
          <Icon name="warn" size={18} className="text-[#ffd60a] shrink-0" />
          <p className="text-xs text-[#ffd60a] font-medium">
            This company has no annual report PDFs uploaded yet. Upload 10-K filings on the Watchlist page first.
          </p>
        </div>
      )}

      {error && (
        <div className="card-glass border-[#ff453a]/30 bg-[#ff453a]/10 p-5 rounded-2xl text-xs text-[#ff453a] font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="card-glass rounded-3xl p-12 text-center border border-white/[0.08] space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-[#2997ff] border-white/10 animate-spin mx-auto" />
          <h4 className="text-base font-bold text-white">Running FinBERT Transformer Model</h4>
          <p className="text-xs text-[#86868b] max-w-md mx-auto">
            Extracting MD&amp;A sections and calculating multi-dimensional sentiment tensors…
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Overall Sentiment Glass Card */}
          <div className={`card-glass rounded-3xl p-8 border ${overallStyle.border} relative overflow-hidden`}>
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#86868b] block mb-1">
                  OVERALL FILING TONE
                </span>
                <p className={`text-4xl sm:text-5xl font-bold tracking-tight ${overallStyle.text}`}>
                  {result.overall_label}
                </p>
                <p className="text-xs text-[#86868b] mt-2 font-medium">
                  Raw Sentiment Score: <strong className="text-white">{result.overall_score.toFixed(2)}</strong> • {result.filings_analyzed} filing(s) processed • {new Date(result.analyzed_at).toLocaleDateString()}
                </p>
              </div>

              {/* Three Stat Bubbles */}
              <div className="flex gap-4 sm:gap-6">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-[#30d158]">{result.positive_pct}%</p>
                  <p className="text-[10px] text-[#86868b] font-semibold uppercase tracking-wider mt-0.5">Positive</p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-[#ffd60a]">{result.neutral_pct}%</p>
                  <p className="text-[10px] text-[#86868b] font-semibold uppercase tracking-wider mt-0.5">Neutral</p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-[#ff453a]">{result.negative_pct}%</p>
                  <p className="text-[10px] text-[#86868b] font-semibold uppercase tracking-wider mt-0.5">Negative</p>
                </div>
              </div>
            </div>

            {/* Apple Tri-color Pill Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex mt-8 bg-white/[0.05] p-0.5">
              <div className="bg-[#30d158] h-full rounded-l-full transition-all duration-500" style={{ width: `${result.positive_pct}%` }} />
              <div className="bg-[#ffd60a] h-full transition-all duration-500" style={{ width: `${result.neutral_pct}%` }} />
              <div className="bg-[#ff453a] h-full rounded-r-full transition-all duration-500" style={{ width: `${result.negative_pct}%` }} />
            </div>
          </div>

          {/* Highlighted Excerpts */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Highlighted Excerpts. <span className="text-[#86868b]">Strongest sentiment polarity statements.</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.excerpts.map((excerpt, idx) => (
                <ExcerptCard key={idx} excerpt={excerpt} />
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && companyId && !error && (
        <div className="card-glass rounded-3xl p-12 text-center border border-white/[0.08] space-y-3">
          <Icon name="sentiment" size={24} className="text-[#86868b] mx-auto" />
          <h4 className="text-base font-bold text-white">No Sentiment Analysis Computed Yet</h4>
          <p className="text-xs text-[#86868b] max-w-sm mx-auto">
            Click "Analyze Filings" above to run FinBERT on this company’s uploaded reports.
          </p>
        </div>
      )}
    </div>
  );
}
