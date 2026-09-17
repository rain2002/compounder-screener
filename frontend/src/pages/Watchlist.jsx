import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const MAX_SLOTS = 10;
const MAX_FILINGS = 10;

function formatPrice(value, market) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  const currency = market === "India" ? "INR" : "USD";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatMarketCap(value, market) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  const amount = Number(value);

  if (market === "India") {
    const crore = amount / 10_000_000;
    if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(2)} Lakh Cr`;
    if (crore >= 1) return `₹${crore.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }

  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}T`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(2)}B`;
  return `$${amount.toFixed(2)}M`;
}

export default function Watchlist() {
  const [market, setMarket] = useState("US");
  const [companies, setCompanies] = useState([]);
  const [ticker, setTicker] = useState("");
  const [indiaForm, setIndiaForm] = useState({ name: "", price: "", market_cap: "", sector: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWatchlist();
  }, [market]);

  async function fetchWatchlist() {
    try {
      const res = await fetch(`${BASE_URL}/watchlist/${market}`);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    }
  }

  async function addCompany() {
    setError("");
    if (!ticker.trim()) {
      setError("Enter a ticker");
      return;
    }
    setLoading(true);
    try {
      const endpoint = market === "US" ? "/watchlist/us/add" : "/watchlist/india/add";
      const body = market === "US" ? { ticker } : {
        ticker,
        name: indiaForm.name || null,
        price: indiaForm.price ? parseFloat(indiaForm.price) : null,
        market_cap: indiaForm.market_cap ? parseFloat(indiaForm.market_cap) : null,
        sector: indiaForm.sector || null,
      };
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to add company");
      }
      setTicker("");
      setIndiaForm({ name: "", price: "", market_cap: "", sector: "" });
      fetchWatchlist();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCompany(company) {
    const ok = window.confirm(`Delete ${company.ticker} from watchlist? This permanently deletes its uploaded filings from disk.`);
    if (!ok) return;
    const res = await fetch(`${BASE_URL}/watchlist/${company.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Delete failed");
      return;
    }
    fetchWatchlist();
  }

  async function uploadFiling(companyId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/watchlist/${companyId}/filings`, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Upload failed");
      return;
    }
    fetchWatchlist();
  }

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => companies[i] || null);

  return (
    <div>
      <PageHeader title="Watchlist" description="Up to 10 companies per market. Company details are fetched automatically for US and India. Each company can hold up to 10 annual report PDFs, shared automatically with the Sentiment page." />

      <div className="flex gap-4 mb-6 items-center">
        <select value={market} onChange={(e) => setMarket(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm">
          <option value="US">US</option>
          <option value="India">India</option>
        </select>
        <span className="text-sm text-slate-400">{companies.length}/{MAX_SLOTS} companies</span>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">Add Company</h3>
        <p className="text-xs text-slate-500 mb-4">
          {market === "US" ? "Enter a US ticker, such as AAPL or MSFT." : "Enter an NSE/BSE ticker, such as RELIANCE.NS or RELIANCE.BO. Fields below are optional fallback values if Yahoo Finance is unavailable."}
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Ticker</span>
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm" placeholder={market === "US" ? "AAPL" : "RELIANCE.NS"} />
          </label>
          {market === "India" && <>
            <label className="flex flex-col gap-1.5"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Name (fallback)</span><input value={indiaForm.name} onChange={(e) => setIndiaForm({ ...indiaForm, name: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm" /></label>
            <label className="flex flex-col gap-1.5"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Price ₹ (fallback)</span><input type="number" value={indiaForm.price} onChange={(e) => setIndiaForm({ ...indiaForm, price: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm w-28" /></label>
            <label className="flex flex-col gap-1.5"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Market Cap ₹ (fallback)</span><input type="number" value={indiaForm.market_cap} onChange={(e) => setIndiaForm({ ...indiaForm, market_cap: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm w-32" /></label>
            <label className="flex flex-col gap-1.5"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Sector (fallback)</span><input value={indiaForm.sector} onChange={(e) => setIndiaForm({ ...indiaForm, sector: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm" /></label>
          </>}
          <button onClick={addCompany} disabled={loading} className="px-4 py-2 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors text-sm font-medium disabled:opacity-50">{loading ? "Adding..." : "Add"}</button>
        </div>
        {error && <p className="text-avoid text-sm mt-3">{error}</p>}
        <p className="text-xs text-slate-500 mt-3">Adding an 11th company permanently deletes the oldest company and all its filings from disk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((company, idx) => (
          <div key={idx} className="card p-5 min-h-[140px]">
            {company ? <>
              <div className="flex justify-between items-start">
                <div><p className="font-semibold text-slate-100">{company.ticker}</p><p className="text-sm text-slate-400">{company.name || "—"}</p></div>
                <div className="flex items-center gap-2"><span className="text-xs bg-slate-800 text-slate-400 rounded px-2 py-1">Slot {company.slot}</span><button onClick={() => deleteCompany(company)} className="text-xs px-2 py-1 rounded-md bg-avoid/15 text-avoid hover:bg-avoid/25 transition-colors font-medium">Delete</button></div>
              </div>
              <div className="text-sm mt-3 space-y-1 text-slate-300">
                <p>Price: {formatPrice(company.price, company.market)}</p>
                <p>Market Cap: {formatMarketCap(company.market_cap, company.market)}</p>
                <p>Sector: {company.sector ?? "N/A"}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60">
                <p className="text-xs text-slate-500 mb-2">Annual reports: {company.filings.length}/{MAX_FILINGS}</p>
                <input type="file" accept=".pdf" disabled={company.filings.length >= MAX_FILINGS} onChange={(e) => e.target.files[0] && uploadFiling(company.id, e.target.files[0])} className="text-xs text-slate-400" />
              </div>
            </> : <p className="text-slate-600 text-sm">Empty slot</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
