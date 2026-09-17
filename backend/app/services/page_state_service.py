from sqlalchemy.orm import Session
from app.models.page_state import PageState


def get_state(db: Session, company_id: int, page_name: str):
    return (
        db.query(PageState)
        .filter(PageState.company_id == company_id, PageState.page_name == page_name)
        .first()
    )


def save_state(db: Session, company_id: int, page_name: str, state_json: str) -> PageState:
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
