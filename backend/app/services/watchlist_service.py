import os
import shutil
from sqlalchemy.orm import Session
from app.models.watchlist import WatchlistCompany, TenKFiling

MAX_COMPANIES_PER_MARKET = 10
MAX_FILINGS_PER_COMPANY = 10
STORAGE_ROOT = os.environ.get(
    "WATCHLIST_UPLOAD_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"),
)


def _company_folder(market: str, ticker: str) -> str:
    path = os.path.join(STORAGE_ROOT, market, ticker)
    os.makedirs(path, exist_ok=True)
    return path


def _evict_oldest_if_full(db: Session, market: str):
    count = db.query(WatchlistCompany).filter(WatchlistCompany.market == market).count()
    if count < MAX_COMPANIES_PER_MARKET:
        return

    oldest = (
        db.query(WatchlistCompany)
        .filter(WatchlistCompany.market == market)
        .order_by(WatchlistCompany.added_at.asc())
        .first()
    )
    if oldest:
        if os.path.exists(oldest.folder_path):
            shutil.rmtree(oldest.folder_path, ignore_errors=True)
        db.delete(oldest)
        db.commit()


def add_company(db: Session, market: str, ticker: str, name=None, price=None,
                market_cap=None, sector=None) -> WatchlistCompany:
    existing = (
        db.query(WatchlistCompany)
        .filter(WatchlistCompany.market == market, WatchlistCompany.ticker == ticker.upper())
        .first()
    )
    if existing:
        raise ValueError(f"{ticker.upper()} is already in the {market} watchlist")

    _evict_oldest_if_full(db, market)

    slot = db.query(WatchlistCompany).filter(WatchlistCompany.market == market).count() + 1
    folder = _company_folder(market, ticker.upper())

    company = WatchlistCompany(
        market=market,
        slot=slot,
        ticker=ticker.upper(),
        name=name,
        price=price,
        market_cap=market_cap,
        sector=sector,
        folder_path=folder,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def add_filing(db: Session, company_id: int, file_name: str, file_bytes: bytes, fiscal_year=None) -> TenKFiling:
    company = db.query(WatchlistCompany).filter(WatchlistCompany.id == company_id).first()
    if not company:
        raise ValueError("Company not found in watchlist")

    filing_count = db.query(TenKFiling).filter(TenKFiling.company_id == company_id).count()
    if filing_count >= MAX_FILINGS_PER_COMPANY:
        raise ValueError(f"{company.ticker} already has {MAX_FILINGS_PER_COMPANY} filings (max reached)")

    file_path = os.path.join(company.folder_path, file_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    filing = TenKFiling(
        company_id=company_id,
        fiscal_year=fiscal_year,
        file_name=file_name,
        file_path=file_path,
    )
    db.add(filing)
    db.commit()
    db.refresh(filing)
    return filing


def get_watchlist(db: Session, market: str):
    return (
        db.query(WatchlistCompany)
        .filter(WatchlistCompany.market == market)
        .order_by(WatchlistCompany.slot.asc())
        .all()
    )


def get_filings_for_sentiment(db: Session, company_id: int):
    return db.query(TenKFiling).filter(TenKFiling.company_id == company_id).all()
