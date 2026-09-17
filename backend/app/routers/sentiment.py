import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.services import sentiment_service, watchlist_service

router = APIRouter(prefix="/sentiment", tags=["sentiment"])


class ExcerptOut(BaseModel):
    text: str
    label: str
    score: float
    source_file: str


class SentimentResultOut(BaseModel):
    id: int
    company_id: int
    positive_pct: float
    neutral_pct: float
    negative_pct: float
    overall_label: str
    overall_score: float
    filings_analyzed: int
    excerpts: List[ExcerptOut]
    analyzed_at: datetime


@router.get("/companies/{market}")
def list_companies_for_sentiment(market: str, db: Session = Depends(get_db)):
    if market not in ("US", "India"):
        raise HTTPException(status_code=400, detail="market must be 'US' or 'India'")
    companies = watchlist_service.get_watchlist(db, market)
    return [
        {"id": c.id, "ticker": c.ticker, "name": c.name, "filings_count": len(c.filings)}
        for c in companies
    ]


@router.get("/{company_id}", response_model=Optional[SentimentResultOut])
def get_sentiment(company_id: int, db: Session = Depends(get_db)):
    result = sentiment_service.get_cached_result(db, company_id)
    if not result:
        return None
    return {
        "id": result.id,
        "company_id": result.company_id,
        "positive_pct": result.positive_pct,
        "neutral_pct": result.neutral_pct,
        "negative_pct": result.negative_pct,
        "overall_label": result.overall_label,
        "overall_score": result.overall_score,
        "filings_analyzed": result.filings_analyzed,
        "excerpts": json.loads(result.excerpts_json),
        "analyzed_at": result.analyzed_at,
    }


@router.post("/{company_id}/analyze", response_model=SentimentResultOut)
def analyze(company_id: int, db: Session = Depends(get_db)):
    try:
        result = sentiment_service.analyze_company(db, company_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "id": result.id,
        "company_id": result.company_id,
        "positive_pct": result.positive_pct,
        "neutral_pct": result.neutral_pct,
        "negative_pct": result.negative_pct,
        "overall_label": result.overall_label,
        "overall_score": result.overall_score,
        "filings_analyzed": result.filings_analyzed,
        "excerpts": json.loads(result.excerpts_json),
        "analyzed_at": result.analyzed_at,
    }
