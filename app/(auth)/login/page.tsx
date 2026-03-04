"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "sonner";
import { Spinner, Eye, EyeSlash, ShieldCheck, Lock, QrCode, ArrowLeft } from "@phosphor-icons/react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setSetupToken } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [setupMode, setSetupMode] = useState(false);
  const [setupToken, setSetupTokenLocal] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify">("qr");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(
        email,
        password,
        show2FA ? twoFactorCode : undefined
      );

      if ("requiresTwoFaSetup" in response && response.requiresTwoFaSetup) {
        const token = (response as any).setupToken as string;
        setSetupTokenLocal(token);
        setSetupToken(token);
        const setup = await authApi.setup2FA(token);
        setQrCode(setup.qrCode);
        setSecret(setup.secret);
        setSetupMode(true);
        setSetupStep("qr");
        setLoading(false);
        return;
      }

      if ("requiresTwoFactor" in response && response.requiresTwoFactor) {
        setShow2FA(true);
        setLoading(false);
        return;
      }

      if ("token" in response && response.token) {
        login(response.token, response.user);
        toast.success("Welcome back!");
        const redirectTo = searchParams.get("redirect") || "/tenants";
        router.push(redirectTo);
      }
    } catch (err: any) {
      const msg = err.data?.message || err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupToken || !setupCode) return;
    setLoading(true);
    setError(null);

    try {
      await authApi.enable2FA(setupCode, setupToken);
      toast.success("Two-factor authentication enabled! Please sign in again.");
      setSetupMode(false);
      setSetupTokenLocal(null);
      setSetupCode("");
      setQrCode(null);
      setSecret(null);
      setShow2FA(false);
      setTwoFactorCode("");
    } catch (err: any) {
      const msg = err.data?.message || err.message || "Failed to enable 2FA";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── 2FA Setup Flow ────────────────────────────────────────────────────────
  if (setupMode) {
    return (
      <div className="w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-goldenYellow-500/10 border border-goldenYellow-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-goldenYellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Secure your account</h1>
            <p className="text-xs text-slate-500">Two-factor authentication required</p>
          </div>
        </div>

        {setupStep === "qr" && qrCode ? (
          <div className="space-y-5">
            <p className="text-sm text-slate-400 leading-relaxed">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) to set up 2FA.
            </p>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl border border-slate-700">
                <img src={qrCode} alt="2FA QR Code" className="w-44 h-44" />
              </div>
            </div>
            {secret && (
              <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Manual entry key</p>
                <code className="text-xs font-mono text-slate-300 break-all leading-relaxed">{secret}</code>
              </div>
            )}
            <Button
              className="w-full h-11 bg-goldenYellow-500 hover:bg-goldenYellow-600 text-slate-900 font-semibold"
              onClick={() => setSetupStep("verify")}
            >
              <QrCode className="h-4 w-4 mr-2" />
              I've scanned the code
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEnable2FA} className="space-y-5">
            <p className="text-sm text-slate-400">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>
            {error && <ErrorBanner message={error} />}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Authentication code</Label>
              <Input
                type="text"
                placeholder="000 000"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\s/g, ""))}
                maxLength={6}
                className="h-12 text-center text-xl tracking-[0.5em] font-mono bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 placeholder:tracking-normal"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-4 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                onClick={() => setSetupStep("qr")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-goldenYellow-500 hover:bg-goldenYellow-600 text-slate-900 font-semibold"
                disabled={loading || setupCode.length !== 6}
              >
                {loading ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : null}
                Enable 2FA & sign in
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ─── Main Login Form ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Logo + heading */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-6">
          <Image src="/logo.png" alt="VersityLife" width={32} height={32} className="rounded-lg" />
          <span className="text-white font-semibold text-base tracking-tight">VersityLife</span>
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">Admin</span>
        </div>
        {show2FA ? (
          <>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Two-factor auth</h1>
            <p className="text-sm text-slate-400">Enter the code from your authenticator app.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-slate-400">Sign in to your admin account.</p>
          </>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        {!show2FA ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@versitylife.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11 bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-goldenYellow-500/60 focus:ring-goldenYellow-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-goldenYellow-500/60 focus:ring-goldenYellow-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlash weight="bold" className="h-4 w-4" />
                    : <Eye weight="bold" className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="twoFactorCode" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Authentication code
            </Label>
            <Input
              id="twoFactorCode"
              type="text"
              placeholder="000 000"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, ""))}
              maxLength={6}
              className="h-12 text-center text-xl tracking-[0.5em] font-mono bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 placeholder:tracking-normal"
              autoFocus
              required
            />
          </div>
        )}

        <div className="pt-1">
          <Button
            type="submit"
            className="w-full h-11 bg-goldenYellow-500 hover:bg-goldenYellow-600 text-slate-900 font-semibold text-sm transition-all"
            disabled={loading}
          >
            {loading
              ? <Spinner className="h-4 w-4 animate-spin mr-2" />
              : null}
            {show2FA ? "Verify & sign in" : "Sign in"}
          </Button>
        </div>

        {show2FA && (
          <button
            type="button"
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            onClick={() => { setShow2FA(false); setTwoFactorCode(""); setError(null); }}
          >
            ← Back to sign in
          </button>
        )}
      </form>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-1.5 text-slate-600">
        <Lock className="h-3 w-3" />
        <span className="text-[11px]">Secured with end-to-end encryption</span>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
      <span className="mt-px shrink-0">⚠</span>
      <span>{message}</span>
    </div>
  );
}
