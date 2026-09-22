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
    api.dashboardAggregate().then(setResults).catch((e) => console.error(e));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Aggregates Buffett+Lynch quant score, sentiment trend, DCF margin of safety, and variance width into one rating per stock. Full aggregation logic (Phase 7) is now live."
      />

      <div className="flex gap-4 mb-8 flex-wrap">
        <StatCard
          label="Backend Status"
          value={health ? "Online" : error ? "Offline" : "Checking…"}
          tone={health ? "good" : error ? "bad" : "neutral"}
          icon={<Icon name="check" size={16} className={health ? "text-buy" : "text-slate-600"} />}
        />
        <StatCard
          label="Database"
          value={health?.db_connected ? "Connected" : "—"}
          tone={health?.db_connected ? "good" : "bad"}
        />
        <StatCard label="Watchlist Analyzed" value={results.length} />
        <StatCard label="Environment" value={health?.environment || "—"} tone="neutral" />
      </div>

      {error && (
        <div className="card border-avoid/30 bg-avoid/5 p-4 mb-6 flex items-start gap-3">
          <Icon name="warn" size={20} className="text-avoid shrink-0 mt-0.5" />
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
            <h3 className="font-semibold text-slate-200 text-sm">Aggregated Watchlist Ratings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Ticker</th>
                  <th className="px-6 py-3 font-medium">Base Rating</th>
                  <th className="px-6 py-3 font-medium">Sentiment</th>
                  <th className="px-6 py-3 font-medium">DCF MoS</th>
                  <th className="px-6 py-3 font-medium">Variance Cap</th>
                  <th className="px-6 py-3 font-medium">Final Rating</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.ticker} className={i % 2 === 0 ? "" : "bg-white/[0.02]"}>
                    <td className="px-6 py-3 font-semibold text-slate-100">{r.ticker}</td>
                    <td className="px-6 py-3 text-slate-400">{r.base_rating}</td>
                    <td className={`px-6 py-3 ${r.sentiment === 'Positive' ? 'text-buy' : r.sentiment === 'Negative' ? 'text-avoid' : 'text-slate-400'}`}>{r.sentiment}</td>
                    <td className="px-6 py-3 text-slate-400">
                      {r.mos_pct !== null ? (
                        <span className={r.mos_pct >= 15 ? "text-buy" : r.mos_pct <= -15 ? "text-avoid" : ""}>
                          {r.mos_pct.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {r.capped ? <span className="text-watch flex items-center gap-1"><Icon name="warn" size={14} /> Yes</span> : "No"}
                    </td>
                    <td className="px-6 py-3">
                      <RatingBadge rating={r.rating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !error && (
          <div className="card p-10 text-center">
            <p className="text-slate-500 text-sm">
              No watchlist data yet. Add companies to the Watchlist to see aggregated ratings.
            </p>
          </div>
        )
      )}
    </div>
  );
}
