
from app.database import SessionLocal
from app.models.watchlist import WatchlistCompany
db = SessionLocal()
print([(w.ticker, w.market) for w in db.query(WatchlistCompany).all()])

