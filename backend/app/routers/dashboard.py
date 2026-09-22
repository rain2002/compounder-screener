
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.watchlist import WatchlistCompany
from app.models.company import ScreenerResult
from app.models.sentiment import SentimentResult
from app.services import page_state_service
import json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

TIERS = ["Avoid", "Caution", "Watch", "Buy"]

def shift_rating(rating: str, steps: int) -> str:
    if rating not in TIERS:
        return rating
    idx = TIERS.index(rating)
    new_idx = max(0, min(len(TIERS) - 1, idx + steps))
    return TIERS[new_idx]

@router.get("/aggregate")
def get_dashboard_aggregation(db: Session = Depends(get_db)):
    companies = db.query(WatchlistCompany).all()
    results = []

    for c in companies:
        # Base Screener Rating
        screener = db.query(ScreenerResult).filter(ScreenerResult.ticker == c.ticker).order_by(ScreenerResult.run_date.desc()).first()
        base_rating = screener.rating if screener and screener.rating else "Watch"
        base_score = ((screener.buffett_score or 0) + (screener.lynch_score or 0)) / 2 if screener else None

        # Sentiment
        sentiment = db.query(SentimentResult).filter(SentimentResult.company_id == c.id).first()
        sentiment_label = sentiment.overall_label if sentiment else "Neutral"

        # DCF State
        dcf_state_rec = page_state_service.get_state(db, c.id, "dcf")
        dcf_state = json.loads(dcf_state_rec.state_json) if dcf_state_rec else {}
        monte_carlo = dcf_state.get("monteCarlo", {})
        p50 = monte_carlo.get("p50")
        relative_spread = monte_carlo.get("relativeSpread")
        
        mos_pct = None
        if p50 and c.price and c.price > 0:
            mos_pct = ((p50 - c.price) / p50) * 100

        # Technical/Financial State
        tech_state_rec = page_state_service.get_state(db, c.id, "financial") or page_state_service.get_state(db, c.id, "technical")
        tech_state = json.loads(tech_state_rec.state_json) if tech_state_rec else {}
        confidence = tech_state.get("growthStats", {}).get("confidence", "Insufficient Data")

        # Aggregation Logic
        final_rating = base_rating
        
        # 1. Sentiment adjust
        if sentiment_label == "Positive":
            final_rating = shift_rating(final_rating, 1)
        elif sentiment_label == "Negative":
            final_rating = shift_rating(final_rating, -1)
            
        # 2. Margin of Safety adjust
        if mos_pct is not None:
            if mos_pct >= 15:
                final_rating = shift_rating(final_rating, 1)
            elif mos_pct <= -15:
                final_rating = shift_rating(final_rating, -1)
                
        # 3. Variance Cap
        capped_at_watch = False
        if relative_spread is not None and relative_spread >= 80:
            capped_at_watch = True
        if confidence in ["Low", "Insufficient Data"]:
            capped_at_watch = True
            
        if capped_at_watch and TIERS.index(final_rating) > TIERS.index("Watch"):
            final_rating = "Watch"

        results.append({
            "id": c.id,
            "ticker": c.ticker,
            "name": c.name,
            "market": c.market,
            "base_rating": base_rating,
            "base_score": base_score,
            "sentiment": sentiment_label,
            "mos_pct": mos_pct,
            "dcf_p50": p50,
            "current_price": c.price,
            "capped": capped_at_watch,
            "rating": final_rating
        })

    return results

