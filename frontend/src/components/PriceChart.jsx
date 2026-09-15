export default function PriceChart({ prices, smaSeries, regression, horizonDays }) {
  const width = 800;
  const height = 260;
  const padding = 30;

  const forecastPoints = regression.forecast.map((f) => f.point);
  const forecastLow = regression.forecast.map((f) => f.low);
  const forecastHigh = regression.forecast.map((f) => f.high);

  const allValues = [
    ...prices,
    ...smaSeries.filter((v) => v !== null),
    ...forecastHigh,
    ...forecastLow,
  ];
  const maxV = Math.max(...allValues);
  const minV = Math.min(...allValues);
  const range = maxV - minV || 1;

  const totalPoints = prices.length + horizonDays;
  const xStep = (width - padding * 2) / (totalPoints - 1);

  function toXY(index, value) {
    const x = padding + index * xStep;
    const y = height - padding - ((value - minV) / range) * (height - padding * 2);
    return [x, y];
  }

  function pathFrom(values, startIndex = 0) {
    let d = "";
    values.forEach((v, i) => {
      if (v === null || v === undefined) return;
      const [x, y] = toXY(startIndex + i, v);
      d += (d === "" ? "M" : "L") + `${x.toFixed(1)},${y.toFixed(1)} `;
    });
    return d;
  }

  const pricePath = pathFrom(prices);
  const smaPath = pathFrom(smaSeries);
  const forecastPath = pathFrom(forecastPoints, prices.length - 1);
  const forecastLowPath = pathFrom(forecastLow, prices.length - 1);
  const forecastHighPath = pathFrom(forecastHigh, prices.length - 1);

  const bandPoints = [];
  forecastHigh.forEach((v, i) => {
    const [x, y] = toXY(prices.length - 1 + i, v);
    bandPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  for (let i = forecastLow.length - 1; i >= 0; i--) {
    const [x, y] = toXY(prices.length - 1 + i, forecastLow[i]);
    bandPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const dividerX = padding + (prices.length - 1) * xStep;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
      <polygon points={bandPoints.join(" ")} fill="rgba(129, 140, 248, 0.12)" />
      <line
        x1={dividerX}
        y1={padding}
        x2={dividerX}
        y2={height - padding}
        stroke="#364268"
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <path d={pricePath} fill="none" stroke="#e2e8f0" strokeWidth="1.75" />
      <path d={smaPath} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d={forecastPath} fill="none" stroke="#818cf8" strokeWidth="1.75" />
      <path d={forecastHighPath} fill="none" stroke="#818cf8" strokeWidth="0.75" opacity="0.5" />
      <path d={forecastLowPath} fill="none" stroke="#818cf8" strokeWidth="0.75" opacity="0.5" />
    </svg>
  );
}
