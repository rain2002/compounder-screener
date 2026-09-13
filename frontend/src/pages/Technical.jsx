import { useState } from "react";
import EditableField from "../components/EditableField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

export default function Technical() {
  const [lookback, setLookback] = useState(90);
  const [horizon, setHorizon] = useState(30);
  const [ticker, setTicker] = useState("AAPL");

  return (
    <div>
      <PageHeader
        title="Technical Analysis"
        description="Price trend and forecast models (ARIMA / Prophet / LSTM) plug in here. Model integration is Phase 4 of the build plan."
      />

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Ticker</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>
          <EditableField label="Lookback Window" value={lookback} onChange={setLookback} step="1" suffix="days" />
          <EditableField label="Forecast Horizon" value={horizon} onChange={setHorizon} step="1" suffix="days" />
        </div>
      </div>

      <div className="card p-16 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Icon name="technical" className="w-6 h-6 text-accent2" />
        </div>
        <p className="text-slate-400 text-sm mb-1">
          Price chart + forecast band for <span className="font-semibold text-slate-200">{ticker}</span>
        </p>
        <p className="text-slate-600 text-xs">
          Lookback: {lookback}d · Horizon: {horizon}d — renders once the model service connects
        </p>
      </div>
    </div>
  );
}
