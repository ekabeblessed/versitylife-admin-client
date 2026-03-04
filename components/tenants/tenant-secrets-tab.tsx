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
  Warning,
  Eye,
  EyeSlash,
  Spinner,
  Rocket,
  FloppyDisk,
  ArrowClockwise,
  ArrowCounterClockwise,
  Key,
} from "@phosphor-icons/react";
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
        <Spinner className="h-8 w-8 animate-spin text-goldenYellow-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-12 text-center text-slate-400">
          Failed to load secrets. The secret may not exist yet in GCP Secret Manager.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
        <Warning weight="fill" className="h-5 w-5 text-amber-400 shrink-0" />
        <span className="text-amber-300">
          Secret changes require a <strong className="text-amber-200">redeploy</strong> to take effect. Use <span className="text-goldenYellow-400 font-medium">"Save & Deploy"</span> to apply immediately.
        </span>
      </div>

      {/* Action bar */}
      {hasEdits && (
        <div className="flex items-center gap-2 justify-end">
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">{Object.keys(edits).length} unsaved change{Object.keys(edits).length !== 1 ? "s" : ""}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEdits({})}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowClockwise className="h-3 w-3 mr-1" />
            Discard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={updateSecrets.isPending}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <FloppyDisk className="h-3 w-3 mr-1" />
            Save Only
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={updateSecrets.isPending || deploy.isPending}
            className="bg-goldenYellow-500 hover:bg-goldenYellow-600 text-slate-900 font-medium"
          >
            {(updateSecrets.isPending || deploy.isPending) ? (
              <Spinner className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Rocket className="h-3 w-3 mr-1" />
            )}
            Save & Deploy
          </Button>
        </div>
      )}

      {/* Secrets by category */}
      {grouped.map(({ category, items }) => (
        <Card key={category} className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 border-b border-slate-800">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Key className="h-4 w-4 text-goldenYellow-400" />
              {CATEGORY_LABELS[category]}
              <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="h-8 px-3 text-left font-medium text-slate-300 w-[260px]">Key</th>
                    <th className="h-8 px-3 text-left font-medium text-slate-300">Value</th>
                    <th className="h-8 px-3 text-right font-medium text-slate-300 w-[100px]">Actions</th>
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
                        className={`border-b border-slate-800 last:border-0 ${isEdited ? "bg-amber-500/10" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono text-xs text-slate-300 align-middle">
                          {item.key}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className="h-7 text-xs font-mono bg-slate-800 border-slate-700 text-slate-200"
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
                              className="h-7 w-7 text-slate-400 hover:text-white"
                              onClick={() => toggleReveal(item.key)}
                              title={isRevealed ? "Hide" : "Reveal masked value"}
                            >
                              {isRevealed ? (
                                <EyeSlash className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            {isEdited && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-white"
                                onClick={() => handleReset(item.key)}
                                title="Discard change"
                              >
                                <ArrowCounterClockwise className="h-3 w-3" />
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
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center text-slate-400">
            No secrets found for this tenant.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
