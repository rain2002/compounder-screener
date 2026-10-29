import { useState, useEffect } from "react";
import EditableField from "./EditableField.jsx";

const DEFAULTS = {
  US: { riskFreeRate: 4.2, equityRiskPremium: 4.5 },
  INDIA: { riskFreeRate: 7.0, equityRiskPremium: 6.5 },
};

export default function WaccCalculator({ market, onWaccChange }) {
  const mKey = market?.toUpperCase() || "US";
  const [riskFreeRate, setRiskFreeRate] = useState(DEFAULTS[mKey]?.riskFreeRate ?? 4.2);
  const [beta, setBeta] = useState(1.1);
  const [equityRiskPremium, setEquityRiskPremium] = useState(DEFAULTS[mKey]?.equityRiskPremium ?? 4.5);
  const [costOfDebt, setCostOfDebt] = useState(5.5);
  const [taxRate, setTaxRate] = useState(21);
  const [marketValueEquity, setMarketValueEquity] = useState(8000);
  const [marketValueDebt, setMarketValueDebt] = useState(2000);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    const key = market?.toUpperCase() || "US";
    setRiskFreeRate(DEFAULTS[key]?.riskFreeRate ?? 4.2);
    setEquityRiskPremium(DEFAULTS[key]?.equityRiskPremium ?? 4.5);
  }, [market]);

  const costOfEquity = riskFreeRate + beta * equityRiskPremium;
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate / 100);
  const totalCapital = marketValueEquity + marketValueDebt;
  const weightEquity = totalCapital ? marketValueEquity / totalCapital : 0;
  const weightDebt = totalCapital ? marketValueDebt / totalCapital : 0;
  const wacc = costOfEquity * weightEquity + afterTaxCostOfDebt * weightDebt;

  useEffect(() => {
    if (autoSync) onWaccChange(Number(wacc.toFixed(2)));
  }, [wacc, autoSync]);

  return (
    <div className="card p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="section-index text-[10px] mb-1 block">[ 03 // DISCOUNT RATE ]</span>
          <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
            WACC CALCULATOR (CAPM MATRIX)
          </h3>
        </div>
        <label className="flex items-center gap-2 font-mono text-xs text-neutral-300 cursor-pointer select-none px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:border-white/20 transition-all">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded accent-white cursor-pointer"
          />
          AUTO-SYNC TO DCF
        </label>
      </div>

      <p className="text-neutral-400 font-sans text-xs mb-6 leading-relaxed max-w-3xl">
        Calculates the hurdle rate via CAPM (Risk-free benchmark + Beta × Equity Risk Premium) combined with tax-shielded cost of debt weighted by capital structure. The resulting WACC automatically seeds the DCF valuation engine below.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <EditableField label="Risk-Free Rate" value={riskFreeRate} onChange={setRiskFreeRate} suffix="%" />
        <EditableField label="Beta (Market Volatility)" value={beta} onChange={setBeta} step="0.05" />
        <EditableField label="Equity Risk Premium" value={equityRiskPremium} onChange={setEquityRiskPremium} suffix="%" />
        <EditableField label="Cost of Debt (Pre-Tax)" value={costOfDebt} onChange={setCostOfDebt} suffix="%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <EditableField label="Effective Tax Rate" value={taxRate} onChange={setTaxRate} suffix="%" />
        <EditableField label="Market Value of Equity" value={marketValueEquity} onChange={setMarketValueEquity} step="100" suffix="$M" />
        <EditableField label="Market Value of Debt" value={marketValueDebt} onChange={setMarketValueDebt} step="100" suffix="$M" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/10">
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Cost of Equity (Ke)</p>
          <p className="font-syne font-bold text-2xl text-white">{costOfEquity.toFixed(2)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">After-Tax Cost of Debt (Kd)</p>
          <p className="font-syne font-bold text-2xl text-neutral-300">{afterTaxCostOfDebt.toFixed(2)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/15">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">Computed WACC (Hurdle)</p>
          <p className="font-syne font-bold text-2xl text-white">{wacc.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
