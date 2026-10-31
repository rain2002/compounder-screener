import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import RatingBadge from "../components/RatingBadge.jsx";
import StatCard from "../components/StatCard.jsx";
import Icon from "../components/Icon.jsx";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.health().then(setHealth).catch((e) => setError(e.message)),
      api.dashboardAggregate().then(setResults).catch((e) => console.error(e)),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-xs font-medium text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Fundamental Equity Research</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Compounder Research Platform
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl pt-1">
              Screen durable businesses with strong economic moats, forecast cash flow velocity with machine learning ensembles, and value equities using Monte Carlo DCF simulations.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/watchlist" className="btn-primary">
              <span>View Watchlist</span>
              <Icon name="arrowRight" size={14} />
            </Link>
            <Link to="/dcf" className="btn-secondary">
              <span>DCF Valuation</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Backend Error Alert */}
      {error && (
        <div className="card border-rose-500/40 bg-rose-500/10 p-5 flex items-start gap-4">
          <Icon name="warn" size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-rose-300">Backend Disconnected</p>
            <p className="text-xs text-zinc-400 mt-1">
              FastAPI is offline on http://localhost:8000. Start services via start.bat in the root folder.
            </p>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Stats */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">System Telemetry</h2>
          <span className="text-xs text-zinc-500">Real-time status</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Backend Engine"
            value={health ? "Online" : error ? "Offline" : "Checking"}
            tone={health ? "good" : error ? "bad" : "neutral"}
            sublabel="FastAPI on Port 8000"
            icon={<Icon name="check" size={15} />}
          />
          <StatCard
            label="Database"
            value={health?.db_connected ? "Connected" : "—"}
            tone={health?.db_connected ? "good" : "bad"}
            sublabel="PostgreSQL Database"
            icon={<Icon name="bolt" size={15} />}
          />
          <StatCard
            label="Monitored Equities"
            value={results.length}
            sublabel="Active Watchlist Assets"
            icon={<Icon name="screener" size={15} />}
          />
          <StatCard
            label="Environment"
            value={health?.environment ? health.environment.toUpperCase() : "Local Dev"}
            tone="neutral"
            sublabel="Silent Boot Armed"
            icon={<Icon name="shield" size={15} />}
          />
        </div>
      </section>

      {/* Core Capabilities Bento */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Core Valuation Methodology</h2>
          <Link to="/watchlist" className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 transition-colors">
            <span>Explore Watchlist</span>
            <Icon name="arrowRight" size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Buffett Quality */}
          <div className="card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Pillar 01
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Buffett Moat &amp; Owner Earnings
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Algorithmic filter checking for sustainable &gt;15% ROIC, 10-year free cash flow generation, conservative debt, and zero accounting manipulation flags via the Beneish M-Score.
              </p>
            </div>

            <div className="pt-6">
              <Link to="/watchlist" className="btn-secondary w-full justify-between">
                <span>Open Watchlist</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>

          {/* Card 2: ML Growth Prediction */}
          <div className="card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Pillar 02
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Machine Learning Growth Ensemble
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Pre-trained cross-sectional ensemble (Ridge, Random Forest, XGBoost) trained across 1,100+ public corporate filings to forecast forward cash flow velocity.
              </p>
            </div>

            <div className="pt-6">
              <Link to="/dcf" className="btn-secondary w-full justify-between">
                <span>Run DCF Model</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>

          {/* Card 3: 10-K NLP Sentiment */}
          <div className="card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Pillar 03
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                10-K FinBERT NLP Sentiment
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Sentence-level transformer analysis on annual report MD&amp;A and Risk Factors sections to uncover executive tone shifts, hedging, and managerial consistency.
              </p>
            </div>

            <div className="pt-6">
              <Link to="/sentiment" className="btn-secondary w-full justify-between">
                <span>Inspect Sentiment</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Watchlist Valuation Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-300">Watchlist Valuation Matrix</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Aggregated ratings synthesized across all pillars</p>
          </div>
          <span className="text-xs text-zinc-500">
            {results.length} equities monitored
          </span>
        </div>

        {results.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-zinc-400 text-xs font-semibold bg-white/[0.02]">
                    <th className="px-6 py-3.5">Ticker</th>
                    <th className="px-6 py-3.5">Base Rating</th>
                    <th className="px-6 py-3.5">10-K Sentiment</th>
                    <th className="px-6 py-3.5">DCF Margin of Safety</th>
                    <th className="px-6 py-3.5">Uncertainty Cap</th>
                    <th className="px-6 py-3.5">Final Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {results.map((r) => (
                    <tr
                      key={r.ticker}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-white">
                        {r.ticker}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {r.base_rating}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            r.sentiment === "Positive"
                              ? "text-emerald-400"
                              : r.sentiment === "Negative"
                              ? "text-rose-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {r.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 tabular-nums">
                        {r.mos_pct !== null ? (
                          <span
                            className={
                              r.mos_pct >= 15
                                ? "text-emerald-400 font-medium"
                                : r.mos_pct <= -15
                                ? "text-rose-400 font-medium"
                                : "text-zinc-200"
                            }
                          >
                            {r.mos_pct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.capped ? (
                          <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                            <Icon name="warn" size={13} /> Capped at Watch
                          </span>
                        ) : (
                          <span className="text-zinc-500">Uncapped</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <RatingBadge rating={r.rating} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !error && !loading && (
            <div className="card p-12 text-center space-y-3">
              <h3 className="text-base font-semibold text-zinc-200">
                No Stocks in Watchlist Yet
              </h3>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                Add target equities in the Watchlist module to begin automated moat scoring, 10-K NLP analysis, and DCF calculations.
              </p>
              <div className="pt-2">
                <Link to="/watchlist" className="btn-primary">
                  <span>Add Stocks to Watchlist</span>
                  <Icon name="arrowRight" size={13} />
                </Link>
              </div>
            </div>
          )
        )}
      </section>
    </div>
  );
}
