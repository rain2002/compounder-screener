import { useState } from "react";
import EditableField from "../components/EditableField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import WaccCalculator from "../components/WaccCalculator.jsx";

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
  const [fcf, setFcf] = useState(1000);
  const [wacc, setWacc] = useState(9);
  const [shares, setShares] = useState(100);
  const [growth, setGrowth] = useState({ conservative: 5, normal: 10, optimistic: 15 });
  const [terminalGrowth, setTerminalGrowth] = useState(GDP_CAPS.US);

  const cap = GDP_CAPS[market];
  const exceedsCap = terminalGrowth > cap;

  const scenarios = ["conservative", "normal", "optimistic"].map((key) => {
    const value = computeScenario(fcf, growth[key], terminalGrowth, wacc);
    return { key, growth: growth[key], value, perShare: value && shares ? value / shares : null };
  });

  return (
    <div>
      <PageHeader
        title="DCF Calculator"
        description="Rule-based v1 — three scenarios computed live from your inputs. ML forecasting and Monte Carlo bands arrive in a later phase."
      />

      <WaccCalculator market={market} onWaccChange={setWacc} />

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">DCF Inputs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <EditableField label="Current FCF" value={fcf} onChange={setFcf} step="10" suffix="$M" />
          <EditableField label="WACC (from calculator above, or edit manually)" value={wacc} onChange={setWacc} suffix="%" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => (
          <div key={s.key} className={`card ${scenarioStyle[s.key]} p-5`}>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
              {s.key}
            </p>
            <p className="text-slate-400 text-xs mb-3">{s.growth}% growth</p>
            <p className="stat-value text-2xl text-white mb-1">
              {s.value ? `$${s.value.toFixed(0)}M` : "—"}
            </p>
            <p className="text-slate-500 text-sm">
              {s.perShare ? `$${s.perShare.toFixed(2)} / share` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
