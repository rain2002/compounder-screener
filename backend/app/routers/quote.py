from fastapi import APIRouter, HTTPException
from app.services.quote_service import get_live_quote


router = APIRouter(prefix="/quote", tags=["quote"])


@router.get("/{symbol}")
async def get_quote(symbol: str):
    try:
        return await get_live_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Quote fetch failed for {symbol}: {str(e)}")
