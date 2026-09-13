// src/pages/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UnitToggle from '../components/UnitToggle';
import { formatValue, currencySymbol, UNIT_SYSTEMS, CURRENCIES, autoDetectDisplay } from '../utils/unitConversion';
import { formatLocalDateTime, localTimeZone } from '../utils/time';

const SAMPLE_STOCKS = [
  { symbol: 'AEHR', name: 'Aehr Test Systems', country: 'US', sector: 'Technology', marketCap: 2981182906, peg: 0.85, roe: 0.18, marginOfSafety: 0.31, beneish: -3.14, sentiment: 'Improving', rating: 'Buy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', country: 'IN', sector: 'Technology', marketCap: 1350000000000, peg: 0.92, roe: 0.45, marginOfSafety: 0.18, beneish: -2.87, sentiment: 'Stable', rating: 'Buy' },
  { symbol: 'MSFT', name: 'Microsoft', country: 'US', sector: 'Technology', marketCap: 3200000000000, peg: 1.72, roe: 0.35, marginOfSafety: 0.04, beneish: -2.41, sentiment: 'Stable', rating: 'Watch' },
  { symbol: 'DIXON.NS', name: 'Dixon Technologies', country: 'IN', sector: 'Consumer', marketCap: 620000000000, peg: 1.18, roe: 0.28, marginOfSafety: 0.26, beneish: -2.08, sentiment: 'Caution', rating: 'Avoid' },
];

const PIPELINE_STAGES = [
  ['01', 'Universe', '2,481', 'border-sky-300 bg-sky-50 text-sky-700'],
  ['02', 'Fraud filter', '1,936', 'border-amber-300 bg-amber-50 text-amber-700'],
  ['03', 'Quality + GARP', '284', 'border-emerald-300 bg-emerald-50 text-emerald-700'],
  ['04', 'Manual review', '28', 'border-violet-300 bg-violet-50 text-violet-700'],
];

const RATING_STYLES = {
  Buy: 'bg-emerald-100 text-emerald-800',
  Watch: 'bg-amber-100 text-amber-800',
  Caution: 'bg-orange-100 text-orange-800',
  Avoid: 'bg-rose-100 text-rose-800',
};

