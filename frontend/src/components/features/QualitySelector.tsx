import { useState } from "react";
import {
  Download, Monitor, Smartphone, Tablet, MonitorSmartphone,
  Music2, Check, Sparkles,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { formatBytes } from "@/lib/utils";
import type { VideoInfo, VideoFormat } from "@/types";

interface QualitySelectorProps {
  info: VideoInfo;
  onDownload: (formatId: string, hasAudio: boolean) => void;
  loading: boolean;
}

function getQualityColor(height: number) {
  if (height >= 2160) return {
    gradient: "from-red-500/15 via-red-500/5 to-transparent",
    border: "rgba(239,68,68,0.2)",
    borderHover: "rgba(239,68,68,0.4)",
    text: "text-red-400",
    accent: "#ef4444",
    label: "4K",
    iconColor: "text-red-400",
    bg: "bg-red-500/10",
  };
  if (height >= 1440) return {
    gradient: "from-orange-500/15 via-orange-500/5 to-transparent",
    border: "rgba(249,115,22,0.2)",
    borderHover: "rgba(249,115,22,0.4)",
    text: "text-orange-400",
    accent: "#f97316",
    label: "2K",
    iconColor: "text-orange-400",
    bg: "bg-orange-500/10",
  };
  if (height >= 1080) return {
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    border: "rgba(52,211,153,0.2)",
    borderHover: "rgba(52,211,153,0.4)",
    text: "text-emerald-400",
    accent: "#22c55e",
    label: "1080p",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/10",
  };
  if (height >= 720) return {
    gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    border: "rgba(96,165,250,0.2)",
    borderHover: "rgba(96,165,250,0.4)",
    text: "text-blue-400",
    accent: "#3b82f6",
    label: "720p",
    iconColor: "text-blue-400",
    bg: "bg-blue-500/10",
  };
  if (height >= 480) return {
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    border: "rgba(167,139,250,0.2)",
    borderHover: "rgba(167,139,250,0.4)",
    text: "text-violet-400",
    accent: "#8b5cf6",
    label: "480p",
    iconColor: "text-violet-400",
    bg: "bg-violet-500/10",
  };
  return {
    gradient: "from-gray-500/15 via-gray-500/5 to-transparent",
    border: "rgba(156,163,175,0.2)",
    borderHover: "rgba(156,163,175,0.4)",
    text: "text-gray-400",
    accent: "#9ca3af",
    label: "SD",
    iconColor: "text-gray-400",
    bg: "bg-gray-500/10",
  };
}

function QualityIcon({ height }: { height: number }) {
  if (height >= 1440) return <Monitor className="h-5 w-5" />;
  if (height >= 1080) return <MonitorSmartphone className="h-5 w-5" />;
  if (height >= 720) return <Tablet className="h-5 w-5" />;
  return <Smartphone className="h-5 w-5" />;
}

export function QualitySelector({ info, onDownload, loading }: QualitySelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  const formats = info.formats.filter((f) => f.hasVideo && f.height > 0);
  const selected = formats.find((f) => f.formatId === selectedId);

  return (
    <div className="mx-auto max-w-2xl animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">Available Qualities</h2>
        <Badge variant="secondary" className="text-xs">
          {formats.length} formats
        </Badge>
      </div>

      <div className="grid gap-3">
        {formats.map((f) => {
          const isSelected = f.formatId === selectedId;
          const isVideoOnly = !f.hasAudio;
          const colors = getQualityColor(f.height);

          return (
            <button
              key={f.formatId}
              onClick={() => setSelectedId(f.formatId)}
              className={`
                group relative flex w-full items-center gap-4 rounded-xl border p-4 text-left
                transition-all duration-300 cursor-pointer overflow-hidden
                ${isSelected
                  ? "shadow-lg ring-1"
                  : "hover:shadow-md"
                }
              `}
              style={{
                borderColor: isSelected ? colors.borderHover : colors.border,
                boxShadow: isSelected ? `0 0 20px ${colors.accent}15, 0 4px 12px rgba(0,0,0,0.1)` : "none",
              }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-80"
                } transition-opacity duration-300`}
              />

              <div
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${colors.bg} ${
                  isSelected ? "scale-110" : "group-hover:scale-105"
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 12px ${colors.accent}30` : "none",
                }}
              >
                <QualityIcon height={f.height} />
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-white/90">
                    {f.resolution}
                  </span>
                  <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
                    {f.ext}
                  </span>
                  {f.height >= 2160 && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                      Premium
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/50">
                  <span className="font-mono">
                    {formatBytes(f.filesize || f.filesizeApprox)}
                  </span>
                  {f.tbr && (
                    <span className="font-mono">{Math.round(f.tbr)} kbps</span>
                  )}
                  {f.fps && f.fps > 30 && (
                    <span className="text-amber-400/60">{Math.round(f.fps)} fps</span>
                  )}
                </div>
              </div>

              <div className="relative flex shrink-0 items-center gap-2">
                {isVideoOnly ? (
                  <div
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium"
                    style={{
                      background: `${colors.accent}15`,
                      color: colors.accent,
                      border: `1px solid ${colors.accent}25`,
                    }}
                  >
                    <Music2 className="h-3 w-3" />
                    <span>+Audio</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <Music2 className="h-3 w-3" />
                    <span>Audio</span>
                  </div>
                )}
                {isSelected && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 animate-fade-in"
                    style={{
                      background: `${colors.accent}20`,
                    }}
                  >
                    <Check className="h-3.5 w-3.5" style={{ color: colors.accent }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {formats.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
          No video formats found for this URL.
        </div>
      )}

      {selected && (
        <div
          className="flex flex-col gap-4 rounded-xl border p-5 animate-fade-in"
          style={{
            background: `linear-gradient(135deg, ${getQualityColor(selected.height).accent}08, ${getQualityColor(selected.height).accent}03)`,
            borderColor: `${getQualityColor(selected.height).accent}20`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" style={{ color: getQualityColor(selected.height).accent }} />
                Download as {selected.resolution}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {selected.ext?.toUpperCase()} ·{" "}
                {formatBytes(selected.filesize || selected.filesizeApprox)}
                {selected.fps && selected.fps > 30 && ` · ${Math.round(selected.fps)}fps`}
                {!selected.hasAudio && " · Audio will be merged automatically"}
              </p>
            </div>
            <Button
              onClick={() => onDownload(selected.formatId, selected.hasAudio)}
              loading={loading}
              size="lg"
              className="shrink-0 font-semibold gap-2"
              style={{
                background: `linear-gradient(135deg, ${getQualityColor(selected.height).accent}, ${getQualityColor(selected.height).accent}cc)`,
                boxShadow: `0 4px 16px ${getQualityColor(selected.height).accent}30`,
              }}
            >
              <Download className="h-4 w-4" />
              {loading ? "Processing..." : "Download"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
