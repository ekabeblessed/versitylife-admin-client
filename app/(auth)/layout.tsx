import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col bg-slate-900 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(hsl(210 40% 98% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(210 40% 98% / 1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Golden glow top-left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-goldenYellow-500/10 blur-3xl pointer-events-none" />
        {/* Golden glow bottom-right */}
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-goldenYellow-500/5 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 px-12 pt-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VersityLife" width={36} height={36} className="rounded-xl" />
            <span className="text-white font-semibold text-lg tracking-tight">VersityLife</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-12">
          <div className="max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-goldenYellow-500 mb-4">Platform Administration</p>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              One dashboard.<br />Every campus.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Provision universities, deploy services, and monitor infrastructure — all from a single control plane.
            </p>

            <div className="space-y-3.5">
              {[
                { label: "Instant tenant provisioning", sub: "15-minute setup end-to-end" },
                { label: "Real-time health monitoring", sub: "Automated checks across all services" },
                { label: "Zero-downtime deployments", sub: "Rolling updates with rollback support" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-goldenYellow-500/20 border border-goldenYellow-500/40 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-goldenYellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 mx-10 mb-10 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm px-6 py-4 grid grid-cols-3 gap-4">
          {[
            { value: "50+", label: "Universities" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "15min", label: "Avg. provision" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-goldenYellow-400 tabular-nums">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-950">
        {children}
      </div>
    </div>
  );
}
