import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import RatingBadge from "../components/RatingBadge.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

const RATING_FILTERS = ["", "Buy", "Watch", "Caution", "Avoid"];

export default function Screener() {
  const [results, setResults] = useState([]);
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [rating]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.screenerResults(rating || undefined);
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Screener"
        description="Full US + India universe, filtered and ranked through the Buffett quality + Lynch GARP pipeline. Auto-refreshes every 24h on weekdays once the sync job is live."
        action={
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="bg-surface border border-border rounded-lg px-4 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {RATING_FILTERS.map((r) => (
              <option key={r} value={r}>
                {r || "All ratings"}
              </option>
            ))}
          </select>
        }
      />

      {error && (
        <div className="card border-avoid/30 bg-avoid/5 p-4 mb-6 flex items-start gap-3">
          <Icon name="warn" className="w-5 h-5 text-avoid shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">
            {error}. Is the backend running on port 8000?
          </p>
        </div>
      )}

      {loading && (
        <div className="card p-10 text-center">
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-400 text-sm mb-1">No screener results yet</p>
          <p className="text-slate-600 text-xs">
            The pipeline hasn't run. Once <code className="bg-black/30 px-1 rounded">screener_results</code> populates, they'll show here.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
                <th className="px-6 py-3 font-medium">Ticker</th>
                <th className="px-6 py-3 font-medium">Buffett Score</th>
                <th className="px-6 py-3 font-medium">Lynch Score</th>
                <th className="px-6 py-3 font-medium">Fraud Flag</th>
                <th className="px-6 py-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.ticker} className={`border-b border-border/40 last:border-0 hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}>
                  <td className="px-6 py-3.5 font-semibold text-slate-100">{r.ticker}</td>
                  <td className="px-6 py-3.5 text-slate-300 tabular-nums">{r.buffett_score ?? "—"}</td>
                  <td className="px-6 py-3.5 text-slate-300 tabular-nums">{r.lynch_score ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    {r.fraud_flag ? (
                      <span className="text-avoid text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-500 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <RatingBadge rating={r.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
