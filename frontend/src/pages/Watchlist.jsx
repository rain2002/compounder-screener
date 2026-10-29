import { useState, useEffect } from "react";
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
    <div className="space-y-10">
      <PageHeader
        title="WATCHLIST"
        subtitle="02 // PORTFOLIO UNIVERSE"
        description="Curated high-conviction universe tracking. Company financials and real-time quotes are synchronized automatically. Each slot stores up to 10 annual reports for NLP sentiment extraction."
      />

      {/* Neozen Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#111111] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full bg-black border border-white/10 p-1">
            <button
              onClick={() => setMarket("US")}
              className={`px-5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                market === "US"
                  ? "bg-white text-black font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              US EQUITIES
            </button>
            <button
              onClick={() => setMarket("India")}
              className={`px-5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                market === "India"
                  ? "bg-white text-black font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              INDIA EQUITIES
            </button>
          </div>

          <span className="font-mono text-xs text-neutral-500 pl-2">
            [ {companies.length} / {MAX_SLOTS} SLOTS ]
          </span>
        </div>

        <button
          onClick={() => refreshLivePrices(companies)}
          disabled={refreshing || companies.length === 0}
          className="neo-btn-ghost text-xs disabled:opacity-40"
        >
          <Icon name="refresh" size={13} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "UPDATING..." : "REFRESH QUOTES"}</span>
        </button>
      </div>

      {/* Neozen Add Stock Module */}
      <div className="card p-7 bg-[#111111] border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block">
              ACTION // ADD TARGET
            </span>
            <h3 className="font-syne font-extrabold text-xl uppercase tracking-tight text-white mt-1">
              Add Company to Universe
            </h3>
            <p className="font-mono text-xs text-neutral-400 mt-1">
              {market === "US"
                ? "Enter US ticker (e.g. AAPL, MSFT, GOOGL, NVDA) to sync fundamentals."
                : "Enter Indian NSE/BSE symbol (e.g. RELIANCE.NS, TCS.NS, INFY.NS)."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end pt-3">
          <label className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">TICKER SYMBOL</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="bg-black/60 border border-white/10 rounded-lg px-3.5 py-2.5 font-mono text-white text-sm focus:outline-none focus:border-white transition-all uppercase placeholder:normal-case placeholder:text-neutral-600"
              placeholder={market === "US" ? "AAPL" : "RELIANCE.NS"}
            />
          </label>

          {market === "India" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">COMPANY NAME</span>
                <input
                  value={indiaForm.name}
                  onChange={(e) => setIndiaForm({ ...indiaForm, name: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-white text-sm focus:outline-none focus:border-white transition-all"
                  placeholder="e.g. Infosys Ltd"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">PRICE ₹</span>
                <input
                  type="number"
                  value={indiaForm.price}
                  onChange={(e) => setIndiaForm({ ...indiaForm, price: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-white text-sm w-28 focus:outline-none focus:border-white transition-all"
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">MKT CAP ₹</span>
                <input
                  type="number"
                  value={indiaForm.market_cap}
                  onChange={(e) => setIndiaForm({ ...indiaForm, market_cap: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-white text-sm w-32 focus:outline-none focus:border-white transition-all"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">SECTOR</span>
                <input
                  value={indiaForm.sector}
                  onChange={(e) => setIndiaForm({ ...indiaForm, sector: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-white text-sm focus:outline-none focus:border-white transition-all"
                  placeholder="Technology"
                />
              </label>
            </>
          )}

          <button
            onClick={addCompany}
            disabled={loading}
            className="neo-btn-primary h-11"
          >
            <span>{loading ? "ADDING..." : "ADD TARGET"}</span>
            <Icon name="arrowRight" size={13} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 font-mono text-xs text-[#ef4444]">
            {error}
          </div>
        )}
      </div>

      {/* Grid of Company Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slots.map((company, idx) => (
          <div
            key={idx}
            className={`card p-6 min-h-[190px] transition-all bg-[#111111] border ${
              company ? "border-white/10 hover:border-white/30" : "border-white/[0.04] opacity-50"
            }`}
          >
            {company ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-syne font-extrabold text-2xl uppercase tracking-tight text-white">
                        {company.ticker}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04]">
                        SLOT 0{company.slot}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-neutral-400 mt-1 uppercase">
                      {company.name || "—"}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteCompany(company)}
                    className="font-mono text-[11px] uppercase tracking-wider text-[#ef4444] hover:text-white px-2.5 py-1 rounded-full border border-[#ef4444]/30 hover:bg-[#ef4444] transition-all"
                  >
                    REMOVE
                  </button>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-black/50 border border-white/[0.06] font-mono text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase tracking-widest block">PRICE</span>
                    <span className="font-bold text-white mt-1 block font-syne text-sm">
                      {formatPrice(livePrices[company.ticker] ?? company.price, company.market)}
                    </span>
                    {livePrices[company.ticker] !== undefined && (
                      <span className="text-[#22c55e] text-[9px] uppercase tracking-wider">● LIVE</span>
                    )}
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase tracking-widest block">MKT CAP</span>
                    <span className="font-bold text-white mt-1 block font-syne text-sm">
                      {formatMarketCap(company.market_cap, company.market)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase tracking-widest block">SECTOR</span>
                    <span className="font-bold text-white mt-1 block truncate text-xs" title={company.sector}>
                      {company.sector ? company.sector.toUpperCase() : "GENERAL"}
                    </span>
                  </div>
                </div>

                {/* Annual Report Filings */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                      10-K FILINGS ({company.filings.length}/{MAX_FILINGS})
                    </span>
                    <label className="font-mono text-xs text-white hover:underline cursor-pointer uppercase tracking-wider inline-flex items-center gap-1">
                      <Icon name="upload" size={12} />
                      <span>UPLOAD PDF</span>
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
                    <ul className="space-y-2 mt-2">
                      {company.filings.map((filing) => (
                        <li
                          key={filing.id}
                          className="flex items-center justify-between bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2 text-xs font-mono"
                        >
                          <span className="text-neutral-300 truncate max-w-[180px] text-[11px]" title={filing.file_name}>
                            [PDF] {filing.file_name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-neutral-300 hover:text-white hover:border-white cursor-pointer uppercase tracking-wider transition-colors">
                              REPLACE
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => e.target.files[0] && replaceFiling(filing.id, e.target.files[0])}
                              />
                            </label>
                            <button
                              onClick={() => deleteFiling(filing.id)}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white uppercase tracking-wider transition-colors"
                            >
                              DEL
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-mono text-[10px] text-neutral-600 uppercase">
                      No 10-K PDFs attached. Upload filings for NLP sentiment extraction.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center space-y-2 font-mono">
                <span className="text-xs text-neutral-600">[ 0{idx + 1} AVAILABLE ]</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
