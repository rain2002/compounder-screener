import Icon from "./Icon.jsx";

function generateDefaultPrices(days, startPrice) {
  const prices = [];
  let price = startPrice;
  for (let i = 0; i < days; i++) {
    const drift = 0.0004;
    const noise = (Math.sin(i * 0.3) * 0.015) + (Math.sin(i * 0.7) * 0.008);
    price = price * (1 + drift + noise);
    prices.push(Math.round(price * 100) / 100);
  }
  return prices;
}

export { generateDefaultPrices };

export default function PriceHistoryBuilder({ prices, onPricesChange, days, onDaysChange }) {
  function updatePrice(index, value) {
    const next = [...prices];
    next[index] = parseFloat(value) || 0;
    onPricesChange(next);
  }

  function regenerate() {
    onPricesChange(generateDefaultPrices(days, prices[0] || 100));
  }

  const recent = prices.slice(-15);
  const offset = prices.length - recent.length;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon name="technical" size={16} className="text-accent2" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Price History ({days} days)
          </h3>
        </div>
        <button
          onClick={regenerate}
          className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
        >
          Regenerate Placeholder Data
        </button>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        Editable daily closing prices — pre-filled with placeholder synthetic data. Replace with
        real OHLCV history from the finance connector once that sync (Phase 4) is wired up. Showing
        the most recent 15 of {days} days below; use the lookback window control to change how many
        days feed the indicators.
      </p>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-wide border-b border-border/60">
              <th className="px-2 py-2 font-medium sticky left-0 bg-surface">Day</th>
              {recent.map((_, i) => (
                <th key={i} className="px-1 py-2 font-medium text-center min-w-[55px]">
                  T-{recent.length - i - 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-2 text-slate-500 sticky left-0 bg-base whitespace-nowrap">
                Close ($)
              </td>
              {recent.map((p, i) => (
                <td key={i} className="px-1 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={p}
                    onChange={(e) => updatePrice(offset + i, e.target.value)}
                    className="w-full bg-black/30 border border-border rounded px-1 py-1 text-slate-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
