// Placeholder sample data for UI testing. Real data should come from the
// `finance` connector sync (US, Phase 2) or a trusted India data source
// once wired up on the backend — this is NOT live market data.

export const SAMPLE_INDIA_STOCKS = [
  {
    ticker: "TESTCO1", name: "Test Industries Ltd", sector: "Industrials",
    marketCap: 4200, sales: 1850, pe: 18, industryPe: 24, historicalPe5Y: 22,
    profitGrowth5Y: 22, peg: 0.75, dividendYield: 1.2, debtToAssets: 0.18,
    diiHolding: 8, fiiHolding: 6, debtToEquity: 0.22, interestCoverage: 9,
    roe: 19, roeAvg10Y: 17, rocAvg10Y: 15, fcfPrecedingYear: 145,
    priceToCashFlow: 14,
  },
  {
    ticker: "SAMPLE2", name: "Sample Chemicals Ltd", sector: "Chemicals",
    marketCap: 8900, sales: 3200, pe: 28, industryPe: 22, historicalPe5Y: 20,
    profitGrowth5Y: 12, peg: 1.4, dividendYield: 0.6, debtToAssets: 0.35,
    diiHolding: 15, fiiHolding: 12, debtToEquity: 0.42, interestCoverage: 3.2,
    roe: 11, roeAvg10Y: 12, rocAvg10Y: 10, fcfPrecedingYear: -20,
    priceToCashFlow: 3,
  },
  {
    ticker: "DEMO3", name: "Demo Consumer Goods", sector: "FMCG",
    marketCap: 12500, sales: 4100, pe: 19, industryPe: 26, historicalPe5Y: 24,
    profitGrowth5Y: 18, peg: 0.68, dividendYield: 1.8, debtToAssets: 0.12,
    diiHolding: 5, fiiHolding: 9, debtToEquity: 0.15, interestCoverage: 15,
    roe: 24, roeAvg10Y: 22, rocAvg10Y: 19, fcfPrecedingYear: 310,
    priceToCashFlow: 16,
  },
];

export const SAMPLE_US_STOCKS = [
  {
    ticker: "AAPL", name: "Apple Inc", sector: "Technology",
    roe: 28, debtToEquity: 1.2, ownerEarnings: 95000, peg: 1.8,
    epsGrowth: 8, revenueGrowth: 5, inventoryGrowth: 3,
  },
  {
    ticker: "KO", name: "Coca-Cola Co", sector: "Consumer Staples",
    roe: 42, debtToEquity: 1.6, ownerEarnings: 9800, peg: 2.9,
    epsGrowth: 4, revenueGrowth: 6, inventoryGrowth: 4,
  },
  {
    ticker: "SAMPLE_GROWTH", name: "Sample Growth Co", sector: "Technology",
    roe: 22, debtToEquity: 0.3, ownerEarnings: 1200, peg: 0.9,
    epsGrowth: 26, revenueGrowth: 24, inventoryGrowth: 10,
  },
];
