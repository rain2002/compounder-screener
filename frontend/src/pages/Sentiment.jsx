import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const LABEL_STYLES = {
  Positive: { bg: "bg-[#22c55e]/10", text: "text-[#22c55e]", border: "border-[#22c55e]/30", dot: "bg-[#22c55e]" },
  Negative: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", border: "border-[#ef4444]/30", dot: "bg-[#ef4444]" },
  Neutral: { bg: "bg-[#eab308]/10", text: "text-[#eab308]", border: "border-[#eab308]/30", dot: "bg-[#eab308]" },
};

function ExcerptCard({ excerpt }) {
  const normLabel = excerpt.label.charAt(0).toUpperCase() + excerpt.label.slice(1).toLowerCase();
  const style = LABEL_STYLES[normLabel] || LABEL_STYLES.Neutral;
  return (
    <div className={`card p-6 bg-[#111111] border ${style.border} transition-all`}>
      <div className="flex items-center justify-between mb-3 font-mono">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          [ {normLabel} ]
        </span>
        <span className="text-[11px] text-neutral-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
          {(excerpt.score * 100).toFixed(0)}% CONFIDENCE
        </span>
      </div>
      <p className="text-sm text-neutral-200 leading-relaxed font-sans italic">
        "{excerpt.text}"
      </p>
      <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500 mt-4 pt-3 border-t border-white/[0.06]">
        <span className="uppercase">SOURCE:</span>
        <span className="text-neutral-300">{excerpt.source_file}</span>
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
    <div className="space-y-10">
      <PageHeader
        title="SENTIMENT"
        subtitle="05 // 10-K NLP ANALYSIS"
        description="FinBERT sentence-level polarity scoring on uploaded annual reports. Scans MD&A and Risk Factors to detect tone shifts, management hesitation, and consistency across filings."
      />

      {/* Neozen Control Strip */}
      <div className="flex flex-wrap gap-4 items-end p-4 rounded-xl bg-[#111111] border border-white/10">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">MARKET</span>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-3.5 py-2 font-mono text-sm text-white focus:outline-none focus:border-white"
          >
            <option value="US">US EQUITIES</option>
            <option value="India">INDIA EQUITIES</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">TARGET COMPANY</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-3.5 py-2 font-mono text-sm text-white min-w-[260px] focus:outline-none focus:border-white"
          >
            <option value="">Select target company…</option>
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
          className="neo-btn-primary h-10"
        >
          {loading ? (
            <>
              <Icon name="refresh" size={13} className="animate-spin" />
              <span>RUNNING FINBERT…</span>
            </>
          ) : result ? (
            <>
              <Icon name="refresh" size={13} />
              <span>RE-ANALYZE FILINGS</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" size={13} />
              <span>ANALYZE FILINGS</span>
            </>
          )}
        </button>
      </div>

      {selectedCompany && selectedCompany.filings_count === 0 && (
        <div className="card border-[#eab308]/30 bg-[#eab308]/10 p-5 rounded-xl flex items-center gap-3">
          <Icon name="warn" size={16} className="text-[#eab308] shrink-0" />
          <p className="font-mono text-xs text-[#eab308]">
            No annual reports uploaded for this company. Add 10-K filings on the Watchlist page first.
          </p>
        </div>
      )}

      {error && (
        <div className="card border-[#ef4444]/30 bg-[#ef4444]/10 p-5 rounded-xl font-mono text-xs text-[#ef4444]">
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-12 text-center bg-[#111111] border border-white/10 space-y-4 font-mono">
          <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/20 animate-spin mx-auto" />
          <h4 className="font-syne font-bold text-lg uppercase text-white">RUNNING TRANSFORMER MODEL</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Extracting management disclosure statements and generating multi-year polarity tensors…
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-8">
          {/* Overall Sentiment Glass Card */}
          <div className={`card p-8 bg-[#111111] border ${overallStyle.border}`}>
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">
                  [ OVERALL FILING TONE ]
                </span>
                <p className={`font-syne font-extrabold text-4xl sm:text-5xl uppercase tracking-tight ${overallStyle.text}`}>
                  {result.overall_label}
                </p>
                <p className="font-mono text-xs text-neutral-400 mt-2">
                  SCORE: <strong className="text-white">{result.overall_score.toFixed(2)}</strong> • {result.filings_analyzed} FILING(S) PROCESSED
                </p>
              </div>

              {/* Three Stat Cards */}
              <div className="flex gap-4">
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-center min-w-[90px]">
                  <p className="font-syne font-extrabold text-2xl text-[#22c55e]">{result.positive_pct}%</p>
                  <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mt-1">POSITIVE</p>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-center min-w-[90px]">
                  <p className="font-syne font-extrabold text-2xl text-[#eab308]">{result.neutral_pct}%</p>
                  <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mt-1">NEUTRAL</p>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-center min-w-[90px]">
                  <p className="font-syne font-extrabold text-2xl text-[#ef4444]">{result.negative_pct}%</p>
                  <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mt-1">NEGATIVE</p>
                </div>
              </div>
            </div>

            {/* Tri-color Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex mt-8 bg-white/10">
              <div className="bg-[#22c55e] h-full" style={{ width: `${result.positive_pct}%` }} />
              <div className="bg-[#eab308] h-full" style={{ width: `${result.neutral_pct}%` }} />
              <div className="bg-[#ef4444] h-full" style={{ width: `${result.negative_pct}%` }} />
            </div>
          </div>

          {/* Highlighted Excerpts */}
          <div className="space-y-4">
            <span className="section-index">[ KEY DISCLOSURE STATEMENTS ]</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.excerpts.map((excerpt, idx) => (
                <ExcerptCard key={idx} excerpt={excerpt} />
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && companyId && !error && (
        <div className="card p-12 text-center bg-[#111111] border border-white/10 space-y-3 font-mono">
          <Icon name="sentiment" size={22} className="text-neutral-500 mx-auto" />
          <h4 className="font-syne font-bold text-base text-white uppercase">No Sentiment Computed</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Click "Analyze Filings" above to run FinBERT on this company’s uploaded reports.
          </p>
        </div>
      )}
    </div>
  );
}
