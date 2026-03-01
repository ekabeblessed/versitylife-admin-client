"use client";

import { useState, useEffect } from "react";
import { useCurrentUser, useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api/auth-api";
import { useGlobalEnv, useUpdateGlobalEnv } from "@/hooks/use-global-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Spinner, ShieldCheck, Key, Plus, Trash, Globe, FloppyDisk } from "@phosphor-icons/react";

export default function SettingsPage() {
  const user = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [setup2FALoading, setSetup2FALoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.changePassword(currentPassword, newPassword);
      useAuthStore.getState().login(result.token, user!);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Failed", { description: err.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setSetup2FALoading(true);
    try {
      const result = await authApi.setup2FA();
      setQrCode(result.qrCode);
      setSecret(result.secret);
    } catch (err: any) {
      toast.error("Failed", { description: err.data?.message || err.message });
    } finally {
      setSetup2FALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      await authApi.enable2FA(verifyCode);
      toast.success("2FA enabled!");
      setQrCode("");
      setSecret("");
      setVerifyCode("");
    } catch (err: any) {
      toast.error("Failed", { description: err.data?.message || err.message });
    }
  };

  const isSuperadmin = user?.role === "platform_superadmin";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="text-muted-foreground">Name</div>
            <div>{user?.firstName} {user?.lastName}</div>
            <div className="text-muted-foreground">Email</div>
            <div>{user?.email}</div>
            <div className="text-muted-foreground">Username</div>
            <div>{user?.username}</div>
            <div className="text-muted-foreground">Role</div>
            <div>
              <Badge>{user?.role?.replace(/platform_/g, "").replace(/_/g, " ")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="h-4 w-4 animate-spin mr-2" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.twoFactorEnabled ? (
            <Badge variant="success">2FA Enabled</Badge>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Manual key:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{secret}</code>
              </div>
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest max-w-xs"
                />
              </div>
              <Button onClick={handleEnable2FA} disabled={verifyCode.length !== 6}>
                Verify & Enable
              </Button>
            </div>
          ) : (
            <Button onClick={handleSetup2FA} disabled={setup2FALoading} variant="outline">
              {setup2FALoading && <Spinner className="h-4 w-4 animate-spin mr-2" />}
              Set Up 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {isSuperadmin && <GlobalEnvSection />}
    </div>
  );
}

function GlobalEnvSection() {
  const { data, isLoading } = useGlobalEnv();
  const updateGlobalEnv = useUpdateGlobalEnv();
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data?.environment && !initialized) {
      const entries = Object.entries(data.environment);
      setEnvVars(
        entries.length > 0
          ? entries.map(([key, value]) => ({ key, value }))
          : []
      );
      setInitialized(true);
    }
  }, [data, initialized]);

  const addVar = () => {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const environment: Record<string, string> = {};
    for (const { key, value } of envVars) {
      if (key.trim()) {
        environment[key.trim()] = value;
      }
    }
    try {
      await updateGlobalEnv.mutateAsync(environment);
      toast.success("Global environment variables saved");
    } catch (err: any) {
      toast.error("Failed to save", {
        description: err.data?.message || err.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Environment Variables
            </CardTitle>
            <CardDescription>
              Default environment variables applied to all tenants. Per-tenant values override these on deploy.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addVar}>
            <Plus className="h-4 w-4 mr-1" />
            Add Variable
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : envVars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No global variables configured. Click &quot;Add Variable&quot; to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {envVars.map((env, index) => (
              <div key={index} className="flex gap-3 items-center">
                <Input
                  value={env.key}
                  onChange={(e) =>
                    setEnvVars((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item))
                    )
                  }
                  placeholder="KEY"
                  className="font-mono text-sm flex-1"
                />
                <Input
                  value={env.value}
                  onChange={(e) =>
                    setEnvVars((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item))
                    )
                  }
                  placeholder="value"
                  className="font-mono text-sm flex-[2]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVar(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {envVars.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateGlobalEnv.isPending}>
                {updateGlobalEnv.isPending ? (
                  <Spinner className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FloppyDisk className="h-4 w-4 mr-2" />
                )}
                Save Global Variables
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
