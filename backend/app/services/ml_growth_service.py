"""
ML growth service: loads the trained pooled US FCF-growth models once at
backend startup, and predicts next-year FCF growth for a given company's
current financial features.

This does NOT retrain anything -- it only loads what train_models.py
already produced and saved to training/models/.
"""

import json
from pathlib import Path
import numpy as np
import joblib
import xgboost as xgb

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "training" / "models"

FEATURE_COLS = [
    "fcf_growth_1y", "revenue_growth_1y", "net_income_growth_1y",
    "fcf_margin", "net_margin", "operating_margin",
    "roic", "net_debt_to_ebit", "capex_to_revenue",
    "fcf_cagr_3y", "revenue_cagr_3y",
]

_state = {"loaded": False, "ridge": None, "rf": None, "xgb": None,
          "xgb_imputer": None, "xgb_scaler": None, "metadata": None,
          "weights": None}


def _mae_to_weight(mae_by_model: dict) -> dict:
    """Inverse-MAE weighting: better (lower MAE) models get more say in the
    ensemble. Normalized so weights sum to 1."""
    inv = {name: 1.0 / mae for name, mae in mae_by_model.items() if mae > 0}
    total = sum(inv.values())
    return {name: v / total for name, v in inv.items()} if total > 0 else {}


def load_models():
    """Call once at FastAPI startup. Safe to call multiple times (no-op
    after first successful load)."""
    if _state["loaded"]:
        return

    metadata_path = MODELS_DIR / "us_model_metadata.json"
    if not metadata_path.exists():
        print("[ml_growth_service] No trained models found -- ML growth suggestions disabled.")
        return

    with open(metadata_path) as f:
        metadata = json.load(f)
    _state["metadata"] = metadata

    kept = metadata.get("models_kept", [])
    mae_by_model = {name: metadata["results"][name]["mae"] for name in kept}
    _state["weights"] = _mae_to_weight(mae_by_model)

    if "ridge" in kept:
        _state["ridge"] = joblib.load(MODELS_DIR / "us_fcf_ridge.joblib")
    if "random_forest" in kept:
        _state["rf"] = joblib.load(MODELS_DIR / "us_fcf_random_forest.joblib")
    if "xgboost" in kept:
        model = xgb.XGBRegressor()
        model.load_model(str(MODELS_DIR / "us_fcf_xgboost.json"))
        _state["xgb"] = model
        _state["xgb_imputer"] = joblib.load(MODELS_DIR / "us_fcf_xgboost_imputer.joblib")
        _state["xgb_scaler"] = joblib.load(MODELS_DIR / "us_fcf_xgboost_scaler.joblib")

    _state["loaded"] = True
    print(f"[ml_growth_service] Loaded models: {kept}, weights: {_state['weights']}")


def is_available() -> bool:
    return _state["loaded"] and bool(_state["weights"])


def get_metadata():
    return _state["metadata"]


def predict_growth(features: dict) -> dict:
    """
    features: dict with keys matching FEATURE_COLS (missing keys become
    NaN and get imputed same as training).

    Returns: {
        "ridge_growth": float or None,
        "rf_growth": float or None,
        "xgb_growth": float or None,
        "ensemble_growth": float,
        "confidence": "High"|"Moderate"|"Low",
        "distribution_note": str or None,
    }
    """
    if not is_available():
        return {
            "ridge_growth": None, "rf_growth": None, "xgb_growth": None,
            "ensemble_growth": None, "confidence": "Unavailable",
            "distribution_note": "No trained models found. Run the training pipeline first.",
        }

    row = np.array([[features.get(col, np.nan) for col in FEATURE_COLS]])

    preds = {}
    if _state["ridge"] is not None:
        preds["ridge"] = float(_state["ridge"].predict(row)[0])
    if _state["rf"] is not None:
        preds["random_forest"] = float(_state["rf"].predict(row)[0])
    if _state["xgb"] is not None:
        row_imputed = _state["xgb_imputer"].transform(row)
        row_scaled = _state["xgb_scaler"].transform(row_imputed)
        preds["xgboost"] = float(_state["xgb"].predict(row_scaled)[0])

    weights = _state["weights"]
    ensemble = sum(preds[name] * weights[name] for name in preds if name in weights)

    pred_values = list(preds.values())
    spread = max(pred_values) - min(pred_values) if len(pred_values) > 1 else 0

    n_missing_features = sum(1 for col in FEATURE_COLS if features.get(col) is None or
                              (isinstance(features.get(col), float) and np.isnan(features.get(col))))
    feature_completeness = 1 - (n_missing_features / len(FEATURE_COLS))

    if feature_completeness < 0.6:
        confidence = "Low"
        note = "This company is missing several input features the models were trained on -- treat the prediction as a rough reference, not a confident estimate."
    elif spread > 15:
        confidence = "Low"
        note = f"The three models disagree by {spread:.1f} points -- wide disagreement usually means this company sits outside the pattern the pooled model learned from (e.g. very small, very new, or unusually volatile)."
    elif spread > 7:
        confidence = "Moderate"
        note = f"Models show some disagreement ({spread:.1f} points spread) -- reasonable starting point, worth sanity-checking against your own view."
    else:
        confidence = "High"
        note = None

    return {
        "ridge_growth": round(preds.get("ridge"), 2) if "ridge" in preds else None,
        "rf_growth": round(preds.get("random_forest"), 2) if "random_forest" in preds else None,
        "xgb_growth": round(preds.get("xgboost"), 2) if "xgboost" in preds else None,
        "ensemble_growth": round(ensemble, 2),
        "confidence": confidence,
        "distribution_note": note,
    }
