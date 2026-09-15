// India thresholds are in ₹ Crore for market cap / sales, sourced directly
// from user-provided Screener.in-style criteria. US thresholds use standard
// Buffett/Lynch benchmarks (USD $M) since India's accounting/ownership
// disclosure norms (DII/FII holding) don't apply to US equities.

export const INDIA_LYNCH = {
  marketCapMin: 500,
  marketCapMax: 15000,
  peBelowIndustry: true,
  peBelow5YHistorical: true,
  profitGrowth5YMin: 15,
  pegMax: 1,
  garpRatioMin: 0,
  garpRatioMax: 0.5,
  debtToAssetsMax: 0.25,
  institutionalHoldingMax: 20,
};

export const INDIA_BUFFETT = {
  salesMin: 250,
  debtToEquityMax: 0.3,
  interestCoverageMin: 4,
  roeMin: 15,
  peBelowIndustry: true,
  dividendYieldMin: 1,
  peMax: 20,
  marketCapMin: 500,
  roeAvg10YMin: 15,
  rocAvg10YMin: 12,
  fcfPrecedingYearMin: 0,
};

export const INDIA_COMBINED = {
  pegMax: 1,
  salesMin: 500,
  peMax: 40,
  profitGrowthMin: 20,
  debtToEquityMax: 0.2,
  priceToCashFlowMin: 5,
  interestCoverageMin: 4,
  roeMin: 15,
  peBelowIndustry: true,
  dividendYieldMin: 1,
  peBelow20: 20,
};

export const US_LYNCH = {
  pegMax: 1,
  epsGrowthMin: 20,
  revenueGrowthAboveInventoryGrowth: true,
  debtToEquityMax: 0.5,
};

export const US_BUFFETT = {
  roeMin: 15,
  debtToEquityMax: 0.5,
  marginStabilityYears: 7,
  ownerEarningsPositive: true,
};

export const SCREENER_MODES = {
  india: [
    { key: "lynch", label: "Lynch (GARP)", criteria: INDIA_LYNCH },
    { key: "buffett", label: "Buffett (Quality)", criteria: INDIA_BUFFETT },
    { key: "combined", label: "Combined (Experimental)", criteria: INDIA_COMBINED },
  ],
  us: [
    { key: "buffett_lynch", label: "Buffett + Lynch (Combined)", criteria: { ...US_BUFFETT, ...US_LYNCH } },
    { key: "buffett", label: "Buffett (Quality) Only", criteria: US_BUFFETT },
    { key: "lynch", label: "Lynch (GARP) Only", criteria: US_LYNCH },
  ],
};
