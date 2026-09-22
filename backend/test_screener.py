
import httpx
from bs4 import BeautifulSoup

url = "https://www.screener.in/company/RELIANCE/consolidated/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = httpx.get(url, headers=headers)
soup = BeautifulSoup(resp.text, "lxml")

for section_id in ["profit-loss", "cash-flow"]:
    section = soup.find("section", id=section_id)
    table = section.find("table", class_="data-table")
    for row in table.find_all("tr"):
        cells = [c.text.strip().replace(",", "") for c in row.find_all(["th", "td"])]
        if cells and ("Sales" in cells[0] or "Free Cash Flow" in cells[0] or "Net Profit" in cells[0] or "" == cells[0]):
            print(cells)

