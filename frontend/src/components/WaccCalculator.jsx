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
    <div className="card p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-semibold text-white">
            Discount Rate Calculator (CAPM WACC)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Calculates the hurdle rate using the Capital Asset Pricing Model and debt weighting.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded accent-white cursor-pointer"
          />
          <span>Auto-sync to DCF</span>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <EditableField label="Risk-Free Rate" value={riskFreeRate} onChange={setRiskFreeRate} suffix="%" />
        <EditableField label="Beta (Volatility)" value={beta} onChange={setBeta} step="0.05" />
        <EditableField label="Equity Risk Premium" value={equityRiskPremium} onChange={setEquityRiskPremium} suffix="%" />
        <EditableField label="Cost of Debt (Pre-tax)" value={costOfDebt} onChange={setCostOfDebt} suffix="%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <EditableField label="Effective Tax Rate" value={taxRate} onChange={setTaxRate} suffix="%" />
        <EditableField label="Market Value of Equity" value={marketValueEquity} onChange={setMarketValueEquity} step="100" suffix="$M" />
        <EditableField label="Market Value of Debt" value={marketValueDebt} onChange={setMarketValueDebt} step="100" suffix="$M" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">Cost of Equity (Ke)</p>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{costOfEquity.toFixed(2)}%</p>
        </div>
        <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
          <p className="text-xs text-zinc-400 mb-1">After-Tax Cost of Debt (Kd)</p>
          <p className="text-xl font-semibold text-zinc-300 tabular-nums">{afterTaxCostOfDebt.toFixed(2)}%</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white/[0.04] border border-white/10">
          <p className="text-xs text-zinc-200 font-medium mb-1">Computed WACC</p>
          <p className="text-xl font-bold text-white tabular-nums">{wacc.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
