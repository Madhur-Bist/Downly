import { useEffect, useState, useRef } from "react";
import {
  CheckCircle2, AlertCircle, Download, FileVideo,
  ArrowDownToLine, Gauge, Clock, HardDrive,
  Sparkles, Film,
} from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { formatBytes, formatSpeed, formatEta, parseProgress } from "@/lib/utils";
import { getDownloadFileUrl } from "@/api/client";
import type { DownloadProgress as ProgressData } from "@/types";

interface DownloadProgressProps {
  progress: ProgressData;
  videoTitle?: string;
  onDownloadReady?: (downloadId: string) => void;
  onRetry?: () => void;
}

function AnimatedProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-sm"
        style={{
          background: `linear-gradient(90deg, ${color}44, ${color}88, ${color}44)`,
          width: `${value}%`,
        }}
      />
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${Math.min(value, 100)}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 12px ${color}66`,
        }}
      />
    </div>
  );
}

function SpeedGauge({ speed, maxSpeed }: { speed: number; maxSpeed: number }) {
  const pct = maxSpeed > 0 ? Math.min((speed / maxSpeed) * 100, 100) : 0;
  const bars = 20;
  const active = Math.floor((pct / 100) * bars);
  const colors = [
    "#22c55e", "#22c55e", "#22c55e", "#22c55e",
    "#84cc16", "#84cc16", "#84cc16",
    "#eab308", "#eab308",
    "#f97316",
    "#ef4444",
  ];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all duration-200"
          style={{
            height: `${6 + (i % 3) * 2}px`,
            background: i < active ? colors[Math.min(i, colors.length - 1)] : "rgba(255,255,255,0.08)",
            boxShadow: i < active ? `0 0 4px ${colors[Math.min(i, colors.length - 1)]}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full animate-float"
          style={{
            background: `hsl(${200 + i * 40}, 80%, 60%)`,
            left: `${15 + i * 14}%`,
            top: `${40 + Math.sin(i * 1.5) * 20}%`,
            animationDelay: `${i * 0.6}s`,
            animationDuration: `${3 + i * 0.5}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

export function DownloadProgress({ progress, videoTitle, onDownloadReady, onRetry }: DownloadProgressProps) {
  const p = parseProgress(progress);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [bgHue, setBgHue] = useState(220);
  const animRef = useRef<number | undefined>(undefined);

  const isProcessing = p.status === "processing";
  const isReady = p.status === "ready";
  const isError = p.status === "error";
  const isDownloading = p.status === "downloading";
  const isActive = isDownloading || isProcessing;

  useEffect(() => {
    if (p.speed > 0) {
      setMaxSpeed((prev) => Math.max(prev, p.speed));
      setSpeedHistory((prev) => [...prev.slice(-40), p.speed]);
    }
  }, [p.speed]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setBgHue((h) => (h + 0.3) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const avgSpeed = speedHistory.length > 0
    ? speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length
    : 0;

  const progressColor = progress.progress < 40
    ? "#22c55e"
    : progress.progress < 75
    ? "#eab308"
    : "#22c55e";

  return (
    <Card className="relative overflow-hidden border-0 animate-slide-up mx-auto max-w-xl">
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: `linear-gradient(135deg, hsla(${bgHue}, 60%, 50%, 0.12), hsla(${bgHue + 60}, 50%, 40%, 0.08))`,
        }}
      />
      {isActive && <ParticleField />}

      <CardContent className="relative p-5 sm:p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500"
              style={{
                background: isReady
                  ? "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1))"
                  : isError
                  ? "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.1))"
                  : `linear-gradient(135deg, hsla(${bgHue}, 70%, 55%, 0.25), hsla(${bgHue + 40}, 50%, 45%, 0.1))`,
                boxShadow: isReady
                  ? "0 0 20px rgba(34,197,94,0.15)"
                  : isError
                  ? "0 0 20px rgba(239,68,68,0.15)"
                  : `0 0 20px hsla(${bgHue}, 70%, 55%, 0.15)`,
              }}
            >
              {isReady ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : isError ? (
                <AlertCircle className="h-5 w-5 text-red-400" />
              ) : isProcessing ? (
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              ) : (
                <div className="relative">
                  <ArrowDownToLine className="h-5 w-5 text-white/90" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-white/90">
                {isReady
                  ? "Download Ready"
                  : isError
                  ? "Download Failed"
                  : isProcessing
                  ? "Processing Video..."
                  : "Downloading..."}
              </p>
              {videoTitle && (
                <p className="text-xs text-white/40 mt-0.5 truncate max-w-[220px] sm:max-w-xs">
                  {videoTitle}
                </p>
              )}
            </div>
          </div>

          {isActive && (
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold font-mono tabular-nums"
              style={{
                background: `linear-gradient(135deg, hsla(${bgHue}, 60%, 50%, 0.2), hsla(${bgHue + 40}, 40%, 40%, 0.1))`,
                color: `hsl(${bgHue + 20}, 80%, 70%)`,
                boxShadow: `0 0 12px hsla(${bgHue}, 60%, 50%, 0.1)`,
              }}
            >
              <span className="text-xs font-normal text-white/50">Progress</span>
              {isProcessing ? (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Merging
                </span>
              ) : (
                `${progress.progress.toFixed(1)}%`
              )}
            </div>
          )}
        </div>

        {isDownloading && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <AnimatedProgressBar value={progress.progress} color={progressColor} />
              <div className="flex justify-between mt-1.5 text-xs text-white/40">
                <span>{formatBytes(p.downloadedSize)}</span>
                <span className="font-mono tabular-nums text-white/60">
                  {progress.progress.toFixed(1)}%
                </span>
                <span>{p.totalSize ? formatBytes(p.totalSize) : "Unknown"}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(34,197,94,0.03))",
                  border: "1px solid rgba(34,197,94,0.12)",
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  <Gauge className="h-3 w-3" />
                  Speed
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                    {p.speed > 0 ? formatSpeed(p.speed) : "—"}
                  </p>
                  <SpeedGauge speed={p.speed} maxSpeed={maxSpeed} />
                </div>
              </div>

              <div
                className="rounded-xl p-3"
                style={{
                  background: "linear-gradient(135deg, rgba(234,179,8,0.10), rgba(234,179,8,0.03))",
                  border: "1px solid rgba(234,179,8,0.12)",
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  <Clock className="h-3 w-3" />
                  ETA
                </div>
                <p className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                  {p.eta > 0 ? formatEta(p.eta) : "—"}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {avgSpeed > 0 && `${formatSpeed(avgSpeed)} avg`}
                </p>
              </div>

              <div
                className="rounded-xl p-3"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(99,102,241,0.03))",
                  border: "1px solid rgba(99,102,241,0.12)",
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  <HardDrive className="h-3 w-3" />
                  Size
                </div>
                <p className="text-sm font-bold text-indigo-400 font-mono tabular-nums">
                  {p.totalSize ? formatBytes(p.totalSize) : "—"}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {p.downloadedSize > 0 && `${formatBytes(p.downloadedSize)} downloaded`}
                </p>
              </div>
            </div>

            {speedHistory.length > 5 && (
              <div className="h-10 rounded-xl overflow-hidden relative"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="absolute inset-0 flex items-end px-1">
                  {speedHistory.map((s, i) => {
                    const h = maxSpeed > 0 ? (s / maxSpeed) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 mx-[0.5px] rounded-t transition-all duration-200"
                        style={{
                          height: `${Math.max(h, 1)}%`,
                          background: `linear-gradient(to top, hsla(${160 + h * 0.8}, 70%, 50%, 0.6), hsla(${160 + h * 0.8}, 70%, 50%, 0.2))`,
                          boxShadow: h > 50 ? `0 0 6px hsla(${160 + h * 0.8}, 70%, 50%, 0.3)` : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="animate-fade-in space-y-3">
            <div className="rounded-xl p-4 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02))",
                border: "1px solid rgba(234,179,8,0.1)",
              }}
            >
              <Sparkles className="h-6 w-6 text-amber-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-white/70">
                Merging audio and video streams...
              </p>
              <div className="flex justify-center gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isReady && (
          <div className="animate-fade-in space-y-4">
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(34,197,94,0.03))",
                border: "1px solid rgba(34,197,94,0.15)",
                boxShadow: "0 0 20px rgba(34,197,94,0.05)",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                <Film className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-300">
                  Video ready for download
                </p>
                <p className="text-xs text-emerald-500/60 mt-0.5 truncate">
                  {videoTitle || "Your video has been processed"}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            </div>

            <Button
              className="w-full h-12 text-base font-semibold gap-2 relative overflow-hidden group"
              size="lg"
              onClick={() => {
                if (onDownloadReady) onDownloadReady(progress.downloadId);
                else window.location.href = getDownloadFileUrl(progress.downloadId);
              }}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
              }}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Download className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Save Video to Computer</span>
              <ArrowDownToLine className="h-4 w-4 relative z-10 group-hover:translate-y-0.5 transition-transform" />
            </Button>

            <p className="text-center text-xs text-white/30">
              File will download directly from our server — no storage, no signup
            </p>
          </div>
        )}

        {isError && (
          <div className="animate-fade-in space-y-3">
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.03))",
                border: "1px solid rgba(239,68,68,0.12)",
              }}
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-300">Download Failed</p>
                <p className="text-xs text-red-400/70 mt-1">
                  {progress.error || "An unexpected error occurred. Please try again."}
                </p>
              </div>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
