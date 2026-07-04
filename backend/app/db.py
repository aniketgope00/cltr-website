from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "backend" / "data"
DB_PATH = DATA_DIR / "waitlist.db"

BASE_WAITLIST_COUNT = 1187
DEFAULT_NEIGHBORHOODS = [
    "Indiranagar",
    "Koramangala",
    "HSR Layout",
    "Whitefield",
    "Jayanagar",
    "MG Road",
    "Bellandur",
    "Hebbal",
]
DEFAULT_AVERAGE_MATCH_MINUTES = 3
INTEREST_OPTIONS = [
    "Coffee runs",
    "Morning runs",
    "Pair programming",
    "Lunch breaks",
    "Study sessions",
    "Board games",
    "Jam sessions",
    "Evening walks",
    "Yoga classes",
    "Gym buddies",
    "Film nights",
    "Bike rides",
]


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS waitlist_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                interests TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def _deserialize_interests(raw: str) -> list[str]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    return [str(item) for item in parsed]


def _serialize_entry(row: sqlite3.Row) -> dict[str, object]:
    interests = _deserialize_interests(row["interests"])
    position = BASE_WAITLIST_COUNT + int(row["id"])
    return {
        "id": int(row["id"]),
        "email": row["email"],
        "interests": interests,
        "position": position,
        "interests_saved": bool(interests),
    }


def get_waitlist_overview() -> dict[str, object]:
    with get_connection() as connection:
        local_entries = connection.execute(
            "SELECT COUNT(*) AS total FROM waitlist_entries"
        ).fetchone()

    total = BASE_WAITLIST_COUNT + int(local_entries["total"])
    return {
        "waitlist_count": total,
        "neighborhood_count": len(DEFAULT_NEIGHBORHOODS),
        "neighborhoods": DEFAULT_NEIGHBORHOODS,
        "average_match_minutes": DEFAULT_AVERAGE_MATCH_MINUTES,
        "interest_options": INTEREST_OPTIONS,
    }


def join_waitlist(email: str) -> dict[str, object]:
    normalized_email = email.strip().lower()

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT * FROM waitlist_entries WHERE email = ?",
            (normalized_email,),
        ).fetchone()

        if existing is None:
            connection.execute(
                """
                INSERT INTO waitlist_entries (email, interests, created_at)
                VALUES (?, '[]', ?)
                """,
                (
                    normalized_email,
                    datetime.now(timezone.utc).isoformat(timespec="seconds"),
                ),
            )
            connection.commit()
            existing = connection.execute(
                "SELECT * FROM waitlist_entries WHERE email = ?",
                (normalized_email,),
            ).fetchone()
            already_joined = False
        else:
            already_joined = True

    payload = _serialize_entry(existing)
    payload["already_joined"] = already_joined
    payload["count"] = get_waitlist_overview()["waitlist_count"]
    payload["referral_message"] = (
        f"You're #{payload['position']}. Share cltr. to move up the list."
    )
    return payload


def save_interests(entry_id: int, interests: list[str]) -> dict[str, object] | None:
    cleaned_interests = [item for item in interests if item in INTEREST_OPTIONS]

    with get_connection() as connection:
        connection.execute(
            "UPDATE waitlist_entries SET interests = ? WHERE id = ?",
            (json.dumps(cleaned_interests), entry_id),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM waitlist_entries WHERE id = ?",
            (entry_id,),
        ).fetchone()

    if row is None:
        return None

    payload = _serialize_entry(row)
    payload["count"] = get_waitlist_overview()["waitlist_count"]
    return payload
