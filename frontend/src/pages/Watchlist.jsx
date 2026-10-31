import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import { api } from "../api/client.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const MAX_SLOTS = 10;
const MAX_FILINGS = 10;

function formatPrice(value, market) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  const currency = market === "India" ? "INR" : "USD";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
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
  const [livePrices, setLivePrices] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, [market]);

  useEffect(() => {
    if (companies.length > 0) {
      refreshLivePrices(companies);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies.length, market]);

  async function refreshLivePrices(list) {
    setRefreshing(true);
    const updates = {};
    await Promise.all(
      list.map(async (c) => {
        try {
          const data = await api.quote(c.ticker);
          if (data && data.current_price !== null && data.current_price !== undefined) {
            updates[c.ticker] = data.current_price;
          }
        } catch {
          // silently skip tickers that fail
        }
      })
    );
    setLivePrices((prev) => ({ ...prev, ...updates }));
    setRefreshing(false);
  }

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
      setError("Please enter a valid stock ticker symbol");
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
    const ok = window.confirm(`Remove ${company.ticker} from watchlist? Filings will be deleted from disk.`);
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

  async function deleteFiling(filingId) {
    const ok = window.confirm("Delete this filing permanently?");
    if (!ok) return;
    const res = await fetch(`${BASE_URL}/watchlist/filings/${filingId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Delete failed");
      return;
    }
    fetchWatchlist();
  }

  async function replaceFiling(filingId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/watchlist/filings/${filingId}`, { method: "PUT", body: formData });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Replace failed");
      return;
    }
    fetchWatchlist();
  }

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => companies[i] || null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Watchlist Universe"
        subtitle="Portfolio Assets"
        description="Curated high-conviction universe tracking. Company financials and real-time market prices are synchronized automatically. Each company stores up to 10 annual reports for NLP sentiment extraction."
      />

      {/* Control Strip */}
      <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setMarket("US")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                market === "US"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              US Equities
            </button>
            <button
              onClick={() => setMarket("India")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                market === "India"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              India Equities
            </button>
          </div>

          <span className="text-xs text-zinc-400">
            {companies.length} of {MAX_SLOTS} slots used
          </span>
        </div>

        <button
          onClick={() => refreshLivePrices(companies)}
          disabled={refreshing || companies.length === 0}
          className="btn-secondary text-xs disabled:opacity-40"
        >
          <Icon name="refresh" size={13} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Updating..." : "Refresh Prices"}</span>
        </button>
      </div>

      {/* Add Stock Card */}
      <div className="card p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">
            Add Stock to Universe
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {market === "US"
              ? "Enter a US stock ticker (e.g. AAPL, MSFT, GOOGL, NVDA) to sync financials."
              : "Enter an Indian NSE/BSE symbol (e.g. RELIANCE.NS, TCS.NS, INFY.NS)."}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="text-xs font-medium text-zinc-400">Ticker Symbol</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-white/30 uppercase placeholder:normal-case placeholder:text-zinc-600"
              placeholder={market === "US" ? "AAPL" : "RELIANCE.NS"}
            />
          </label>

          {market === "India" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-400">Company Name</span>
                <input
                  value={indiaForm.name}
                  onChange={(e) => setIndiaForm({ ...indiaForm, name: e.target.value })}
                  className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                  placeholder="e.g. Infosys Ltd"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-400">Price (₹)</span>
                <input
                  type="number"
                  value={indiaForm.price}
                  onChange={(e) => setIndiaForm({ ...indiaForm, price: e.target.value })}
                  className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-2 text-white text-sm w-28 focus:outline-none focus:border-white/30"
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-400">Market Cap (₹)</span>
                <input
                  type="number"
                  value={indiaForm.market_cap}
                  onChange={(e) => setIndiaForm({ ...indiaForm, market_cap: e.target.value })}
                  className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-2 text-white text-sm w-32 focus:outline-none focus:border-white/30"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-400">Sector</span>
                <input
                  value={indiaForm.sector}
                  onChange={(e) => setIndiaForm({ ...indiaForm, sector: e.target.value })}
                  className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                  placeholder="Technology"
                />
              </label>
            </>
          )}

          <button
            onClick={addCompany}
            disabled={loading}
            className="btn-primary h-9.5 px-4"
          >
            <span>{loading ? "Adding..." : "Add to Watchlist"}</span>
            <Icon name="arrowRight" size={13} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Grid of Company Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slots.map((company, idx) => (
          <div
            key={idx}
            className={`card p-5 min-h-[190px] transition-all ${
              company ? "hover:border-zinc-700/80" : "border-dashed border-white/10 opacity-40"
            }`}
          >
            {company ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white tracking-tight">
                        {company.ticker}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                        Slot {company.slot}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {company.name || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/dcf"
                      className="text-xs font-medium text-zinc-300 hover:text-white px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                    >
                      DCF
                    </Link>
                    <button
                      onClick={() => deleteCompany(company)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-md hover:bg-rose-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-zinc-950/60 border border-white/[0.06] text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Price</span>
                    <span className="font-semibold text-white mt-0.5 block text-sm tabular-nums">
                      {formatPrice(livePrices[company.ticker] ?? company.price, company.market)}
                    </span>
                    {livePrices[company.ticker] !== undefined && (
                      <span className="text-emerald-400 text-[10px] font-medium">● Live</span>
                    )}
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Market Cap</span>
                    <span className="font-semibold text-white mt-0.5 block text-sm tabular-nums">
                      {formatMarketCap(company.market_cap, company.market)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Sector</span>
                    <span className="font-semibold text-white mt-0.5 block truncate text-xs" title={company.sector}>
                      {company.sector ? company.sector : "General"}
                    </span>
                  </div>
                </div>

                {/* Annual Report Filings */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-400">
                      10-K Filings ({company.filings.length}/{MAX_FILINGS})
                    </span>
                    <label className="text-xs text-zinc-300 hover:text-white cursor-pointer inline-flex items-center gap-1 font-medium">
                      <Icon name="upload" size={12} />
                      <span>Upload PDF</span>
                      <input
                        type="file"
                        accept=".pdf"
                        disabled={company.filings.length >= MAX_FILINGS}
                        onChange={(e) => e.target.files[0] && uploadFiling(company.id, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {company.filings.length > 0 ? (
                    <ul className="space-y-1.5 mt-2">
                      {company.filings.map((filing) => (
                        <li
                          key={filing.id}
                          className="flex items-center justify-between bg-zinc-950/40 border border-white/[0.06] rounded-md px-3 py-1.5 text-xs"
                        >
                          <span className="text-zinc-300 truncate max-w-[200px]" title={filing.file_name}>
                            {filing.file_name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-[11px] px-2 py-0.5 rounded border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 cursor-pointer transition-colors">
                              Replace
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => e.target.files[0] && replaceFiling(filing.id, e.target.files[0])}
                              />
                            </label>
                            <button
                              onClick={() => deleteFiling(filing.id)}
                              className="text-[11px] px-2 py-0.5 rounded border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      No 10-K filings attached yet. Upload a PDF to run NLP sentiment analysis.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Empty Slot {idx + 1}</span>
                <span className="text-[11px] text-zinc-600">Add ticker above</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
