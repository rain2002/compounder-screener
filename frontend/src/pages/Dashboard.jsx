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
    <div className="space-y-16">
      {/* 1. Neozen Hero Section */}
      <section className="space-y-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4">
          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>01 // QUANTITATIVE ARCHITECTURE</span>
            </span>

            <h1 className="font-syne text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white leading-none">
              COMPOUNDER. <br />
              <span className="text-neutral-500">PRECISION VALUATION SUITE.</span>
            </h1>

            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl font-sans pt-1">
              Synthesizes Buffett+Lynch quality scores, SEC 10-K transformer NLP sentiment, DCF margin of safety, and Monte Carlo variance into one definitive rating per stock.
            </p>
          </div>

          {/* Quick Action Block (Neozen Style) */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="card p-4 min-w-[220px] bg-[#111111] border border-white/10 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">ENGINE STATUS</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${health ? "bg-[#22c55e]" : "bg-[#ef4444]"} animate-pulse`} />
                  <span className="font-syne font-bold text-sm text-white">
                    {health ? "FASTAPI + DB ONLINE" : "OFFLINE"}
                  </span>
                </div>
              </div>
              <Link to="/dcf" className="neo-btn-ghost text-[10px] px-3 py-1.5">
                <span>DCF</span>
                <Icon name="arrowRight" size={11} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Backend Error Alert */}
      {error && (
        <div className="card border-[#ef4444]/40 bg-[#ef4444]/10 p-5 flex items-start gap-4">
          <Icon name="warn" size={18} className="text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-syne font-bold text-sm text-[#ef4444] uppercase tracking-wide">Backend Disconnected</p>
            <p className="font-mono text-xs text-neutral-400 mt-1">
              FastAPI is offline on http://localhost:8000. Launch via start.bat or scripts/start_app.ps1.
            </p>
          </div>
        </div>
      )}

      {/* 2. Neozen Telemetry Counter Stats */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="section-index">[ 02 // ENGINE TELEMETRY ]</span>
          <span className="font-mono text-xs text-neutral-500">REAL-TIME MONITOR</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Backend Engine"
            value={health ? "ONLINE" : error ? "OFFLINE" : "CHECKING"}
            tone={health ? "good" : error ? "bad" : "neutral"}
            sublabel="PORT 8000 • FASTAPI"
            icon={<Icon name="check" size={15} />}
          />
          <StatCard
            label="Database"
            value={health?.db_connected ? "CONNECTED" : "—"}
            tone={health?.db_connected ? "good" : "bad"}
            sublabel="POSTGRESQL 18"
            icon={<Icon name="bolt" size={15} />}
          />
          <StatCard
            label="Watchlist Analyzed"
            value={results.length}
            sublabel="ACTIVE EQUITIES"
            icon={<Icon name="screener" size={15} />}
          />
          <StatCard
            label="Environment"
            value={health?.environment ? health.environment.toUpperCase() : "DEVELOPMENT"}
            tone="neutral"
            sublabel="AUTO-START ARMED"
            icon={<Icon name="shield" size={15} />}
          />
        </div>
      </section>

      {/* 3. Neozen Core Capabilities Bento Shelf */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="section-index">[ 03 // CORE VALUATION CAPABILITIES ]</span>
          <Link to="/watchlist" className="font-mono text-xs text-neutral-400 hover:text-white uppercase tracking-wider inline-flex items-center gap-1 transition-colors">
            <span>EXPLORE WATCHLIST</span>
            <Icon name="arrowRight" size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: Buffett Quality */}
          <div className="card card-hover p-7 flex flex-col justify-between bg-[#111111] border border-white/10 min-h-[320px]">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block">
                01 // BUFFETT + LYNCH MOAT
              </span>
              <h3 className="font-syne font-extrabold text-2xl uppercase tracking-tight text-white">
                Owner Earnings &amp; High ROE.
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed font-sans">
                Algorithmic screener testing for persistent &gt;20% ROE, zero fraud flags via Beneish M-Score, and capital reinvestment moat.
              </p>
            </div>

            <div className="pt-6">
              <Link to="/watchlist" className="neo-btn-primary w-full justify-between">
                <span>SCREEN WATCHLIST</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>

          {/* Bento Card 2: ML Growth Prediction */}
          <div className="card card-hover p-7 flex flex-col justify-between bg-[#111111] border border-white/10 min-h-[320px]">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block">
                02 // POOLED XGBOOST ENSEMBLE
              </span>
              <h3 className="font-syne font-extrabold text-2xl uppercase tracking-tight text-white">
                Projected FCF Growth Forecast.
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed font-sans">
                Trained on pooled SEC 10-K statements across 3,000+ public equities to predict next-year normalized cash flow growth.
              </p>
            </div>

            <div className="pt-6">
              <Link to="/dcf" className="neo-btn-ghost w-full justify-between">
                <span>RUN DCF MODEL</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>

          {/* Bento Card 3: 10-K NLP Sentiment */}
          <div className="card card-hover p-7 flex flex-col justify-between bg-[#111111] border border-white/10 min-h-[320px]">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block">
                03 // SEC 10-K FINBERT NLP
              </span>
              <h3 className="font-syne font-extrabold text-2xl uppercase tracking-tight text-white">
                Executive Tone Trajectory.
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed font-sans">
                Sentence-level transformer analysis on annual report MD&amp;A sections to uncover managerial risk disclosures and tone shifts.
              </p>
            </div>

            <div className="pt-6">
              <Link to="/sentiment" className="neo-btn-ghost w-full justify-between">
                <span>INSPECT SENTIMENT</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Synthesized Watchlist Ratings Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="section-index">[ 04 // AGGREGATED VALUATION SYNTHESIS ]</span>
          <span className="font-mono text-xs text-neutral-500">
            {results.length} EQUITIES MONITORED
          </span>
        </div>

        {results.length > 0 ? (
          <div className="card overflow-hidden bg-[#111111] border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-neutral-400 font-mono text-[11px] uppercase tracking-wider bg-white/[0.02]">
                    <th className="px-6 py-4 font-semibold">TICKER</th>
                    <th className="px-6 py-4 font-semibold">BASE RATING</th>
                    <th className="px-6 py-4 font-semibold">SENTIMENT</th>
                    <th className="px-6 py-4 font-semibold">DCF MoS</th>
                    <th className="px-6 py-4 font-semibold">VARIANCE CAP</th>
                    <th className="px-6 py-4 font-semibold">FINAL RATING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
                  {results.map((r) => (
                    <tr
                      key={r.ticker}
                      className="hover:bg-white/[0.03] transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-syne font-bold text-base text-white tracking-tight">
                        {r.ticker}
                      </td>
                      <td className="px-6 py-4 text-neutral-300">
                        {r.base_rating}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            r.sentiment === "Positive"
                              ? "text-[#22c55e]"
                              : r.sentiment === "Negative"
                              ? "text-[#ef4444]"
                              : "text-neutral-400"
                          }`}
                        >
                          {r.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.mos_pct !== null ? (
                          <span
                            className={
                              r.mos_pct >= 15
                                ? "text-[#22c55e] font-semibold"
                                : r.mos_pct <= -15
                                ? "text-[#ef4444] font-semibold"
                                : "text-white"
                            }
                          >
                            {r.mos_pct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.capped ? (
                          <span className="text-[#eab308] flex items-center gap-1.5 font-semibold">
                            <Icon name="warn" size={13} /> YES
                          </span>
                        ) : (
                          <span className="text-neutral-500">NO</span>
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
            <div className="card p-12 text-center bg-[#111111] border border-white/10 space-y-4">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">
                [ EMPTY UNIVERSE ]
              </span>
              <h3 className="font-syne font-extrabold text-xl uppercase text-white tracking-tight">
                NO STOCKS IN WATCHLIST YET
              </h3>
              <p className="text-neutral-400 text-xs max-w-sm mx-auto font-sans leading-relaxed">
                Add target equities in the Watchlist module to initiate automated quality scoring and DCF calculations.
              </p>
              <div className="pt-2">
                <Link to="/watchlist" className="neo-btn-primary">
                  <span>ADD STOCKS TO WATCHLIST</span>
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
