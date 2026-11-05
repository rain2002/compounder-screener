"""
ML growth service: loads the trained pooled US FCF-growth models once at
backend startup, and predicts next-year FCF growth for a given company's
current financial features.

This does NOT retrain anything -- it only loads what train_models.py
already produced and saved to training/models/.
"""

import json
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd
import joblib
import xgboost as xgb

MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "training" / "models"

FEATURE_COLS = [
    "fcf_growth_1y", "revenue_growth_1y", "net_income_growth_1y",
    "fcf_margin", "net_margin", "operating_margin",
    "roic", "net_debt_to_ebit", "capex_to_revenue",
    "fcf_cagr_3y", "revenue_cagr_3y",
]

GROWTH_FLOOR = -75.0
GROWTH_CAP = 150.0

_state = {"loaded": False, "ridge": None, "rf": None, "xgb": None,
          "xgb_imputer": None, "xgb_scaler": None, "metadata": None,
          "weights": None}


def _mae_to_weight(mae_by_model: dict) -> dict:
    inv = {name: 1.0 / mae for name, mae in mae_by_model.items() if mae > 0}
    total = sum(inv.values())
    return {name: v / total for name, v in inv.items()} if total > 0 else {}


def _clip_growth(value: Optional[float]) -> Optional[float]:
    """Clips finite values into sane bounds, returns None for non-finite / NaN values."""
    if value is None:
        return None
    try:
        val_f = float(value)
        if np.isnan(val_f) or np.isinf(val_f):
            return None
        return max(GROWTH_FLOOR, min(GROWTH_CAP, val_f))
    except (ValueError, TypeError):
        return None


def load_models():
    if _state["loaded"]:
        return

    metadata_path = MODELS_DIR / "us_model_metadata.json"
    if not metadata_path.exists():
        print(f"[ml_growth_service] No trained models found at {MODELS_DIR} -- ML growth suggestions disabled.")
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
    print(f"[ml_growth_service] Loaded models from {MODELS_DIR}: {kept}, weights: {_state['weights']}")


def is_available() -> bool:
    return _state["loaded"] and bool(_state["weights"])


def get_metadata():
    return _state["metadata"]


def predict_growth(features: dict) -> dict:
    if not is_available():
        return {
            "ridge_growth": None, "rf_growth": None, "xgb_growth": None,
            "ensemble_growth": None, "confidence": "Unavailable",
            "distribution_note": f"No trained models found at {MODELS_DIR}. Run the training pipeline first.",
        }

    row_df = pd.DataFrame([[features.get(col, np.nan) for col in FEATURE_COLS]], columns=FEATURE_COLS)

    raw_preds = {}
    if _state["ridge"] is not None:
        try:
            raw_preds["ridge"] = float(_state["ridge"].predict(row_df)[0])
        except Exception:
            pass
    if _state["rf"] is not None:
        try:
            raw_preds["random_forest"] = float(_state["rf"].predict(row_df)[0])
        except Exception:
            pass
    if _state["xgb"] is not None:
        try:
            row_imputed = _state["xgb_imputer"].transform(row_df)
            row_scaled = _state["xgb_scaler"].transform(row_imputed)
            raw_preds["xgboost"] = float(_state["xgb"].predict(row_scaled)[0])
        except Exception:
            pass

    valid_preds = {}
    clipped_names = []
    for name, raw_val in raw_preds.items():
        clipped = _clip_growth(raw_val)
        if clipped is not None:
            valid_preds[name] = clipped
            if abs(clipped - raw_val) > 1e-4:
                clipped_names.append(name)

    if not valid_preds:
        return {
            "ridge_growth": None, "rf_growth": None, "xgb_growth": None,
            "ensemble_growth": None, "confidence": "Unavailable",
            "distribution_note": "Models could not generate valid numerical predictions for the given financial inputs.",
        }

    weights = _state["weights"] or {}
    total_valid_weight = sum(weights.get(name, 0) for name in valid_preds)
    if total_valid_weight > 0:
        ensemble = sum(valid_preds[name] * weights.get(name, 0) for name in valid_preds) / total_valid_weight
    else:
        ensemble = sum(valid_preds.values()) / len(valid_preds)

    pred_values = list(valid_preds.values())
    spread = max(pred_values) - min(pred_values) if len(pred_values) > 1 else 0

    n_missing_features = sum(1 for col in FEATURE_COLS if features.get(col) is None or
                              (isinstance(features.get(col), float) and np.isnan(features.get(col))))
    feature_completeness = 1 - (n_missing_features / len(FEATURE_COLS))

    if clipped_names:
        confidence = "Low"
        note = (
            f"{', '.join(clipped_names)} predicted a growth rate outside a plausible range "
            f"(raw: {', '.join(f'{n}={raw_preds[n]:.0f}%' for n in clipped_names)}) and was capped to "
            f"[{GROWTH_FLOOR:.0f}%, {GROWTH_CAP:.0f}%]. This usually means the company's inputs fall "
            f"outside the pattern the pooled model learned from (e.g. very small, very new, or unusually volatile) "
            f"-- treat this prediction as unreliable and rely on your own FCF CAGR judgment instead."
        )
    elif len(valid_preds) < 2:
        confidence = "Low"
        note = "Only a single model was able to score these inputs -- treat this prediction as a rough reference."
    elif feature_completeness < 0.6:
        confidence = "Low"
        note = "This company is missing several input features the models were trained on -- treat the prediction as a rough reference, not a confident estimate."
    elif spread > 15:
        confidence = "Low"
        note = f"The models disagree by {spread:.1f} points -- wide disagreement usually means this company sits outside the pattern the pooled model learned from (e.g. very small, very new, or unusually volatile)."
    elif spread > 7:
        confidence = "Moderate"
        note = f"Models show some disagreement ({spread:.1f} points spread) -- reasonable starting point, worth sanity-checking against your own view."
    else:
        confidence = "High"
        note = None

    return {
        "ridge_growth": round(valid_preds["ridge"], 2) if "ridge" in valid_preds else None,
        "rf_growth": round(valid_preds["random_forest"], 2) if "random_forest" in valid_preds else None,
        "xgb_growth": round(valid_preds["xgboost"], 2) if "xgboost" in valid_preds else None,
        "ensemble_growth": round(ensemble, 2) if ensemble is not None else None,
        "confidence": confidence,
        "distribution_note": note,
    }
