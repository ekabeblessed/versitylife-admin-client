"use client";

import { useState, useEffect } from "react";
import { useBilling, useUpdateBilling, useSendBillingReminder } from "@/hooks/use-tenants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Spinner, CreditCard, FloppyDisk, Warning, CheckCircle,
  Clock, Prohibit, Flask, Envelope,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import type { Tenant, SubscriptionStatus } from "@/types/tenant";

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case "trial":
      return (
        <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          <Flask className="h-3 w-3" />
          Free Trial
        </Badge>
      );
    case "trial_expiring":
      return (
        <Badge variant="warning" className="gap-1">
          <Flask className="h-3 w-3" />
          Trial Expiring
        </Badge>
      );
    case "trial_expired":
      return (
        <Badge variant="destructive" className="gap-1">
          <Warning className="h-3 w-3" />
          Trial Expired
        </Badge>
      );
    case "active":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      );
    case "expiring_soon":
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="destructive" className="gap-1">
          <Warning className="h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Prohibit className="h-3 w-3" />
          Not Set
        </Badge>
      );
  }
}

interface FormState {
  plan: string;
  amount: string;
  currency: string;
  billingCycle: "monthly" | "annual" | "free_trial";
  trialDays: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const CURRENCIES = ["XAF", "USD", "EUR", "GBP", "NGN", "GHS", "KES", "ZAR", "XOF"];

const DEFAULT_FORM: FormState = {
  plan: "",
  amount: "",
  currency: "XAF",
  billingCycle: "annual",
  trialDays: "30",
  startDate: "",
  endDate: "",
  notes: "",
};

export function TenantBillingTab({ tenant }: { tenant: Tenant }) {
  const { data, isLoading } = useBilling(tenant.tenantId);
  const updateBilling = useUpdateBilling();
  const sendReminder = useSendBillingReminder();

  const subscription = data?.subscription;
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (subscription) {
      setForm({
        plan: subscription.plan || "",
        amount: subscription.amount ? String(subscription.amount) : "",
        currency: subscription.currency || "XAF",
        billingCycle: subscription.billingCycle || "annual",
        trialDays: subscription.trialDays ? String(subscription.trialDays) : "30",
        startDate: subscription.startDate
          ? format(parseISO(subscription.startDate), "yyyy-MM-dd")
          : "",
        endDate: subscription.endDate
          ? format(parseISO(subscription.endDate), "yyyy-MM-dd")
          : "",
        notes: subscription.notes || "",
      });
      setIsDirty(false);
    }
  }, [subscription]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }

  // When switching to free_trial, auto-set end date from trialDays if start is set
  function handleCycleChange(value: "monthly" | "annual" | "free_trial") {
    const updates: Partial<FormState> = { billingCycle: value };

    if (value === "free_trial") {
      // Zero out amount — trials are free
      updates.amount = "0";
      // Auto-compute end date if start date is present
      if (form.startDate && form.trialDays) {
        const start = new Date(form.startDate);
        start.setDate(start.getDate() + parseInt(form.trialDays));
        updates.endDate = format(start, "yyyy-MM-dd");
      }
    }

    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  // Recompute endDate when trialDays changes (only in free_trial mode)
  function handleTrialDaysChange(value: string) {
    const updates: Partial<FormState> = { trialDays: value };
    if (form.billingCycle === "free_trial" && form.startDate && value) {
      const start = new Date(form.startDate);
      start.setDate(start.getDate() + parseInt(value));
      updates.endDate = format(start, "yyyy-MM-dd");
    }
    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  // Recompute endDate when startDate changes (only in free_trial mode)
  function handleStartDateChange(value: string) {
    const updates: Partial<FormState> = { startDate: value };
    if (form.billingCycle === "free_trial" && value && form.trialDays) {
      const start = new Date(value);
      start.setDate(start.getDate() + parseInt(form.trialDays));
      updates.endDate = format(start, "yyyy-MM-dd");
    }
    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  const isTrial = form.billingCycle === "free_trial";

  async function handleSendReminder() {
    try {
      const result = await sendReminder.mutateAsync(tenant.tenantId);
      toast.success("Reminder sent", { description: result.message });
    } catch (err: any) {
      toast.error("Failed to send reminder", {
        description: err.data?.message || err.message,
      });
    }
  }

  async function handleSave() {
    try {
      await updateBilling.mutateAsync({
        tenantId: tenant.tenantId,
        data: {
          plan: form.plan,
          amount: isTrial ? 0 : (form.amount ? parseFloat(form.amount) : 0),
          currency: form.currency,
          billingCycle: form.billingCycle,
          trialDays: isTrial ? (parseInt(form.trialDays) || 30) : undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          notes: form.notes,
        },
      });
      toast.success("Billing updated");
      setIsDirty(false);
    } catch (err: any) {
      toast.error("Failed to update billing", {
        description: err.data?.message || err.message,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status summary */}
      {subscription && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {subscription.billingCycle === "free_trial" ? (
                  <Flask className="h-8 w-8 text-purple-500" />
                ) : (
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {subscription.plan || "No plan set"}
                  </p>
                  {subscription.billingCycle === "free_trial" ? (
                    <p className="text-muted-foreground text-sm">
                      Free trial — {subscription.trialDays ?? "?"} days
                    </p>
                  ) : subscription.amount > 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {subscription.currency} {subscription.amount.toLocaleString()} /{" "}
                      {subscription.billingCycle}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <SubscriptionStatusBadge status={subscription.status} />
                {subscription.daysLeft !== null && subscription.daysLeft !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {subscription.daysLeft > 0
                      ? `${subscription.daysLeft} days remaining`
                      : "Ended"}
                  </p>
                )}
              </div>
            </div>

            {(subscription.status === "expired" || subscription.status === "trial_expired") && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                <Warning className="h-4 w-4 shrink-0" />
                {subscription.status === "trial_expired"
                  ? "Free trial has ended. Set up a paid plan to continue."
                  : "Subscription has expired. Please update the end date."}
              </div>
            )}
            {subscription.status === "expiring_soon" && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0" />
                Subscription expiring in {subscription.daysLeft} days. Renew soon.
              </div>
            )}
            {subscription.status === "trial_expiring" && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                <Flask className="h-4 w-4 shrink-0" />
                Free trial ends in {subscription.daysLeft} day{subscription.daysLeft === 1 ? "" : "s"}. Set up a paid plan.
              </div>
            )}

            {/* Billing alert actions */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {subscription.billingAlerts && subscription.billingAlerts.length > 0 ? (
                  (() => {
                    const last = subscription.billingAlerts[subscription.billingAlerts.length - 1];
                    return (
                      <span>
                        Last alert: <span className="font-medium">{last.type.replace(/_/g, " ")}</span>{" "}
                        on {new Date(last.sentAt).toLocaleDateString()}
                      </span>
                    );
                  })()
                ) : (
                  <span>No billing alerts sent yet</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminder}
                disabled={sendReminder.isPending || !tenant.university.contactEmail}
                title={!tenant.university.contactEmail ? "No contact email configured" : "Send billing reminder email"}
              >
                {sendReminder.isPending ? (
                  <Spinner className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Envelope className="h-4 w-4 mr-2" />
                )}
                Send Reminder Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Billing cycle — first, drives the rest */}
          <div className="space-y-2">
            <Label>Billing Type</Label>
            <div className="flex gap-2">
              {(
                [
                  { value: "annual", label: "Annual" },
                  { value: "monthly", label: "Monthly" },
                  { value: "free_trial", label: "Free Trial" },
                ] as { value: FormState["billingCycle"]; label: string }[]
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleCycleChange(value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    form.billingCycle === value
                      ? value === "free_trial"
                        ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300"
                        : "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  {value === "free_trial" && <Flask className="h-3.5 w-3.5 inline mr-1.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Trial-specific: trial days */}
          {isTrial ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trial-days">Trial Duration (days)</Label>
                <Input
                  id="trial-days"
                  type="number"
                  min="1"
                  max="365"
                  value={form.trialDays}
                  onChange={(e) => handleTrialDaysChange(e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  End date is auto-calculated from start date + trial days.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-plan-trial">Plan Name</Label>
                <Input
                  id="p-plan-trial"
                  value={form.plan}
                  onChange={(e) => handleChange("plan", e.target.value)}
                  placeholder="e.g. Starter Trial"
                />
              </div>
            </div>
          ) : (
            /* Paid plan fields */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan Name</Label>
                <Input
                  id="plan"
                  value={form.plan}
                  onChange={(e) => handleChange("plan", e.target.value)}
                  placeholder="e.g. Standard, Premium, Enterprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-2">
                  <Select
                    value={form.currency}
                    onValueChange={(v) => handleChange("currency", v)}
                  >
                    <SelectTrigger className="w-24 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">
                {isTrial ? "Trial End Date" : "End Date"}
                {isTrial && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (auto-calculated)
                  </span>
                )}
              </Label>
              <Input
                id="end-date"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                readOnly={isTrial}
                className={isTrial ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any notes about this subscription..."
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateBilling.isPending}
            >
              {updateBilling.isPending ? (
                <Spinner className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FloppyDisk className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
