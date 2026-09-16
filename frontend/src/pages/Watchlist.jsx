import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const MAX_SLOTS = 10;

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
    const res = await fetch(`${API_BASE}/api/watchlist/${market}`);
    const data = await res.json();
    setCompanies(data);
  }

  async function addCompany() {
    setError("");
    if (!ticker.trim()) {
      setError("Enter a ticker");
      return;
    }
    setLoading(true);
    try {
      const endpoint = market === "US" ? "/api/watchlist/us/add" : "/api/watchlist/india/add";
      const body =
        market === "US"
          ? { ticker }
          : {
              ticker,
              name: indiaForm.name,
              price: parseFloat(indiaForm.price),
              market_cap: parseFloat(indiaForm.market_cap),
              sector: indiaForm.sector,
            };

      const res = await fetch(`${API_BASE}${endpoint}`, {
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

  async function uploadFiling(companyId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/watchlist/${companyId}/filings`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Upload failed");
      return;
    }
    fetchWatchlist();
  }

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => companies[i] || null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Watchlist</h1>

      <div className="flex gap-4 mb-6 items-center">
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="US">US</option>
          <option value="India">India</option>
        </select>
        <span className="text-sm text-gray-500">
          {companies.length}/{MAX_SLOTS} companies
        </span>
      </div>

      <div className="border rounded p-4 mb-6 bg-gray-50">
        <h2 className="font-semibold mb-3">Add Company</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500">Ticker</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder={market === "US" ? "AAPL" : "RELIANCE"}
            />
          </div>

          {market === "India" && (
            <>
              <div>
                <label className="block text-xs text-gray-500">Name</label>
                <input
                  value={indiaForm.name}
                  onChange={(e) => setIndiaForm({ ...indiaForm, name: e.target.value })}
                  className="border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Price</label>
                <input
                  value={indiaForm.price}
                  onChange={(e) => setIndiaForm({ ...indiaForm, price: e.target.value })}
                  className="border rounded px-2 py-1 w-24"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Market Cap</label>
                <input
                  value={indiaForm.market_cap}
                  onChange={(e) => setIndiaForm({ ...indiaForm, market_cap: e.target.value })}
                  className="border rounded px-2 py-1 w-28"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Sector</label>
                <input
                  value={indiaForm.sector}
                  onChange={(e) => setIndiaForm({ ...indiaForm, sector: e.target.value })}
                  className="border rounded px-2 py-1"
                />
              </div>
            </>
          )}

          <button
            onClick={addCompany}
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-500 mt-2">
          Adding an 11th company deletes the oldest company and its filings permanently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((company, idx) => (
          <div key={idx} className="border rounded p-4 min-h-[140px]">
            {company ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{company.ticker}</p>
                    <p className="text-sm text-gray-600">{company.name}</p>
                  </div>
                  <span className="text-xs bg-gray-200 rounded px-2 py-1">Slot {company.slot}</span>
                </div>
                <div className="text-sm mt-2 space-y-1">
                  <p>Price: {company.price ?? "N/A"}</p>
                  <p>Market Cap: {company.market_cap ?? "N/A"}</p>
                  <p>Sector: {company.sector ?? "N/A"}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">
                    10-Ks: {company.filings.length}/10
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={company.filings.length >= 10}
                    onChange={(e) => e.target.files[0] && uploadFiling(company.id, e.target.files[0])}
                    className="text-xs"
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Empty slot</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
