import { Clock, User, Eye, ExternalLink, Film } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { formatNumber, formatDuration } from "@/lib/utils";
import type { VideoInfo } from "@/types";

interface VideoPreviewProps {
  info: VideoInfo;
}

export function VideoPreview({ info }: VideoPreviewProps) {
  const hasThumbnail = info.thumbnail && info.thumbnail.startsWith("http");

  return (
    <Card className="overflow-hidden border-0 animate-slide-up mx-auto max-w-2xl">
      <div className="relative bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {hasThumbnail ? (
              <div className="relative w-full sm:w-56 shrink-0 bg-black/20 overflow-hidden">
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="h-48 w-full object-cover sm:h-full sm:w-56 transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <Badge className="text-xs bg-black/60 text-white/90 border-0 backdrop-blur-sm">
                    <Clock className="mr-1 h-3 w-3" />
                    {info.duration}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex w-full sm:w-56 h-48 shrink-0 items-center justify-center bg-gradient-to-br from-blue-500/10 to-violet-500/10">
                <Film className="h-12 w-12 text-white/20" />
              </div>
            )}

            <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 text-white/90">
                {info.title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-white/30" />
                  {info.uploader}
                </span>
                {info.viewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-white/30" />
                    {formatNumber(info.viewCount)} views
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-white/30" />
                  {info.duration}
                </span>
                <a
                  href={info.webpageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open original
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
