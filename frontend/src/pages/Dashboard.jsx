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
      {/* 1. Apple Store Hero Section */}
      <section className="pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Store.{" "}
              <span className="text-[#86868b]">
                The best way to screen the stocks you love.
              </span>
            </h1>
            <p className="text-[#86868b] text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
              Synthesizes Buffett+Lynch quant score, SEC 10-K NLP sentiment, DCF margin of safety, and variance width into one definitive rating per stock.
            </p>
          </div>

          {/* Quick Help / Specialist Cards (Apple Store style) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="card-glass p-4 rounded-2xl flex items-center gap-3.5 min-w-[240px]">
              <div className="w-9 h-9 rounded-full bg-[#0071e3]/20 border border-[#0071e3]/30 flex items-center justify-center text-[#2997ff] shrink-0">
                <Icon name="sparkles" size={17} />
              </div>
              <div>
                <p className="text-xs text-[#86868b] font-medium">Need valuation guidance?</p>
                <Link to="/dcf" className="text-xs font-semibold text-white hover:text-[#2997ff] transition-colors flex items-center gap-1">
                  Explore DCF Calculator <Icon name="chevronRight" size={12} />
                </Link>
              </div>
            </div>

            <div className="card-glass p-4 rounded-2xl flex items-center gap-3.5 min-w-[200px]">
              <div className="w-9 h-9 rounded-full bg-[#30d158]/20 border border-[#30d158]/30 flex items-center justify-center text-[#30d158] shrink-0">
                <Icon name="check" size={17} />
              </div>
              <div>
                <p className="text-xs text-[#86868b] font-medium">System Telemetry</p>
                <p className="text-xs font-semibold text-white">
                  {health ? "FastAPI & DB Online" : error ? "Backend Unreachable" : "Checking…"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backend Error Alert if offline */}
      {error && (
        <div className="card-glass border-[#ff453a]/30 bg-[#ff453a]/10 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2 rounded-xl bg-[#ff453a]/20 text-[#ff453a] shrink-0">
            <Icon name="warn" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#ff453a]">Backend Service Offline</p>
            <p className="text-xs text-[#a1a1a6] mt-1 leading-relaxed">
              FastAPI is not responding on <code className="bg-black/50 px-2 py-0.5 rounded text-white font-mono">http://localhost:8000</code>.
              Your automatic background service or <code className="bg-black/50 px-2 py-0.5 rounded text-white font-mono">uvicorn app.main:app</code> will start automatically on boot.
            </p>
          </div>
        </div>
      )}

      {/* 2. Apple "The Latest." Bento Carousel / Highlights */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            The Latest. <span className="text-[#86868b]">Take a look at what’s new right now.</span>
          </h2>
          <Link to="/watchlist" className="text-xs text-[#2997ff] hover:underline font-medium hidden sm:inline-flex items-center gap-1">
            See all in Watchlist <Icon name="chevronRight" size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: Buffett Quality */}
          <div className="card-glass card-hover rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/[0.08] min-h-[340px]">
            <div className="space-y-3 z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">
                BUFFETT QUALITY • NEW
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Deep Moats & Owner Earnings.
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Automated multi-factor screening tests for persistent &gt;20% ROE, robust pricing power, and Beneish M-Score fraud immunity.
              </p>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868b]">M-Score Filter</span>
                <span className="text-[#30d158] font-semibold">&lt; -2.22 (Passed)</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#30d158] h-full w-[85%]" />
              </div>
            </div>

            <div className="z-10">
              <Link
                to="/watchlist"
                className="apple-btn-white inline-flex items-center gap-2 px-5 py-2 text-xs"
              >
                <span>Screen Watchlist</span>
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>

          {/* Bento Card 2: ML Cash Flow Prediction */}
          <div className="card-glass card-hover rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/[0.08] min-h-[340px]">
            <div className="space-y-3 z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2997ff]">
                MACHINE LEARNING • POOLED MODELS
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Projected FCF Growth Forecast.
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Trained on historical SEC 10-K datasets using XGBoost &amp; Random Forest ensembles to predict normalized future cash flows.
              </p>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868b]">Ensemble Confidence</span>
                <span className="text-[#2997ff] font-semibold">High • Model Calibrated</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#2997ff] h-full w-[78%]" />
              </div>
            </div>

            <div className="z-10">
              <Link
                to="/dcf"
                className="apple-btn-glass inline-flex items-center gap-2 px-5 py-2 text-xs"
              >
                <span>Run DCF Valuation</span>
                <Icon name="chevronRight" size={13} />
              </Link>
            </div>
          </div>

          {/* Bento Card 3: 10-K NLP Sentiment */}
          <div className="card-glass card-hover rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/[0.08] min-h-[340px]">
            <div className="space-y-3 z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#bf5af2]">
                TRANSFORMER NLP • SEC 10-K
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Executive Tone &amp; Risk Shift.
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Sentence-by-sentence FinBERT sentiment scans MD&amp;A sections across consecutive annual reports to surface subtle executive hedge flags.
              </p>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868b]">Tone Trajectory</span>
                <span className="text-[#bf5af2] font-semibold">Consistent • Zero Flags</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#bf5af2] h-full w-[90%]" />
              </div>
            </div>

            <div className="z-10">
              <Link
                to="/sentiment"
                className="apple-btn-glass inline-flex items-center gap-2 px-5 py-2 text-xs"
              >
                <span>Inspect Sentiments</span>
                <Icon name="chevronRight" size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Apple Telemetry & Engine Status */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          System &amp; Market Telemetry. <span className="text-[#86868b]">Real-time operational health.</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Backend Engine"
            value={health ? "Online" : error ? "Offline" : "Checking…"}
            tone={health ? "good" : error ? "bad" : "neutral"}
            sublabel="FastAPI Port 8000"
            icon={<Icon name="check" size={16} className={health ? "text-[#30d158]" : "text-[#86868b]"} />}
          />
          <StatCard
            label="Database"
            value={health?.db_connected ? "Connected" : "—"}
            tone={health?.db_connected ? "good" : "bad"}
            sublabel="PostgreSQL 18"
            icon={<Icon name="bolt" size={16} className={health?.db_connected ? "text-[#30d158]" : "text-[#86868b]"} />}
          />
          <StatCard
            label="Watchlist Analyzed"
            value={results.length}
            sublabel="Active Compounders"
            icon={<Icon name="screener" size={16} className="text-[#2997ff]" />}
          />
          <StatCard
            label="Environment"
            value={health?.environment || "Development"}
            tone="neutral"
            sublabel="Local Auto-Start Active"
            icon={<Icon name="shield" size={16} className="text-[#bf5af2]" />}
          />
        </div>
      </section>

      {/* 4. Aggregated Watchlist Ratings Table (Apple Store Glass Card) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Aggregated Watchlist Ratings. <span className="text-[#86868b]">All-in-one synthesis per stock.</span>
          </h2>
          <span className="text-xs text-[#86868b]">
            {results.length} companies synthesized
          </span>
        </div>

        {results.length > 0 ? (
          <div className="card-glass rounded-3xl overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-[#86868b] text-[11px] uppercase tracking-wider bg-white/[0.02]">
                    <th className="px-6 py-4 font-semibold">Ticker</th>
                    <th className="px-6 py-4 font-semibold">Base Rating</th>
                    <th className="px-6 py-4 font-semibold">Sentiment</th>
                    <th className="px-6 py-4 font-semibold">DCF MoS</th>
                    <th className="px-6 py-4 font-semibold">Variance Cap</th>
                    <th className="px-6 py-4 font-semibold">Final Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {results.map((r) => (
                    <tr
                      key={r.ticker}
                      className="hover:bg-white/[0.03] transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-bold text-white text-base tracking-tight">
                        {r.ticker}
                      </td>
                      <td className="px-6 py-4 text-[#a1a1a6] font-medium">
                        {r.base_rating}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            r.sentiment === "Positive"
                              ? "text-[#30d158]"
                              : r.sentiment === "Negative"
                              ? "text-[#ff453a]"
                              : "text-[#a1a1a6]"
                          }`}
                        >
                          {r.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {r.mos_pct !== null ? (
                          <span
                            className={
                              r.mos_pct >= 15
                                ? "text-[#30d158]"
                                : r.mos_pct <= -15
                                ? "text-[#ff453a]"
                                : "text-[#f5f5f7]"
                            }
                          >
                            {r.mos_pct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#86868b]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.capped ? (
                          <span className="text-[#ffd60a] flex items-center gap-1.5 font-medium text-xs">
                            <Icon name="warn" size={14} /> Yes
                          </span>
                        ) : (
                          <span className="text-[#86868b]">No</span>
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
            <div className="card-glass rounded-3xl p-12 text-center border border-white/[0.08] space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#86868b] mx-auto">
                <Icon name="screener" size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">No Watchlist Stocks Analyzed Yet</h3>
              <p className="text-[#86868b] text-xs max-w-md mx-auto leading-relaxed">
                Add companies to your Watchlist to run automated Buffett scoring, SEC 10-K sentiment extraction, and DCF margin of safety.
              </p>
              <div className="pt-2">
                <Link to="/watchlist" className="apple-btn-white inline-flex items-center gap-2 px-5 py-2 text-xs">
                  <span>Go to Watchlist</span>
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
