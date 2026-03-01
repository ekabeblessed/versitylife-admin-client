"use client";

import { useState, useMemo } from "react";
import { useLiveEnvVars, useUpdateTenant } from "@/hooks/use-tenants";
import { useDeploy } from "@/hooks/use-deployments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Spinner, MagnifyingGlass, CaretDown, CaretRight, FloppyDisk, Rocket,
  Warning, ArrowClockwise, ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
  categorizeLiveEnvVars, getCategoryLabel, CATEGORY_ORDER,
} from "@/lib/env-var-categories";
import type { Tenant, EnvVarCategory, CategorizedEnvVar } from "@/types/tenant";

export function TenantEnvVarsTab({ tenant }: { tenant: Tenant }) {
  const { data, isLoading, error: fetchError, refetch } = useLiveEnvVars(tenant.tenantId);
  const updateTenant = useUpdateTenant();
  const deploy = useDeploy();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));

  const categorized = useMemo(() => {
    if (!data) return [];
    return categorizeLiveEnvVars(data.envVars, data.storedEnv);
  }, [data]);

  const filtered = useMemo(() => {
    let items = categorized;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (v) => v.key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      items = items.filter((v) => v.category === categoryFilter);
    }
    return items;
  }, [categorized, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<EnvVarCategory, CategorizedEnvVar[]>();
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [filtered]);

  const hasEdits = Object.keys(edits).length > 0;
  const diffCount = categorized.filter((v) => v.isDifferent).length;

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
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

  const handleSave = async (andDeploy: boolean) => {
    try {
      await updateTenant.mutateAsync({
        tenantId: tenant.tenantId,
        data: { environment: edits },
      });

      if (andDeploy) {
        await deploy.mutateAsync(tenant.tenantId);
        toast.success("Environment saved and deployment initiated");
      } else {
        toast.success("Environment overrides saved to MongoDB");
      }

      setEdits({});
      refetch();
    } catch (err: any) {
      toast.error("Failed to save", { description: err.data?.message || err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || fetchError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Warning className="h-8 w-8 mx-auto mb-3 text-amber-500" />
          <p className="font-medium">Service not deployed or Cloud Run unreachable</p>
          <p className="text-sm mt-1">
            {fetchError
              ? (fetchError as any).data?.message || (fetchError as any).message
              : "Environment variables are not available until the service is deployed."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {diffCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm">
          <Warning className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>{diffCount}</strong> env var(s) differ between Cloud Run (live) and MongoDB
            (stored overrides). These will sync on next deploy.
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by key or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_ORDER.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} vars</Badge>
      </div>

      {hasEdits && (
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEdits({})}
          >
            <ArrowClockwise className="h-3 w-3 mr-1" />
            Discard ({Object.keys(edits).length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={updateTenant.isPending}
          >
            <FloppyDisk className="h-3 w-3 mr-1" />
            Save to MongoDB
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={updateTenant.isPending || deploy.isPending}
          >
            {(updateTenant.isPending || deploy.isPending) && (
              <Spinner className="h-3 w-3 animate-spin mr-1" />
            )}
            <Rocket className="h-3 w-3 mr-1" />
            Save & Deploy
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {grouped.map(({ category, items }) => {
          const isOpen = openCategories.has(category);
          return (
            <Card key={category}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isOpen ? (
                      <CaretDown className="h-4 w-4" />
                    ) : (
                      <CaretRight className="h-4 w-4" />
                    )}
                    {getCategoryLabel(category)}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="pt-0">
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-8 px-3 text-left font-medium w-[280px]">Key</th>
                          <th className="h-8 px-3 text-left font-medium">Value</th>
                          <th className="h-8 px-3 text-right font-medium w-[80px]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((v) => {
                          const isEdited = v.key in edits;
                          const displayValue = isEdited ? edits[v.key] : v.value;
                          const isSensitive =
                            v.key.includes("SECRET") ||
                            v.key.includes("KEY") ||
                            v.key.includes("PASSWORD") ||
                            v.key.includes("TOKEN");

                          return (
                            <tr
                              key={v.key}
                              className={`border-b last:border-0 ${
                                v.isDifferent ? "bg-amber-50 dark:bg-amber-950/10" : ""
                              } ${isEdited ? "bg-blue-50 dark:bg-blue-950/10" : ""}`}
                            >
                              <td className="px-3 py-1.5 font-mono text-xs align-middle">
                                {v.key}
                                {v.isDifferent && (
                                  <Badge variant="outline" className="ml-2 text-[10px] border-amber-400 text-amber-600">
                                    diff
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-1.5">
                                <Input
                                  className="h-7 text-xs font-mono"
                                  type={isSensitive ? "password" : "text"}
                                  value={displayValue}
                                  onChange={(e) => handleEdit(v.key, e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                {isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => handleReset(v.key)}
                                  >
                                    <ArrowCounterClockwise className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No environment variables match your search.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
