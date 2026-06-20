import re
import secrets
from urllib.parse import urlparse
from typing import Optional


BLOCKED_NETWORKS = [
    "localhost", "127.0.0.1", "0.0.0.0",
    "10.", "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.",
    "172.24.", "172.25.", "172.26.", "172.27.",
    "172.28.", "172.29.", "172.30.", "172.31.",
    "192.168.",
]


def validate_url(raw: str) -> Optional[str]:
    url = raw.strip()
    if not url:
        return "Please enter a URL"

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return "URL must start with http:// or https://"

    hostname = parsed.hostname or ""
    for blocked in BLOCKED_NETWORKS:
        if hostname.startswith(blocked):
            return "Private or local URLs are not allowed"

    if hostname == "example.com":
        return "Please enter a real video URL"

    return None


def generate_download_id() -> str:
    return secrets.token_hex(16)


def format_duration(seconds: int) -> str:
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def parse_resolution(height: int) -> str:
    if height >= 2160:
        return "2160p 4K"
    elif height >= 1440:
        return "1440p"
    elif height >= 1080:
        return "1080p Full HD"
    elif height >= 720:
        return "720p HD"
    elif height >= 480:
        return "480p"
    elif height >= 360:
        return "360p"
    else:
        return f"{height}p"
