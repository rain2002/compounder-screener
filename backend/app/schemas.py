from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Any


class CompanyOut(BaseModel):
    id: int
    ticker: str
    name: str
    market: str
    sector: Optional[str] = None
    market_cap: Optional[float] = None
    currency: str

    class Config:
        from_attributes = True


class ScreenerResultOut(BaseModel):
    ticker: str
    buffett_score: Optional[float] = None
    lynch_score: Optional[float] = None
    fraud_flag: bool = False
    rating: Optional[str] = None
    run_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class HealthOut(BaseModel):
    status: str
    environment: str
    db_connected: bool
