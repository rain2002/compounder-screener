import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Clean, smooth Company State Selector
 * Allows switching between US / India equities and company profiles with
 * persistent auto-saving.
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
        setStatus("Saved");
        setTimeout(() => setStatus(""), 1600);
      } catch {
        setStatus("Save failed");
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
            <span className="text-xs font-medium text-zinc-400">Market</span>
            <div className="flex bg-zinc-900 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setMarket("US")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  market === "US"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                US Equities
              </button>
              <button
                type="button"
                onClick={() => setMarket("India")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  market === "India"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                India Equities
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Selected Stock</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-1.5 text-xs text-zinc-200 min-w-[260px] focus:outline-none focus:border-white/30 transition-all cursor-pointer"
            >
              <option value="">Select a stock from Watchlist…</option>
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
            <span className="text-xs font-medium text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{status}</span>
            </span>
          )}
          {selectedCompany && (
            <span className="text-xs font-medium text-zinc-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              {selectedCompany.ticker}
            </span>
          )}
        </div>
      </div>

      {!companyId && (
        <div className="card p-12 text-center border-dashed border-white/15 my-6">
          <h4 className="text-base font-semibold text-zinc-200 mb-2">
            Select a Stock to Load Financials
          </h4>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Choose an asset from your active watchlist above to synchronize {pageName === "dcf" ? "discounted cash flow projections, WACC hurdle rate, and Monte Carlo simulations" : "10-year historical statements, multi-scenario CAGRs, and guardrailed forecasts"}.
          </p>
        </div>
      )}

      {companyId && isLoading && (
        <div className="card p-12 text-center border-white/10 my-6">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">
            Loading company data &amp; projections…
          </p>
        </div>
      )}

      {companyId && !isLoading && children({ companyId, selectedCompany, loadedState, saveState })}
    </div>
  );
}
