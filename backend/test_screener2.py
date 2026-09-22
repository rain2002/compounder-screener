
from app.services.screener_in_service import fetch_financials
import json
print(json.dumps(fetch_financials("RELIANCE"), indent=2))

