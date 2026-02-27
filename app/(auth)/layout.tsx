export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-deepBlue-600 items-center justify-center p-12">
        <div className="text-white max-w-md space-y-6">
          <h1 className="text-4xl font-bold">VersityLife Platform</h1>
          <p className="text-lg text-deepBlue-100">
            Centralized management for all university tenants. Provision,
            deploy, and monitor across your entire fleet.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-goldenYellow-400">50+</p>
              <p className="text-sm text-deepBlue-200">Universities</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-goldenYellow-400">99.9%</p>
              <p className="text-sm text-deepBlue-200">Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-goldenYellow-400">15min</p>
              <p className="text-sm text-deepBlue-200">Provisioning</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
