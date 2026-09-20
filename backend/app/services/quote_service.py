import httpx
from app.config import get_settings
import os


FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_BASE = "https://finnhub.io/api/v1"


async def get_live_quote(symbol: str) -> dict:
    api_key = get_settings().finnhub_api_key or FINNHUB_API_KEY
    symbol = symbol.upper().strip()

    if symbol.endswith((".NS", ".BO")):
        return await get_india_live_quote(symbol)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{FINNHUB_BASE}/quote",
            params={"symbol": symbol, "token": api_key},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "symbol": symbol,
            "market": "US",
            "current_price": data.get("c"),
            "change": data.get("d"),
            "change_percent": data.get("dp"),
            "high": data.get("h"),
            "low": data.get("l"),
            "open": data.get("o"),
            "previous_close": data.get("pc"),
        }


async def get_india_live_quote(symbol: str) -> dict:
    """Live quote for NSE/BSE tickers via Yahoo Finance.
    Use .NS for NSE (RELIANCE.NS) and .BO for BSE (RELIANCE.BO).
    """
    symbol = symbol.upper().strip()
    if not symbol.endswith((".NS", ".BO")):
        symbol = f"{symbol}.NS"

    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            url,
            params={"symbols": symbol},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        response.raise_for_status()
        results = response.json().get("quoteResponse", {}).get("result", [])

    if not results:
        raise ValueError(f"No Yahoo Finance data found for {symbol}")

    info = results[0]
    price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("regularMarketPreviousClose")

    return {
        "symbol": symbol,
        "market": "INDIA",
        "current_price": price,
        "change": info.get("regularMarketChange"),
        "change_percent": info.get("regularMarketChangePercent"),
        "high": info.get("regularMarketDayHigh"),
        "low": info.get("regularMarketDayLow"),
        "open": info.get("regularMarketOpen"),
        "previous_close": info.get("regularMarketPreviousClose"),
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

    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    with httpx.Client(timeout=10) as client:
        response = client.get(
            url,
            params={"symbols": ticker},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        response.raise_for_status()
        results = response.json().get("quoteResponse", {}).get("result", [])

    if not results:
        raise ValueError(f"No Yahoo Finance data found for {ticker}")

    info = results[0]
    price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("regularMarketPreviousClose")

    return {
        "ticker": ticker,
        "name": info.get("longName") or info.get("shortName") or info.get("displayName"),
        "price": price,
        "market_cap": info.get("marketCap"),
        "sector": info.get("sector") or info.get("industry"),
    }
