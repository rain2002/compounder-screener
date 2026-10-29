import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Neozen Architectural Company State Selector
 * Allows switching between US / India equites and company profiles with
 * persistent auto-saving and JetBrains Mono indicators.
 */
export default function CompanyStateSelector({ pageName, children }) {
  const [market, setMarket] = useState("US");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [loadedState, setLoadedState] = useState(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
    setCompanyId("");
    setLoadedState(null);
  }, [market]);

  useEffect(() => {
    if (companyId) {
      setIsLoading(true);
      loadState(companyId);
    } else {
      setLoadedState(null);
      setIsLoading(false);
    }
  }, [companyId]);

  async function fetchCompanies() {
    try {
      const res = await fetch(`${BASE_URL}/watchlist/${market}`);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    }
  }

  async function loadState(id) {
    try {
      const res = await fetch(`${BASE_URL}/page-state/${id}/${pageName}`);
      const data = await res.json();
      setLoadedState(data.state);
    } catch {
      setLoadedState(null);
    } finally {
      setIsLoading(false);
    }
  }

  const saveState = useCallback(
    async (stateValue) => {
      if (!companyId) return;
      try {
        await fetch(`${BASE_URL}/page-state/${companyId}/${pageName}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: stateValue }),
        });
        setStatus("STATE SYNCED");
        setTimeout(() => setStatus(""), 1600);
      } catch {
        setStatus("SYNC FAILED");
      }
    },
    [companyId, pageName]
  );

  const selectedCompany = companies.find((c) => String(c.id) === String(companyId));

  return (
    <div>
      {/* Control Console */}
      <div className="card p-4 sm:p-5 mb-8 flex flex-wrap gap-4 sm:gap-6 items-end justify-between">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="section-index text-[10px]">MARKET DOMAIN</span>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer"
            >
              <option value="US">US EQUITIES (NASDAQ / NYSE)</option>
              <option value="India">INDIA EQUITIES (NSE / BSE)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="section-index text-[10px]">ACTIVE ENTITY</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white min-w-[260px] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer"
            >
              <option value="">SELECT TARGET FROM WATCHLIST…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ticker} {c.name ? `— ${c.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status && (
            <span className="font-mono text-[10px] tracking-widest text-buy uppercase px-3 py-1 rounded-full border border-buy/30 bg-buy/10">
              ● {status}
            </span>
          )}
          {selectedCompany && (
            <span className="neo-tag">
              PROFILE: {selectedCompany.ticker}
            </span>
          )}
        </div>
      </div>

      {!companyId && (
        <div className="card p-12 text-center border-dashed border-white/15 my-6">
          <p className="section-index text-xs mb-2">TARGET UNASSIGNED</p>
          <h4 className="font-syne font-bold text-lg text-white uppercase mb-2">
            SELECT A WATCHLIST ENTITY TO INITIALIZE TELEMETRY
          </h4>
          <p className="text-neutral-400 font-sans text-xs max-w-md mx-auto leading-relaxed">
            Choose an asset from the active universe above to synchronize {pageName === "dcf" ? "discounted cash flow trajectories, Monte Carlo simulations, and WACC matrices" : "10-year historical statements, multi-scenario CAGRs, and guardrailed forecasts"}.
          </p>
        </div>
      )}

      {companyId && isLoading && (
        <div className="card p-12 text-center border-white/10 my-6">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            LOADING MODEL TELEMETRY &amp; PROJECTIONS…
          </p>
        </div>
      )}

      {companyId && !isLoading && children({ companyId, selectedCompany, loadedState, saveState })}
    </div>
  );
}
