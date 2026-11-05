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


def _clean_text(text: str) -> str:
    """Normalizes whitespace, unicode ligatures, and strips PDF artifacts."""
    if not text:
        return ""
    text = text.replace("\xa0", " ").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    # Remove SEC checkboxes and symbol glyphs
    text = re.sub(r"[\u2610-\u2612\uf0a7\u2022\u25cf\u25cb\u25aa\u25ab]", " ", text)
    # Fix hyphenated words split across lines (e.g. "oper-\nating" -> "operating")
    text = re.sub(r"(\b[a-zA-Z]{3,})-\s*\n\s*([a-zA-Z]{3,}\b)", r"\1\2", text)
    # Collapse consecutive whitespace and line breaks
    text = re.sub(r"[\r\n]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _is_valid_sentence(s: str) -> bool:
    """Filters out table of contents rows, pure numbers, headers, and noisy fragments."""
    if len(s) < 45 or len(s) > 650:
        return False
    # Reject table of contents dotted lines (e.g. "... ... 45")
    if s.count("...") > 2 or s.count(". .") > 2:
        return False
    # Reject financial table rows with heavy numeric density (> 25% digits)
    digit_ratio = sum(c.isdigit() for c in s) / len(s)
    if digit_ratio > 0.25:
        return False
    # Reject standalone section or page headers
    if re.match(r"^(?:PART\s+[I|V|X]+|Item\s+\d+|Page\s+\d+)", s, re.I):
        return False
    return True


def _sentences_to_chunks(text: str, max_chunks: int = 20) -> list[str]:
    """Splits text into cohesive multi-sentence context windows suitable for FinBERT."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    buffer = ""
    for s in sentences:
        s = s.strip()
        if not _is_valid_sentence(s):
            continue
        if len(buffer) + len(s) < 380:
            buffer += " " + s
        else:
            if buffer.strip():
                chunks.append(buffer.strip())
            buffer = s
        if len(chunks) >= max_chunks:
            break
    if buffer.strip() and len(chunks) < max_chunks:
        chunks.append(buffer.strip())
    return chunks


def _extract_text_chunks(file_path: str, max_chunks: int = 40) -> list[str]:
    """
    Extracts high-signal financial narrative chunks from annual reports (10-Ks).
    Prioritizes Management's Discussion and Analysis (Item 7) and Risk Factors (Item 1A),
    with intelligent fallback for non-SEC/international annual reports.
    """
    from pypdf import PdfReader

    try:
        reader = PdfReader(file_path)
    except Exception:
        return []

    total_pages = len(reader.pages)
    if total_pages == 0:
        return []

    # Small documents: read all pages
    if total_pages <= 6:
        full_text = " ".join((reader.pages[i].extract_text() or "") for i in range(total_pages))
        return _sentences_to_chunks(_clean_text(full_text), max_chunks=max_chunks)

    # Detect high-signal sections by inspecting page headers (pages 5 to min(85, total_pages))
    # This skips cover/TOC boilerplate and avoids scanning hundreds of financial statement/notes pages.
    mda_pattern = re.compile(
        r"(?:item\s+7[\.\:\s\-]+)?management[\'’]?s?\s+discussion\s+and\s+analysis",
        re.I,
    )
    risk_pattern = re.compile(
        r"(?:item\s+1a[\.\:\s\-]*)?r\s*i\s*s\s*k\s*factors|\brisk\s+management\b|principal\s+risks",
        re.I,
    )

    mda_pages = []
    risk_pages = []
    scan_limit = min(total_pages, 85)

    for p in range(5, scan_limit):
        try:
            page_text = reader.pages[p].extract_text() or ""
            header = page_text[:600]
            if mda_pattern.search(header) or "MANAGEMENT DISCUSSION" in header.upper():
                mda_pages.append(p)
            elif risk_pattern.search(header) or "RISK FACTORS" in header.upper():
                risk_pages.append(p)
        except Exception:
            continue

    chunks: list[str] = []

    # Case 1: Both MD&A and Risk Factors detected
    if mda_pages and risk_pages:
        mda_start = mda_pages[0]
        risk_start = risk_pages[0]

        # Extract up to 10 pages of MD&A
        mda_text = ""
        for p in range(mda_start, min(mda_start + 10, total_pages)):
            try:
                mda_text += " " + (reader.pages[p].extract_text() or "")
            except Exception:
                continue
        mda_chunks = _sentences_to_chunks(_clean_text(mda_text), max_chunks=int(max_chunks * 0.6))

        # Extract up to 6 pages of Risk Factors
        risk_text = ""
        for p in range(risk_start, min(risk_start + 6, total_pages)):
            try:
                risk_text += " " + (reader.pages[p].extract_text() or "")
            except Exception:
                continue
        risk_chunks = _sentences_to_chunks(_clean_text(risk_text), max_chunks=int(max_chunks * 0.4))

        chunks = mda_chunks + risk_chunks

    # Case 2: Only MD&A detected
    elif mda_pages:
        mda_start = mda_pages[0]
        mda_text = ""
        for p in range(mda_start, min(mda_start + 12, total_pages)):
            try:
                mda_text += " " + (reader.pages[p].extract_text() or "")
            except Exception:
                continue
        chunks = _sentences_to_chunks(_clean_text(mda_text), max_chunks=max_chunks)

    # Case 3: Only Risk Factors detected
    elif risk_pages:
        risk_start = risk_pages[0]
        risk_text = ""
        for p in range(risk_start, min(risk_start + 10, total_pages)):
            try:
                risk_text += " " + (reader.pages[p].extract_text() or "")
            except Exception:
                continue
        chunks = _sentences_to_chunks(_clean_text(risk_text), max_chunks=max_chunks)

    # Case 4: Fallback for international / non-standard reports:
    # Sample pages evenly from the operational body (pages 5 to min(65, total_pages))
    if not chunks:
        sample_end = min(total_pages, 65)
        step = max(1, (sample_end - 5) // 12)
        sample_pages = list(range(5, sample_end, step))[:12]
        body_text = ""
        for p in sample_pages:
            try:
                body_text += " " + (reader.pages[p].extract_text() or "")
            except Exception:
                continue
        chunks = _sentences_to_chunks(_clean_text(body_text), max_chunks=max_chunks)

    return chunks[:max_chunks]


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
        chunks = _extract_text_chunks(filing.file_path, max_chunks=40)
        if not chunks:
            continue

        try:
            # High-performance batch evaluation with FinBERT
            batch_predictions = nlp(chunks, batch_size=8, truncation=True)
            for chunk, res in zip(chunks, batch_predictions):
                all_results.append({
                    "text": chunk,
                    "label": res["label"],
                    "score": float(res["score"]),
                    "source_file": filing.file_name,
                })
        except Exception:
            # Fallback to single-item inference if batching encounters an issue
            for chunk in chunks:
                try:
                    res = nlp(chunk, truncation=True)[0]
                    all_results.append({
                        "text": chunk,
                        "label": res["label"],
                        "score": float(res["score"]),
                        "source_file": filing.file_name,
                    })
                except Exception:
                    continue

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
    if overall_score > 0.08:
        overall_label = "Positive"
    elif overall_score < -0.08:
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
