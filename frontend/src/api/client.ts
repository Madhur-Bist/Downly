import type { VideoInfo, DownloadProgress } from "@/types";

export async function analyzeVideo(url: string): Promise<{
  success: boolean;
  data?: VideoInfo;
  error?: string;
}> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { success: false, error: json.detail || json.error || "Analysis failed" };
    } catch {
      return { success: false, error: text || "Server error" };
    }
  }

  return res.json();
}

export async function startDownload(
  url: string,
  formatId: string,
  hasAudio: boolean = true,
  title: string = "video"
): Promise<{ success: boolean; downloadId?: string; error?: string }> {
  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, formatId, hasAudio, title }),
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { success: false, error: json.detail || json.error || "Download failed to start" };
    } catch {
      return { success: false, error: text || "Server error" };
    }
  }

  return res.json();
}

export function subscribeToProgress(
  downloadId: string,
  onProgress: (data: DownloadProgress) => void,
  onError: (error: string) => void,
  onDone: () => void
): () => void {
  const eventSource = new EventSource(`/api/download/${downloadId}/status`);

  eventSource.onmessage = (event) => {
    try {
      const data: DownloadProgress = JSON.parse(event.data);
      onProgress(data);
    } catch {
      // ignore parse errors
    }
  };

  eventSource.addEventListener("done", () => {
    onDone();
    eventSource.close();
  });

  eventSource.addEventListener("error", (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data);
      onError(data.error || "Unknown error");
    } catch {
      onError("Connection lost");
    }
    eventSource.close();
  });

  eventSource.onerror = () => {
    onError("Connection to server lost");
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

export function getDownloadFileUrl(downloadId: string): string {
  return `/api/download/${downloadId}/file`;
}
