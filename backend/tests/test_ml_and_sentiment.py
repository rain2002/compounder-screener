import pytest
import numpy as np
from app.routers.ml_growth import predict_growth, PredictGrowthIn, HistoryYear, FEATURE_BOUNDS
from app.services import ml_growth_service
from app.services.ml_growth_service import _clip_growth
from app.services.sentiment_service import _clean_text, _is_valid_sentence, _sentences_to_chunks
from app.routers.dashboard import shift_rating


def test_ml_growth_service_loading():
    ml_growth_service.load_models()
    assert ml_growth_service.is_available() is True
    metadata = ml_growth_service.get_metadata()
    assert metadata is not None
    assert "models_kept" in metadata


def test_ml_growth_predict_realistic_inputs():
    ml_growth_service.load_models()
    payload = PredictGrowthIn(
        historyYears=[
            HistoryYear(year="2020", revenue=100000, ebitMargin=25, taxRate=21, depreciation=5000, capex=6000, deltaWorkingCapital=1000),
            HistoryYear(year="2021", revenue=112000, ebitMargin=26, taxRate=21, depreciation=5500, capex=6500, deltaWorkingCapital=1200),
            HistoryYear(year="2022", revenue=125000, ebitMargin=27, taxRate=21, depreciation=6000, capex=7000, deltaWorkingCapital=1500),
            HistoryYear(year="2023", revenue=138000, ebitMargin=27.5, taxRate=21, depreciation=6500, capex=7500, deltaWorkingCapital=1600),
            HistoryYear(year="2024", revenue=152000, ebitMargin=28, taxRate=21, depreciation=7200, capex=8000, deltaWorkingCapital=1800),
        ],
        totalDebt=25000,
        cash=35000,
        totalEquity=80000,
        targetMetric="fcf",
    )
    result = predict_growth(payload)
    assert result["ensemble_growth"] is not None
    # Result should be realistic positive growth for a healthy compounder, not clipped to -75%
    assert -10.0 <= result["ensemble_growth"] <= 50.0
    assert result["confidence"] in ("High", "Moderate")
    assert result["ridge_growth"] is not None
    assert result["rf_growth"] is not None
    assert result["xgb_growth"] is not None

    # Check that ratio features are properly scaled (0.0 to 1.0)
    features = result["features_used"]
    assert 0.0 <= features["fcf_margin"] <= 1.0
    assert 0.0 <= features["operating_margin"] <= 1.0
    assert 0.0 <= features["capex_to_revenue"] <= 1.0


def test_ml_growth_clip_edge_cases():
    assert _clip_growth(None) is None
    assert _clip_growth(np.nan) is None
    assert _clip_growth(float("inf")) is None
    assert _clip_growth(float("-inf")) is None
    assert _clip_growth(200.0) == 150.0
    assert _clip_growth(-100.0) == -75.0
    assert _clip_growth(12.5) == 12.5


def test_ml_growth_partial_balance_sheet():
    ml_growth_service.load_models()
    # Debt and cash provided, but totalEquity is omitted
    payload = PredictGrowthIn(
        historyYears=[
            HistoryYear(year="2022", revenue=125000, ebitMargin=27, taxRate=21, depreciation=6000, capex=7000, deltaWorkingCapital=1500),
            HistoryYear(year="2023", revenue=138000, ebitMargin=27.5, taxRate=21, depreciation=6500, capex=7500, deltaWorkingCapital=1600),
            HistoryYear(year="2024", revenue=152000, ebitMargin=28, taxRate=21, depreciation=7200, capex=8000, deltaWorkingCapital=1800),
        ],
        totalDebt=25000,
        cash=35000,
        totalEquity=None,
    )
    result = predict_growth(payload)
    assert result["ensemble_growth"] is not None
    # Net debt to EBIT should still be computed despite totalEquity being None
    features = result["features_used"]
    assert features["net_debt_to_ebit"] is not None
    assert features["roic"] is None


def test_ml_growth_insufficient_history():
    payload = PredictGrowthIn(
        historyYears=[
            HistoryYear(year="2023", revenue=100000, ebitMargin=20, taxRate=21, depreciation=5000, capex=5000, deltaWorkingCapital=1000),
            HistoryYear(year="2024", revenue=110000, ebitMargin=22, taxRate=21, depreciation=5500, capex=5500, deltaWorkingCapital=1100),
        ]
    )
    result = predict_growth(payload)
    assert result["confidence"] == "Unavailable"
    assert result["ensemble_growth"] is None


def test_feature_bounds_ratio_scale():
    # Bounds for ratio-based features must be in -1.0 to 1.0 / 1.5 range, NOT -100 to 100
    assert FEATURE_BOUNDS["fcf_margin"] == (-1.0, 1.0)
    assert FEATURE_BOUNDS["net_margin"] == (-1.0, 1.0)
    assert FEATURE_BOUNDS["operating_margin"] == (-1.0, 1.0)
    assert FEATURE_BOUNDS["roic"] == (-1.0, 1.5)
    assert FEATURE_BOUNDS["capex_to_revenue"] == (0, 1.0)


def test_sentiment_clean_text():
    raw = "The company's oper-\nating margin increased by 5% \u2019 \u2612 and cash flow was strong.\r\nNext line."
    cleaned = _clean_text(raw)
    assert "operating margin" in cleaned
    assert "\u2612" not in cleaned
    assert "\n" not in cleaned
    assert "\r" not in cleaned


def test_sentiment_valid_sentence():
    # Valid financial sentence
    assert _is_valid_sentence("Microsoft Cloud revenue increased 23% driven by Azure growth.") is True

    # Too short
    assert _is_valid_sentence("Short") is False

    # Table of contents dots
    assert _is_valid_sentence("Item 1. Business . . . . . . . . . . . . . . . . 12") is False

    # Header / Item line
    assert _is_valid_sentence("PART I Item 1A. Risk Factors") is False

    # Heavy digit table row
    assert _is_valid_sentence("2024 152000 28.0 21.0 7200 8000 1800 25000 35000") is False


def test_sentiment_sentence_to_chunks():
    text = (
        "Operating performance remained robust across all cloud segments throughout the fiscal year. "
        "Customer retention reached new highs with enterprise agreements extending globally. "
        "Capital expenditure aligned with anticipated long-term demand for infrastructure."
    )
    chunks = _sentences_to_chunks(text, max_chunks=5)
    assert len(chunks) >= 1
    assert all(len(c) > 40 for c in chunks)


def test_dashboard_shift_rating():
    assert shift_rating("Watch", 1) == "Buy"
    assert shift_rating("Buy", 1) == "Buy"
    assert shift_rating("Watch", -1) == "Caution"
    assert shift_rating("Avoid", -2) == "Avoid"
    assert shift_rating("NonStandardTier", 1) == "NonStandardTier"
