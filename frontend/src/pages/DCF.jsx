import { useState } from "react";
import EditableField from "../components/EditableField.jsx";

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

export default function DCF() {
  const [market, setMarket] = useState("US");
  const [fcf, setFcf] = useState(1000);
  const [wacc, setWacc] = useState(9);
  const [shares, setShares] = useState(100);

  const [growth, setGrowth] = useState({ conservative: 5, normal: 10, optimistic: 15 });
  const [terminalGrowth, setTerminalGrowth] = useState(GDP_CAPS[market]);

  const cap = GDP_CAPS[market];
  const exceedsCap = terminalGrowth > cap;

  const scenarios = ["conservative", "normal", "optimistic"].map((key) => {
    const value = computeScenario(fcf, growth[key], terminalGrowth, wacc);
    return { key, growth: growth[key], value, perShare: value && shares ? value / shares : null };
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">DCF Calculator</h2>
      <p className="text-slate-400 text-sm mb-6">
        Rule-based v1 — 3 scenarios computed live. ML forecast layer (XGBoost) and Monte Carlo
        band come in a later phase per the build plan.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-900 p-4 rounded border border-slate-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Market</span>
          <select
            value={market}
            onChange={(e) => {
              setMarket(e.target.value);
              setTerminalGrowth(GDP_CAPS[e.target.value]);
            }}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
          >
            <option value="US">US</option>
            <option value="INDIA">India</option>
          </select>
        </label>
        <EditableField label="Current FCF ($M)" value={fcf} onChange={setFcf} step="10" />
        <EditableField label="WACC (%)" value={wacc} onChange={setWacc} />
        <EditableField label="Shares Outstanding (M)" value={shares} onChange={setShares} step="1" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <EditableField
          label="Conservative growth (%)"
          value={growth.conservative}
          onChange={(v) => setGrowth({ ...growth, conservative: v })}
        />
        <EditableField
          label="Normal growth (%)"
          value={growth.normal}
          onChange={(v) => setGrowth({ ...growth, normal: v })}
        />
        <EditableField
          label="Optimistic growth (%)"
          value={growth.optimistic}
          onChange={(v) => setGrowth({ ...growth, optimistic: v })}
        />
      </div>

      <div className="mb-6">
        <EditableField
          label={`Terminal growth (%) — capped to ${market} GDP growth ~${cap}%`}
          value={terminalGrowth}
          onChange={setTerminalGrowth}
        />
        {exceedsCap && (
          <p className="text-caution text-xs mt-1">
            Warning: terminal growth exceeds the {market} long-term GDP growth cap of {cap}%.
          </p>
        )}
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="py-2 pr-4">Scenario</th>
            <th className="py-2 pr-4">Growth Rate</th>
            <th className="py-2 pr-4">Intrinsic Value ($M)</th>
            <th className="py-2 pr-4">Per Share</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.key} className="border-b border-slate-800">
              <td className="py-2 pr-4 capitalize">{s.key}</td>
              <td className="py-2 pr-4">{s.growth}%</td>
              <td className="py-2 pr-4">{s.value ? s.value.toFixed(1) : "—"}</td>
              <td className="py-2 pr-4">{s.perShare ? `$${s.perShare.toFixed(2)}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
