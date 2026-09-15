import EditableField from "./EditableField.jsx";
import Icon from "./Icon.jsx";

const FIELD_LABELS = {
  marketCapMin: { label: "Market Cap Min", suffix: "" },
  marketCapMax: { label: "Market Cap Max", suffix: "" },
  profitGrowth5YMin: { label: "5Y Profit Growth Min", suffix: "%" },
  pegMax: { label: "PEG Max", suffix: "" },
  garpRatioMin: { label: "GARP Ratio Min", suffix: "" },
  garpRatioMax: { label: "GARP Ratio Max", suffix: "" },
  debtToAssetsMax: { label: "Debt/Assets Max", suffix: "" },
  institutionalHoldingMax: { label: "DII+FII Holding Max", suffix: "%" },
  salesMin: { label: "Sales Min", suffix: "" },
  debtToEquityMax: { label: "Debt/Equity Max", suffix: "" },
  interestCoverageMin: { label: "Interest Coverage Min", suffix: "x" },
  roeMin: { label: "ROE Min", suffix: "%" },
  dividendYieldMin: { label: "Dividend Yield Min", suffix: "%" },
  peMax: { label: "PE Max", suffix: "" },
  roeAvg10YMin: { label: "10Y Avg ROE Min", suffix: "%" },
  rocAvg10YMin: { label: "10Y Avg ROCE Min", suffix: "%" },
  fcfPrecedingYearMin: { label: "FCF (Prior Year) Min", suffix: "" },
  profitGrowthMin: { label: "Profit Growth Min", suffix: "%" },
  priceToCashFlowMin: { label: "Price/Cash Flow Min", suffix: "x" },
  peBelow20: { label: "PE Below", suffix: "" },
  epsGrowthMin: { label: "EPS Growth Min", suffix: "%" },
  marginStabilityYears: { label: "Margin Stability Window", suffix: "yrs" },
};

const BOOLEAN_LABELS = {
  peBelowIndustry: "PE < Industry PE",
  peBelow5YHistorical: "PE < 5Y Historical PE",
  revenueGrowthAboveInventoryGrowth: "Revenue Growth > Inventory Growth",
  ownerEarningsPositive: "Owner Earnings Positive",
};

export default function CriteriaEditor({ criteria, onChange, onReset }) {
  const numericFields = Object.keys(criteria).filter(
    (k) => typeof criteria[k] === "number" && FIELD_LABELS[k]
  );
  const booleanFields = Object.keys(criteria).filter(
    (k) => typeof criteria[k] === "boolean" && BOOLEAN_LABELS[k]
  );

  function updateField(key, value) {
    onChange({ ...criteria, [key]: value });
  }

  function toggleField(key) {
    onChange({ ...criteria, [key]: !criteria[key] });
  }

  return (
    <div className="card p-6 mb-6 border border-accent/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="wacc" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Edit Thresholds
          </h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
        >
          Reset to Default
        </button>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Every number below drives the pass/fail checks in the table. Change anything and results
        recompute live — your edits apply only to this session unless you reset.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {numericFields.map((key) => (
          <EditableField
            key={key}
            label={FIELD_LABELS[key].label}
            value={criteria[key]}
            onChange={(v) => updateField(key, v)}
            step={criteria[key] < 5 ? "0.05" : "1"}
            suffix={FIELD_LABELS[key].suffix}
          />
        ))}
      </div>

      {booleanFields.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-3 border-t border-border/60">
          {booleanFields.map((key) => (
            <label key={key} className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={criteria[key]}
                onChange={() => toggleField(key)}
                className="rounded accent-accent"
              />
              {BOOLEAN_LABELS[key]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
