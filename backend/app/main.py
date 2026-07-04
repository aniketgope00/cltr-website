from __future__ import annotations

import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from .db import INTEREST_OPTIONS, get_waitlist_overview, init_db, join_waitlist, save_interests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

app = FastAPI(
    title="cltr. pre-launch site",
    summary="Landing page and waitlist API for cltr.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WaitlistRequest(BaseModel):
    email: str = Field(min_length=5, max_length=120)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("Enter a valid email address.")
        return cleaned


class InterestsRequest(BaseModel):
    interests: list[str] = Field(default_factory=list, max_length=4)

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            item = value.strip()
            if item and item in INTEREST_OPTIONS and item not in cleaned:
                cleaned.append(item)
        return cleaned


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/waitlist/overview")
def waitlist_overview() -> dict[str, object]:
    return get_waitlist_overview()


@app.post("/api/waitlist/join")
def waitlist_join(payload: WaitlistRequest) -> dict[str, object]:
    return join_waitlist(payload.email)


@app.patch("/api/waitlist/{entry_id}/interests")
def waitlist_interests(entry_id: int, payload: InterestsRequest) -> dict[str, object]:
    updated = save_interests(entry_id, payload.interests)
    if updated is None:
        raise HTTPException(status_code=404, detail="Waitlist entry not found.")
    return updated


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def frontend_app(full_path: str) -> FileResponse:
        index_file = FRONTEND_DIST / "index.html"
        if not index_file.exists():
            raise HTTPException(status_code=404, detail="Frontend build not found.")
        return FileResponse(index_file)
