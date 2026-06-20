import os
import json
import tempfile
import threading
import logging
from typing import Optional, Callable

import yt_dlp

from models.schemas import VideoInfo, VideoFormat
from utils.helpers import format_duration, parse_resolution

logger = logging.getLogger("downly")


def extract_info(url: str) -> VideoInfo:
    cookies_file = os.environ.get("COOKIES_FILE")
    opts: dict = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "ignoreerrors": False,
        "verbose": True,
        "socket_timeout": 30,
        "retries": 3,
        "extractor_retries": 2,
    }
    if cookies_file:
        if os.path.exists(cookies_file):
            size = os.path.getsize(cookies_file)
            opts["cookiefile"] = cookies_file
            logger.info(f"Using cookies file: {cookies_file} ({size} bytes)")
        else:
            logger.warning(f"Cookies file not found: {cookies_file}")

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            raw = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        msg = str(e)
        logger.error(f"yt-dlp DownloadError: {msg}")
        raise ValueError(f"Failed to analyze video: {msg}")
    except Exception as e:
        logger.error(f"yt-dlp unexpected error", exc_info=True)
        raise ValueError(f"Failed to analyze video: {str(e)[:200]}")

    if not raw:
        raise ValueError("Could not extract video information. Video may be blocked in your region.")
    if not raw.get("formats"):
        logger.warning(f"extract_info returned no formats. Keys: {list(raw.keys())}")
        raise ValueError("No formats found. Video may be blocked or region-restricted.")
    if raw.get("is_live"):
        raise ValueError("Live streams are not supported for download.")
    if raw.get("age_limit", 0) and raw["age_limit"] > 18:
        raise ValueError("Age-restricted videos cannot be downloaded.")

    duration_seconds = raw.get("duration") or 0

    formats: list[VideoFormat] = []
    seen_ids: set[str] = set()

    raw_formats = raw.get("formats") or []
    for f in raw_formats:
        height = f.get("height") or 0
        width = f.get("width") or 0

        if height == 0 and width == 0:
            continue

        has_video = bool(f.get("vcodec") and f["vcodec"] != "none")
        has_audio = bool(f.get("acodec") and f["acodec"] != "none")

        if not has_video:
            continue

        fid = f.get("format_id", "")
        if fid in seen_ids:
            continue
        seen_ids.add(fid)

        resolution = parse_resolution(height)

        formats.append(VideoFormat(
            formatId=fid,
            resolution=resolution,
            formatNote=f.get("format_note") or "",
            ext=f.get("ext", "mp4"),
            hasAudio=has_audio,
            hasVideo=True,
            filesize=f.get("filesize"),
            filesizeApprox=f.get("filesize_approx"),
            tbr=f.get("tbr"),
            fps=f.get("fps"),
            height=height,
            width=width,
            vcodec=f.get("vcodec") or "",
            acodec=f.get("acodec") or "",
        ))

    formats.sort(key=lambda x: x.height, reverse=True)

    if not formats:
        raise ValueError("No downloadable video formats found for this URL.")

    thumbnail = raw.get("thumbnail") or ""
    if not thumbnail and raw.get("thumbnails"):
        thumbs = raw["thumbnails"]
        if thumbs:
            thumbnail = thumbs[-1].get("url", "")

    return VideoInfo(
        title=raw.get("title") or "Untitled Video",
        thumbnail=thumbnail,
        duration=format_duration(duration_seconds),
        durationSeconds=duration_seconds,
        uploader=raw.get("uploader") or raw.get("channel") or "Unknown",
        uploaderUrl=raw.get("uploader_url") or raw.get("channel_url") or "",
        webpageUrl=raw.get("webpage_url") or url,
        viewCount=raw.get("view_count") or 0,
        formats=formats,
    )


def download_video(
    url: str,
    format_id: str,
    output_path: str,
    hasAudio: bool = True,
    progress_callback: Optional[Callable[[dict], None]] = None,
) -> str:
    def hook(d: dict):
        if progress_callback:
            progress_callback(d)

    if hasAudio:
        format_str = format_id
    else:
        format_str = f"{format_id}+bestaudio[ext=m4a]/bestaudio/best"

    cookies_file = os.environ.get("COOKIES_FILE")
    opts: dict = {
        "format": format_str,
        "outtmpl": output_path,
        "merge_output_format": "mp4",
        "progress_hooks": [hook],
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "concurrent_fragments": 5,
        "extractor_args": {
            "youtube": {
                "skip": ["dash", "hls"],
            }
        },
        "socket_timeout": 30,
        "retries": 3,
        "extractor_retries": 2,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    }
    if cookies_file and os.path.exists(cookies_file):
        opts["cookiefile"] = cookies_file

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
    except Exception as e:
        raise RuntimeError(f"Download failed: {str(e)[:300]}")

    base_dir = os.path.dirname(output_path)
    base_name = os.path.splitext(os.path.basename(output_path))[0]

    if os.path.isfile(output_path):
        return output_path

    for fname in os.listdir(base_dir):
        if fname.startswith(base_name) or fname.startswith("video"):
            candidate = os.path.join(base_dir, fname)
            if os.path.isfile(candidate) and os.path.getsize(candidate) > 0:
                return candidate

    raise RuntimeError(f"Download completed but output file not found in {base_dir}")
