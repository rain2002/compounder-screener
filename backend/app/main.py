from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, engine
from app.routers import health, companies, screener, watchlist, sentiment, page_state, ml_growth, quote, dashboard
from app.services import ml_growth_service


settings = get_settings()


app = FastAPI(title="Compounder Screener API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health.router)
app.include_router(companies.router)
app.include_router(screener.router)
app.include_router(watchlist.router)
app.include_router(sentiment.router)
app.include_router(page_state.router)
app.include_router(ml_growth.router)
app.include_router(quote.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    ml_growth_service.load_models()
