import httpx
from app.config import get_settings

FINNHUB_BASE = "https://finnhub.io/api/v1"
INDIA_STOCK_API_BASE = "http://65.0.104.9"


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


def _first(data: dict, *keys):
    for key in keys:
        value = data.get(key)
        if value not in (None, "", "N/A"):
            return value
    return None


def get_india_quote_and_profile(ticker: str) -> dict:
    """Fetch NSE/BSE quote from 0xramm's free India market API.
    Use exchange suffixes such as RELIANCE.NS or RELIANCE.BO.
    """
    ticker = ticker.upper().strip()
    with httpx.Client(timeout=12) as client:
        response = client.get(
            f"{INDIA_STOCK_API_BASE}/stock",
            params={"symbol": ticker, "res": "num"},
        )
        response.raise_for_status()
        payload = response.json()

    data = payload.get("data", payload) if isinstance(payload, dict) else {}
    if not data or data.get("error"):
        raise ValueError(f"No India market data found for {ticker}")

    name = _first(data, "name", "longName", "shortName", "companyName")
    price = _first(data, "currentPrice", "regularMarketPrice", "price", "lastPrice")
    market_cap = _first(data, "marketCap", "market_cap", "marketCapitalization")
    sector = _first(data, "sector", "industry", "sectorName")

    if name is None and price is None:
        raise ValueError(f"0xramm returned no usable quote for {ticker}")

    return {
        "ticker": ticker,
        "name": name,
        "price": price,
        "market_cap": market_cap,
        "sector": sector,
    }