export default function Dashboard() {
  const [unitSystem, setUnitSystem] = useState(UNIT_SYSTEMS.INTERNATIONAL);
  const [currency, setCurrency] = useState(CURRENCIES.USD);
  const [fxRate, setFxRate] = useState(83.5);
  const [autoMode, setAutoMode] = useState(true);
  const [activeMarket, setActiveMarket] = useState('All markets');
  const [ratingFilter, setRatingFilter] = useState('All ratings');
  const [search, setSearch] = useState('');
  const [pegLimit, setPegLimit] = useState(1.5);
  const [roeFloor, setRoeFloor] = useState(15);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getDisplayForRow = (row) => (autoMode ? autoDetectDisplay(row.country) : { unitSystem, currency });
  const visibleStocks = useMemo(() => SAMPLE_STOCKS.filter((row) => {
    const matchesMarket = activeMarket === 'All markets' || row.country === activeMarket;
    const matchesRating = ratingFilter === 'All ratings' || row.rating === ratingFilter;
    const matchesSearch = `${row.symbol} ${row.name} ${row.sector}`.toLowerCase().includes(search.toLowerCase());
    return matchesMarket && matchesRating && matchesSearch;
  }), [activeMarket, ratingFilter, search]);

  const handleRefresh = () => setLastRefresh(new Date());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Research workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Compounder Screener</h1></div>
          <div className="flex items-center gap-3 text-right"><div className="hidden sm:block"><p className="text-xs text-slate-400">Last data refresh</p><p className="text-sm font-medium text-slate-700">{formatLocalDateTime(lastRefresh)}</p><p className="text-xs text-slate-400">{localTimeZone()}</p></div><button onClick={handleRefresh} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Refresh data</button></div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6" aria-label="Application sections">
          {[['Dashboard', '/'], ['Screener', '/screener'], ['Technical', '/technical'], ['Sentiment', '/sentiment'], ['DCF / WACC', '/dcf'], ['Forward log', '/forward-log']].map(([item, path], index) => <Link key={item} to={path} className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium ${index === 0 ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{item}</Link>)}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-7">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-medium text-slate-500">Bias-aware shortlist</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Quality, growth, and valuation in one view</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">A research shortlist, not an auto-buy signal. Rankings are separated by market and designed for full-cycle review.</p></div><div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="h-2 w-2 rounded-full bg-amber-500" />Forward tracking only · no backtest</div></section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{PIPELINE_STAGES.map(([number, label, value, style]) => <div key={label} className={`rounded-lg border p-4 ${style}`}><div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider"><span>{number}</span><span>stage</span></div><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-sm font-medium">{label}</p></div>)}</section>

        <section className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">Screen controls</h3><button className="text-xs font-semibold text-emerald-700">Reset</button></div><label className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} className="accent-emerald-600" />Auto units by market</label><label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Market</label><select value={activeMarket} onChange={(e) => setActiveMarket(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option>All markets</option><option value="US">US</option><option value="IN">India</option></select><label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Rating</label><select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option>All ratings</option><option>Buy</option><option>Watch</option><option>Caution</option><option>Avoid</option></select><label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Max PEG <span className="float-right font-normal text-slate-700">{pegLimit}</span></label><input type="range" min="0.5" max="3" step="0.05" value={pegLimit} onChange={(e) => setPegLimit(e.target.value)} className="mt-3 w-full accent-emerald-600" /><label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Minimum ROE <span className="float-right font-normal text-slate-700">{roeFloor}%</span></label><input type="range" min="0" max="40" step="1" value={roeFloor} onChange={(e) => setRoeFloor(e.target.value)} className="mt-3 w-full accent-emerald-600" />{!autoMode && <UnitToggle unitSystem={unitSystem} setUnitSystem={setUnitSystem} currency={currency} setCurrency={setCurrency} fxRate={fxRate} setFxRate={setFxRate} />}</aside>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Ranked watchlist</h3><p className="mt-1 text-xs text-slate-500">{visibleStocks.length} candidates · US and India scored independently</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or ticker" className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" /></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Company</th><th>Market cap</th><th>PEG</th><th>ROE</th><th>Sentiment</th><th>MoS</th><th>Rating</th></tr></thead><tbody>{visibleStocks.map((row) => { const disp = getDisplayForRow(row); return <tr key={row.symbol} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{row.symbol}</p><p className="text-xs text-slate-500">{row.name} · {row.sector}</p></td><td className="font-medium">{currencySymbol(disp.currency)}{formatValue(row.marketCap, { ...disp, fxRate })}</td><td className={row.peg <= pegLimit ? 'font-semibold text-emerald-700' : 'text-slate-600'}>{row.peg.toFixed(2)}</td><td className={row.roe * 100 >= roeFloor ? 'font-semibold text-emerald-700' : 'text-slate-600'}>{(row.roe * 100).toFixed(1)}%</td><td><span className="text-xs font-medium text-slate-600">{row.sentiment}</span></td><td className="font-medium">{(row.marginOfSafety * 100).toFixed(0)}%</td><td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${RATING_STYLES[row.rating]}`}>{row.rating}</span></td></tr>; })}</tbody></table></div></div>
        </section>

        <section className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quality + GARP</p><p className="mt-2 text-2xl font-bold">74 / 100</p><p className="mt-1 text-sm text-slate-500">Sector-normalized composite score</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valuation band</p><p className="mt-2 text-2xl font-bold">18% - 31%</p><p className="mt-1 text-sm text-slate-500">Median DCF margin of safety</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Review queue</p><p className="mt-2 text-2xl font-bold">28 names</p><p className="mt-1 text-sm text-slate-500">Read filings before watchlist entry</p></div></section>
      </main>
    </div>
  );
}
