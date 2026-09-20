from sqlalchemy.orm import Session
from app.models.page_state import PageState
import json


MAX_DCF_HISTORY_YEARS = 10


def _clamp_dcf_history(state_json: str) -> str:
    """If this is a dcf page state with historyYears longer than the cap,
    trim to the most recent MAX_DCF_HISTORY_YEARS entries before persisting."""
    try:
        state = json.loads(state_json)
    except (TypeError, ValueError):
        return state_json

    if isinstance(state, dict) and isinstance(state.get("historyYears"), list):
        years = state["historyYears"]
        if len(years) > MAX_DCF_HISTORY_YEARS:
            state["historyYears"] = years[-MAX_DCF_HISTORY_YEARS:]
            return json.dumps(state)

    return state_json


def get_state(db: Session, company_id: int, page_name: str):
    return (
        db.query(PageState)
        .filter(PageState.company_id == company_id, PageState.page_name == page_name)
        .first()
    )


def save_state(db: Session, company_id: int, page_name: str, state_json: str) -> PageState:
    if page_name == "dcf":
        state_json = _clamp_dcf_history(state_json)

    existing = get_state(db, company_id, page_name)
    if existing:
        existing.state_json = state_json
        db.commit()
        db.refresh(existing)
        return existing

    record = PageState(company_id=company_id, page_name=page_name, state_json=state_json)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_states_for_company(db: Session, company_id: int):
    db.query(PageState).filter(PageState.company_id == company_id).delete()
    db.commit()


def cleanup_oversized_dcf_history(db: Session) -> int:
    """One-time (or repeatable) migration: trims historyYears to the most
    recent MAX_DCF_HISTORY_YEARS for every already-saved dcf page state.
    Returns the number of records modified."""
    records = db.query(PageState).filter(PageState.page_name == "dcf").all()
    modified = 0
    for record in records:
        trimmed = _clamp_dcf_history(record.state_json)
        if trimmed != record.state_json:
            record.state_json = trimmed
            modified += 1
    if modified:
        db.commit()
    return modified
