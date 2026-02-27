"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, QrCode } from "lucide-react";

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

  // Existing 2FA verify flow (user already has 2FA enabled)
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // 2FA setup flow (user needs to set up 2FA)
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
        // User must set up 2FA before gaining access
        const token = (response as any).setupToken as string;
        setSetupTokenLocal(token);
        setSetupToken(token);

        // Fetch QR code using setup token
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
      toast.error("Login failed", { description: msg });
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
      // Reset to login form so user can log in with their 2FA code
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
      toast.error("2FA setup failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // ─── 2FA Setup UI ─────────────────────────────────────────────────────────
  if (setupMode) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-deepBlue-600" />
            Set Up Two-Factor Auth
          </CardTitle>
          <CardDescription>
            2FA is required for all platform administrators. Scan the QR code with your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {setupStep === "qr" && qrCode && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="rounded-md border p-2" />
              </div>
              {secret && (
                <div className="rounded-md bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Manual entry key</p>
                  <code className="text-sm font-mono break-all">{secret}</code>
                </div>
              )}
              <Button
                className="w-full h-12 bg-deepBlue-600 hover:bg-deepBlue-700 text-white"
                onClick={() => setSetupStep("verify")}
              >
                <QrCode className="h-4 w-4 mr-2" />
                I&apos;ve Scanned the Code
              </Button>
            </div>
          )}

          {setupStep === "verify" && (
            <form onSubmit={handleEnable2FA} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="setupCode" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Enter the 6-digit code from your app
                </Label>
                <Input
                  id="setupCode"
                  type="text"
                  placeholder="000000"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)}
                  maxLength={6}
                  className="h-12 text-center text-lg tracking-widest"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setSetupStep("qr")}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-deepBlue-600 hover:bg-deepBlue-700 text-white"
                  disabled={loading || setupCode.length !== 6}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Enable 2FA
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Standard Login / 2FA Verify UI ──────────────────────────────────────
  return (
    <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Access the VersityLife Platform Admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@versitylife.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {show2FA && (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Two-Factor Code
                </Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  maxLength={6}
                  className="h-12 text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-deepBlue-600 hover:bg-deepBlue-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {show2FA ? "Verify & Sign In" : "Sign In"}
            </Button>
          </form>
        </CardContent>
    </Card>
  );
}
