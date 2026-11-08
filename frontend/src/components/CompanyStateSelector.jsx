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
            <div className="flex bg-[#05070f] border border-blue-500/20 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setMarket("US")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  market === "US"
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(0,102,255,0.45)]"
                    : "text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10"
                }`}
              >
                US Equities
              </button>
              <button
                type="button"
                onClick={() => setMarket("India")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  market === "India"
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(0,102,255,0.45)]"
                    : "text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10"
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
              className="bg-[#05070f] border border-blue-500/20 rounded-lg px-3.5 py-1.5 text-xs text-zinc-100 min-w-[260px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
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
            <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{status}</span>
            </span>
          )}
          {selectedCompany && (
            <span className="text-xs font-semibold text-blue-300 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 shadow-[0_0_10px_rgba(0,102,255,0.2)]">
              {selectedCompany.ticker}
            </span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="card p-12 text-center my-6">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-blue-300">Loading company page state…</p>
        </div>
      )}

      {!companyId && !isLoading && (
        <div className="card p-12 text-center border-dashed border-blue-500/20 my-6">
          <h4 className="text-base font-semibold text-white mb-1">
            Select a Stock to Access Financial Models
          </h4>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Choose an active company from your watchlist above. Your projections, DCF iterations, and financial statements are saved automatically.
          </p>
        </div>
      )}

      {companyId && !isLoading && (
        <div>
          {children({
            companyId,
            selectedCompany,
            loadedState,
            saveState,
          })}
        </div>
      )}
    </div>
  );
}
