"""
Extraction script v5: adds fiscal_year sanity validation. A small number of
raw EDGAR filings have a corrupted/misparsed "fy" field showing up as an
Excel serial date number (e.g. 43465) instead of an actual year -- this
filters those out at the source instead of letting bad years reach the
training set.

Usage:
    python training/scripts/extract_training_dataset.py

Reads from:  training/data/raw/*_companyfacts.json
Writes to:   training/data/processed/company_year_financials.parquet
             training/data/processed/company_year_financials.csv
"""

import json
from pathlib import Path
import pandas as pd

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

MIN_VALID_FISCAL_YEAR = 1990
MAX_VALID_FISCAL_YEAR = 2027

TAG_SOURCES = {
    "revenue": [
        ("us-gaap", "Revenues"),
        ("us-gaap", "RevenueFromContractWithCustomerExcludingAssessedTax"),
        ("us-gaap", "RevenueFromContractWithCustomerIncludingAssessedTax"),
        ("us-gaap", "SalesRevenueNet"),
        ("us-gaap", "SalesRevenueGoodsNet"),
    ],
    "net_income": [
        ("us-gaap", "NetIncomeLoss"),
        ("us-gaap", "ProfitLoss"),
        ("us-gaap", "NetIncomeLossAvailableToCommonStockholdersBasic"),
    ],
    "operating_income": [
        ("us-gaap", "OperatingIncomeLoss"),
    ],
    "operating_cash_flow": [
        ("us-gaap", "NetCashProvidedByUsedInOperatingActivities"),
        ("us-gaap", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"),
    ],
    "capex": [
        ("us-gaap", "PaymentsToAcquirePropertyPlantAndEquipment"),
        ("us-gaap", "PaymentsForCapitalImprovements"),
        ("us-gaap", "PaymentsToAcquireProductiveAssets"),
    ],
    "total_debt": [
        ("us-gaap", "DebtLongtermAndShorttermCombinedAmount"),
        ("us-gaap", "LongTermDebtNoncurrent"),
        ("us-gaap", "LongTermDebt"),
        ("us-gaap", "LongTermDebtAndCapitalLeaseObligations"),
        ("us-gaap", "LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities"),
        ("us-gaap", "DebtInstrumentCarryingAmount"),
        ("us-gaap", "SecuredDebt"),
        ("us-gaap", "UnsecuredDebt"),
        ("us-gaap", "NotesPayable"),
        ("us-gaap", "LongTermNotesPayable"),
    ],
    "cash": [
        ("us-gaap", "CashAndCashEquivalentsAtCarryingValue"),
        ("us-gaap", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"),
    ],
    "total_equity": [
        ("us-gaap", "StockholdersEquity"),
        ("us-gaap", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"),
    ],
    "shares_outstanding": [
        ("dei", "EntityCommonStockSharesOutstanding"),
        ("us-gaap", "CommonStockSharesOutstanding"),
    ],
}

INSTANT_CONCEPTS = {"total_debt", "cash", "total_equity", "shares_outstanding"}


def load_raw_files():
    files = sorted(RAW_DIR.glob("*_companyfacts.json"))
    print(f"Found {len(files)} raw company files.")
    return files


def get_annual_facts(taxonomy_dict: dict, tag: str, is_instant: bool):
    if tag not in taxonomy_dict:
        return {}
    units = taxonomy_dict[tag].get("units", {})
    facts = units.get("USD", []) or units.get("shares", []) or units.get("USD/shares", [])
    if not facts:
        return {}

    annual = {}
    for fact in facts:
        if fact.get("form") not in ("10-K", "10-K/A"):
            continue

        fy = fact.get("fy")
        if fy is None:
            continue
        # Guard against corrupted fy values in raw EDGAR data (e.g. Excel
        # serial dates like 43465 instead of an actual year like 2019).
        if not (MIN_VALID_FISCAL_YEAR <= fy <= MAX_VALID_FISCAL_YEAR):
            continue

        if fact.get("fp") != "FY":
            continue

        if is_instant:
            annual[fy] = fact.get("val")
        else:
            start, end = fact.get("start"), fact.get("end")
            if not start or not end:
                continue
            try:
                days = (pd.Timestamp(end) - pd.Timestamp(start)).days
            except Exception:
                continue
            if days < 300:
                continue
            annual[fy] = fact.get("val")

    return annual


def get_merged_series(facts_json: dict, field: str):
    is_instant = field in INSTANT_CONCEPTS
    merged = {}
    tag_per_year = {}

    for taxonomy, tag in TAG_SOURCES[field]:
        taxonomy_dict = facts_json.get("facts", {}).get(taxonomy, {})
        annual = get_annual_facts(taxonomy_dict, tag, is_instant)
        for fy, val in annual.items():
            if fy not in merged:
                merged[fy] = val
                tag_per_year[fy] = f"{taxonomy}:{tag}"

    tags_used = sorted(set(tag_per_year.values()))
    return merged, tags_used


def extract_company(filepath: Path):
    with open(filepath) as f:
        facts_json = json.load(f)

    ticker = filepath.stem.replace("_companyfacts", "")
    entity_name = facts_json.get("entityName", ticker)

    field_series = {}
    for field in TAG_SOURCES:
        series, _ = get_merged_series(facts_json, field)
        field_series[field] = series

    all_years = sorted(set().union(*[s.keys() for s in field_series.values()]))
    if not all_years:
        return []

    rows = []
    for fy in all_years:
        row = {"ticker": ticker, "entity_name": entity_name, "fiscal_year": fy}
        for field in TAG_SOURCES:
            row[field] = field_series[field].get(fy)
        rows.append(row)

    return rows


def main():
    files = load_raw_files()
    if not files:
        print("No raw files found.")
        return

    all_rows = []
    for i, filepath in enumerate(files, 1):
        rows = extract_company(filepath)
        all_rows.extend(rows)
        if i % 500 == 0:
            print(f"  Processed {i}/{len(files)} companies...")

    df = pd.DataFrame(all_rows)
    if df.empty:
        print("No rows extracted.")
        return

    df = df.sort_values(["ticker", "fiscal_year"]).reset_index(drop=True)

    before_debt_pct = df["total_debt"].notna().mean() * 100
    debt_by_ticker = df.groupby("ticker")["total_debt"].apply(lambda s: s.notna().any())
    zero_debt_tickers = debt_by_ticker[~debt_by_ticker].index
    mask = df["ticker"].isin(zero_debt_tickers) & df["total_equity"].notna()
    df.loc[mask, "total_debt"] = df.loc[mask, "total_debt"].fillna(0)
    after_debt_pct = df["total_debt"].notna().mean() * 100
    print(f"\nZero-debt fill: total_debt completeness {before_debt_pct:.1f}% -> {after_debt_pct:.1f}% "
          f"({len(zero_debt_tickers)} companies treated as debt-free)")

    df["fcf"] = df["operating_cash_flow"] - df["capex"]

    csv_path = PROCESSED_DIR / "company_year_financials.csv"
    parquet_path = PROCESSED_DIR / "company_year_financials.parquet"
    df.to_csv(csv_path, index=False)
    df.to_parquet(parquet_path, index=False)

    print(f"\nSaved {len(df)} company-year rows across {df['ticker'].nunique()} companies.")
    print(f"  Fiscal year range: {df['fiscal_year'].min()}-{df['fiscal_year'].max()}")
    print(f"  CSV:     {csv_path}")
    print(f"  Parquet: {parquet_path}")

    print("\n" + "=" * 70)
    print("COMPLETENESS CHECK")
    print("=" * 70)
    for field in TAG_SOURCES:
        pct = df[field].notna().mean() * 100
        flag = "OK" if pct >= 70 else "REVIEW"
        print(f"  {field:22s} {pct:5.1f}% populated  [{flag}]")
    fcf_pct = df["fcf"].notna().mean() * 100
    print(f"  {'fcf (derived)':22s} {fcf_pct:5.1f}% populated  [{'OK' if fcf_pct >= 60 else 'REVIEW'}]")


if __name__ == "__main__":
    main()
