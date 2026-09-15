// Evaluates one stock's data against a criteria set, returning per-check
// pass/fail plus an overall rating. Criteria objects use plain thresholds
// (see screenerCriteria.js) — this function is data-shape agnostic so the
// same evaluator works for both India and US criteria sets.

export function evaluateIndiaLynch(stock, c) {
  const checks = [
    { label: "Market Cap 500-15,000 Cr", pass: stock.marketCap >= c.marketCapMin && stock.marketCap <= c.marketCapMax },
    { label: "PE < Industry PE", pass: stock.pe < stock.industryPe },
    { label: "PE < 5Y Historical PE", pass: stock.pe < stock.historicalPe5Y },
    { label: "5Y Profit Growth > 15%", pass: stock.profitGrowth5Y > c.profitGrowth5YMin },
    { label: "PEG < 1", pass: stock.peg < c.pegMax && stock.peg > 0 },
    {
      label: "PE/(Growth+Div Yield) 0-0.5",
      pass:
        stock.profitGrowth5Y + stock.dividendYield > 0 &&
        stock.pe / (stock.profitGrowth5Y + stock.dividendYield) > c.garpRatioMin &&
        stock.pe / (stock.profitGrowth5Y + stock.dividendYield) < c.garpRatioMax,
    },
    { label: "Debt/Total Assets < 0.25", pass: stock.debtToAssets < c.debtToAssetsMax },
    { label: "DII+FII Holding < 20%", pass: stock.diiHolding + stock.fiiHolding < c.institutionalHoldingMax },
  ];
  return finalize(checks);
}

export function evaluateIndiaBuffett(stock, c) {
  const checks = [
    { label: "Sales > 250 Cr", pass: stock.sales > c.salesMin },
    { label: "Debt/Equity < 0.3", pass: stock.debtToEquity < c.debtToEquityMax },
    { label: "Interest Coverage > 4", pass: stock.interestCoverage > c.interestCoverageMin },
    { label: "ROE > 15%", pass: stock.roe > c.roeMin },
    { label: "PE < Industry PE", pass: stock.pe < stock.industryPe },
    { label: "Dividend Yield > 1%", pass: stock.dividendYield > c.dividendYieldMin },
    { label: "PE < 20", pass: stock.pe < c.peMax },
    { label: "Market Cap > 500 Cr", pass: stock.marketCap > c.marketCapMin },
    { label: "10Y Avg ROE > 15%", pass: stock.roeAvg10Y > c.roeAvg10YMin },
    { label: "10Y Avg ROCE > 12%", pass: stock.rocAvg10Y > c.rocAvg10YMin },
    { label: "FCF (Preceding Year) > 0", pass: stock.fcfPrecedingYear > c.fcfPrecedingYearMin },
  ];
  return finalize(checks);
}

export function evaluateIndiaCombined(stock, c) {
  const checks = [
    { label: "PEG < 1", pass: stock.peg < c.pegMax && stock.peg > 0 },
    { label: "Sales > 500 Cr", pass: stock.sales > c.salesMin },
    { label: "PE < 40", pass: stock.pe < c.peMax },
    { label: "Profit Growth > 20%", pass: stock.profitGrowth5Y > c.profitGrowthMin },
    { label: "Debt/Equity < 0.2", pass: stock.debtToEquity < c.debtToEquityMax },
    { label: "Price/Cash Flow > 5", pass: stock.priceToCashFlow > c.priceToCashFlowMin },
    { label: "Interest Coverage > 4", pass: stock.interestCoverage > c.interestCoverageMin },
    { label: "ROE > 15%", pass: stock.roe > c.roeMin },
    { label: "PE < Industry PE", pass: stock.pe < stock.industryPe },
    { label: "Dividend Yield > 1%", pass: stock.dividendYield > c.dividendYieldMin },
    { label: "PE < 20", pass: stock.pe < c.peBelow20 },
  ];
  return finalize(checks);
}

export function evaluateUsBuffettLynch(stock, c, mode) {
  const buffettChecks = [
    { label: "ROE > 15%", pass: stock.roe > c.roeMin },
    { label: "Debt/Equity < 0.5", pass: stock.debtToEquity < c.debtToEquityMax },
    { label: "Owner Earnings Positive", pass: stock.ownerEarnings > 0 },
  ];
  const lynchChecks = [
    { label: "PEG < 1", pass: stock.peg < c.pegMax && stock.peg > 0 },
    { label: "EPS Growth > 20%", pass: stock.epsGrowth > c.epsGrowthMin },
    { label: "Revenue Growth > Inventory Growth", pass: stock.revenueGrowth > stock.inventoryGrowth },
  ];
  const checks =
    mode === "buffett" ? buffettChecks : mode === "lynch" ? lynchChecks : [...buffettChecks, ...lynchChecks];
  return finalize(checks);
}

function finalize(checks) {
  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const passRate = total ? passed / total : 0;
  let rating;
  if (passRate === 1) rating = "Buy";
  else if (passRate >= 0.7) rating = "Watch";
  else if (passRate >= 0.4) rating = "Caution";
  else rating = "Avoid";
  return { checks, passed, total, passRate, rating };
}
