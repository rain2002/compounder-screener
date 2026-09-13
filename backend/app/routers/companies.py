from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.company import Company
from app.schemas import CompanyOut

router = APIRouter(prefix="/companies", tags=["companies"])


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
