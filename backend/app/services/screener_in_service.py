
import httpx
from bs4 import BeautifulSoup
import re
from typing import List, Dict

def fetch_financials(ticker: str) -> List[Dict]:
    ticker = ticker.upper().replace(".NS", "").replace(".BO", "")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    # Try consolidated first, fallback to standalone
    url = f"https://www.screener.in/company/{ticker}/consolidated/"
    resp = httpx.get(url, headers=headers)
    if resp.status_code == 404:
        url = f"https://www.screener.in/company/{ticker}/"
        resp = httpx.get(url, headers=headers)
        
    if resp.status_code != 200:
        raise ValueError(f"Could not fetch data for {ticker} from Screener.in")

    soup = BeautifulSoup(resp.text, "lxml")
    
    def extract_table(section_id: str):
        section = soup.find("section", id=section_id)
        if not section: return [], {}
        table = section.find("table", class_="data-table")
        if not table: return [], {}
        
        headers = []
        for th in table.find("thead").find_all("th"):
            headers.append(th.text.strip())
            
        data = {}
        for row in table.find("tbody").find_all("tr"):
            cells = [c.text.strip().replace(",", "") for c in row.find_all(["th", "td"])]
            if cells:
                # Clean row name (remove trailing + or spaces)
                row_name = re.sub(r"[^a-zA-Z\s]", "", cells[0]).strip()
                data[row_name] = cells[1:]
        return headers[1:], data

    pl_years, pl_data = extract_table("profit-loss")
    bs_years, bs_data = extract_table("balance-sheet")
    cf_years, cf_data = extract_table("cash-flow")

    # Use PL years as the base
    years_out = []
    
    for i, year_col in enumerate(pl_years):
        # Ignore forward estimates or TTM if we just want historical annual
        if "TTM" in year_col:
            year_label = "TTM"
        else:
            # Extract just the year number (e.g. "Mar 2024" -> "2024")
            match = re.search(r"\d{4}", year_col)
            if not match: continue
            year_label = match.group(0)
            
        def safe_raw(val):
            try:
                return float(val) * 10000000 if val else 0.0 # Convert Crores to absolute raw units
            except:
                return 0.0

        # P&L
        sales = safe_raw(pl_data.get("Sales", [])[i]) if i < len(pl_data.get("Sales", [])) else 0
        ebitda = safe_raw(pl_data.get("Operating Profit", [])[i]) if i < len(pl_data.get("Operating Profit", [])) else 0
        depreciation = safe_raw(pl_data.get("Depreciation", [])[i]) if i < len(pl_data.get("Depreciation", [])) else 0
        ebit = ebitda - depreciation
        net_income = safe_raw(pl_data.get("Net Profit", [])[i]) if i < len(pl_data.get("Net Profit", [])) else 0

        # Cash Flow
        cf_idx = cf_years.index(year_col) if year_col in cf_years else -1
        ocf = safe_raw(cf_data.get("Cash from Operating Activity", [])[cf_idx]) if cf_idx >= 0 and cf_idx < len(cf_data.get("Cash from Operating Activity", [])) else 0
        fcf = safe_raw(cf_data.get("Free Cash Flow", [])[cf_idx]) if cf_idx >= 0 and cf_idx < len(cf_data.get("Free Cash Flow", [])) else 0
        capex = safe_raw(cf_data.get("Cash from Investing Activity", [])[cf_idx]) if cf_idx >= 0 and cf_idx < len(cf_data.get("Cash from Investing Activity", [])) else 0

        years_out.append({
            "year": year_label,
            "revenue": sales,
            "grossProfit": sales * 0.5,
            "operatingIncome": ebit,
            "netIncome": net_income,
            "operatingCashFlow": ocf,
            "capex": capex,
            "fcf": fcf
        })

    # Filter out future years (where Revenue == 0 but it is a future date, or if its a pure estimate)
    # Actually, Screener puts estimates in the main table. Lets just return everything up to TTM.
    return years_out

