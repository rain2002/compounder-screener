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

MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "training" / "models"

FEATURE_COLS = [
    "fcf_growth_1y", "revenue_growth_1y", "net_income_growth_1y",
    "fcf_margin", "net_margin", "operating_margin",
    "roic", "net_debt_to_ebit", "capex_to_revenue",
    "fcf_cagr_3y", "revenue_cagr_3y",
]

# No real company sustains FCF growth outside this range for a full year --
# these bounds exist purely to stop a single model (especially Ridge, which
# is linear and has no natural output cap) from extrapolating to nonsense
# like +1400% when an input feature falls outside the range the model was
# trained on. Tree models (RF/XGBoost) are naturally bounded by their
# training leaves and rarely need this, but it's applied uniformly as a
# safety net for all three.
GROWTH_FLOOR = -75.0
GROWTH_CAP = 150.0

_state = {"loaded": False, "ridge": None, "rf": None, "xgb": None,
          "xgb_imputer": None, "xgb_scaler": None, "metadata": None,
          "weights": None}


def _mae_to_weight(mae_by_model: dict) -> dict:
    inv = {name: 1.0 / mae for name, mae in mae_by_model.items() if mae > 0}
    total = sum(inv.values())
    return {name: v / total for name, v in inv.items()} if total > 0 else {}


def _clip_growth(value: float) -> float:
    return max(GROWTH_FLOOR, min(GROWTH_CAP, value))


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

    row = np.array([[features.get(col, np.nan) for col in FEATURE_COLS]])

    raw_preds = {}
    if _state["ridge"] is not None:
        raw_preds["ridge"] = float(_state["ridge"].predict(row)[0])
    if _state["rf"] is not None:
        raw_preds["random_forest"] = float(_state["rf"].predict(row)[0])
    if _state["xgb"] is not None:
        row_imputed = _state["xgb_imputer"].transform(row)
        row_scaled = _state["xgb_scaler"].transform(row_imputed)
        raw_preds["xgboost"] = float(_state["xgb"].predict(row_scaled)[0])

    preds = {name: _clip_growth(val) for name, val in raw_preds.items()}
    n_clipped = sum(1 for name in raw_preds if raw_preds[name] != preds[name])

    weights = _state["weights"]
    ensemble = sum(preds[name] * weights[name] for name in preds if name in weights)

    pred_values = list(preds.values())
    spread = max(pred_values) - min(pred_values) if len(pred_values) > 1 else 0

    n_missing_features = sum(1 for col in FEATURE_COLS if features.get(col) is None or
                              (isinstance(features.get(col), float) and np.isnan(features.get(col))))
    feature_completeness = 1 - (n_missing_features / len(FEATURE_COLS))

    if n_clipped > 0:
        confidence = "Low"
        clipped_names = [name for name in raw_preds if raw_preds[name] != preds[name]]
        note = (
            f"{', '.join(clipped_names)} predicted a growth rate outside a plausible range "
            f"(raw: {', '.join(f'{n}={raw_preds[n]:.0f}%' for n in clipped_names)}) and was capped to "
            f"[{GROWTH_FLOOR:.0f}%, {GROWTH_CAP:.0f}%]. This usually means the company's inputs fall "
            f"outside the pattern the pooled model learned from (e.g. very small, very new, or unusually volatile) "
            f"-- treat this prediction as unreliable and rely on your own FCF CAGR judgment instead."
        )
    elif feature_completeness < 0.6:
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
