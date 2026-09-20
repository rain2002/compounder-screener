from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.company import Company
from app.schemas import CompanyOut
from sqlalchemy import asc
from app.models.company_financials import CompanyFinancials
import math


router = APIRouter(prefix="/companies", tags=["companies"])


def _clean(value):
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


@router.get("", response_model=list[CompanyOut])
def list_companies(market: Optional[str] = None, sector: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Company).filter(Company.is_active == True)
    if market:
        q = q.filter(Company.market == market.upper())
    if sector:
        q = q.filter(Company.sector == sector)
    return q.limit(200).all()


@router.get("/{ticker}", response_model=CompanyOut)
def get_company(ticker: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {ticker} not found")
    return company


@router.get("/{ticker}/financials")
def get_company_financials(ticker: str, db: Session = Depends(get_db)):
    rows = (
        db.query(CompanyFinancials)
        .filter(CompanyFinancials.ticker == ticker.upper())
        .order_by(asc(CompanyFinancials.fiscal_year))
        .all()
    )
    if not rows:
        return {"ticker": ticker.upper(), "years": []}

    years = [{
        "year": str(r.fiscal_year), "revenue": _clean(r.revenue), "netIncome": _clean(r.net_income),
        "operatingIncome": _clean(r.operating_income), "operatingCashFlow": _clean(r.operating_cash_flow),
        "capex": _clean(r.capex), "totalDebt": _clean(r.total_debt), "cash": _clean(r.cash),
        "totalEquity": _clean(r.total_equity), "sharesOutstanding": _clean(r.shares_outstanding), "fcf": _clean(r.fcf),
    } for r in rows]
    return {"ticker": ticker.upper(), "entityName": rows[-1].entity_name, "years": years}
