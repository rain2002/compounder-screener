import React, { useState } from 'react';
import PageFrame, { Field, Panel } from '../components/PageFrame';

export default function ForwardLog() {
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [thesis, setThesis] = useState('');
  return <PageFrame eyebrow="Accountability layer" title="Forward-tracking log" description="Record picks with a date, entry price, and thesis. This keeps the project honest when free data cannot support a point-in-time backtest.">
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]"><Panel title="Log a candidate"><div className="mt-5 space-y-4"><Field label="Ticker" value={ticker} onChange={setTicker} type="text" step="" /><Field label="Entry price" value={price} onChange={setPrice} /><label className="block text-sm font-medium text-slate-700">Investment thesis<textarea value={thesis} onChange={(event) => setThesis(event.target.value)} rows="4" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600" /></label><button className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add to forward log</button></div></Panel><Panel title="Tracked candidates"><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[540px] text-sm"><thead className="text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-3">Ticker</th><th>Logged</th><th>Entry</th><th>Since entry</th><th>Status</th></tr></thead><tbody>{[['AEHR', '13 Sep 2026', '$21.40', '+8.2%', 'Tracking'], ['TCS.NS', '12 Sep 2026', '3,420 INR', '+2.6%', 'Tracking']].map((row) => <tr key={row[0]} className="border-t border-slate-100"><td className="py-3 font-semibold">{row[0]}</td>{row.slice(1).map((value, index) => <td key={`${row[0]}-${index}`} className={value.startsWith('+') ? 'font-semibold text-emerald-700' : ''}>{value}</td>)}</tr>)}</tbody></table></div></Panel></div>
  </PageFrame>;
}
