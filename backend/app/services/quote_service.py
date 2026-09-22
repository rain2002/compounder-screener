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

    async with httpx.AsyncClient(timeout=30.0) as client:
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
    """Live quote for NSE/BSE tickers via Yahoo Finance, fallback to Screener.in."""
    symbol_clean = symbol.upper().strip()
    yahoo_symbol = symbol_clean if symbol_clean.endswith((".NS", ".BO")) else f"{symbol_clean}.NS"

    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    results = []
    
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    url,
                    params={"symbols": yahoo_symbol},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                response.raise_for_status()
                results = response.json().get("quoteResponse", {}).get("result", [])
                break
        except Exception:
            pass

    if results:
        info = results[0]
        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("regularMarketPreviousClose")
        return {
            "symbol": symbol_clean,
            "market": "INDIA",
            "current_price": price,
            "change": info.get("regularMarketChange"),
            "change_percent": info.get("regularMarketChangePercent"),
            "high": info.get("regularMarketDayHigh"),
            "low": info.get("regularMarketDayLow"),
            "open": info.get("regularMarketOpen"),
            "previous_close": info.get("regularMarketPreviousClose"),
        }

    # --- FALLBACK TO SCREENER.IN ---
    screener_ticker = symbol_clean.replace(".NS", "").replace(".BO", "")
    try:
        from bs4 import BeautifulSoup
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"https://www.screener.in/company/{screener_ticker}/",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            ratios = soup.find("div", class_="company-ratios")
            price = None
            
            for li in ratios.find_all("li"):
                name_span = li.find("span", class_="name")
                val_span = li.find("span", class_="number")
                if name_span and val_span and "current price" in name_span.text.strip().lower():
                    price = float(val_span.text.strip().replace(",", ""))
                    break
                    
            if price is None:
                raise ValueError("Price not found on Screener.in page")
                
            return {
                "symbol": symbol_clean,
                "market": "INDIA",
                "current_price": price,
                "change": None,
                "change_percent": None,
                "high": None,
                "low": None,
                "open": None,
                "previous_close": None,
            }
    except Exception as e:
        raise ValueError(f"Yahoo Finance and Screener fallback both failed for {symbol_clean}: {e}")


def get_us_quote_and_profile(ticker: str) -> dict:
    api_key = get_settings().finnhub_api_key
    if not api_key:
        raise RuntimeError("FINNHUB_API_KEY not set in backend/.env")

    ticker = ticker.upper().strip()

    with httpx.Client(timeout=30.0) as client:
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
    """Fetch NSE/BSE data from Yahoo Finance, fallback to Screener.in if it fails."""
    ticker_clean = ticker.upper().strip()
    yahoo_ticker = ticker_clean if ticker_clean.endswith((".NS", ".BO")) else f"{ticker_clean}.NS"

    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    results = []
    
    for attempt in range(2):
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(
                    url,
                    params={"symbols": yahoo_ticker},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                response.raise_for_status()
                results = response.json().get("quoteResponse", {}).get("result", [])
                break
        except Exception:
            pass

    if results:
        info = results[0]
        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("regularMarketPreviousClose")
        return {
            "ticker": ticker_clean,
            "name": info.get("longName") or info.get("shortName") or info.get("displayName"),
            "price": price,
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector") or info.get("industry"),
        }

    # --- FALLBACK TO SCREENER.IN ---
    screener_ticker = ticker_clean.replace(".NS", "").replace(".BO", "")
    try:
        from bs4 import BeautifulSoup
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(
                f"https://www.screener.in/company/{screener_ticker}/consolidated/",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if resp.status_code == 404:
                resp = client.get(f"https://www.screener.in/company/{screener_ticker}/", headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.text, "lxml")
            name = soup.find("h1", class_="show-from-tablet-landscape").text.strip()
            
            ratios = soup.find("div", class_="company-ratios")
            price = None
            market_cap = None
            
            for li in ratios.find_all("li"):
                name_span = li.find("span", class_="name")
                val_span = li.find("span", class_="number")
                if not name_span or not val_span: continue
                
                label = name_span.text.strip().lower()
                val_text = val_span.text.strip().replace(",", "")
                try:
                    if "current price" in label:
                        price = float(val_text)
                    elif "market cap" in label:
                        # Screener shows Market Cap in Crores. Convert to standard unit or keep as Crores.
                        # Watchlist expects raw value for India to convert it back. We will provide Crores * 10,000,000
                        market_cap = float(val_text) * 10000000 
                except:
                    pass
                    
            return {
                "ticker": ticker_clean,
                "name": name,
                "price": price,
                "market_cap": market_cap,
                "sector": "N/A"
            }
    except Exception as e:
        raise ValueError(f"Yahoo Finance and Screener fallback both failed for {ticker_clean}: {e}")
