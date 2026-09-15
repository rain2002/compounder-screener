import { useState } from "react";
import EditableField from "../components/EditableField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import WaccCalculator from "../components/WaccCalculator.jsx";
import MonteCarloDCF from "../components/MonteCarloDCF.jsx";
import FcfBuilder from "../components/FcfBuilder.jsx";

const GDP_CAPS = { US: 2.5, INDIA: 7.0 };

function computeScenario(fcf, growthRate, terminalGrowth, wacc, years = 5) {
  if (!fcf || !wacc || wacc <= terminalGrowth) return null;
  let pv = 0;
  let cf = fcf;
  for (let y = 1; y <= years; y++) {
    cf = cf * (1 + growthRate / 100);
    pv += cf / Math.pow(1 + wacc / 100, y);
  }
  const terminalValue = (cf * (1 + terminalGrowth / 100)) / (wacc / 100 - terminalGrowth / 100);
  const pvTerminal = terminalValue / Math.pow(1 + wacc / 100, years);
  return pv + pvTerminal;
}

const scenarioStyle = {
  conservative: "border-l-4 border-l-slate-500",
  normal: "border-l-4 border-l-accent",
  optimistic: "border-l-4 border-l-buy",
};

export default function DCF() {
  const [market, setMarket] = useState("US");
  const [currentPrice, setCurrentPrice] = useState(150);
  const [fcf, setFcf] = useState(1000);
  const [wacc, setWacc] = useState(9);
  const [shares, setShares] = useState(100);
  const [growth, setGrowth] = useState({ conservative: 5, normal: 10, optimistic: 15 });
  const [terminalGrowth, setTerminalGrowth] = useState(GDP_CAPS.US);
  const [marginOfSafety, setMarginOfSafety] = useState(20);
  const [medianIntrinsicValue, setMedianIntrinsicValue] = useState(null);

  const [fcfInputs, setFcfInputs] = useState({
    revenue: 5000,
    ebitMargin: 25,
    taxRate: 21,
    depreciation: 200,
    capex: 250,
    deltaWorkingCapital: 30,
  });

  const cap = GDP_CAPS[market];
  const exceedsCap = terminalGrowth > cap;

  const scenarios = ["conservative", "normal", "optimistic"].map((key) => {
    const value = computeScenario(fcf, growth[key], terminalGrowth, wacc);
    const perShare = value && shares ? value / shares : null;
    const upside = perShare && currentPrice ? ((perShare - currentPrice) / currentPrice) * 100 : null;
    return { key, growth: growth[key], value, perShare, upside };
  });

  const safeBuyPrice = medianIntrinsicValue ? medianIntrinsicValue * (1 - marginOfSafety / 100) : null;
  const currentMarginOfSafety = medianIntrinsicValue && currentPrice
    ? ((medianIntrinsicValue - currentPrice) / medianIntrinsicValue) * 100
    : null;

  return (
    <div>
      <PageHeader
        title="DCF Calculator"
        description="Full build-up from FCF fundamentals through WACC, 3 scenarios, and Monte Carlo uncertainty — ending in a Buy/Watch/Caution read against the current price."
      />

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
              Current Share Price
            </p>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="bg-transparent text-3xl font-bold text-white w-40 focus:outline-none border-b border-transparent focus:border-accent"
              />
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Market</span>
            <select
              value={market}
              onChange={(e) => {
                setMarket(e.target.value);
                setTerminalGrowth(GDP_CAPS[e.target.value]);
              }}
              className="bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="US">United States</option>
              <option value="INDIA">India</option>
            </select>
          </label>
        </div>
      </div>

      <FcfBuilder inputs={fcfInputs} onChange={setFcfInputs} onFcfChange={setFcf} />

      <WaccCalculator market={market} onWaccChange={setWacc} />

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">DCF Inputs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="Base Year FCF (from build-up above)" value={fcf} onChange={setFcf} step="10" suffix="$M" />
          <EditableField label="WACC (auto-synced, editable)" value={wacc} onChange={setWacc} suffix="%" />
          <EditableField label="Shares Outstanding" value={shares} onChange={setShares} step="1" suffix="M" />
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Growth Assumptions</h3>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <EditableField
            label="Conservative"
            value={growth.conservative}
            onChange={(v) => setGrowth({ ...growth, conservative: v })}
            suffix="%"
          />
          <EditableField
            label="Normal"
            value={growth.normal}
            onChange={(v) => setGrowth({ ...growth, normal: v })}
            suffix="%"
          />
          <EditableField
            label="Optimistic"
            value={growth.optimistic}
            onChange={(v) => setGrowth({ ...growth, optimistic: v })}
            suffix="%"
          />
        </div>
        <EditableField
          label={`Terminal Growth — capped to ${market} GDP (~${cap}%)`}
          value={terminalGrowth}
          onChange={setTerminalGrowth}
          suffix="%"
        />
        {exceedsCap && (
          <div className="flex items-center gap-2 mt-2.5">
            <Icon name="warn" size={16} className="text-caution" />
            <p className="text-caution text-xs font-medium">
              Exceeds the {market} long-term GDP growth cap of {cap}%
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((s) => (
          <div key={s.key} className={`card ${scenarioStyle[s.key]} p-5`}>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
              {s.key}
            </p>
            <p className="text-slate-400 text-xs mb-3">{s.growth}% growth</p>
            <p className="stat-value text-2xl text-white mb-1">
              {s.perShare ? `$${s.perShare.toFixed(2)}` : "—"}
            </p>
            <p className="text-slate-500 text-sm mb-2">
              {s.value ? `$${s.value.toFixed(0)}M total` : "—"}
            </p>
            {s.upside !== null && (
              <p className={`text-sm font-semibold ${s.upside >= 0 ? "text-buy" : "text-avoid"}`}>
                {s.upside >= 0 ? "+" : ""}{s.upside.toFixed(1)}% {s.upside >= 0 ? "upside" : "downside"}
              </p>
            )}
          </div>
        ))}
      </div>

      <MonteCarloDCF
        fcf={fcf}
        waccMean={wacc}
        terminalGrowth={terminalGrowth}
        shares={shares}
        growthMean={growth.normal}
        currentPrice={currentPrice}
        onMedianChange={setMedianIntrinsicValue}
      />

      <div className="card p-6 border-2 border-accent/30">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="check" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Evaluation Summary
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Current Price</p>
            <p className="stat-value text-xl text-slate-200">${currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Median Intrinsic Value</p>
            <p className="stat-value text-xl text-accent2">
              {medianIntrinsicValue ? `$${medianIntrinsicValue.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Current Margin of Safety</p>
            <p className={`stat-value text-xl ${currentMarginOfSafety >= 0 ? "text-buy" : "text-avoid"}`}>
              {currentMarginOfSafety !== null ? `${currentMarginOfSafety >= 0 ? "+" : ""}${currentMarginOfSafety.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <EditableField
              label="Target Margin of Safety"
              value={marginOfSafety}
              onChange={setMarginOfSafety}
              suffix="%"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
              Suggested Max Buy Price (at {marginOfSafety}% cushion)
            </p>
            <p className="stat-value text-2xl text-white">
              {safeBuyPrice ? `$${safeBuyPrice.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="text-right max-w-sm">
            <p className="text-slate-400 text-sm leading-relaxed">
              {currentMarginOfSafety === null
                ? "Waiting on Monte Carlo simulation to compute median intrinsic value."
                : currentMarginOfSafety >= marginOfSafety
                ? "Current price sits below your target cushion — statistically attractive entry per this model."
                : currentMarginOfSafety >= 0
                ? "Some margin of safety exists, but below your target cushion. Treat as a Watch, not a Buy."
                : "Current price exceeds the model's median intrinsic value. No margin of safety at this price."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
