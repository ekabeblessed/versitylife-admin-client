"use client";

import { useState, useEffect } from "react";
import {
  usePartners, useCreatePartner, useUpdatePartner,
  useSetPartnerStatus, useDeletePartner, usePartnerHealthCheck,
} from "@/hooks/use-partners";
import { useCurrentUser } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, MagnifyingGlass, Spinner, ArrowSquareOut, Heartbeat, Pencil, Trash,
  ToggleLeft, ToggleRight, Handshake, CheckCircle, XCircle, Warning,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Partner, PartnerInput } from "@/types/partner";

function PartnerStatusBadge({ status }: { status: Partner["status"] }) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspended</Badge>;
    default:
      return <Badge variant="secondary">Inactive</Badge>;
  }
}

function HealthDot({ healthy }: { healthy: boolean }) {
  return healthy ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

const DEFAULT_FORM: PartnerInput = {
  name: "",
  shortName: "",
  code: "",
  logo: "",
  website: "",
  apiUrl: "",
  motto: "",
  country: "",
  city: "",
  primaryColor: "#1e3a8a",
  secondaryColor: "#3b82f6",
  status: "active",
  displayOrder: 0,
  features: {
    onlinePayment: false,
    pushNotifications: false,
    courseRegistration: true,
    library: false,
  },
  supportEmail: "",
  supportPhone: "",
};

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const currentUser = useCurrentUser();
  const isSuperadmin = currentUser?.role === "platform_superadmin";
  const canEdit = currentUser?.role === "platform_admin" || isSuperadmin;

  const { data, isLoading } = usePartners({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const setStatus = useSetPartnerStatus();
  const deletePartner = useDeletePartner();
  const healthCheck = usePartnerHealthCheck();

  const partners = data?.partners || [];

  function openCreate() {
    setEditingPartner(null);
    setDialogOpen(true);
  }

  function openEdit(partner: Partner) {
    setEditingPartner(partner);
    setDialogOpen(true);
  }

  async function handleToggleStatus(partner: Partner) {
    const newStatus: Partner["status"] =
      partner.status === "active" ? "inactive" : "active";
    try {
      await setStatus.mutateAsync({ id: partner._id, status: newStatus });
      toast.success(`Partner ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.data?.message || err.message });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePartner.mutateAsync(deleteTarget._id);
      toast.success("Partner deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Failed to delete partner", { description: err.data?.message || err.message });
    }
  }

  async function handleHealthCheck() {
    try {
      const result = await healthCheck.mutateAsync();
      const healthy = result.results.filter((r) => r.healthy).length;
      const total = result.results.length;
      toast.success(`Health check complete: ${healthy}/${total} healthy`);
    } catch (err: any) {
      toast.error("Health check failed", { description: err.data?.message || err.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Partner Registry</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage university partner institutions connected to the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleHealthCheck} disabled={healthCheck.isPending}>
            {healthCheck.isPending ? (
              <Spinner className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Heartbeat className="h-4 w-4 mr-2" />
            )}
            Health Check
          </Button>
          {isSuperadmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading partners...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <Handshake className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No partners found</p>
          <p className="text-sm text-slate-400 max-w-xs">
            {search || statusFilter ? "Try adjusting your filters." : "Add your first partner institution."}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Partner</th>
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Code</th>
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">API URL</th>
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Health</th>
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Features</th>
                <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {partner.logo ? (
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="h-8 w-8 rounded object-contain bg-muted"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: partner.primaryColor || "#1e3a8a" }}
                        >
                          {partner.initial || partner.code.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{partner.name}</p>
                        {partner.shortName && (
                          <p className="text-xs text-slate-400">{partner.shortName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {partner.code}
                  </td>
                  <td className="px-4 py-3">
                    {partner.apiUrl ? (
                      <a
                        href={partner.apiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ArrowSquareOut className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{partner.apiUrl}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PartnerStatusBadge status={partner.status} />
                  </td>
                  <td className="px-4 py-3">
                    <HealthDot healthy={partner.isHealthy} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {partner.features.onlinePayment && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">Pay</Badge>
                      )}
                      {partner.features.library && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">Lib</Badge>
                      )}
                      {partner.features.courseRegistration && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">Courses</Badge>
                      )}
                      {partner.features.pushNotifications && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">Push</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(partner)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(partner)}
                          title={partner.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {partner.status === "active" ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                      {isSuperadmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(partner)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PartnerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
        onSave={async (data) => {
          if (editingPartner) {
            await updatePartner.mutateAsync({ id: editingPartner._id, data });
            toast.success("Partner updated");
          } else {
            await createPartner.mutateAsync(data as PartnerInput);
            toast.success("Partner created");
          }
          setDialogOpen(false);
        }}
        isSaving={createPartner.isPending || updatePartner.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone and will remove all partner data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deletePartner.isPending ? (
                <Spinner className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartnerFormDialog({
  open,
  onOpenChange,
  partner,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onSave: (data: PartnerInput) => Promise<void>;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<PartnerInput>(DEFAULT_FORM);

  // Sync form when dialog opens or partner changes
  useEffect(() => {
    if (open && partner) {
      setForm({
        name: partner.name,
        shortName: partner.shortName || "",
        code: partner.code,
        logo: partner.logo || "",
        website: partner.website || "",
        apiUrl: partner.apiUrl || "",
        motto: partner.motto || "",
        country: partner.country || "",
        city: partner.city || "",
        primaryColor: partner.primaryColor || "#1e3a8a",
        secondaryColor: partner.secondaryColor || "#3b82f6",
        status: partner.status,
        displayOrder: partner.displayOrder,
        features: { ...partner.features },
        supportEmail: partner.supportEmail || "",
        supportPhone: partner.supportPhone || "",
      });
    } else if (open && !partner) {
      setForm(DEFAULT_FORM);
    }
  }, [open, partner]);

  // Reset when dialog opens/closes
  function handleOpenChange(o: boolean) {
    if (o && partner) {
      setForm({
        name: partner.name,
        shortName: partner.shortName || "",
        code: partner.code,
        logo: partner.logo || "",
        website: partner.website || "",
        apiUrl: partner.apiUrl || "",
        motto: partner.motto || "",
        country: partner.country || "",
        city: partner.city || "",
        primaryColor: partner.primaryColor || "#1e3a8a",
        secondaryColor: partner.secondaryColor || "#3b82f6",
        status: partner.status,
        displayOrder: partner.displayOrder,
        features: { ...partner.features },
        supportEmail: partner.supportEmail || "",
        supportPhone: partner.supportPhone || "",
      });
    } else if (o && !partner) {
      setForm(DEFAULT_FORM);
    }
    onOpenChange(o);
  }

  function set(field: keyof PartnerInput, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setFeature(key: keyof Partner["features"], value: boolean) {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await onSave(form);
    } catch (err: any) {
      toast.error("Failed to save partner", { description: err.data?.message || err.message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partner ? "Edit Partner" : "Add Partner"}</DialogTitle>
          <DialogDescription>
            {partner
              ? "Update partner institution details"
              : "Register a new partner institution"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="p-name">Name *</Label>
              <Input
                id="p-name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="University of Example"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-short">Short Name</Label>
              <Input
                id="p-short"
                value={form.shortName}
                onChange={(e) => set("shortName", e.target.value)}
                placeholder="UoE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-code">Code *</Label>
              <Input
                id="p-code"
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="UOE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-country">Country</Label>
              <Input
                id="p-country"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="Cameroon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-city">City</Label>
              <Input
                id="p-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Buea"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="p-motto">Motto</Label>
              <Input
                id="p-motto"
                value={form.motto}
                onChange={(e) => set("motto", e.target.value)}
                placeholder="Knowledge for Development"
              />
            </div>
          </div>

          <Separator />

          {/* URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="p-api-url">API URL</Label>
              <Input
                id="p-api-url"
                value={form.apiUrl}
                onChange={(e) => set("apiUrl", e.target.value)}
                placeholder="https://api.uoe.example.com"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="p-website">Website</Label>
              <Input
                id="p-website"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://uoe.example.com"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="p-logo">Logo URL</Label>
              <Input
                id="p-logo"
                value={form.logo}
                onChange={(e) => set("logo", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <Separator />

          {/* Branding */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="p-primary"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  placeholder="#1e3a8a"
                />
                <input
                  type="color"
                  value={form.primaryColor || "#1e3a8a"}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="p-secondary"
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  placeholder="#3b82f6"
                />
                <input
                  type="color"
                  value={form.secondaryColor || "#3b82f6"}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-3">
            <Label>Features</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { key: "courseRegistration", label: "Course Registration" },
                  { key: "onlinePayment", label: "Online Payment" },
                  { key: "library", label: "Library" },
                  { key: "pushNotifications", label: "Push Notifications" },
                ] as { key: keyof Partner["features"]; label: string }[]
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.features?.[key]}
                    onChange={(e) => setFeature(key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status & order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-status">Status</Label>
              <Select
                value={form.status || "active"}
                onValueChange={(v) => set("status", v as Partner["status"])}
              >
                <SelectTrigger id="p-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-order">Display Order</Label>
              <Input
                id="p-order"
                type="number"
                min="0"
                value={form.displayOrder ?? 0}
                onChange={(e) => set("displayOrder", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Support */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-support-email">Support Email</Label>
              <Input
                id="p-support-email"
                type="email"
                value={form.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
                placeholder="support@uoe.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-support-phone">Support Phone</Label>
              <Input
                id="p-support-phone"
                value={form.supportPhone}
                onChange={(e) => set("supportPhone", e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : null}
              {partner ? "Save Changes" : "Create Partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
