from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from app.database import get_db
from app.services import page_state_service
import json

router = APIRouter(prefix="/page-state", tags=["page-state"])

ALLOWED_PAGES = {"dcf", "technical", "variance"}


class SaveStateIn(BaseModel):
    state: Any


@router.get("/{company_id}/{page_name}")
def load_state(company_id: int, page_name: str, db: Session = Depends(get_db)):
    if page_name not in ALLOWED_PAGES:
        raise HTTPException(status_code=400, detail="Invalid page_name")
    record = page_state_service.get_state(db, company_id, page_name)
    if not record:
        return {"state": None}
    return {"state": json.loads(record.state_json), "updated_at": record.updated_at}


@router.put("/{company_id}/{page_name}")
def save_state(company_id: int, page_name: str, payload: SaveStateIn, db: Session = Depends(get_db)):
    if page_name not in ALLOWED_PAGES:
        raise HTTPException(status_code=400, detail="Invalid page_name")
    record = page_state_service.save_state(db, company_id, page_name, json.dumps(payload.state))
    return {"saved": True, "updated_at": record.updated_at}
