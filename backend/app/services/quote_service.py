import httpx
from app.config import get_settings

FINNHUB_BASE = "https://finnhub.io/api/v1"


def get_us_quote_and_profile(ticker: str) -> dict:
    api_key = get_settings().finnhub_api_key
    if not api_key:
        raise RuntimeError("FINNHUB_API_KEY not set in backend/.env")

    ticker = ticker.upper().strip()

    with httpx.Client(timeout=10) as client:
        quote_resp = client.get(f"{FINNHUB_BASE}/quote", params={"symbol": ticker, "token": api_key})
        quote_resp.raise_for_status()
        quote = quote_resp.json()

        profile_resp = client.get(f"{FINNHUB_BASE}/stock/profile2", params={"symbol": ticker, "token": api_key})
        profile_resp.raise_for_status()
        profile = profile_resp.json()

    if not profile:
        raise ValueError(f"No profile data found for ticker {ticker}")

    return {
        "ticker": ticker,
        "name": profile.get("name"),
        "price": quote.get("c"),
        "market_cap": profile.get("marketCapitalization"),
        "sector": profile.get("finnhubIndustry"),
    }
