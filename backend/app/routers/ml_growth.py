"""
ML growth prediction endpoint. Computes the required features from the
company's saved DCF page-state (historyYears) and returns predictions from
the pooled US FCF-growth models.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services import ml_growth_service

router = APIRouter(prefix="/ml-growth", tags=["ml-growth"])


class HistoryYear(BaseModel):
    year: str
    revenue: float
    ebitMargin: float
    taxRate: float
    depreciation: float
    capex: float
    deltaWorkingCapital: float


class PredictGrowthIn(BaseModel):
    historyYears: List[HistoryYear]
    totalDebt: Optional[float] = None
    cash: Optional[float] = None
    totalEquity: Optional[float] = None


def _compute_fcf(row: HistoryYear) -> float:
    ebit = row.revenue * (row.ebitMargin / 100)
    nopat = ebit * (1 - row.taxRate / 100)
    return nopat + row.depreciation - row.capex - row.deltaWorkingCapital


def _safe_pct(curr, prev):
    if prev is None or prev <= 0 or curr is None:
        return None
    return ((curr - prev) / prev) * 100


def _cagr(first, last, years):
    if first is None or last is None or first <= 0 or last <= 0 or years <= 0:
        return None
    return (pow(last / first, 1 / years) - 1) * 100


@router.post("/predict")
def predict_growth(payload: PredictGrowthIn):
    years = payload.historyYears
    if len(years) < 3:
        return {
            "ridge_growth": None, "rf_growth": None, "xgb_growth": None,
            "ensemble_growth": None, "confidence": "Unavailable",
            "distribution_note": "Need at least 3 years of history to compute growth features.",
        }

    fcf_series = [_compute_fcf(y) for y in years]
    revenue_series = [y.revenue for y in years]
    ebit_series = [y.revenue * (y.ebitMargin / 100) for y in years]
    net_income_series = [e * (1 - y.taxRate / 100) for e, y in zip(ebit_series, years)]

    last_fcf, prev_fcf = fcf_series[-1], fcf_series[-2]
    last_rev, prev_rev = revenue_series[-1], revenue_series[-2]
    last_ni, prev_ni = net_income_series[-1], net_income_series[-2]

    n = len(years)
    fcf_cagr_3y = _cagr(fcf_series[n - 4], last_fcf, 3) if n >= 4 else None
    revenue_cagr_3y = _cagr(revenue_series[n - 4], last_rev, 3) if n >= 4 else None

    invested_capital = None
    roic = None
    net_debt_to_ebit = None
    if payload.totalEquity is not None and payload.totalDebt is not None and payload.cash is not None:
        invested_capital = payload.totalEquity + payload.totalDebt - payload.cash
        last_ebit = ebit_series[-1]
        if invested_capital and invested_capital != 0:
            roic = (last_ebit * 0.79 / invested_capital) * 100
        if last_ebit and last_ebit != 0:
            net_debt_to_ebit = (payload.totalDebt - payload.cash) / last_ebit

    features = {
        "fcf_growth_1y": _safe_pct(last_fcf, prev_fcf),
        "revenue_growth_1y": _safe_pct(last_rev, prev_rev),
        "net_income_growth_1y": _safe_pct(last_ni, prev_ni),
        "fcf_margin": (last_fcf / last_rev * 100) if last_rev else None,
        "net_margin": (last_ni / last_rev * 100) if last_rev else None,
        "operating_margin": (ebit_series[-1] / last_rev * 100) if last_rev else None,
        "roic": roic,
        "net_debt_to_ebit": net_debt_to_ebit,
        "capex_to_revenue": (years[-1].capex / last_rev * 100) if last_rev else None,
        "fcf_cagr_3y": fcf_cagr_3y,
        "revenue_cagr_3y": revenue_cagr_3y,
    }

    result = ml_growth_service.predict_growth(features)
    result["features_used"] = features
    return result


@router.get("/status")
def ml_status():
    return {
        "available": ml_growth_service.is_available(),
        "metadata": ml_growth_service.get_metadata(),
    }
