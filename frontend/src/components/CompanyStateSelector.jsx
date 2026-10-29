import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Reusable Market -> Company dropdown pair that loads/saves a JSON state
 * blob per company for a given page ("dcf" or "technical"). Renders the
 * dropdowns and exposes the loaded state + a save callback to the parent
 * via render props.
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
        setTimeout(() => setStatus(""), 1500);
      } catch {
        setStatus("Save failed");
      }
    },
    [companyId, pageName]
  );

  const selectedCompany = companies.find((c) => String(c.id) === String(companyId));

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6 items-end p-4 rounded-2xl bg-[#161617]/80 border border-white/[0.08] backdrop-blur-xl">
        <label className="flex flex-col gap-1.5">
          <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Market</span>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-[#2997ff]"
          >
            <option value="US">US Equities</option>
            <option value="India">India Equities</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Selected Company</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium min-w-[240px] focus:outline-none focus:border-[#2997ff]"
          >
            <option value="">Select a company from Watchlist…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ticker} {c.name ? `— ${c.name}` : ""}
              </option>
            ))}
          </select>
        </label>

        {status && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30">
            {status}
          </span>
        )}
      </div>

      {!companyId && (
        <div className="card-glass rounded-3xl p-10 text-center border border-white/[0.08] space-y-2 mb-6">
          <p className="text-sm text-[#86868b]">
            Select a stock from your Watchlist above to automatically load its {pageName === "dcf" ? "DCF Valuation" : "Financial Statements"} inputs and sync projections.
          </p>
        </div>
      )}

      {companyId && isLoading && (
        <div className="card-glass rounded-3xl p-10 text-center border border-white/[0.08] text-sm text-[#86868b] mb-6">
          Loading company telemetry &amp; models…
        </div>
      )}

      {companyId && !isLoading && children({ companyId, selectedCompany, loadedState, saveState })}
    </div>
  );
}
