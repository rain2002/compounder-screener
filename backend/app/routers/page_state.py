from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from app.database import get_db
from app.services import page_state_service
import json


router = APIRouter(prefix="/page-state", tags=["page-state"])


ALLOWED_PAGES = {"dcf", "technical", "financial", "variance"}


class SaveStateIn(BaseModel):
    state: Any


@router.get("/{company_id}/{page_name}")
def load_state(company_id: int, page_name: str, db: Session = Depends(get_db)):
    if page_name not in ALLOWED_PAGES:
        raise HTTPException(status_code=400, detail="Invalid page_name")
        
    record = page_state_service.get_state(db, company_id, page_name)
    
    # Migration fallback: If they ask for 'financial' and it doesn't exist, check for 'technical'
    if not record and page_name == "financial":
        record = page_state_service.get_state(db, company_id, "technical")
        
    if not record:
        return {"state": None}
    return {"state": json.loads(record.state_json), "updated_at": record.updated_at}


@router.put("/{company_id}/{page_name}")
def save_state(company_id: int, page_name: str, payload: SaveStateIn, db: Session = Depends(get_db)):
    if page_name not in ALLOWED_PAGES:
        raise HTTPException(status_code=400, detail="Invalid page_name")
    record = page_state_service.save_state(db, company_id, page_name, json.dumps(payload.state))
    return {"saved": True, "updated_at": record.updated_at}


@router.post("/cleanup/dcf-history")
def cleanup_dcf_history(db: Session = Depends(get_db)):
    """One-time cleanup: trims any saved DCF historyYears longer than 10
    down to the most recent 10 years. Safe to call multiple times."""
    modified_count = page_state_service.cleanup_oversized_dcf_history(db)
    return {"records_modified": modified_count}
