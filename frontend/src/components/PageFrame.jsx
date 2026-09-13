import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  ['Dashboard', '/'],
  ['Screener', '/screener'],
  ['Technical', '/technical'],
  ['Sentiment', '/sentiment'],
  ['DCF / WACC', '/dcf'],
  ['Forward log', '/forward-log'],
];

export default function PageFrame({ eyebrow, title, description, children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Research workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Compounder Screener</h1></div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6" aria-label="Application sections">
          {NAV_ITEMS.map(([label, path]) => <Link key={path} to={path} className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium ${location.pathname === path ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-7"><section><p className="text-sm font-medium text-slate-500">{eyebrow}</p><h2 className="mt-1 text-3xl font-bold tracking-tight">{title}</h2><p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p></section>{children}</main>
    </div>
  );
}

export function Panel({ title, children }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><h3 className="font-semibold">{title}</h3>{children}</section>;
}

export function Field({ label, value, onChange, type = 'number', step = '0.1' }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600" /></label>;
}
