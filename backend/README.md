# Compounder Screener — Backend

FastAPI backend for the Buffett + Lynch stock screener (Phase 1 of the build plan).

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # edit DATABASE_URL for your local/Render Postgres
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs.

## What's here (Phase 1)

- `app/main.py` — FastAPI app, CORS, router registration, auto-creates tables on startup
- `app/database.py` — SQLAlchemy engine/session (PostgreSQL)
- `app/models/company.py` — `Company`, `FinancialSnapshot`, `ScreenerResult` tables
- `app/services/finance_service.py` — Buffett quality score + Lynch GARP score + Beneish fraud
  flag logic (v1, not yet sector-normalized — that's the next iteration)
- `app/routers/health.py` — `GET /health` (checks DB connection)
- `app/routers/companies.py` — `GET /companies`, `GET /companies/{ticker}`
- `app/routers/screener.py` — `GET /screener/results`, `POST /screener/test-score` (smoke test
  without DB or finance connector — just pass raw ratios, get a score back)

## Try it without a database first

`POST /screener/test-score?ticker=AAPL&roe=28&debt_to_equity=1.2&peg_ratio=1.8&eps_growth=8&revenue_growth=5`

This proves the Buffett/Lynch scoring math works before wiring the real `finance` connector data in.

## Next steps (Phase 2+)

- Wire real `finance` connector output (via CSV drop or a sync script) into `finance_service.py`
- Add sector-relative thresholds (currently flat cutoffs — plan calls for sector-normalized)
- Add APScheduler job for 24h weekday auto-refresh
- Add India market ingestion (BharatStock/NSE-BSE) + FX conversion service
