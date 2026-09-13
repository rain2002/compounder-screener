import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import RatingBadge from "../components/RatingBadge.jsx";
import StatCard from "../components/StatCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

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
      <PageHeader
        title="Dashboard"
        description="Aggregates Buffett+Lynch quant score, sentiment trend, DCF margin of safety, and variance width into one rating per stock. Full aggregation logic lands in Phase 7 — this mirrors live screener data for now."
      />

      <div className="flex gap-4 mb-8 flex-wrap">
        <StatCard
          label="Backend Status"
          value={health ? "Online" : error ? "Offline" : "Checking…"}
          tone={health ? "good" : error ? "bad" : "neutral"}
          icon={<Icon name="check" className={`w-4 h-4 ${health ? "text-buy" : "text-slate-600"}`} />}
        />
        <StatCard
          label="Database"
          value={health?.db_connected ? "Connected" : "—"}
          tone={health?.db_connected ? "good" : "bad"}
        />
        <StatCard label="Screener Results" value={results.length} />
        <StatCard label="Environment" value={health?.environment || "—"} tone="neutral" />
      </div>

      {error && (
        <div className="card border-avoid/30 bg-avoid/5 p-4 mb-6 flex items-start gap-3">
          <Icon name="warn" className="w-5 h-5 text-avoid shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-avoid">Can't reach backend</p>
            <p className="text-slate-400 text-sm mt-0.5">
              Start it with <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">uvicorn app.main:app --reload</code> from the backend folder.
            </p>
          </div>
        </div>
      )}

      {results.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h3 className="font-semibold text-slate-200 text-sm">Recent Screener Results</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Ticker</th>
                <th className="px-6 py-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map((r, i) => (
                <tr key={r.ticker} className={i % 2 === 0 ? "" : "bg-white/[0.02]"}>
                  <td className="px-6 py-3 font-semibold text-slate-100">{r.ticker}</td>
                  <td className="px-6 py-3">
                    <RatingBadge rating={r.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <div className="card p-10 text-center">
            <p className="text-slate-500 text-sm">
              No screener data yet. Once the pipeline runs, results will appear here.
            </p>
          </div>
        )
      )}
    </div>
  );
}
