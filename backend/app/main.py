from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, engine
from app.routers import health, companies, screener, watchlist, sentiment, page_state

settings = get_settings()

app = FastAPI(title="Compounder Screener API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
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


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Compounder Screener API", "docs": "/docs"}
