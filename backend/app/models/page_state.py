from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, UniqueConstraint
from datetime import datetime
from app.database import Base


class PageState(Base):
    """Generic JSON-blob state storage per (company, page). Used by DCF,
    Technical, and Variance pages so every editable input/result persists per
    watchlist company until that company is deleted. Kept compact - one row
    per company per page, not per field."""
    __tablename__ = "page_state"
    __table_args__ = (UniqueConstraint("company_id", "page_name", name="uq_company_page"),)

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("watchlist_companies.id"), nullable=False)
    page_name = Column(String, nullable=False)  # "dcf", "technical", or "variance"
    state_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
