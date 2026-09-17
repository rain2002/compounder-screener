import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Reusable Market -> Company dropdown pair that loads/saves a JSON state
 * blob per company for a given page ("dcf" or "technical"). Renders the
 * dropdowns and exposes the loaded state + a save callback to the parent
 * via render props, so DCF.jsx/Technical.jsx don't need internal rewrites -
 * they just wrap their existing state in what this component loads/saves.
 */
export default function CompanyStateSelector({ pageName, children }) {
  const [market, setMarket] = useState("US");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [loadedState, setLoadedState] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchCompanies();
    setCompanyId("");
    setLoadedState(null);
  }, [market]);

  useEffect(() => {
    if (companyId) loadState(companyId);
    else setLoadedState(null);
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
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Market</span>
          <select value={market} onChange={(e) => setMarket(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm">
            <option value="US">US</option>
            <option value="India">India</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Company</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm min-w-[220px]"
          >
            <option value="">Select a company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.ticker} {c.name ? `- ${c.name}` : ""}</option>
            ))}
          </select>
        </label>
        {status && <span className="text-xs text-accent2">{status}</span>}
      </div>

      {!companyId && (
        <div className="card p-8 text-center text-slate-400 text-sm mb-6">
          Select a company from your Watchlist above to save and load its {pageName === "dcf" ? "DCF" : "Technical"} inputs and results here.
        </div>
      )}

      {companyId && children({ companyId, selectedCompany, loadedState, saveState })}
    </div>
  );
}
