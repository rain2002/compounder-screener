import httpx
from app.config import get_settings
import os

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_BASE = "https://finnhub.io/api/v1"

async def get_live_quote(symbol: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{FINNHUB_BASE}/quote",
            params={"symbol": symbol, "token": FINNHUB_API_KEY},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "symbol": symbol,
            "current_price": data.get("c"),
            "change": data.get("d"),
            "change_percent": data.get("dp"),
            "high": data.get("h"),
            "low": data.get("l"),
            "open": data.get("o"),
            "previous_close": data.get("pc"),
        }


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


def get_india_quote_and_profile(ticker: str) -> dict:
    """Fetch NSE/BSE data from Yahoo Finance.
    Use .NS for NSE (RELIANCE.NS) and .BO for BSE (RELIANCE.BO).
    """
    ticker = ticker.upper().strip()
    if not ticker.endswith((".NS", ".BO")):
        ticker = f"{ticker}.NS"

    url = f"https://query1.finance.yahoo.com/v7/finance/quote"
    with httpx.Client(timeout=10) as client:
        response = client.get(
            url,
            params={"symbols": ticker},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        response.raise_for_status()
        results = response.json().get("quoteResponse", {}).get("result", [])

    if not info or (not info.get("longName") and not info.get("shortName")):
        raise ValueError(f"No Yahoo Finance data found for {ticker}")

    price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")

    return {
        "ticker": ticker,
        "name": info.get("longName") or info.get("shortName") or info.get("displayName"),
        "price": price,
        "market_cap": info.get("marketCap"),
        "sector": info.get("sector") or info.get("industry"),
    }
