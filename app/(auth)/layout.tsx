export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="text-white max-w-md space-y-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xl">V</span>
            </div>
            <h1 className="text-4xl font-bold">VersityLife</h1>
          </div>
          <p className="text-lg text-slate-300">
            Centralized management for all university tenants. Provision,
            deploy, and monitor across your entire fleet.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-goldenYellow-400">50+</p>
              <p className="text-sm text-slate-400">Universities</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-goldenYellow-400">99.9%</p>
              <p className="text-sm text-slate-400">Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-goldenYellow-400">15min</p>
              <p className="text-sm text-slate-400">Provisioning</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-slate-950">
        {children}
      </div>
    </div>
  );
}
