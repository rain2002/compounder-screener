# Compounder Screener — Frontend

React + Vite + Tailwind + React Router. Talks to the FastAPI backend in `../backend`.

## Setup

```bash
cd frontend
npm install
cp .env.example .env  # set VITE_API_BASE_URL if backend isn't on localhost:8000
npm run dev
```

Visit `http://localhost:5173`.

**Start the backend first** (`uvicorn app.main:app --reload` in `../backend`) or you'll see
"Unreachable" on the Dashboard and Screener pages.

## Pages

| Route | Page | Status |
|---|---|---|
| `/` | Dashboard | Live health check + screener summary |
| `/screener` | Screener | Live — fetches `/screener/results`, filter by rating |
| `/dcf` | DCF Calculator | Live — rule-based 3-scenario DCF, editable inputs, GDP-capped terminal growth |
| `/technical` | Technical Analysis | Shell UI — model wiring is Phase 4 |
| `/sentiment` | Sentiment Analysis | Shell UI — 10-K upload wiring is Phase 5 |
| `/variance` | Variance Analysis | Shell UI — depends on Technical/Sentiment/DCF being live, Phase 6 |

## Structure

- `src/api/client.js` — fetch wrapper for all backend calls
- `src/components/Layout.jsx` — sidebar nav shared across pages
- `src/components/RatingBadge.jsx` — Buy/Watch/Caution/Avoid colored badge
- `src/components/EditableField.jsx` — reusable editable numeric input (plan requires every
  number to be user-overridable)
- `src/pages/*.jsx` — one file per app page

## Next steps

- Wire Technical page to a price-forecast model endpoint (ARIMA/Prophet)
- Wire Sentiment page to a 10-K upload + NLP backend endpoint
- Build Variance page once DCF/Technical/Sentiment have real outputs to wrap
- Add unit/currency toggle (Million/Billion ↔ Lakh/Crore, USD ↔ INR) per original plan
