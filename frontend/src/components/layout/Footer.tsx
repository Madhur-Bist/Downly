import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/40 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Shield className="h-4 w-4 text-white/30" />
            <span>Your downloads are processed locally and never stored on our servers.</span>
          </div>
          <div className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Downly
          </div>
        </div>
      </div>
    </footer>
  );
}
