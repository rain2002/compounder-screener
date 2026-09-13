import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import RatingBadge from "../components/RatingBadge.jsx";

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Screener</h2>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm"
        >
          {RATING_FILTERS.map((r) => (
            <option key={r} value={r}>
              {r || "All ratings"}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded p-3 mb-4">
          {error}. Is the backend running on port 8000? Try{" "}
          <code>uvicorn app.main:app --reload</code> in the backend folder.
        </div>
      )}

      {loading && <p className="text-slate-400">Loading...</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-slate-400">
          No screener results yet — the pipeline hasn't run. Once the finance
          connector sync job populates <code>screener_results</code>, they'll
          show here automatically (auto-refreshes every 24h on weekdays per
          the plan).
        </p>
      )}

      {results.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-4">Ticker</th>
              <th className="py-2 pr-4">Buffett Score</th>
              <th className="py-2 pr-4">Lynch Score</th>
              <th className="py-2 pr-4">Fraud Flag</th>
              <th className="py-2 pr-4">Rating</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.ticker} className="border-b border-slate-800">
                <td className="py-2 pr-4 font-medium">{r.ticker}</td>
                <td className="py-2 pr-4">{r.buffett_score ?? "—"}</td>
                <td className="py-2 pr-4">{r.lynch_score ?? "—"}</td>
                <td className="py-2 pr-4">{r.fraud_flag ? "Yes" : "No"}</td>
                <td className="py-2 pr-4">
                  <RatingBadge rating={r.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
