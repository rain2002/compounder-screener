from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.company import ScreenerResult
from app.schemas import ScreenerResultOut
from app.services.finance_service import CompanyMetrics, rate_company, buffett_quality_score, lynch_garp_score

router = APIRouter(prefix="/screener", tags=["screener"])


@router.get("/results", response_model=list[ScreenerResultOut])
def get_screener_results(rating: str | None = None, db: Session = Depends(get_db)):
    q = db.query(ScreenerResult)
    if rating:
        q = q.filter(ScreenerResult.rating == rating.title())
    return q.order_by(ScreenerResult.run_date.desc()).limit(100).all()


@router.post("/test-score")
def test_score(
    ticker: str,
    roe: float | None = None,
    debt_to_equity: float | None = None,
    peg_ratio: float | None = None,
    eps_growth: float | None = None,
    revenue_growth: float | None = None,
):
    """Manual smoke-test endpoint: pass raw metrics, get back Buffett/Lynch
    scores and a rating, without needing the DB or finance connector wired
    up yet. Use this to verify the scoring logic works end-to-end."""
    m = CompanyMetrics(
        ticker=ticker,
        roe=roe,
        debt_to_equity=debt_to_equity,
        peg_ratio=peg_ratio,
        eps_growth=eps_growth,
        revenue_growth=revenue_growth,
    )
    return {
        "ticker": ticker,
        "buffett_score": buffett_quality_score(m),
        "lynch_score": lynch_garp_score(m),
        "rating": rate_company(m),
    }
