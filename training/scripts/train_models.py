"""
Training script: trains Ridge, Random Forest, and XGBoost on the pooled
company-year dataset to predict next-year FCF growth. Uses a TIME-BASED
train/test split (not random) to avoid lookahead bias, and backtests each
model against the naive rule-based baseline (median historical FCF growth)
before saving anything.

Only models that beat the baseline get saved -- per the plan, we don't keep
a model just because it trained; it has to earn its place over the rule.

Usage:
    python training/scripts/train_models.py

Reads from:  training/data/processed/training_features.parquet
Writes to:   training/models/*.joblib, *.json, model_metadata.json
"""

import json
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
    "fcf_growth_1y", "revenue_growth_1y", "net_income_growth_1y",
    "fcf_margin", "net_margin", "operating_margin",
    "roic", "net_debt_to_ebit", "capex_to_revenue",
    "fcf_cagr_3y", "revenue_cagr_3y",
]
TARGET_COL = "target_next_year_fcf_growth"

# Clip extreme outliers in the target before training -- a handful of
# distressed/recovering companies can show +2000% or -300% swings that
# would otherwise dominate the loss function. This mirrors the same
# guardrail philosophy already used elsewhere in the app.
TARGET_CLIP_LOW = -80
TARGET_CLIP_HIGH = 150

TEST_YEARS_HELD_OUT = 2  # most recent N fiscal years reserved for testing


def load_data():
    df = pd.read_parquet(PROCESSED_DIR / "training_features.parquet")
    trainable = df.dropna(subset=[TARGET_COL] + FEATURE_COLS).copy()
    trainable[TARGET_COL] = trainable[TARGET_COL].clip(TARGET_CLIP_LOW, TARGET_CLIP_HIGH)
    return trainable


def time_based_split(df: pd.DataFrame):
    max_year = df["fiscal_year"].max()
    cutoff = max_year - TEST_YEARS_HELD_OUT
    train_df = df[df["fiscal_year"] <= cutoff].copy()
    test_df = df[df["fiscal_year"] > cutoff].copy()
    return train_df, test_df


def baseline_predict(train_df: pd.DataFrame, test_df: pd.DataFrame):
    """Naive rule-based baseline: predict each test row's target as that
    company's OWN historical median fcf_growth_1y from the training period,
    falling back to the overall training-set median if the company has no
    training history (e.g., IPO'd during the test window)."""
    company_medians = train_df.groupby("ticker")["fcf_growth_1y"].median()
    overall_median = train_df["fcf_growth_1y"].median()
    preds = test_df["ticker"].map(company_medians).fillna(overall_median)
    return preds.values


def build_pipeline(model):
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", Pipeline(steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]), FEATURE_COLS),
        ]
    )
    return Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])


def evaluate(y_true, y_pred, label):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    print(f"  {label:22s} MAE={mae:6.2f}  RMSE={rmse:6.2f}")
    return {"mae": round(mae, 3), "rmse": round(rmse, 3)}


