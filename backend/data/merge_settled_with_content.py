#!/usr/bin/env python3
"""
Merge settled CSV (canonical model/homework) + Ed API thread details (real content).

Output:
- backend/data/special_participation_a_merged.json   (content filled)
- backend/data/special_participation_a_merged.csv    (metadata only)
"""

import os
import csv
import json
import time
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Optional: HTML -> text
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

load_dotenv()

COURSE_ID = 84647
SETTLED_CSV = "data/special_participation_a_settled.csv"
OUT_JSON = "data/special_participation_a_merged.json"
OUT_CSV  = "data/special_participation_a_merged.csv"

BASE_URL = "https://us.edstem.org/api"


def html_to_text(html: str) -> str:
    if not html:
        return ""
    if BeautifulSoup is None:
        # Fallback: keep raw HTML if bs4 isn't installed
        return html
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text("\n", strip=True)


def deep_get(d: Any, path: str) -> Optional[Any]:
    """Safely get nested keys: path like 'thread.document'."""
    cur = d
    for key in path.split("."):
        if not isinstance(cur, dict) or key not in cur:
            return None
        cur = cur[key]
    return cur


def pick_best_content(payload: Dict[str, Any]) -> str:
    """
    Ed payload shapes vary; try common locations, then fallback to longest string among candidates.
    """
    candidate_paths = [
        "thread.document",
        "thread.content",
        "thread.body",
        "thread.post.document",
        "thread.post.content",
        "post.document",
        "post.content",
        "document",
        "content",
        "body",
    ]

    candidates = []
    for p in candidate_paths:
        v = deep_get(payload, p)
        if isinstance(v, str) and v.strip():
            candidates.append(v)

    if candidates:
        # Prefer the longest string (usually full post body)
        return max(candidates, key=len)

    # Fallback: scan for any string fields with meaningful length
    def scan(obj: Any):
        if isinstance(obj, dict):
            for _, vv in obj.items():
                yield from scan(vv)
        elif isinstance(obj, list):
            for it in obj:
                yield from scan(it)
        elif isinstance(obj, str):
            s = obj.strip()
            if len(s) >= 50:
                yield s

    scanned = list(scan(payload))
    if scanned:
        return max(scanned, key=len)

    return ""


class EdClient:
    def __init__(self, course_id: int):
        self.course_id = course_id
        token = os.getenv("ED_API_TOKEN")
        if not token:
            raise ValueError("ED_API_TOKEN not found in environment variables")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def get_thread_detail(self, thread_id: int) -> Dict[str, Any]:
        """
        Try a few likely endpoints (Ed API has multiple shapes depending on version).
        One of these should work with your token.
        """
        endpoints = [
            f"{BASE_URL}/courses/{self.course_id}/threads/{thread_id}",
            f"{BASE_URL}/courses/{self.course_id}/threads/{thread_id}?view=full",
            f"{BASE_URL}/threads/{thread_id}",
        ]

        last_err = None
        for url in endpoints:
            try:
                r = requests.get(url, headers=self.headers, timeout=30)
                r.raise_for_status()
                return r.json()
            except Exception as e:
                last_err = e

        raise RuntimeError(f"Failed to fetch detail for thread {thread_id}: {last_err}")


def load_settled_csv(path: str) -> Dict[int, Dict[str, str]]:
    settled = {}
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                tid = int(row["id"])
            except Exception:
                continue
            settled[tid] = row
    return settled


def main():
    settled = load_settled_csv(SETTLED_CSV)
    print(f"Loaded settled rows: {len(settled)}")

    client = EdClient(COURSE_ID)

    merged = []
    failures = 0

    for idx, (tid, row) in enumerate(settled.items(), start=1):
        try:
            detail = client.get_thread_detail(tid)

            # Extract title/author/time/likes/comments if available; else keep settled values
            title = row.get("title", "")
            author = row.get("author", "")

            # Try to override title/author from detail if present
            detail_title = deep_get(detail, "thread.title") or deep_get(detail, "title")
            if isinstance(detail_title, str) and detail_title.strip():
                title = detail_title.strip()

            detail_author = (
                deep_get(detail, "thread.user.name")
                or deep_get(detail, "thread.user.full_name")
                or deep_get(detail, "user.name")
            )
            if isinstance(detail_author, str) and detail_author.strip():
                author = detail_author.strip()

            raw = pick_best_content(detail)
            content = html_to_text(raw)

            merged.append({
                "id": tid,
                "title": title,
                "author": author,
                "content": content,                 # ✅ now filled
                "content_raw": raw if raw != content else "",  # optional (keep HTML if converted)
                "model": row.get("model", "Unknown"),
                "homework": row.get("homework", "Unknown"),
                "created_at": row.get("created_at", ""),
                "updated_at": row.get("updated_at", row.get("created_at", "")),
                "url": row.get("url", f"https://edstem.org/us/courses/{COURSE_ID}/discussion/{tid}"),
                "likes": int(row.get("likes", 0) or 0),
                "comments": int(row.get("comments", 0) or 0),
            })

            if idx % 25 == 0:
                print(f"[{idx}/{len(settled)}] merged... latest content_len={len(content)}")

            time.sleep(0.15)  # be nice to the API

        except Exception as e:
            failures += 1
            print(f"[WARN] thread {tid} failed: {e}")

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"Wrote JSON: {OUT_JSON}  (rows={len(merged)}, failures={failures})")

    # CSV metadata only (keep it light)
    keys = ["id", "title", "author", "model", "homework", "created_at", "url", "likes", "comments"]
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for item in merged:
            w.writerow({k: item.get(k, "") for k in keys})
    print(f"Wrote CSV: {OUT_CSV}")

    # Quick sanity check: how many content non-empty?
    nonempty = sum(1 for x in merged if (x.get("content") or "").strip())
    print(f"Non-empty content: {nonempty}/{len(merged)}")
    if nonempty == 0:
        print("!!! Content is still all empty. That means the detail endpoint didn't contain post body with your token. See notes below.")


if __name__ == "__main__":
    main()
