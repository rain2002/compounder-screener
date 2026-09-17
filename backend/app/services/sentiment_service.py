import json
import re
from sqlalchemy.orm import Session
from app.models.sentiment import SentimentResult
from app.models.watchlist import WatchlistCompany, TenKFiling

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

    device = 0 if torch.cuda.is_available() else -1
    model_name = "ProsusAI/finbert"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    _pipeline = pipeline(
        "sentiment-analysis",
        model=model,
        tokenizer=tokenizer,
        device=device,
        truncation=True,
        max_length=512,
    )
    return _pipeline


def _extract_text_chunks(file_path: str, max_chunks: int = 40) -> list[str]:
    from pypdf import PdfReader

    try:
        reader = PdfReader(file_path)
    except Exception:
        return []

    full_text = ""
    for page in reader.pages:
        try:
            full_text += page.extract_text() or ""
        except Exception:
            continue

    sentences = re.split(r'(?<=[.!?])\s+', full_text)
    chunks = []
    buffer = ""
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 40:
            continue
        if len(buffer) + len(sentence) < 400:
            buffer += " " + sentence
        else:
            if buffer.strip():
                chunks.append(buffer.strip())
            buffer = sentence
        if len(chunks) >= max_chunks:
            break
    if buffer.strip() and len(chunks) < max_chunks:
        chunks.append(buffer.strip())
    return chunks


def analyze_company(db: Session, company_id: int) -> SentimentResult:
    company = db.query(WatchlistCompany).filter(WatchlistCompany.id == company_id).first()
    if not company:
        raise ValueError("Company not found in watchlist")

    filings = db.query(TenKFiling).filter(TenKFiling.company_id == company_id).all()
    if not filings:
        raise ValueError(f"{company.ticker} has no uploaded 10-Ks to analyze")

    nlp = _get_pipeline()

    all_results = []
    for filing in filings:
        chunks = _extract_text_chunks(filing.file_path)
        for chunk in chunks:
            try:
                result = nlp(chunk)[0]
            except Exception:
                continue
            all_results.append({
                "text": chunk,
                "label": result["label"],
                "score": float(result["score"]),
                "source_file": filing.file_name,
            })

    if not all_results:
        raise ValueError("Could not extract readable text from the uploaded filings")

    total = len(all_results)
    positive = sum(1 for r in all_results if r["label"].lower() == "positive")
    negative = sum(1 for r in all_results if r["label"].lower() == "negative")
    neutral = total - positive - negative

    positive_pct = round(100 * positive / total, 1)
    negative_pct = round(100 * negative / total, 1)
    neutral_pct = round(100 * neutral / total, 1)

    overall_score = round((positive - negative) / total, 3)
    if overall_score > 0.1:
        overall_label = "Positive"
    elif overall_score < -0.1:
        overall_label = "Negative"
    else:
        overall_label = "Neutral"

    strongest_positive = sorted(
        [r for r in all_results if r["label"].lower() == "positive"],
        key=lambda r: r["score"], reverse=True,
    )[:4]
    strongest_negative = sorted(
        [r for r in all_results if r["label"].lower() == "negative"],
        key=lambda r: r["score"], reverse=True,
    )[:4]
    excerpts = strongest_positive + strongest_negative

    existing = db.query(SentimentResult).filter(SentimentResult.company_id == company_id).first()
    if existing:
        existing.positive_pct = positive_pct
        existing.neutral_pct = neutral_pct
        existing.negative_pct = negative_pct
        existing.overall_label = overall_label
        existing.overall_score = overall_score
        existing.filings_analyzed = len(filings)
        existing.excerpts_json = json.dumps(excerpts)
        db.commit()
        db.refresh(existing)
        return existing

    record = SentimentResult(
        company_id=company_id,
        positive_pct=positive_pct,
        neutral_pct=neutral_pct,
        negative_pct=negative_pct,
        overall_label=overall_label,
        overall_score=overall_score,
        filings_analyzed=len(filings),
        excerpts_json=json.dumps(excerpts),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_cached_result(db: Session, company_id: int):
    return db.query(SentimentResult).filter(SentimentResult.company_id == company_id).first()


def delete_result_for_company(db: Session, company_id: int):
    db.query(SentimentResult).filter(SentimentResult.company_id == company_id).delete()
    db.commit()
