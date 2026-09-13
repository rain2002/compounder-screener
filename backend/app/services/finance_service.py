"""
Wraps the Perplexity `finance` connector data shape so screener/DCF/dashboard
phases can call one stable interface instead of touching raw connector calls.

NOTE: The actual finance connector tools (finance_stock_screener,
finance_company_ratios, finance_company_financials, finance_estimates) are
invoked by the Perplexity assistant layer, not from inside this FastAPI app.
This service defines the contract those results should be normalized into,
plus a pluggable HTTP fallback for local/CI runs where you feed in CSV
exports or a scheduled job dumps connector output here.
"""
from typing import Optional
import pandas as pd


class CompanyMetrics:
    def __init__(
        self,
        ticker: str,
        roe: Optional[float] = None,
        debt_to_equity: Optional[float] = None,
        peg_ratio: Optional[float] = None,
        eps_growth: Optional[float] = None,
        revenue_growth: Optional[float] = None,
        owner_earnings: Optional[float] = None,
        beneish_m_score: Optional[float] = None,
        raw: Optional[dict] = None,
    ):
        self.ticker = ticker
        self.roe = roe
        self.debt_to_equity = debt_to_equity
        self.peg_ratio = peg_ratio
        self.eps_growth = eps_growth
        self.revenue_growth = revenue_growth
        self.owner_earnings = owner_earnings
        self.beneish_m_score = beneish_m_score
        self.raw = raw or {}


def load_metrics_from_csv(path: str) -> list[CompanyMetrics]:
    """Load a CSV export (e.g. from finance_company_ratios) into CompanyMetrics."""
    df = pd.read_csv(path)
    results = []
    for _, row in df.iterrows():
        results.append(
            CompanyMetrics(
                ticker=row.get("ticker") or row.get("symbol"),
                roe=row.get("roe"),
                debt_to_equity=row.get("debt_to_equity") or row.get("de_ratio"),
                peg_ratio=row.get("peg_ratio"),
                eps_growth=row.get("eps_growth"),
                revenue_growth=row.get("revenue_growth"),
                raw=row.to_dict(),
            )
        )
    return results


def beneish_fraud_flag(m_score: Optional[float]) -> bool:
    """Beneish M-Score: flag as fraud risk if score > -2.22."""
    if m_score is None:
        return False
    return m_score > -2.22


def buffett_quality_score(m: CompanyMetrics) -> float:
    """Simple v1 quality score: rewards high ROE, low leverage, positive owner earnings.
    Sector-normalization comes in a later iteration once sector medians are computed.
    """
    score = 0.0
    if m.roe is not None:
        score += min(m.roe / 15.0, 2.0) * 40
    if m.debt_to_equity is not None:
        score += max(0, (1.5 - m.debt_to_equity)) * 20
    if m.owner_earnings is not None and m.owner_earnings > 0:
        score += 20
    return round(min(score, 100), 2)


def lynch_garp_score(m: CompanyMetrics) -> float:
    """Simple v1 GARP score: rewards PEG < 1 and strong EPS growth."""
    score = 0.0
    if m.peg_ratio is not None and m.peg_ratio > 0:
        score += max(0, (1.5 - m.peg_ratio)) * 40
    if m.eps_growth is not None:
        score += min(m.eps_growth / 20.0, 2.0) * 30
    if m.revenue_growth is not None:
        score += min(m.revenue_growth / 15.0, 2.0) * 20
    return round(min(score, 100), 2)


def rate_company(m: CompanyMetrics) -> str:
    if beneish_fraud_flag(m.beneish_m_score):
        return "Avoid"
    b = buffett_quality_score(m)
    l = lynch_garp_score(m)
    combined = (b + l) / 2
    if combined >= 70:
        return "Buy"
    if combined >= 50:
        return "Watch"
    if combined >= 30:
        return "Caution"
    return "Avoid"
