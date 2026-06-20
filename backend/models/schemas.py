from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    url: str


class VideoFormat(BaseModel):
    formatId: str
    resolution: str
    formatNote: str
    ext: str
    hasAudio: bool
    hasVideo: bool
    filesize: Optional[int] = None
    filesizeApprox: Optional[int] = None
    tbr: Optional[float] = None
    fps: Optional[float] = None
    height: int = 0
    width: int = 0
    vcodec: str = ""
    acodec: str = ""


class VideoInfo(BaseModel):
    title: str
    thumbnail: str
    duration: str
    durationSeconds: int
    uploader: str
    uploaderUrl: str
    webpageUrl: str
    viewCount: Optional[int] = 0
    formats: list[VideoFormat]


class AnalyzeResponse(BaseModel):
    success: bool
    data: Optional[VideoInfo] = None
    error: Optional[str] = None


class DownloadRequest(BaseModel):
    url: str
    formatId: str
    hasAudio: bool = True
    title: str = "video"


class DownloadStartResponse(BaseModel):
    success: bool
    downloadId: Optional[str] = None
    error: Optional[str] = None


class DownloadProgressData(BaseModel):
    downloadId: str
    status: str
    progress: float
    downloadedSize: int
    totalSize: Optional[int] = None
    speed: str = ""
    eta: str = ""
    error: Optional[str] = None
