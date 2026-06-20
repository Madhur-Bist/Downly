export interface VideoFormat {
  formatId: string;
  resolution: string;
  formatNote: string;
  ext: string;
  hasAudio: boolean;
  hasVideo: boolean;
  filesize: number | null;
  filesizeApprox: number | null;
  tbr: number | null;
  fps: number | null;
  height: number;
  width: number;
  vcodec: string;
  acodec: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  uploader: string;
  uploaderUrl: string;
  webpageUrl: string;
  viewCount: number;
  formats: VideoFormat[];
}

export interface DownloadProgress {
  downloadId: string;
  status: "queued" | "downloading" | "processing" | "ready" | "error";
  progress: number;
  downloadedSize: number;
  totalSize: number | null;
  speed: string;
  eta: string;
  error?: string;
}

export interface ParsedProgress {
  downloadId: string;
  status: "queued" | "downloading" | "processing" | "ready" | "error";
  progress: number;
  downloadedSize: number;
  totalSize: number | null;
  speed: number;
  eta: number;
  error?: string;
}

export type AppPhase =
  | { phase: "idle" }
  | { phase: "analyzing" }
  | { phase: "preview"; info: VideoInfo }
  | { phase: "downloading"; downloadId: string; info: VideoInfo }
  | { phase: "complete"; info: VideoInfo }
  | { phase: "error"; message: string };
