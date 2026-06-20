import json
import asyncio
import time

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.ytdlp_service import extract_info
from utils.helpers import validate_url

router = APIRouter()

RATE_LIMIT_WINDOW = 10
RATE_LIMIT_MAX = 5
_rate_limit_store: dict[str, list[float]] = {}


def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if t > window_start]
    if len(_rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit_store[ip].append(now)
    return True


@router.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    ip = "global"
    if not _check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait.")

    err = validate_url(request.url)
    if err:
        return AnalyzeResponse(success=False, error=err)

    try:
        info = await asyncio.to_thread(extract_info, request.url)
        return AnalyzeResponse(success=True, data=info)
    except ValueError as e:
        return AnalyzeResponse(success=False, error=str(e))
    except Exception as e:
        return AnalyzeResponse(success=False, error=f"An unexpected error occurred: {str(e)[:200]}")
