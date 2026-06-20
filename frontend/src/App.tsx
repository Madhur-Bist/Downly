import { useState, useCallback, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/layout/Hero";
import { Footer } from "@/components/layout/Footer";
import { VideoInput } from "@/components/features/VideoInput";
import { VideoPreview } from "@/components/features/VideoPreview";
import { QualitySelector } from "@/components/features/QualitySelector";
import { DownloadProgress } from "@/components/features/DownloadProgress";
import { analyzeVideo, startDownload, subscribeToProgress, getDownloadFileUrl } from "@/api/client";
import type { AppPhase, DownloadProgress as DownloadProgressType } from "@/types";

export default function App() {
  const [state, setState] = useState<AppPhase>({ phase: "idle" });
  const [progress, setProgress] = useState<DownloadProgressType | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleAnalyze = useCallback(async (url: string) => {
    setState({ phase: "analyzing" });
    setProgress(null);

    const result = await analyzeVideo(url);
    if (result.success && result.data) {
      setState({ phase: "preview", info: result.data });
    } else {
      setState({ phase: "error", message: result.error || "Failed to analyze video" });
    }
  }, []);

  const handleDownload = useCallback(async (formatId: string, hasAudio: boolean) => {
    if (state.phase !== "preview") return;

    setState({ phase: "downloading", downloadId: "", info: state.info });

    const result = await startDownload(state.info.webpageUrl, formatId, hasAudio, state.info.title);
    if (!result.success || !result.downloadId) {
      setState({ phase: "error", message: result.error || "Failed to start download" });
      return;
    }

    setState({ phase: "downloading", downloadId: result.downloadId, info: state.info });

    unsubscribeRef.current = subscribeToProgress(
      result.downloadId,
      (data) => {
        setProgress(data);
        if (data.status === "ready") {
          setState({ phase: "complete", info: state.info as any });
        } else if (data.status === "error") {
          setState({ phase: "error", message: data.error || "Download failed" });
        }
      },
      (error) => {
        setState({ phase: "error", message: error });
      },
      () => {
        // done
      }
    );
  }, [state]);

  const handleRetry = useCallback(() => {
    setState({ phase: "idle" });
    setProgress(null);
  }, []);

  const handleDownloadReady = useCallback((downloadId: string) => {
    window.location.href = getDownloadFileUrl(downloadId);
  }, []);

  const showInput =
    state.phase === "idle" ||
    state.phase === "analyzing" ||
    state.phase === "error" ||
    state.phase === "preview" ||
    state.phase === "complete";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {showInput && (
          <VideoInput
            onSubmit={handleAnalyze}
            loading={state.phase === "analyzing"}
            error={state.phase === "error" && !progress ? (state as any).message : undefined}
          />
        )}

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 space-y-4 mt-8">
          {state.phase === "preview" && (
            <>
              <VideoPreview info={(state as any).info} />
              <QualitySelector
                info={(state as any).info}
                onDownload={(fid, hasAudio) => handleDownload(fid, hasAudio)}
                loading={false}
              />
            </>
          )}

          {(state.phase === "downloading" || state.phase === "complete") && progress && (
            <DownloadProgress
              progress={progress}
              videoTitle={(state as any).info?.title}
              onDownloadReady={handleDownloadReady}
              onRetry={handleRetry}
            />
          )}

          {state.phase === "error" && progress && (
            <DownloadProgress
              progress={progress}
              onRetry={handleRetry}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
