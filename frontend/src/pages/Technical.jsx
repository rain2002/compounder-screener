import { useState } from "react";
import EditableField from "../components/EditableField.jsx";

export default function Technical() {
  const [lookback, setLookback] = useState(90);
  const [horizon, setHorizon] = useState(30);
  const [ticker, setTicker] = useState("AAPL");

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Technical Analysis</h2>
      <p className="text-slate-400 text-sm mb-6">
        Price trend + forecast models (ARIMA/Prophet/LSTM) plug in here — placeholder UI wired
        for editable inputs now, model integration is Phase 4 of the build plan.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-900 p-4 rounded border border-slate-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Ticker</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
          />
        </label>
        <EditableField label="Lookback window (days)" value={lookback} onChange={setLookback} step="1" />
        <EditableField label="Forecast horizon (days)" value={horizon} onChange={setHorizon} step="1" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded p-8 text-center text-slate-500">
        Price chart + forecast band for {ticker} will render here once the model service is
        connected (lookback: {lookback}d, horizon: {horizon}d).
      </div>
    </div>
  );
}
