# Compounder Screener

Buffett quality + Lynch GARP stock screener for US and India markets, with Beneish M-Score fraud filter, ML-enhanced DCF, and 10-K NLP sentiment analysis.

## UI
- React + Tailwind frontend
- Unit toggle: Million/Billion (international) vs Lakh/Crore (Indian)
- Currency toggle: USD/INR with live FX rate
- Auto-detects display units based on stock's home market

## Structure
- `frontend/index.html` - Vite HTML entry document
- `frontend/package.json` - frontend scripts and dependencies
- `frontend/package-lock.json` - locked dependency versions
- `frontend/vite.config.js` - Vite and port 5500 configuration
- `frontend/src/components/` - shared React components
- `frontend/src/pages/` - dashboard and research workflow pages
- `frontend/src/utils/` - number formatting, FX, and local-time utilities
- `frontend/src/main.jsx` - React application entry point

## Run the frontend
```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5500/` in your browser.

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
