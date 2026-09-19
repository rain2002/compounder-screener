"""
Feature engineering script: turns company_year_financials into the training
table with growth rates, margins, ratios, and the target variable (next-year
FCF growth) that Ridge/RF/XGBoost will actually train on.

Usage:
    python training/scripts/build_features.py

Reads from:  training/data/processed/company_year_financials.parquet
Writes to:   training/data/processed/training_features.parquet
             training/data/processed/training_features.csv
"""

from pathlib import Path
import numpy as np
import pandas as pd

PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"


def load_data():
    df = pd.read_parquet(PROCESSED_DIR / "company_year_financials.parquet")
    df = df.sort_values(["ticker", "fiscal_year"]).reset_index(drop=True)
    return df


def safe_pct_change(series):
    """YoY % change, returns NaN instead of inf when prior value is 0/negative."""
    prev = series.shift(1)
    pct = (series - prev) / prev.abs()
    pct = pct.where((prev > 0), np.nan)
    return pct * 100


def safe_ratio(numerator, denominator):
    return np.where(denominator.abs() > 0, numerator / denominator, np.nan)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    out_rows = []

    for ticker, g in df.groupby("ticker", sort=False):
        g = g.sort_values("fiscal_year").reset_index(drop=True)
        if len(g) < 3:
            continue  # need at least 3 years to compute any meaningful growth history

        g["fcf_growth_1y"] = safe_pct_change(g["fcf"])
        g["revenue_growth_1y"] = safe_pct_change(g["revenue"])
        g["net_income_growth_1y"] = safe_pct_change(g["net_income"])

        g["fcf_margin"] = safe_ratio(g["fcf"], g["revenue"])
        g["net_margin"] = safe_ratio(g["net_income"], g["revenue"])
        g["operating_margin"] = safe_ratio(g["operating_income"], g["revenue"])

        invested_capital = g["total_equity"] + g["total_debt"] - g["cash"]
        after_tax_op_income = g["operating_income"] * 0.79  # rough 21% tax assumption
        g["roic"] = safe_ratio(after_tax_op_income, invested_capital)

        g["net_debt_to_ebitda"] = safe_ratio(
            g["total_debt"] - g["cash"],
            g["operating_income"] + g.get("capex", 0) * 0  # placeholder, refined below
        )
        # EBITDA isn't directly in our extracted fields (no D&A pulled yet) --
        # approximate with operating_income for now. This is a known
        # simplification; D&A can be added as a future extraction field.
        g["net_debt_to_ebit"] = safe_ratio(g["total_debt"] - g["cash"], g["operating_income"])

        g["capex_to_revenue"] = safe_ratio(g["capex"], g["revenue"])

        # 3yr and 5yr FCF CAGR (trailing, computed at each row using data
        # available up to that row -- avoids lookahead bias)
        def trailing_cagr(series, years):
            result = [np.nan] * len(series)
            for i in range(years, len(series)):
                first, last = series.iloc[i - years], series.iloc[i]
                if pd.notna(first) and pd.notna(last) and first > 0 and last > 0:
                    result[i] = (np.power(last / first, 1 / years) - 1) * 100
            return result

        g["fcf_cagr_3y"] = trailing_cagr(g["fcf"], 3)
        g["revenue_cagr_3y"] = trailing_cagr(g["revenue"], 3)

        # TARGET: next-year FCF growth (this is what the model predicts).
        # Shift fcf_growth_1y backward by one row so row i's target is what
        # actually happened the following fiscal year.
        g["target_next_year_fcf_growth"] = g["fcf_growth_1y"].shift(-1)

        out_rows.append(g)

    result = pd.concat(out_rows, ignore_index=True)
    return result


def main():
    df = load_data()
    print(f"Loaded {len(df)} rows across {df['ticker'].nunique()} companies.")

    featured = build_features(df)

    feature_cols = [
        "fcf_growth_1y", "revenue_growth_1y", "net_income_growth_1y",
        "fcf_margin", "net_margin", "operating_margin",
        "roic", "net_debt_to_ebit", "capex_to_revenue",
        "fcf_cagr_3y", "revenue_cagr_3y",
    ]

    # Drop rows where the target is missing (last year of each company has
    # no "next year" to predict) or where too many features are missing.
    trainable = featured.dropna(subset=["target_next_year_fcf_growth"]).copy()
    feature_completeness = trainable[feature_cols].notna().mean()

    csv_path = PROCESSED_DIR / "training_features.csv"
    parquet_path = PROCESSED_DIR / "training_features.parquet"
    featured.to_csv(csv_path, index=False)
    featured.to_parquet(parquet_path, index=False)

    print(f"\nSaved {len(featured)} total rows ({len(trainable)} with a usable target).")
    print(f"  CSV:     {csv_path}")
    print(f"  Parquet: {parquet_path}")

    print("\n" + "=" * 70)
    print("FEATURE COMPLETENESS (within rows that have a usable target)")
    print("=" * 70)
    for col in feature_cols:
        pct = feature_completeness[col] * 100
        flag = "OK" if pct >= 60 else "REVIEW"
        print(f"  {col:28s} {pct:5.1f}% populated  [{flag}]")

    fully_complete = trainable.dropna(subset=feature_cols)
    print(f"\nRows with ALL features + target present (fully trainable): {len(fully_complete)}")
    print(f"Companies represented in fully trainable set: {fully_complete['ticker'].nunique()}")


if __name__ == "__main__":
    main()
