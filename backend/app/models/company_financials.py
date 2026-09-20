from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class CompanyFinancials(Base):
    """
    One row per company per fiscal year, sourced from SEC EDGAR companyfacts
    (via training/data/processed/company_year_financials.csv). This is raw
    historical fundamentals -- revenue, FCF, balance sheet -- used to
    auto-populate the DCF and Technical pages when a company is selected,
    as opposed to FinancialSnapshot which stores point-in-time ratios/scores
    from the finance connector.
    """

    __tablename__ = "company_financials"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    entity_name = Column(String)
    fiscal_year = Column(Integer, index=True, nullable=False)

    revenue = Column(Float)
    net_income = Column(Float)
    operating_income = Column(Float)
    operating_cash_flow = Column(Float)
    capex = Column(Float)
    total_debt = Column(Float)
    cash = Column(Float)
    total_equity = Column(Float)
    shares_outstanding = Column(Float)
    fcf = Column(Float)

    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("ticker", "fiscal_year", name="uq_ticker_fiscal_year"),
    )
