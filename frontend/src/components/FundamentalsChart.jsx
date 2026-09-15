import { formatMoney } from "../utils/units.js";

export default function FundamentalsChart({ years, metricKey, metricLabel, forecast, forecastBand }) {
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const historicalValues = years.map((y) => y[metricKey]);
  const forecastValues = forecast.map((f) => f.value);
  const forecastHighValues = forecastBand.map((f) => f.high);
  const forecastLowValues = forecastBand.map((f) => f.low);

  const allValues = [...historicalValues, ...forecastHighValues, ...forecastLowValues, 0];
  const maxV = Math.max(...allValues);
  const minV = Math.min(0, ...allValues);
  const range = maxV - minV || 1;

  const totalPoints = years.length + forecast.length;
  const barSlot = plotWidth / totalPoints;
  const barWidth = barSlot * 0.6;

  function yFor(value) {
    return padding.top + plotHeight - ((value - minV) / range) * plotHeight;
  }

  function xForIndex(index) {
    return padding.left + index * barSlot + barSlot / 2;
  }

  const zeroY = yFor(0);

  const forecastLinePoints = forecast.map((f, i) => {
    const x = xForIndex(years.length + i);
    const y = yFor(f.value);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const connectorStart = xForIndex(years.length - 1);
  const connectorStartY = yFor(historicalValues[historicalValues.length - 1]);
  const linePath = `M${connectorStart.toFixed(1)},${connectorStartY.toFixed(1)} L${forecastLinePoints.join(" L")}`;

  const bandPoints = [];
  bandPoints.push(`${connectorStart.toFixed(1)},${connectorStartY.toFixed(1)}`);
  forecastBand.forEach((f, i) => {
    const x = xForIndex(years.length + i);
    bandPoints.push(`${x.toFixed(1)},${yFor(f.high).toFixed(1)}`);
  });
  for (let i = forecastBand.length - 1; i >= 0; i--) {
    const x = xForIndex(years.length + i);
    bandPoints.push(`${x.toFixed(1)},${yFor(forecastBand[i].low).toFixed(1)}`);
  }
  bandPoints.push(`${connectorStart.toFixed(1)},${connectorStartY.toFixed(1)}`);

  const dividerX = padding.left + years.length * barSlot;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          {metricLabel} — History + Forecast
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-slate-500 inline-block rounded-sm" /> Historical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-accent2 inline-block" /> Forecast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-accent2/20 inline-block rounded-sm" /> ±1σ Range
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72">
        <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="#1f2740" strokeWidth="1" />
        <line
          x1={dividerX}
          y1={padding.top}
          x2={dividerX}
          y2={height - padding.bottom}
          stroke="#364268"
          strokeDasharray="4 4"
          strokeWidth="1"
        />

        <polygon points={bandPoints.join(" ")} fill="rgba(129, 140, 248, 0.15)" />

        {years.map((y, i) => {
          const x = xForIndex(i) - barWidth / 2;
          const v = historicalValues[i];
          const barY = v >= 0 ? yFor(v) : zeroY;
          const barH = Math.abs(yFor(v) - zeroY);
          return (
            <rect
              key={i}
              x={x}
              y={barY}
              width={barWidth}
              height={Math.max(barH, 1)}
              fill="#64748b"
              rx="2"
            />
          );
        })}

        <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="2" />
        {forecast.map((f, i) => {
          const x = xForIndex(years.length + i);
          const y = yFor(f.value);
          return <circle key={i} cx={x} cy={y} r="3" fill="#818cf8" />;
        })}

        {years.map((y, i) => (
          <text
            key={i}
            x={xForIndex(i)}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {y.year}
          </text>
        ))}
        {forecast.map((f, i) => (
          <text
            key={`f-${i}`}
            x={xForIndex(years.length + i)}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            fontSize="10"
            fill="#818cf8"
          >
            +{f.year}
          </text>
        ))}
      </svg>

      <p className="text-slate-600 text-xs mt-2">
        Gray bars are entered history. Purple line is the guardrailed forecast; shaded band is the
        ±1σ uncertainty range, same widening-with-horizon principle as the DCF Monte Carlo band.
      </p>
    </div>
  );
}
