// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import UnitToggle from '../components/UnitToggle';
import { formatValue, currencySymbol, UNIT_SYSTEMS, CURRENCIES, autoDetectDisplay } from '../utils/unitConversion';

const SAMPLE_STOCKS = [
  { symbol: 'AEHR', name: 'Aehr Test Systems', country: 'US', marketCap: 2981182906, peg: 0.85, roe: 0.18 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', country: 'IN', marketCap: 1350000000000, peg: 0.92, roe: 0.45 },
];

export default function Dashboard() {
  const [unitSystem, setUnitSystem] = useState(UNIT_SYSTEMS.INTERNATIONAL);
  const [currency, setCurrency] = useState(CURRENCIES.USD);
  const [fxRate, setFxRate] = useState(83.5);
  const [autoMode, setAutoMode] = useState(true);

  const getDisplayForRow = (row) => (autoMode ? autoDetectDisplay(row.country) : { unitSystem, currency });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Compounder Screener</h1>
      <p className="text-slate-500 mb-4 text-sm">Buffett quality + Lynch GARP ranked watchlist (US + India)</p>

      <label className="text-sm font-medium text-slate-600 flex items-center gap-2 mb-2">
        <input type="checkbox" checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} />
        Auto units by market
      </label>

      {!autoMode && (
        <UnitToggle unitSystem={unitSystem} setUnitSystem={setUnitSystem} currency={currency} setCurrency={setCurrency} fxRate={fxRate} setFxRate={setFxRate} />
      )}

      <table className="w-full text-sm border-collapse mt-4">
        <thead>
          <tr className="border-b border-slate-300 text-left text-slate-500">
            <th className="py-2">Symbol</th><th>Company</th><th>Market Cap</th><th>PEG</th><th>ROE</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_STOCKS.map((row) => {
            const disp = getDisplayForRow(row);
            return (
              <tr key={row.symbol} className="border-b border-slate-100">
                <td className="py-2 font-medium">{row.symbol}</td>
                <td>{row.name}</td>
                <td>{currencySymbol(disp.currency)}{formatValue(row.marketCap, { ...disp, fxRate })}</td>
                <td>{row.peg.toFixed(2)}</td>
                <td>{(row.roe * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
