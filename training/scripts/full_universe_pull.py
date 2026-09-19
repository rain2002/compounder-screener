"""
Full universe pull v2: adds retry-with-backoff so transient connection drops
(common on long unattended pulls) don't crash the whole script.

Usage:
    python training/scripts/full_universe_pull.py

Edit USER_AGENT and MAX_COMPANIES below before running.
Safe to re-run if interrupted -- resumes from pull_progress.json.
"""

import json
import time
import requests
from pathlib import Path

USER_AGENT = "sidekickofrain@example.com"  # <-- EDIT THIS

MAX_COMPANIES = 3000

TICKER_MAP_URL = "https://www.sec.gov/files/company_tickers.json"
SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"
COMPANYFACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"

EXCLUDED_SIC_RANGES = [
    (6000, 6799),  # Finance, Insurance, Real Estate
    (4900, 4999),  # Utilities
]

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)
PROGRESS_FILE = Path(__file__).resolve().parent.parent / "data" / "pull_progress.json"

HEADERS = {"User-Agent": USER_AGENT}

MAX_RETRIES = 4
RETRY_BACKOFF_SECONDS = 3  # doubles each retry: 3, 6, 12, 24


def request_with_retry(url):
    """GET with retry-on-failure. Returns Response or None if all retries fail."""
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            return resp
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            wait = RETRY_BACKOFF_SECONDS * (2 ** attempt)
            print(f"    [retry {attempt + 1}/{MAX_RETRIES}] connection issue, waiting {wait}s...")
            time.sleep(wait)
    print(f"    [FAILED after {MAX_RETRIES} retries] {url}")
    return None


def is_excluded_sic(sic):
    if sic is None:
        return False
    try:
        sic = int(sic)
    except (ValueError, TypeError):
        return False
    for lo, hi in EXCLUDED_SIC_RANGES:
        if lo <= sic <= hi:
            return True
    return False


def get_ticker_list():
    print("Fetching SEC ticker -> CIK map...")
    resp = request_with_retry(TICKER_MAP_URL)
    if resp is None or resp.status_code != 200:
        raise RuntimeError("Could not fetch ticker map even after retries.")
    data = resp.json()
    entries = list(data.values())
    print(f"  -> {len(entries)} total tickers available.")
    return entries


def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def save_progress(done_tickers):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(done_tickers), f)


def fetch_submissions_meta(cik: str):
    url = SUBMISSIONS_URL.format(cik=cik)
    resp = request_with_retry(url)
    if resp is None or resp.status_code != 200:
        return None
    return resp.json()


def fetch_company_facts(cik: str):
    url = COMPANYFACTS_URL.format(cik=cik)
    resp = request_with_retry(url)
    if resp is None or resp.status_code != 200:
        return None
    return resp.json()


def main():
    if "your-email@example.com" in USER_AGENT:
        print("ERROR: Edit USER_AGENT at the top of this script before running.")
        return

    entries = get_ticker_list()
    done = load_progress()
    print(f"Already pulled: {len(done)} companies (resuming, skipping these).")

    pulled_count = 0
    skipped_sic = 0
    skipped_no_recent_filing = 0
    failed = 0

    for entry in entries:
        if pulled_count >= MAX_COMPANIES:
            print(f"Reached MAX_COMPANIES ({MAX_COMPANIES}). Stopping.")
            break

        ticker = entry["ticker"].upper()
        cik = str(entry["cik_str"]).zfill(10)

        if ticker in done:
            continue

        meta = fetch_submissions_meta(cik)
        time.sleep(0.15)
        if meta is None:
            failed += 1
            done.add(ticker)  # mark as done so we don't retry forever on a bad CIK
            continue

        sic = meta.get("sic")
        if is_excluded_sic(sic):
            skipped_sic += 1
            done.add(ticker)
            continue

        recent_forms = meta.get("filings", {}).get("recent", {}).get("form", [])
        has_10k = any(f in ("10-K", "10-K/A") for f in recent_forms)
        if not has_10k:
            skipped_no_recent_filing += 1
            done.add(ticker)
            continue

        facts = fetch_company_facts(cik)
        time.sleep(0.15)
        if facts is None:
            failed += 1
            done.add(ticker)
            continue

        raw_path = RAW_DIR / f"{ticker}_companyfacts.json"
        with open(raw_path, "w") as f:
            json.dump(facts, f)

        done.add(ticker)
        pulled_count += 1

        if pulled_count % 50 == 0:
            print(f"  Progress: {pulled_count} pulled, {skipped_sic} skipped (sector), "
                  f"{skipped_no_recent_filing} skipped (no 10-K), {failed} failed.")
            save_progress(done)

    save_progress(done)

    print("\n" + "=" * 70)
    print("FULL PULL COMPLETE (or MAX_COMPANIES reached)")
    print("=" * 70)
    print(f"  Companies pulled this run:     {pulled_count}")
    print(f"  Skipped (excluded sector):     {skipped_sic}")
    print(f"  Skipped (no recent 10-K):      {skipped_no_recent_filing}")
    print(f"  Failed (after retries):        {failed}")
    print(f"  Total tickers marked done:     {len(done)}")
    print(f"  Raw files saved in:            {RAW_DIR}")
    print("\nIf you want more companies, raise MAX_COMPANIES and re-run --")
    print("it will resume and only pull NEW tickers, skipping everything in")
    print("pull_progress.json.")


if __name__ == "__main__":
    main()
