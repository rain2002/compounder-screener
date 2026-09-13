import React, { useState } from 'react';
import PageFrame, { Field, Panel } from '../components/PageFrame';

export default function Technical() {
  const [lookback, setLookback] = useState('180');
  const [horizon, setHorizon] = useState('30');
  return <PageFrame eyebrow="Forecast model" title="Technical analysis" description="Compare price trend and forecast assumptions before they feed the variance layer. Model outputs remain estimates, not trading signals.">
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]"><Panel title="Model inputs"><div className="mt-5 space-y-4"><Field label="Lookback window (days)" value={lookback} onChange={setLookback} step="1" /><Field label="Forecast horizon (days)" value={horizon} onChange={setHorizon} step="1" /><label className="block text-sm font-medium text-slate-700">Model<select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"><option>ARIMA</option><option>Prophet</option><option>LSTM</option></select></label><button className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Run forecast</button></div></Panel><Panel title="AEHR price forecast"><div className="mt-5 h-64 rounded-md border border-dashed border-slate-300 bg-slate-50 p-5"><div className="flex h-full items-end gap-2">{[38, 48, 42, 55, 52, 65, 72, 68, 78, 88, 82, 94].map((height, index) => <div key={index} className="flex-1 rounded-t-sm bg-emerald-500" style={{ height: `${height}%` }} />)}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Current</p><p className="text-xl font-bold">$21.40</p></div><div><p className="text-xs text-slate-500">Forecast median</p><p className="text-xl font-bold text-emerald-700">$25.80</p></div><div><p className="text-xs text-slate-500">Confidence</p><p className="text-xl font-bold">68%</p></div></div></Panel></div>
  </PageFrame>;
}
