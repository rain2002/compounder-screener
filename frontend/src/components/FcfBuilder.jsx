import { useMemo } from "react";
import EditableField from "./EditableField.jsx";
import Icon from "./Icon.jsx";

export default function FcfBuilder({ inputs, onChange, onFcfChange }) {
  const {
    revenue,
    ebitMargin,
    taxRate,
    depreciation,
    capex,
    deltaWorkingCapital,
  } = inputs;

  const ebit = revenue * (ebitMargin / 100);
  const nopat = ebit * (1 - taxRate / 100);
  const fcf = nopat + depreciation - capex - deltaWorkingCapital;

  useMemo(() => {
    onFcfChange(Math.round(fcf));
  }, [fcf]);

  const rows = [
    { label: "Revenue", value: revenue, formula: null },
    { label: "EBIT (Revenue × EBIT Margin)", value: ebit, formula: `${ebitMargin}% margin` },
    { label: "NOPAT (EBIT × (1 − Tax Rate))", value: nopat, formula: `${taxRate}% tax` },
    { label: "+ D&A", value: depreciation, formula: null, sign: "+" },
    { label: "− CapEx", value: -capex, formula: null, sign: "−" },
    { label: "− Δ Working Capital", value: -deltaWorkingCapital, formula: null, sign: "−" },
  ];

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="dcf" size={16} className="text-accent2" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Free Cash Flow Build-Up
        </h3>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        FCF = NOPAT + D&amp;A − CapEx − ΔWorking Capital. Fields are pre-filled with placeholder
        10-K-style figures — replace with real filings, or wait for the finance connector sync
        (Phase 2) to auto-populate these. Future years will use ML-forecasted revenue/margins once
        that pipeline is live; for now all years use this same base year.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        <EditableField
          label="Revenue"
          value={revenue}
          onChange={(v) => onChange({ ...inputs, revenue: v })}
          step="10"
          suffix="$M"
        />
        <EditableField
          label="EBIT Margin"
          value={ebitMargin}
          onChange={(v) => onChange({ ...inputs, ebitMargin: v })}
          suffix="%"
        />
        <EditableField
          label="Tax Rate"
          value={taxRate}
          onChange={(v) => onChange({ ...inputs, taxRate: v })}
          suffix="%"
        />
        <EditableField
          label="Depreciation & Amortization"
          value={depreciation}
          onChange={(v) => onChange({ ...inputs, depreciation: v })}
          step="5"
          suffix="$M"
        />
        <EditableField
          label="Capital Expenditures"
          value={capex}
          onChange={(v) => onChange({ ...inputs, capex: v })}
          step="5"
          suffix="$M"
        />
        <EditableField
          label="Δ Working Capital"
          value={deltaWorkingCapital}
          onChange={(v) => onChange({ ...inputs, deltaWorkingCapital: v })}
          step="5"
          suffix="$M"
        />
      </div>

      <div className="pt-4 border-t border-border/60">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-slate-500">{row.label}</span>
            <span className="text-slate-300 tabular-nums">
              {row.value >= 0 ? "" : ""}${row.value.toFixed(0)}M
              {row.formula && <span className="text-slate-600 ml-2 text-xs">({row.formula})</span>}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/60">
          <span className="text-slate-200 font-semibold text-sm">Base Year FCF</span>
          <span className="stat-value text-lg text-accent2">${fcf.toFixed(0)}M</span>
        </div>
      </div>
    </div>
  );
}
