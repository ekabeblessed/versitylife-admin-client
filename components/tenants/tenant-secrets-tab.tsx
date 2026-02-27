"use client";

import { useState, useMemo } from "react";
import { useTenantSecrets, useUpdateSecrets } from "@/hooks/use-tenants";
import { useDeploy } from "@/hooks/use-deployments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Rocket,
  Save,
  RotateCcw,
  KeyRound,
} from "lucide-react";
import type { Tenant } from "@/types/tenant";

interface TenantSecretsTabProps {
  tenant: Tenant;
}

// Determine category from key name
type SecretCategory = "core" | "database" | "aws" | "payment" | "ai" | "backup" | "other";

const CATEGORY_ORDER: SecretCategory[] = ["core", "database", "aws", "payment", "ai", "backup", "other"];

const CATEGORY_LABELS: Record<SecretCategory, string> = {
  core: "Core",
  database: "Database",
  aws: "AWS / Storage",
  payment: "Payment",
  ai: "AI",
  backup: "Backup",
  other: "Other",
};

function getSecretCategory(key: string): SecretCategory {
  if (key.includes("MONGODB") || key.includes("DATABASE")) return "database";
  if (key.includes("JWT") || key.includes("CRON")) return "core";
  if (key.includes("AWS") || key.includes("S3") || key.includes("SES") || key.includes("SENDGRID")) return "aws";
  if (
    key.includes("FLUTTER") || key.includes("FLUTTERWAVE") ||
    key.includes("PAYUNIT") || key.includes("STRIPE")
  ) return "payment";
  if (key.includes("ANTHROPIC") || key.includes("GEMINI") || key.includes("OPENAI")) return "ai";
  if (key.includes("GCS") || key.includes("GOOGLE_APPLICATION") || key.includes("BACKUP")) return "backup";
  return "other";
}

export function TenantSecretsTab({ tenant }: TenantSecretsTabProps) {
  const { data, isLoading } = useTenantSecrets(tenant.tenantId);
  const updateSecrets = useUpdateSecrets();
  const deploy = useDeploy();

  // Track which values are revealed
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  // Track edited values (key → new value)
  const [edits, setEdits] = useState<Record<string, string>>({});

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = (key: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (deployAfter: boolean) => {
    if (Object.keys(edits).length === 0) {
      toast.info("No changes to save");
      return;
    }
    try {
      await updateSecrets.mutateAsync({
        tenantId: tenant.tenantId,
        updates: edits,
        deployAfter,
      });
      toast.success(
        deployAfter
          ? "Secrets updated and redeployment initiated"
          : "Secrets updated. Redeploy to apply changes."
      );
      setEdits({});
    } catch (err: any) {
      toast.error("Failed to update secrets", {
        description: err.data?.message || err.message,
      });
    }
  };

  // Group secrets by category
  const grouped = useMemo(() => {
    if (!data?.keys) return [];
    const map = new Map<SecretCategory, typeof data.keys>();
    for (const item of data.keys) {
      const cat = getSecretCategory(item.key);
      const list = map.get(cat) || [];
      list.push(item);
      map.set(cat, list);
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [data]);

  const hasEdits = Object.keys(edits).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load secrets. The secret may not exist yet in GCP Secret Manager.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span>
          Secret changes require a <strong>redeploy</strong> to take effect. Use &ldquo;Save &amp; Deploy&rdquo; to apply immediately.
        </span>
      </div>

      {/* Action bar */}
      {hasEdits && (
        <div className="flex items-center gap-2 justify-end">
          <Badge variant="secondary">{Object.keys(edits).length} unsaved change{Object.keys(edits).length !== 1 ? "s" : ""}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEdits({})}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Discard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={updateSecrets.isPending}
          >
            <Save className="h-3 w-3 mr-1" />
            Save Only
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={updateSecrets.isPending || deploy.isPending}
          >
            {(updateSecrets.isPending || deploy.isPending) ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Rocket className="h-3 w-3 mr-1" />
            )}
            Save &amp; Deploy
          </Button>
        </div>
      )}

      {/* Secrets by category */}
      {grouped.map(({ category, items }) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              {CATEGORY_LABELS[category]}
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-8 px-3 text-left font-medium w-[260px]">Key</th>
                    <th className="h-8 px-3 text-left font-medium">Value</th>
                    <th className="h-8 px-3 text-right font-medium w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isRevealed = revealed.has(item.key);
                    const isEdited = item.key in edits;
                    const displayValue = isEdited
                      ? edits[item.key]
                      : isRevealed
                      ? (item.revealed || item.masked)
                      : item.masked;

                    return (
                      <tr
                        key={item.key}
                        className={`border-b last:border-0 ${isEdited ? "bg-blue-50 dark:bg-blue-950/10" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono text-xs align-middle">
                          {item.key}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className="h-7 text-xs font-mono"
                            type={isRevealed || isEdited ? "text" : "password"}
                            value={displayValue}
                            onChange={(e) => handleEdit(item.key, e.target.value)}
                            placeholder={isEdited ? "" : "Enter new value to override"}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleReveal(item.key)}
                              title={isRevealed ? "Hide" : "Reveal masked value"}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            {isEdited && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleReset(item.key)}
                                title="Discard change"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {grouped.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No secrets found for this tenant.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
