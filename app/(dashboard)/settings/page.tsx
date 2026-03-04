"use client";

import { useState, useEffect } from "react";
import { useCurrentUser, useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api/auth-api";
import { useGlobalEnv, useUpdateGlobalEnv } from "@/hooks/use-global-config";
import { useDeploymentNotifications, useUpdateDeploymentNotifications } from "@/hooks/use-deployment-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Spinner, ShieldCheck, Key, Plus, Trash, Globe, FloppyDisk, Bell, X } from "@phosphor-icons/react";

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
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account settings</p>
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

      {isSuperadmin && <DeploymentNotificationsSection />}
      {isSuperadmin && <GlobalEnvSection />}
    </div>
  );
}

const ALL_STATUSES = ["FAILURE", "TIMEOUT", "INTERNAL_ERROR", "SUCCESS"] as const;

function DeploymentNotificationsSection() {
  const { data, isLoading } = useDeploymentNotifications();
  const updateConfig = useUpdateDeploymentNotifications();
  const [enabled, setEnabled] = useState(true);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [notifyOn, setNotifyOn] = useState<string[]>([]);
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      setEnabled(data.enabled);
      setRecipients(data.recipients || []);
      setNotifyOn(data.notifyOn || []);
      setFromEmail(data.fromEmail || "");
      setFromName(data.fromName || "");
      setInitialized(true);
    }
  }, [data, initialized]);

  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (recipients.includes(email)) {
      toast.error("Email already added");
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setNewRecipient("");
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  const toggleStatus = (status: string) => {
    setNotifyOn((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleSave = async () => {
    if (recipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    if (notifyOn.length === 0) {
      toast.error("Select at least one status to notify on");
      return;
    }
    try {
      await updateConfig.mutateAsync({
        enabled,
        recipients,
        notifyOn,
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim(),
      });
      toast.success("Deployment notification settings saved");
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
              <Bell className="h-5 w-5" />
              Deployment Notifications
            </CardTitle>
            <CardDescription>
              Configure email alerts for CI/CD build events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="deploy-notify-toggle" className="text-sm text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="deploy-notify-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Notify On</Label>
              <p className="text-xs text-muted-foreground">Select which build statuses trigger an email</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((status) => (
                  <Badge
                    key={status}
                    variant={notifyOn.includes(status) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleStatus(status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={addRecipient}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipients.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="ml-1 rounded-full hover:bg-slate-600 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="support@versitylife.com"
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Versity Life CI/CD"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateConfig.isPending}>
                {updateConfig.isPending ? (
                  <Spinner className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FloppyDisk className="h-4 w-4 mr-2" />
                )}
                Save Notification Settings
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
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
