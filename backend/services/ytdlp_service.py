import os
import json
import subprocess
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
    cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-download",
        "--no-warnings",
        "--ignore-errors",
        "--format", "best",
        "--socket-timeout", "30",
        "--retries", "3",
    ]
    if cookies_file and os.path.exists(cookies_file):
        cmd.extend(["--cookies", cookies_file])
        logger.info(f"Using cookies ({os.path.getsize(cookies_file)} bytes)")

    cmd.append(url)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        stderr = result.stderr.strip()[:500]
        stdout = result.stdout.strip()
        if stderr:
            logger.warning(f"yt-dlp: {stderr}")
        if not stdout:
            raise ValueError(f"Could not extract video info. {stderr or 'No response from yt-dlp'}")
        raw = json.loads(stdout.splitlines()[0])
    except subprocess.TimeoutExpired:
        raise ValueError("Video analysis timed out.")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse video info: {e}")

    raw_formats = raw.get("formats") or []
    if not raw_formats:
        logger.warning(f"No formats found. Keys: {list(raw.keys())}")
        if raw.get("title"):
            raise ValueError(f"No downloadable formats for '{raw['title']}'.")
        raise ValueError("No formats found.")

    if raw.get("is_live"):
        raise ValueError("Live streams are not supported.")

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
