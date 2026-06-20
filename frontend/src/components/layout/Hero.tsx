import { Globe, Zap, Shield, Monitor, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

const features = [
  {
    icon: Globe,
    title: "Universal Support",
    description: "YouTube, Twitter, Instagram, TikTok, Facebook, and 1800+ sites.",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    borderColor: "rgba(52,211,153,0.15)",
    shadowColor: "rgba(52,211,153,0.05)",
  },
  {
    icon: Zap,
    title: "Maximum Quality",
    description: "Download at the highest available resolution — up to 4K and beyond.",
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    borderColor: "rgba(251,191,36,0.15)",
    shadowColor: "rgba(251,191,36,0.05)",
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "No account needed. All processing happens on your machine.",
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    borderColor: "rgba(167,139,250,0.15)",
    shadowColor: "rgba(167,139,250,0.05)",
  },
  {
    icon: Monitor,
    title: "Any Format",
    description: "MP4, WebM, MKV, or audio-only. Choose what works for you.",
    gradient: "from-rose-500/20 via-rose-500/10 to-transparent",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    borderColor: "rgba(244,114,182,0.15)",
    shadowColor: "rgba(244,114,182,0.05)",
  },
];

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full animate-float"
          style={{
            background: [
              "rgba(52,211,153,0.5)",
              "rgba(251,191,36,0.5)",
              "rgba(167,139,250,0.5)",
              "rgba(244,114,182,0.5)",
            ][i % 4],
            left: `${10 + i * 11}%`,
            top: `${20 + Math.sin(i * 1.2) * 30}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.08] via-transparent to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      <FloatingParticles />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Free · Private · No Signup
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Download{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Any Video
              </span>
              <br />
              Instantly
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Paste any video URL and download it at the highest quality. 
              No uploads, no storage, no tracking — just direct downloads to your device.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="group card-hover animate-slide-up border-0 overflow-hidden"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="relative p-5">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBg} ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
