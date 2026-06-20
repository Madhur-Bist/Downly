import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from routers.analyze import router as analyze_router
from routers.download import router as download_router

app = FastAPI(
    title="Downly",
    description="Universal video downloader API. Powered by yt-dlp + FFmpeg.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "https://downly-qfpv.onrender.com",
        "https://downly-backend-ogzy.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(download_router)


@app.get("/")
async def root():
    return Response(status_code=200, content="Downly API is running")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "downly"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
