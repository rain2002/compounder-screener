import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import RatingBadge from "../components/RatingBadge.jsx";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setError(e.message));
    api.screenerResults().then(setResults).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <p className="text-slate-400 text-sm mb-6">
        Aggregates Buffett+Lynch quant score, sentiment trend, DCF margin of safety, and variance
        width into one Buy/Watch/Caution/Avoid rating per stock. Full aggregation logic lands in
        Phase 7 — this page currently mirrors live screener results as a starting summary.
      </p>

      <div className="flex gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex-1">
          <p className="text-slate-400 text-xs">Backend Status</p>
          <p className={`text-lg font-bold mt-1 ${health ? "text-buy" : "text-avoid"}`}>
            {health ? `${health.status} (${health.environment})` : error ? "Unreachable" : "Checking..."}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex-1">
          <p className="text-slate-400 text-xs">DB Connected</p>
          <p className={`text-lg font-bold mt-1 ${health?.db_connected ? "text-buy" : "text-avoid"}`}>
            {health ? (health.db_connected ? "Yes" : "No") : "—"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex-1">
          <p className="text-slate-400 text-xs">Screener Results</p>
          <p className="text-lg font-bold mt-1">{results.length}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded p-3 mb-6">
          Can't reach backend at the configured API URL. Start it with{" "}
          <code>uvicorn app.main:app --reload</code> from the backend folder.
        </div>
      )}

      {results.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-4">Ticker</th>
              <th className="py-2 pr-4">Rating</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 10).map((r) => (
              <tr key={r.ticker} className="border-b border-slate-800">
                <td className="py-2 pr-4 font-medium">{r.ticker}</td>
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
