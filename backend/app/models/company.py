from sqlalchemy import Column, Integer, String, Float, Date, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    market = Column(String, nullable=False)  # "US" or "INDIA"
    sector = Column(String, index=True)
    industry = Column(String)
    market_cap = Column(Float)
    currency = Column(String, default="USD")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class FinancialSnapshot(Base):
    __tablename__ = "financial_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    snapshot_date = Column(Date, index=True, nullable=False)
    roe = Column(Float)
    debt_to_equity = Column(Float)
    peg_ratio = Column(Float)
    eps_growth = Column(Float)
    revenue_growth = Column(Float)
    owner_earnings = Column(Float)
    beneish_m_score = Column(Float)
    raw_metrics = Column(JSON)  # full ratio/financial payload from finance connector
    created_at = Column(DateTime, server_default=func.now())


class ScreenerResult(Base):
    __tablename__ = "screener_results"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    run_date = Column(DateTime, server_default=func.now())
    buffett_score = Column(Float)
    lynch_score = Column(Float)
    fraud_flag = Column(Boolean, default=False)
    rating = Column(String)  # Buy / Watch / Caution / Avoid
    notes = Column(JSON)
