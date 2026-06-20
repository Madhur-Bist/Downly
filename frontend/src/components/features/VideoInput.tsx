import { useState, type FormEvent } from "react";
import { Link2, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface VideoInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  error?: string;
}

export function VideoInput({ onSubmit, loading, error }: VideoInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <div className="mx-auto max-w-2xl -mt-8 relative z-10 px-4 sm:px-6">
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-fuchsia-500/40">
        <div className="rounded-2xl bg-background/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 p-2">
              <div className="flex items-center pl-3 text-white/40">
                <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <Input
                type="url"
                placeholder="Paste video URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 border-0 bg-transparent px-2 text-sm sm:text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 sm:h-12 text-white/90 placeholder:text-white/30"
                disabled={loading}
              />
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={loading || !url.trim()}
                className="shrink-0 h-10 sm:h-12 px-4 sm:px-6 gap-2 font-semibold bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300 animate-fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-white/30">
        Supports YouTube, Twitter/X, Instagram, TikTok, Facebook, Vimeo, and 1800+ more sites
      </p>
    </div>
  );
}
