"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export function TwoFactorDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await authApi.setup2FA();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setStep("verify");
    } catch (err: any) {
      toast.error("2FA setup failed", { description: err.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await authApi.enable2FA(verifyCode);
      toast.success("Two-factor authentication enabled!");
      setOpen(false);
      setStep("setup");
      setVerifyCode("");
    } catch (err: any) {
      toast.error("Verification failed", { description: err.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app and enter the code to verify.
          </DialogDescription>
        </DialogHeader>

        {step === "setup" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click below to generate a QR code for your authenticator app.
            </p>
            <Button onClick={handleSetup} disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate QR Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Manual key:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{secret}</code>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input
                id="verify-code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verify & Enable
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
