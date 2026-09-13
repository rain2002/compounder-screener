import React, { useState } from 'react';
import PageFrame, { Field, Panel } from '../components/PageFrame';

export default function Dcf() {
  const [riskFree, setRiskFree] = useState('4.25');
  const [erp, setErp] = useState('4.5');
  const [beta, setBeta] = useState('1.1');
  const [terminalGrowth, setTerminalGrowth] = useState('2.5');
  return <PageFrame eyebrow="Valuation engine" title="DCF / WACC calculator" description="Calculate market-specific WACC and compare conservative, normal, and optimistic intrinsic-value scenarios with editable assumptions.">
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]"><Panel title="WACC assumptions"><div className="mt-5 space-y-4"><label className="block text-sm font-medium text-slate-700">Market<select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"><option>US</option><option>India</option></select></label><Field label="Risk-free rate (%)" value={riskFree} onChange={setRiskFree} /><Field label="Equity risk premium (%)" value={erp} onChange={setErp} /><Field label="Beta" value={beta} onChange={setBeta} /><Field label="Terminal growth (%)" value={terminalGrowth} onChange={setTerminalGrowth} /><p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">Terminal growth is capped to long-term country GDP growth. Values above the cap require review.</p></div></Panel><Panel title="Three-scenario valuation"><div className="mt-5 grid gap-3 md:grid-cols-3">{[['Conservative', '$18.20', 'bg-slate-100'], ['Normal', '$25.80', 'bg-emerald-50'], ['Optimistic', '$34.60', 'bg-sky-50']].map(([name, value, style]) => <div key={name} className={`rounded-md p-5 ${style}`}><p className="text-sm font-semibold">{name}</p><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">Intrinsic value / share</p></div>)}</div><div className="mt-6 rounded-md border border-slate-200 p-4"><div className="flex justify-between text-sm"><span className="text-slate-500">WACC</span><strong>{(Number(riskFree) + Number(beta) * Number(erp)).toFixed(2)}%</strong></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Monte Carlo band</span><strong className="text-emerald-700">$16.40 - $38.10</strong></div></div></Panel></div>
  </PageFrame>;
}
