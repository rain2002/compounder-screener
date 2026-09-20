"""
One-time (or re-runnable) ingestion script: loads
training/data/processed/company_year_financials.csv into the
company_financials table.

Usage (from backend/ directory, with the backend's environment active):
    python -m scripts.ingest_financials

Safe to re-run: upserts on (ticker, fiscal_year) so re-running after a
fresh EDGAR pull just refreshes the numbers instead of duplicating rows.

Uses Postgres ON CONFLICT upsert syntax (psycopg driver).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
from sqlalchemy.dialects.postgresql import insert as pg_upsert
from app.database import SessionLocal, engine, Base
from app.models.company_financials import CompanyFinancials

CSV_PATH = Path(__file__).resolve().parent.parent.parent / "training" / "data" / "processed" / "company_year_financials.csv"

NUMERIC_COLS = [
    "fiscal_year", "revenue", "net_income", "operating_income",
    "operating_cash_flow", "capex", "total_debt", "cash",
    "total_equity", "shares_outstanding", "fcf",
]


def main():
    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH} -- check the path.")
        return

    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} rows from {CSV_PATH}")

    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.where(pd.notnull(df), None)

    Base.metadata.create_all(bind=engine, tables=[CompanyFinancials.__table__])

    db = SessionLocal()
    inserted = 0
    try:
        records = df.to_dict(orient="records")
        for i in range(0, len(records), 500):
            batch = records[i:i + 500]
            stmt = pg_upsert(CompanyFinancials).values(batch)
            stmt = stmt.on_conflict_do_update(
                index_elements=["ticker", "fiscal_year"],
                set_={
                    "entity_name": stmt.excluded.entity_name,
                    "revenue": stmt.excluded.revenue,
                    "net_income": stmt.excluded.net_income,
                    "operating_income": stmt.excluded.operating_income,
                    "operating_cash_flow": stmt.excluded.operating_cash_flow,
                    "capex": stmt.excluded.capex,
                    "total_debt": stmt.excluded.total_debt,
                    "cash": stmt.excluded.cash,
                    "total_equity": stmt.excluded.total_equity,
                    "shares_outstanding": stmt.excluded.shares_outstanding,
                    "fcf": stmt.excluded.fcf,
                },
            )
            db.execute(stmt)
            inserted += len(batch)
            db.commit()
        print(f"Upserted {inserted} rows into company_financials.")
    except Exception as e:
        db.rollback()
        print(f"Ingestion failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
