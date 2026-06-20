import json
import asyncio
import os
import time
import mimetypes

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import DownloadRequest, DownloadStartResponse
from services.download_manager import get_manager
from utils.helpers import validate_url, generate_download_id

router = APIRouter()

RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 3
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


@router.post("/api/download")
async def start_download(request: DownloadRequest):
    if not _check_rate_limit("global"):
        raise HTTPException(status_code=429, detail="Too many downloads. Please wait.")

    err = validate_url(request.url)
    if err:
        return DownloadStartResponse(success=False, error=err)

    manager = get_manager()
    download_id = generate_download_id()
    task = manager.create_task(download_id, request.url, request.formatId, request.hasAudio, request.title)
    manager.start_download(task)

    return DownloadStartResponse(success=True, downloadId=download_id)


@router.get("/api/download/{download_id}/status")
async def download_status(download_id: str):
    manager = get_manager()
    task = manager.get_task(download_id)

    if not task:
        async def err_stream():
            yield f"event: error\ndata: {json.dumps({'error': 'Download not found'})}\n\n"
        return StreamingResponse(err_stream(), media_type="text/event-stream")

    async def event_stream():
        last_status = None
        while True:
            data = task.to_dict()
            yield f"data: {json.dumps(data)}\n\n"

            if data["status"] in ("ready", "error"):
                yield f"event: done\ndata: {json.dumps(data)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/api/download/{download_id}/file")
async def download_file(download_id: str):
    manager = get_manager()
    task = manager.get_task(download_id)

    if not task:
        raise HTTPException(status_code=404, detail="Download not found")

    if task.status != "ready":
        raise HTTPException(status_code=400, detail="Download is not ready yet")

    file_path = task.file_path
    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise HTTPException(status_code=500, detail="Downloaded file is empty")

    safe_title = "".join(c for c in task.title if c.isalnum() or c in " ._-()[]").strip() or "video"
    ext = os.path.splitext(file_path)[1] or ".mp4"
    download_name = f"{safe_title}{ext}"

    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = "application/octet-stream"

    async def file_stream():
        with open(file_path, "rb") as f:
            chunk_size = 65536
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    return StreamingResponse(
        file_stream(),
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{download_name}"',
            "Content-Length": str(file_size),
            "Cache-Control": "no-cache",
        },
    )
