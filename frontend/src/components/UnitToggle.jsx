// src/components/UnitToggle.jsx
import React, { useEffect, useState } from 'react';
import { UNIT_SYSTEMS, CURRENCIES, fetchUsdInrRate } from '../utils/unitConversion';

export default function UnitToggle({ unitSystem, setUnitSystem, currency, setCurrency, fxRate, setFxRate }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchUsdInrRate().then((rate) => {
      setFxRate(rate);
      setLoading(false);
    });
  }, [setFxRate]);

  return (
    <div className="flex items-center gap-4 bg-slate-100 rounded-lg px-4 py-2 mb-4 w-fit">
      <span className="text-sm font-medium text-slate-600">Units:</span>
      <div className="flex rounded-md overflow-hidden border border-slate-300">
        <button className={`px-3 py-1 text-sm ${unitSystem === UNIT_SYSTEMS.INTERNATIONAL ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
          onClick={() => setUnitSystem(UNIT_SYSTEMS.INTERNATIONAL)}>Million / Billion</button>
        <button className={`px-3 py-1 text-sm ${unitSystem === UNIT_SYSTEMS.INDIAN ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
          onClick={() => setUnitSystem(UNIT_SYSTEMS.INDIAN)}>Lakh / Crore</button>
      </div>
      <span className="text-sm font-medium text-slate-600 ml-4">Currency:</span>
      <div className="flex rounded-md overflow-hidden border border-slate-300">
        <button className={`px-3 py-1 text-sm ${currency === CURRENCIES.USD ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
          onClick={() => setCurrency(CURRENCIES.USD)}>USD</button>
        <button className={`px-3 py-1 text-sm ${currency === CURRENCIES.INR ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
          onClick={() => setCurrency(CURRENCIES.INR)}>INR</button>
      </div>
      {loading ? <span className="text-xs text-slate-400">fetching FX rate...</span> :
        <span className="text-xs text-slate-400">1 USD = {fxRate.toFixed(2)} INR</span>}
    </div>
  );
}
