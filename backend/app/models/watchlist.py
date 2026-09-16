from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class WatchlistCompany(Base):
    __tablename__ = "watchlist_companies"

    id = Column(Integer, primary_key=True, index=True)
    market = Column(String, nullable=False)          # "US" or "India"
    slot = Column(Integer, nullable=False)            # insertion order within market
    ticker = Column(String, nullable=False)
    name = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    sector = Column(String, nullable=True)
    folder_path = Column(String, nullable=False)      # local disk path holding this company's 10-Ks
    added_at = Column(DateTime, default=datetime.utcnow)

    filings = relationship("TenKFiling", back_populates="company", cascade="all, delete-orphan")


class TenKFiling(Base):
    __tablename__ = "tenk_filings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("watchlist_companies.id"), nullable=False)
    fiscal_year = Column(String, nullable=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("WatchlistCompany", back_populates="filings")
