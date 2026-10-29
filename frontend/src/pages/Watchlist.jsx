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
    if (crore >= 100_000) return `\u20b9${(crore / 100_000).toFixed(2)} Lakh Cr`;
    if (crore >= 1) return `\u20b9${crore.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
    return `\u20b9${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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
    const ok = window.confirm(`Remove ${company.ticker} from watchlist? Uploaded 10-K filings will be permanently removed.`);
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
        title="Watchlist"
        subtitle="Universe Tracking"
        description="Up to 10 high-conviction companies per market. Company metadata and quotes are fetched automatically. Store up to 10 annual reports per company for deep NLP sentiment extraction."
      />

      {/* Apple Segmented Controls & Actions Rail */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-[#161617]/80 border border-white/[0.08] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {/* Segmented Pill Selector (Apple style) */}
          <div className="inline-flex rounded-full bg-black/60 p-1 border border-white/[0.08]">
            <button
              onClick={() => setMarket("US")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
                market === "US"
                  ? "bg-white text-black shadow-sm"
                  : "text-[#86868b] hover:text-white"
              }`}
            >
              US Equities
            </button>
            <button
              onClick={() => setMarket("India")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
                market === "India"
                  ? "bg-white text-black shadow-sm"
                  : "text-[#86868b] hover:text-white"
              }`}
            >
              India Equities
            </button>
          </div>

          <span className="text-xs text-[#86868b] pl-2 font-medium">
            {companies.length} / {MAX_SLOTS} slots occupied
          </span>
        </div>

        <button
          onClick={() => refreshLivePrices(companies)}
          disabled={refreshing || companies.length === 0}
          className="apple-btn-glass inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-40"
        >
          <Icon name="refresh" size={13} className={refreshing ? "animate-spin text-[#2997ff]" : ""} />
          <span>{refreshing ? "Updating quotes…" : "Refresh live quotes"}</span>
        </button>
      </div>

      {/* Apple Store Style Add Company Card */}
      <div className="card-glass rounded-3xl p-7 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Add Company to Portfolio</h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              {market === "US"
                ? "Enter any US ticker (e.g. AAPL, MSFT, GOOGL, NVDA) to fetch SEC filings & financial statements."
                : "Enter an NSE/BSE ticker (e.g. RELIANCE.NS, TCS.NS, INFY.NS)."}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-[#86868b]">
            <Icon name="screener" size={16} />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end pt-2">
          <label className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Ticker Symbol</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-sm font-semibold placeholder:text-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] transition-all"
              placeholder={market === "US" ? "AAPL" : "RELIANCE.NS"}
            />
          </label>

          {market === "India" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Company Name (opt)</span>
                <input
                  value={indiaForm.name}
                  onChange={(e) => setIndiaForm({ ...indiaForm, name: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-[#6e6e73] focus:outline-none focus:border-[#2997ff] transition-all"
                  placeholder="e.g. Infosys Ltd"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Price ₹</span>
                <input
                  type="number"
                  value={indiaForm.price}
                  onChange={(e) => setIndiaForm({ ...indiaForm, price: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-28 focus:outline-none focus:border-[#2997ff] transition-all"
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Mkt Cap ₹</span>
                <input
                  type="number"
                  value={indiaForm.market_cap}
                  onChange={(e) => setIndiaForm({ ...indiaForm, market_cap: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-32 focus:outline-none focus:border-[#2997ff] transition-all"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">Sector</span>
                <input
                  value={indiaForm.sector}
                  onChange={(e) => setIndiaForm({ ...indiaForm, sector: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2997ff] transition-all"
                  placeholder="Technology"
                />
              </label>
            </>
          )}

          <button
            onClick={addCompany}
            disabled={loading}
            className="apple-btn-white px-6 py-2.5 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>{loading ? "Adding Stock…" : "Add Company"}</span>
            <Icon name="arrowRight" size={13} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/20 text-[#ff453a] text-xs font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Grid of Company Slot Cards (Apple Glass Shelf) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slots.map((company, idx) => (
          <div
            key={idx}
            className={`card-glass rounded-3xl p-6 min-h-[180px] transition-all duration-300 ${
              company ? "border border-white/[0.08] hover:border-white/[0.18]" : "border border-white/[0.04] bg-white/[0.01]"
            }`}
          >
            {company ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white tracking-tight">{company.ticker}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                        Slot {company.slot}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5 font-medium">{company.name || "—"}</p>
                  </div>

                  <button
                    onClick={() => deleteCompany(company)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#ff453a]/15 text-[#ff453a] hover:bg-[#ff453a]/25 border border-[#ff453a]/20 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {/* Price & Fundamentals Telemetry */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/[0.06] text-xs">
                  <div>
                    <span className="text-[#86868b] text-[10px] uppercase font-semibold block">Market Price</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {formatPrice(livePrices[company.ticker] ?? company.price, company.market)}
                    </span>
                    {livePrices[company.ticker] !== undefined && (
                      <span className="text-[#30d158] text-[10px] font-medium flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" /> live
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#86868b] text-[10px] uppercase font-semibold block">Market Cap</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {formatMarketCap(company.market_cap, company.market)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#86868b] text-[10px] uppercase font-semibold block">Sector</span>
                    <span className="font-bold text-white mt-0.5 block truncate" title={company.sector}>
                      {company.sector ?? "General"}
                    </span>
                  </div>
                </div>

                {/* Annual Report Filings (PDFs) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      Annual Reports ({company.filings.length}/{MAX_FILINGS})
                    </span>
                    <label className="text-xs text-[#2997ff] hover:underline cursor-pointer font-medium inline-flex items-center gap-1">
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
                    <ul className="space-y-2 mt-2">
                      {company.filings.map((filing) => (
                        <li
                          key={filing.id}
                          className="flex items-center justify-between bg-black/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs"
                        >
                          <span className="text-white truncate max-w-[180px] font-mono text-[11px]" title={filing.file_name}>
                            📄 {filing.file_name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.08] text-[#2997ff] hover:bg-white/[0.14] font-medium cursor-pointer transition-colors">
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
                              className="text-[11px] px-2.5 py-1 rounded-full bg-[#ff453a]/15 text-[#ff453a] hover:bg-[#ff453a]/25 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#6e6e73] italic">No 10-K PDFs attached yet. Upload filings to unlock NLP sentiment analysis.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center text-[#6e6e73]">
                  <span className="text-xs font-semibold">{idx + 1}</span>
                </div>
                <p className="text-xs font-medium text-[#6e6e73]">Available Slot</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
