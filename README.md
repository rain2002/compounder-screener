# Compounder Screener

Buffett quality + Lynch GARP stock screener for US and India markets, with Beneish M-Score fraud filter, ML-enhanced DCF, and 10-K NLP sentiment analysis.

## UI
- React + Tailwind frontend
- Unit toggle: Million/Billion (international) vs Lakh/Crore (Indian)
- Currency toggle: USD/INR with live FX rate
- Auto-detects display units based on stock's home market

## Structure
- `src/utils/unitConversion.js` - core number formatting + FX fetch
- `src/components/UnitToggle.jsx` - toggle bar UI
- `src/pages/Dashboard.jsx` - ranked watchlist view

## Pipeline (in progress)
1. Universe filter (SQL screener)
2. Beneish M-Score fraud filter
3. Buffett quality scoring (owner earnings, ROE, sector-normalized)
4. ML cash flow/earnings forecast (pooled XGBoost) feeding DCF
5. 10-K NLP sentiment + consistency scoring
6. Lynch GARP scoring
7. WACC calculator + Monte Carlo DCF
8. Liquidity filter
9. Manual review layer + forward-tracking log
