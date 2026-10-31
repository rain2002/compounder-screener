import { formatMoney } from "../utils/units.js";

export default function FundamentalsChart({ years, metricKey, metricLabel, forecast, forecastBand }) {
  const width = 800;
  const height = 280;
  const padding = { top: 24, right: 24, bottom: 40, left: 24 };
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
  const barWidth = barSlot * 0.55;

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-semibold text-white">
            {metricLabel} — History &amp; Forecast Trajectory
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Historical reported levels paired with forward projection and dispersion envelope.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-700 inline-block rounded-sm" /> Historical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Forecast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-400/20 inline-block rounded-sm" /> ±1σ Uncertainty
          </span>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 sm:h-72">
          {/* Base Grid Line */}
          <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line
            x1={dividerX}
            y1={padding.top}
            x2={dividerX}
            y2={height - padding.bottom}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Uncertainty Envelope */}
          <polygon points={bandPoints.join(" ")} fill="rgba(56, 189, 248, 0.12)" />

          {/* Historical Bars */}
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
                fill="#27272a"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                rx="2"
              />
            );
          })}

          {/* Forecast Path */}
          <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2" />
          {forecast.map((f, i) => {
            const x = xForIndex(years.length + i);
            const y = yFor(f.value);
            return <circle key={i} cx={x} cy={y} r="3" fill="#38bdf8" />;
          })}

          {/* X Axis Labels */}
          {years.map((y, i) => (
            <text
              key={i}
              x={xForIndex(i)}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              fontSize="10"
              fontFamily="sans-serif"
              fill="#71717a"
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
              fontFamily="sans-serif"
              fill="#38bdf8"
              fontWeight="bold"
            >
              +{f.year}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
