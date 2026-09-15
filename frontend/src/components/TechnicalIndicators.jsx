function sma(prices, window) {
  const result = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    const slice = prices.slice(i - window + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / window);
  }
  return result;
}

function rsi(prices, window = 14) {
  if (prices.length < window + 1) return null;
  const changes = [];
  for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);
  const recent = changes.slice(-window);
  const gains = recent.filter((c) => c > 0);
  const losses = recent.filter((c) => c < 0).map((c) => -c);
  const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / window : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / window : 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function linearRegressionForecast(prices, horizonDays) {
  const n = prices.length;
  const xs = prices.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = prices.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (prices[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  const residuals = prices.map((p, i) => p - (slope * i + intercept));
  const residualStd = Math.sqrt(residuals.reduce((a, b) => a + b * b, 0) / n);

  const forecast = [];
  for (let h = 1; h <= horizonDays; h++) {
    const x = n - 1 + h;
    const point = slope * x + intercept;
    const spread = residualStd * Math.sqrt(h) * 1.5;
    forecast.push({ day: h, point, low: point - spread, high: point + spread });
  }
  return { slope, intercept, forecast, residualStd };
}

export function computeIndicators(prices, smaWindow, rsiWindow, horizonDays) {
  const smaSeries = sma(prices, smaWindow);
  const rsiValue = rsi(prices, rsiWindow);
  const regression = linearRegressionForecast(prices, horizonDays);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const current = prices[prices.length - 1];
  const currentSma = smaSeries[smaSeries.length - 1];
  const trend = current > currentSma ? "above" : "below";
  const dailyDrift = regression.slope;
  const annualizedTrendPct = (Math.pow(1 + dailyDrift / current, 252) - 1) * 100;

  return {
    smaSeries,
    rsiValue,
    regression,
    high,
    low,
    current,
    currentSma,
    trend,
    annualizedTrendPct,
  };
}
