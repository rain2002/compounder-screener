
import httpx
from bs4 import BeautifulSoup

url = "https://www.screener.in/company/RELIANCE/consolidated/"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
resp = httpx.get(url, headers=headers)
soup = BeautifulSoup(resp.text, "lxml")

name = soup.find("h1", class_="show-from-tablet-landscape").text.strip()
print(f"Name: {name}")

ratios = soup.find("div", class_="company-ratios")
for li in ratios.find_all("li"):
    name_span = li.find("span", class_="name")
    val_span = li.find("span", class_="number")
    if name_span and val_span:
        print(f"{name_span.text.strip()}: {val_span.text.strip()}")

