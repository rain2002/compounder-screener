from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.services import watchlist_service, quote_service

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


class TenKFilingOut(BaseModel):
    id: int
    fiscal_year: Optional[str] = None
    file_name: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class WatchlistCompanyOut(BaseModel):
    id: int
    market: str
    slot: int
    ticker: str
    name: Optional[str] = None
    price: Optional[float] = None
    market_cap: Optional[float] = None
    sector: Optional[str] = None
    added_at: datetime
    filings: List[TenKFilingOut] = []

    class Config:
        from_attributes = True


class WatchlistAddUS(BaseModel):
    ticker: str


class WatchlistAddIndia(BaseModel):
    ticker: str
    name: Optional[str] = None
    price: Optional[float] = None
    market_cap: Optional[float] = None
    sector: Optional[str] = None


@router.get("/{market}", response_model=List[WatchlistCompanyOut])
def list_watchlist(market: str, db: Session = Depends(get_db)):
    if market not in ("US", "India"):
        raise HTTPException(status_code=400, detail="market must be 'US' or 'India'")
    return watchlist_service.get_watchlist(db, market)


@router.post("/us/add", response_model=WatchlistCompanyOut)
def add_us_company(payload: WatchlistAddUS, db: Session = Depends(get_db)):
    try:
        data = quote_service.get_us_quote_and_profile(payload.ticker)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Finnhub lookup failed: {e}")

    try:
        company = watchlist_service.add_company(
            db, market="US", ticker=data["ticker"], name=data["name"],
            price=data["price"], market_cap=data["market_cap"], sector=data["sector"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return company


@router.post("/india/add", response_model=WatchlistCompanyOut)
def add_india_company(payload: WatchlistAddIndia, db: Session = Depends(get_db)):
    try:
        api_data = quote_service.get_india_quote_and_profile(payload.ticker)
        data = {
            "ticker": api_data["ticker"],
            "name": api_data["name"] or payload.name,
            "price": api_data["price"] if api_data["price"] is not None else payload.price,
            "market_cap": api_data["market_cap"] if api_data["market_cap"] is not None else payload.market_cap,
            "sector": api_data["sector"] or payload.sector,
        }
    except Exception as api_error:
        if not payload.name:
            raise HTTPException(
                status_code=502,
                detail=f"India API lookup failed: {api_error}. Enter manual fallback fields and retry.",
            )
        data = {
            "ticker": payload.ticker.upper().strip(),
            "name": payload.name,
            "price": payload.price,
            "market_cap": payload.market_cap,
            "sector": payload.sector,
        }

    try:
        company = watchlist_service.add_company(
            db, market="India", ticker=data["ticker"], name=data["name"],
            price=data["price"], market_cap=data["market_cap"], sector=data["sector"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return company


@router.post("/{company_id}/filings")
def upload_filing(company_id: int, fiscal_year: Optional[str] = Form(None),
                  file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = file.file.read()
    try:
        filing = watchlist_service.add_filing(db, company_id, file.filename, contents, fiscal_year)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": filing.id, "file_name": filing.file_name, "fiscal_year": filing.fiscal_year}


@router.delete("/{company_id}")
def remove_company(company_id: int, db: Session = Depends(get_db)):
    if not watchlist_service.delete_company(db, company_id):
        raise HTTPException(status_code=404, detail="Company not found in watchlist")
    return {"deleted": company_id}
