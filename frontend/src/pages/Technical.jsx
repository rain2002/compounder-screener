import { useState, useMemo } from "react";
import EditableField from "../components/EditableField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import StatCard from "../components/StatCard.jsx";
import PriceHistoryBuilder, { generateDefaultPrices } from "../components/PriceHistoryBuilder.jsx";
import PriceChart from "../components/PriceChart.jsx";
import { computeIndicators } from "../components/TechnicalIndicators.jsx";

export default function Technical() {
  const [ticker, setTicker] = useState("AAPL");
  const [lookback, setLookback] = useState(90);
  const [horizon, setHorizon] = useState(30);
  const [smaWindow, setSmaWindow] = useState(20);
  const [rsiWindow, setRsiWindow] = useState(14);
  const [prices, setPrices] = useState(() => generateDefaultPrices(90, 150));

  function handleLookbackChange(v) {
    const newLookback = Math.max(20, Math.round(v));
    setLookback(newLookback);
    if (newLookback > prices.length) {
      setPrices(generateDefaultPrices(newLookback, prices[0] || 150));
    } else {
      setPrices(prices.slice(prices.length - newLookback));
    }
  }

  const indicators = useMemo(
    () => computeIndicators(prices, smaWindow, rsiWindow, horizon),
    [prices, smaWindow, rsiWindow, horizon]
  );

  const rsiZone =
    indicators.rsiValue === null
      ? "—"
      : indicators.rsiValue >= 70
      ? "Overbought"
      : indicators.rsiValue <= 30
      ? "Oversold"
      : "Neutral";
  const rsiColor =
    indicators.rsiValue === null
      ? "text-slate-400"
      : indicators.rsiValue >= 70
      ? "text-avoid"
      : indicators.rsiValue <= 30
      ? "text-buy"
      : "text-slate-300";

  const forecastEnd = indicators.regression.forecast[indicators.regression.forecast.length - 1];
  const forecastChangePct = forecastEnd
    ? ((forecastEnd.point - indicators.current) / indicators.current) * 100
    : null;

  return (
    <div>
      <PageHeader
        title="Technical Analysis"
        description="Price trend and momentum from a linear regression forecast + SMA + RSI. Full ARIMA/Prophet/LSTM model integration is Phase 4 — this is a lightweight, fully computed v1 in the meantime."
      />

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Ticker</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>
          <EditableField label="Lookback Window" value={lookback} onChange={handleLookbackChange} step="10" suffix="days" />
          <EditableField label="Forecast Horizon" value={horizon} onChange={setHorizon} step="5" suffix="days" />
          <EditableField label="SMA Window" value={smaWindow} onChange={setSmaWindow} step="5" suffix="days" />
        </div>
      </div>

      <PriceHistoryBuilder
        prices={prices}
        onPricesChange={setPrices}
        days={lookback}
        onDaysChange={handleLookbackChange}
      />

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="technical" size={16} className="text-accent2" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              {ticker} — Price + Forecast
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-200 inline-block" /> Price
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-watch inline-block" style={{ borderTop: "1px dashed" }} /> SMA-{smaWindow}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-accent2 inline-block" /> Forecast
            </span>
          </div>
        </div>
        <PriceChart prices={prices} smaSeries={indicators.smaSeries} regression={indicators.regression} horizonDays={horizon} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Price" value={`$${indicators.current.toFixed(2)}`} />
        <StatCard
          label={`vs SMA-${smaWindow}`}
          value={indicators.trend === "above" ? "Above" : "Below"}
          tone={indicators.trend === "above" ? "good" : "bad"}
        />
        <StatCard
          label={`RSI-${rsiWindow}`}
          value={indicators.rsiValue !== null ? indicators.rsiValue.toFixed(0) : "—"}
          tone={rsiZone === "Overbought" ? "bad" : rsiZone === "Oversold" ? "good" : "neutral"}
        />
        <StatCard label="RSI Zone" value={rsiZone} tone={rsiZone === "Overbought" ? "bad" : rsiZone === "Oversold" ? "good" : "neutral"} />
      </div>

      <div className="card p-6 border-2 border-accent/30">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="check" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Forecast Summary
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
              {horizon}-Day Forecast Price
            </p>
            <p className="stat-value text-xl text-accent2">
              {forecastEnd ? `$${forecastEnd.point.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Forecast Range</p>
            <p className="stat-value text-lg text-slate-200">
              {forecastEnd ? `$${forecastEnd.low.toFixed(2)} – $${forecastEnd.high.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Projected Change</p>
            <p className={`stat-value text-xl ${forecastChangePct >= 0 ? "text-buy" : "text-avoid"}`}>
              {forecastChangePct !== null ? `${forecastChangePct >= 0 ? "+" : ""}${forecastChangePct.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">52-Period High / Low</p>
            <p className="stat-value text-sm text-slate-200">
              ${indicators.high.toFixed(2)} / ${indicators.low.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-4 pt-4 border-t border-border/60 leading-relaxed">
          Forecast is a linear regression trend projection with a widening uncertainty band (not
          ARIMA/Prophet/LSTM) — treat this as a rough directional read, not a precise prediction.
          The wider the band at day {horizon}, the less this trend should be trusted that far out.
        </p>
      </div>
    </div>
  );
}
