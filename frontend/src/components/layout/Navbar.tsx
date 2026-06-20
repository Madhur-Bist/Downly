import { Download } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 group-hover:from-blue-500/30 group-hover:to-violet-500/30 transition-all duration-300">
              <Download className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Downly</span>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