def main():
    df = load_data()
    print(f"Loaded {len(df)} fully-trainable rows across {df['ticker'].nunique()} companies.")

    train_df, test_df = time_based_split(df)
    print(f"Train: {len(train_df)} rows (through FY{train_df['fiscal_year'].max()})")
    print(f"Test:  {len(test_df)} rows (FY{test_df['fiscal_year'].min()}-{test_df['fiscal_year'].max()})")

    if len(test_df) < 50:
        print("WARNING: test set is very small -- results may be noisy. "
              "Consider reducing TEST_YEARS_HELD_OUT if this keeps happening.")

    X_train, y_train = train_df[FEATURE_COLS], train_df[TARGET_COL]
    X_test, y_test = test_df[FEATURE_COLS], test_df[TARGET_COL]

    print("\n" + "=" * 70)
    print("BASELINE (rule-based: company's own historical median growth)")
    print("=" * 70)
    baseline_preds = baseline_predict(train_df, test_df)
    baseline_metrics = evaluate(y_test, baseline_preds, "Baseline")

    models = {
        "ridge": build_pipeline(Ridge(alpha=10.0)),
        "random_forest": build_pipeline(RandomForestRegressor(
            n_estimators=300, max_depth=6, min_samples_leaf=10,
            random_state=42, n_jobs=-1,
        )),
    }

    print("\n" + "=" * 70)
    print("TRAINING MODELS")
    print("=" * 70)

    results = {"baseline": baseline_metrics}
    fitted_models = {}

    for name, pipeline in models.items():
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        results[name] = evaluate(y_test, preds, name)
        fitted_models[name] = pipeline

    # XGBoost handled separately (no sklearn Pipeline wrapping needed for
    # its native save format, but we still impute/scale manually first).
    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    X_train_xgb = scaler.fit_transform(imputer.fit_transform(X_train))
    X_test_xgb = scaler.transform(imputer.transform(X_test))

    xgb_model = XGBRegressor(
        n_estimators=300, max_depth=4, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
    )
    xgb_model.fit(X_train_xgb, y_train)
    xgb_preds = xgb_model.predict(X_test_xgb)
    results["xgboost"] = evaluate(y_test, xgb_preds, "xgboost")

    print("\n" + "=" * 70)
    print("VERDICT: does each model beat the rule-based baseline?")
    print("=" * 70)
    baseline_mae = results["baseline"]["mae"]
    kept_models = []
    for name in ["ridge", "random_forest", "xgboost"]:
        mae = results[name]["mae"]
        beats = mae < baseline_mae
        print(f"  {name:15s} MAE={mae:6.2f} vs baseline {baseline_mae:6.2f}  "
              f"-> {'KEEP (beats baseline)' if beats else 'DISCARD (does not beat baseline)'}")
        if beats:
            kept_models.append(name)

    print(f"\nModels to save: {kept_models if kept_models else 'NONE -- baseline wins, do not deploy ML yet'}")

    if "ridge" in kept_models:
        joblib.dump(fitted_models["ridge"], MODELS_DIR / "us_fcf_ridge.joblib")
        print(f"  Saved: {MODELS_DIR / 'us_fcf_ridge.joblib'}")
    if "random_forest" in kept_models:
        joblib.dump(fitted_models["random_forest"], MODELS_DIR / "us_fcf_random_forest.joblib")
        print(f"  Saved: {MODELS_DIR / 'us_fcf_random_forest.joblib'}")
    if "xgboost" in kept_models:
        xgb_model.save_model(str(MODELS_DIR / "us_fcf_xgboost.json"))
        joblib.dump(imputer, MODELS_DIR / "us_fcf_xgboost_imputer.joblib")
        joblib.dump(scaler, MODELS_DIR / "us_fcf_xgboost_scaler.joblib")
        print(f"  Saved: {MODELS_DIR / 'us_fcf_xgboost.json'} (+ imputer/scaler)")

    metadata = {
        "model_version": "v1.0",
        "country": "USA",
        "target": "next_year_fcf_growth",
        "trained_on": datetime.now().strftime("%Y-%m-%d"),
        "training_years": f"{int(train_df['fiscal_year'].min())}-{int(train_df['fiscal_year'].max())}",
        "test_years": f"{int(test_df['fiscal_year'].min())}-{int(test_df['fiscal_year'].max())}",
        "company_count_train": int(train_df["ticker"].nunique()),
        "training_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "excluded_sectors": ["Financials", "Real Estate", "Utilities"],
        "target_clip_range": [TARGET_CLIP_LOW, TARGET_CLIP_HIGH],
        "features": FEATURE_COLS,
        "results": results,
        "models_kept": kept_models,
    }
    with open(MODELS_DIR / "us_model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"\nMetadata saved: {MODELS_DIR / 'us_model_metadata.json'}")


if __name__ == "__main__":
    main()
