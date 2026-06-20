import os
import time
import json
import tempfile
import threading
import asyncio
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from services.ytdlp_service import download_video

executor = ThreadPoolExecutor(max_workers=2)
CLEANUP_INTERVAL = 300
FILE_TTL = 1800


class DownloadTask:
    def __init__(self, download_id: str, url: str, format_id: str, hasAudio: bool = True, title: str = "video"):
        self.download_id = download_id
        self.url = url
        self.format_id = format_id
        self.hasAudio = hasAudio
        self.title = title
        self.status = "queued"
        self.progress = 0.0
        self.downloaded_bytes = 0
        self.total_bytes: Optional[int] = None
        self.speed = ""
        self.eta = ""
        self.file_path: Optional[str] = None
        self.error: Optional[str] = None
        self.created_at = time.time()
        self._lock = threading.Lock()

    def update(self, **kwargs):
        with self._lock:
            for k, v in kwargs.items():
                setattr(self, k, v)

    def to_dict(self):
        with self._lock:
            return {
                "downloadId": self.download_id,
                "status": self.status,
                "progress": self.progress,
                "downloadedSize": self.downloaded_bytes,
                "totalSize": self.total_bytes,
                "speed": self.speed,
                "eta": self.eta,
                "error": self.error,
            }


class DownloadManager:
    def __init__(self):
        self._tasks: dict[str, DownloadTask] = {}
        self._lock = threading.Lock()
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def create_task(self, download_id: str, url: str, format_id: str, hasAudio: bool = True, title: str = "video") -> DownloadTask:
        task = DownloadTask(download_id, url, format_id, hasAudio, title)
        with self._lock:
            self._tasks[download_id] = task
        return task

    def get_task(self, download_id: str) -> Optional[DownloadTask]:
        with self._lock:
            return self._tasks.get(download_id)

    def remove_task(self, download_id: str):
        task = self.get_task(download_id)
        if task and task.file_path and os.path.exists(task.file_path):
            try:
                os.remove(task.file_path)
            except OSError:
                pass
        with self._lock:
            self._tasks.pop(download_id, None)

    def start_download(self, task: DownloadTask):
        def run():
            temp_dir = tempfile.mkdtemp(prefix="vf_")
            temp_path = os.path.join(temp_dir, f"video.%(ext)s")

            def progress_hook(d: dict):
                if d["status"] == "downloading":
                    total = d.get("total_bytes") or d.get("total_bytes_estimate")
                    downloaded = d.get("downloaded_bytes", 0)

                    raw_pct = d.get("_percent")
                    if raw_pct is not None:
                        pct = float(raw_pct)
                    elif total and total > 0:
                        pct = (downloaded / total) * 100
                    else:
                        pct = 0.0

                    raw_speed = d.get("speed")
                    speed_val = float(raw_speed) if raw_speed is not None else 0

                    raw_eta = d.get("eta")
                    eta_val = int(raw_eta) if raw_eta is not None else 0

                    task.update(
                        status="downloading",
                        progress=pct,
                        downloaded_bytes=downloaded,
                        total_bytes=total,
                        speed=str(speed_val),
                        eta=str(eta_val),
                    )
                elif d["status"] == "finished":
                    task.update(status="processing")

            try:
                task.update(status="downloading")
                result_path = download_video(
                    url=task.url,
                    format_id=task.format_id,
                    output_path=temp_path,
                    hasAudio=task.hasAudio,
                    progress_callback=progress_hook,
                )

                file_size = os.path.getsize(result_path) if os.path.isfile(result_path) else 0
                if file_size == 0:
                    raise RuntimeError("Downloaded file is empty (0 bytes)")

                task.update(status="ready", progress=100.0, file_path=result_path)
            except Exception as e:
                task.update(status="error", error=str(e))
                try:
                    import shutil
                    shutil.rmtree(temp_dir, ignore_errors=True)
                except Exception:
                    pass

        executor.submit(run)

    def _cleanup_loop(self):
        while True:
            time.sleep(CLEANUP_INTERVAL)
            now = time.time()
            to_remove: list[str] = []
            with self._lock:
                for tid, task in self._tasks.items():
                    if task.status in ("ready", "error") and (now - task.created_at) > FILE_TTL:
                        to_remove.append(tid)
            for tid in to_remove:
                self.remove_task(tid)


_manager: Optional[DownloadManager] = None


def get_manager() -> DownloadManager:
    global _manager
    if _manager is None:
        _manager = DownloadManager()
    return _manager
