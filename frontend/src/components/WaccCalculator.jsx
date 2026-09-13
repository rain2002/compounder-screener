import { useState } from "react";
import EditableField from "./EditableField.jsx";
import Icon from "./Icon.jsx";

const DEFAULTS = {
  US: { riskFreeRate: 4.2, equityRiskPremium: 4.5 },
  INDIA: { riskFreeRate: 7.0, equityRiskPremium: 6.5 },
};

export default function WaccCalculator({ market, onWaccChange }) {
  const [riskFreeRate, setRiskFreeRate] = useState(DEFAULTS[market]?.riskFreeRate ?? 4.2);
  const [beta, setBeta] = useState(1.1);
  const [equityRiskPremium, setEquityRiskPremium] = useState(DEFAULTS[market]?.equityRiskPremium ?? 4.5);
  const [costOfDebt, setCostOfDebt] = useState(5.5);
  const [taxRate, setTaxRate] = useState(21);
  const [marketValueEquity, setMarketValueEquity] = useState(8000);
  const [marketValueDebt, setMarketValueDebt] = useState(2000);

  const costOfEquity = riskFreeRate + beta * equityRiskPremium;
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate / 100);
  const totalCapital = marketValueEquity + marketValueDebt;
  const weightEquity = totalCapital ? marketValueEquity / totalCapital : 0;
  const weightDebt = totalCapital ? marketValueDebt / totalCapital : 0;
  const wacc = costOfEquity * weightEquity + afterTaxCostOfDebt * weightDebt;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="wacc" size={16} className="text-accent2" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          WACC Calculator (CAPM)
        </h3>
      </div>

      <p className="text-slate-500 text-xs mb-5">
        Cost of equity via CAPM (Risk-free rate + Beta × Equity Risk Premium), cost of debt after tax,
        weighted by market value of equity vs. debt. Defaults reflect a rough {market === "INDIA" ? "India" : "US"} benchmark — edit freely.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <EditableField label="Risk-Free Rate" value={riskFreeRate} onChange={setRiskFreeRate} suffix="%" />
        <EditableField label="Beta" value={beta} onChange={setBeta} step="0.05" />
        <EditableField label="Equity Risk Premium" value={equityRiskPremium} onChange={setEquityRiskPremium} suffix="%" />
        <EditableField label="Cost of Debt (pre-tax)" value={costOfDebt} onChange={setCostOfDebt} suffix="%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <EditableField label="Tax Rate" value={taxRate} onChange={setTaxRate} suffix="%" />
        <EditableField label="Market Value of Equity" value={marketValueEquity} onChange={setMarketValueEquity} step="100" suffix="$M" />
        <EditableField label="Market Value of Debt" value={marketValueDebt} onChange={setMarketValueDebt} step="100" suffix="$M" />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Cost of Equity</p>
          <p className="stat-value text-lg text-slate-200">{costOfEquity.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">After-Tax Cost of Debt</p>
          <p className="stat-value text-lg text-slate-200">{afterTaxCostOfDebt.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">WACC</p>
          <div className="flex items-center gap-2">
            <p className="stat-value text-lg text-accent2">{wacc.toFixed(2)}%</p>
            <button
              onClick={() => onWaccChange(Number(wacc.toFixed(2)))}
              className="text-xs px-2 py-1 rounded-md bg-accent/15 text-accent2 hover:bg-accent/25 transition-colors font-medium"
            >
              Use in DCF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
