#!/usr/bin/env python3
"""
Export Instagram media data through the official Instagram Graph API.

This script is for Instagram accounts you own or manage and have authorized
through Meta. It does not scrape private pages, bypass login, or clone other
people's content.

Setup:
  python3 -m pip install requests

Required environment variables:
  IG_ACCESS_TOKEN   A valid Meta access token
  IG_USER_ID        Instagram Business/Creator account ID

Optional:
  IG_API_VERSION    Graph API version, defaults to v23.0

Example:
  IG_ACCESS_TOKEN="EA..." IG_USER_ID="1784..." python3 instagram_export.py \
    --limit 100 --out instagram_media.json --csv instagram_media.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from typing import Any
from urllib.parse import urlencode

import requests


DEFAULT_FIELDS = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "timestamp",
    "username",
    "like_count",
    "comments_count",
]


class InstagramApiError(RuntimeError):
    pass


def build_url(api_version: str, ig_user_id: str, fields: list[str], limit: int) -> str:
    query = urlencode(
        {
            "fields": ",".join(fields),
            "limit": min(limit, 100),
        }
    )
    return f"https://graph.facebook.com/{api_version}/{ig_user_id}/media?{query}"


def get_json(url: str, access_token: str, timeout: int) -> dict[str, Any]:
    response = requests.get(
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=timeout,
    )

    try:
        payload = response.json()
    except ValueError as exc:
        raise InstagramApiError(f"Non-JSON response: HTTP {response.status_code}") from exc

    if response.status_code >= 400 or "error" in payload:
        error = payload.get("error", {})
        message = error.get("message", payload)
        code = error.get("code", response.status_code)
        raise InstagramApiError(f"Instagram API error {code}: {message}")

    return payload


def fetch_media(
    api_version: str,
    ig_user_id: str,
    access_token: str,
    total_limit: int,
    fields: list[str],
    sleep_seconds: float,
    timeout: int,
) -> list[dict[str, Any]]:
    url = build_url(api_version, ig_user_id, fields, total_limit)
    items: list[dict[str, Any]] = []

    while url and len(items) < total_limit:
        payload = get_json(url, access_token, timeout)
        batch = payload.get("data", [])
        if not isinstance(batch, list):
            raise InstagramApiError("Unexpected API response: data is not a list")

        remaining = total_limit - len(items)
        items.extend(batch[:remaining])

        paging = payload.get("paging", {})
        next_url = paging.get("next")
        url = next_url if len(items) < total_limit else ""

        if url and sleep_seconds > 0:
            time.sleep(sleep_seconds)

    return items


def write_json(path: str, rows: list[dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8") as file:
        json.dump(rows, file, ensure_ascii=False, indent=2)
        file.write("\n")


def write_csv(path: str, rows: list[dict[str, Any]], fields: list[str]) -> None:
    with open(path, "w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export Instagram media metadata through the Instagram Graph API."
    )
    parser.add_argument("--limit", type=int, default=50, help="Maximum media items to export")
    parser.add_argument("--out", default="instagram_media.json", help="JSON output path")
    parser.add_argument("--csv", default="", help="Optional CSV output path")
    parser.add_argument(
        "--fields",
        default=",".join(DEFAULT_FIELDS),
        help="Comma-separated media fields to request",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.5,
        help="Seconds to wait between paginated API requests",
    )
    parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    access_token = os.getenv("IG_ACCESS_TOKEN", "").strip()
    ig_user_id = os.getenv("IG_USER_ID", "").strip()
    api_version = os.getenv("IG_API_VERSION", "v23.0").strip()

    if not access_token:
        print("Missing IG_ACCESS_TOKEN environment variable.", file=sys.stderr)
        return 2
    if not ig_user_id:
        print("Missing IG_USER_ID environment variable.", file=sys.stderr)
        return 2
    if args.limit < 1:
        print("--limit must be at least 1.", file=sys.stderr)
        return 2

    fields = [field.strip() for field in args.fields.split(",") if field.strip()]
    if not fields:
        print("--fields cannot be empty.", file=sys.stderr)
        return 2

    try:
        rows = fetch_media(
            api_version=api_version,
            ig_user_id=ig_user_id,
            access_token=access_token,
            total_limit=args.limit,
            fields=fields,
            sleep_seconds=args.sleep,
            timeout=args.timeout,
        )
    except InstagramApiError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    write_json(args.out, rows)
    if args.csv:
        write_csv(args.csv, rows, fields)

    print(f"Exported {len(rows)} media item(s) to {args.out}")
    if args.csv:
        print(f"Exported CSV to {args.csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
