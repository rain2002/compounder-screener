# Compounder Screener

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

Buffett quality + Lynch GARP stock screener for US and India markets, with Beneish M-Score fraud filter, ML-enhanced DCF, and 10-K NLP sentiment analysis.

## UI & Architecture
- Modern architectural Neozen dark theme
- React + Tailwind frontend
- Unit toggle: Million/Billion (international) vs Lakh/Crore (Indian)
- Currency toggle: USD/INR with live FX rate
- Auto-detects display units based on stock's home market

## Structure
- `frontend/index.html` - Vite HTML entry document
- `frontend/package.json` - frontend scripts and dependencies
- `frontend/src/components/` - shared React components
- `frontend/src/pages/` - dashboard and research workflow pages
- `frontend/src/utils/` - number formatting, FX, and local-time utilities
- `backend/app/` - FastAPI backend application and ML models
- `start.bat` - unified simultaneous startup script

## Quick Launch
Run `start.bat` from the root directory or start services individually:
```powershell
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Pipeline
1. Universe filter (SQL screener)
2. Beneish M-Score fraud filter
3. Buffett quality scoring (owner earnings, ROE, sector-normalized)
4. ML cash flow/earnings forecast (pooled XGBoost) feeding DCF
5. 10-K NLP sentiment + consistency scoring
6. Lynch GARP scoring
7. WACC calculator + Monte Carlo DCF
8. Liquidity filter
9. Manual review layer + forward-tracking log

## License & Copyright

Copyright (C) 2026 Raja Nithin (<nitinbatchu15@gmail.com>).

This project is licensed under the **GNU Affero General Public License v3.0 (GNU AGPLv3)**.

### Freedom & Anti-Privatization Guarantee:
- **Anyone can fork, contribute, study, and modify** this codebase freely.
- **Nobody can own or privatize it**: Under AGPLv3, any modified version, fork, or network-hosted deployment (such as a public web service or SaaS) **must remain completely free and open source** under the exact same license terms. No proprietary forks or closed-source derivatives are permitted.

See the full text in the [LICENSE](LICENSE) file.
