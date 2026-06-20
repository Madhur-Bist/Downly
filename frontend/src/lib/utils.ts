import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DownloadProgress, ParsedProgress } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatSpeed(speedBps: number): string {
  if (speedBps <= 0) return "";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let i = 0;
  let speed = speedBps;
  while (speed >= 1024 && i < units.length - 1) {
    speed /= 1024;
    i++;
  }
  return `${speed.toFixed(i > 0 ? (i > 1 ? 2 : 1) : 0)} ${units[i]}`;
}

export function formatEta(seconds: number): string {
  if (seconds <= 0) return "";
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  }
  return `${Math.floor(seconds)}s`;
}

export function parseProgress(data: DownloadProgress): ParsedProgress {
  return {
    ...data,
    speed: parseFloat(data.speed) || 0,
    eta: parseInt(data.eta) || 0,
  };
}
