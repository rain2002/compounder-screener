from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class SentimentResult(Base):
    """Compact cached sentiment result per company. Stores only aggregate
    scores and a handful of short highlighted excerpts - never the full
    extracted 10-K text - to keep the database small.
    """
    __tablename__ = "sentiment_results"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("watchlist_companies.id"), unique=True, nullable=False)
    positive_pct = Column(Float, nullable=False)
    neutral_pct = Column(Float, nullable=False)
    negative_pct = Column(Float, nullable=False)
    overall_label = Column(String, nullable=False)  # Positive / Neutral / Negative
    overall_score = Column(Float, nullable=False)   # -1.0 to 1.0
    filings_analyzed = Column(Integer, default=0)
    excerpts_json = Column(Text, nullable=False)     # small JSON list of {text, label, score, source_file}
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("WatchlistCompany")
