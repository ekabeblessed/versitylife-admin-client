"use client";

import Link from "next/link";
import { useBillingOverview } from "@/hooks/use-tenants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner, CreditCard, Warning, Clock, CheckCircle, Prohibit, Buildings, Flask } from "@phosphor-icons/react";
import type { SubscriptionStatus, BillingOverviewItem } from "@/types/tenant";

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case "active":
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
    case "expiring_soon":
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />Expiring Soon</Badge>;
    case "expired":
      return <Badge variant="destructive" className="gap-1"><Warning className="h-3 w-3" />Expired</Badge>;
    case "trial":
      return <Badge className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"><Flask className="h-3 w-3" />Trial</Badge>;
    case "trial_expiring":
      return <Badge variant="warning" className="gap-1"><Flask className="h-3 w-3" />Trial Expiring</Badge>;
    case "trial_expired":
      return <Badge variant="destructive" className="gap-1"><Flask className="h-3 w-3" />Trial Ended</Badge>;
    default:
      return <Badge variant="secondary" className="gap-1"><Prohibit className="h-3 w-3" />Not Set</Badge>;
  }
}

function SummaryCard({
  label,
  count,
  variant,
  icon: Icon,
}: {
  label: string;
  count: number;
  variant: "destructive" | "warning" | "success" | "secondary";
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{count}</p>
          </div>
          <Badge variant={variant} className="h-10 w-10 rounded-full p-0 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const { data, isLoading } = useBillingOverview();
  const tenants = data?.tenants || [];

  const expired = tenants.filter((t) => t.subscription.status === "expired" || t.subscription.status === "trial_expired");
  const expiringSoon = tenants.filter((t) => t.subscription.status === "expiring_soon" || t.subscription.status === "trial_expiring");
  const active = tenants.filter((t) => t.subscription.status === "active");
  const trials = tenants.filter((t) => t.subscription.status === "trial");
  const notSet = tenants.filter((t) => t.subscription.status === "not_set");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Billing Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Subscription status across all university tenants
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading billing data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryCard label="Expired" count={expired.length} variant="destructive" icon={Warning} />
            <SummaryCard label="Expiring Soon" count={expiringSoon.length} variant="warning" icon={Clock} />
            <SummaryCard label="Active" count={active.length} variant="success" icon={CheckCircle} />
            <SummaryCard label="On Trial" count={trials.length} variant="secondary" icon={Flask} />
            <SummaryCard label="Not Set" count={notSet.length} variant="secondary" icon={Prohibit} />
          </div>

          {tenants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tenants found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Tenants</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-b-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/50">
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">University</th>
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cycle</th>
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">End Date</th>
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((item) => (
                        <TenantBillingRow key={item.tenantId} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function TenantBillingRow({ item }: { item: BillingOverviewItem }) {
  const sub = item.subscription;
  const endDate = sub.endDate ? new Date(sub.endDate) : null;

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Buildings className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <Link
              href={`/tenants/${item.tenantId}?tab=billing`}
              className="font-medium hover:underline"
            >
              {item.universityName}
            </Link>
            {item.isStaging && (
              <Badge variant="warning" className="ml-2 text-[10px] px-1.5 py-0">STAGING</Badge>
            )}
            {!item.enabled && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Disabled</Badge>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {sub.plan || <span className="italic text-xs">—</span>}
      </td>
      <td className="px-4 py-3">
        {sub.amount > 0 ? (
          <span>{sub.currency} {sub.amount.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground italic text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {sub.billingCycle === "free_trial"
          ? <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">Free Trial{sub.trialDays ? ` (${sub.trialDays}d)` : ""}</span>
          : sub.billingCycle
            ? <span className="capitalize">{sub.billingCycle}</span>
            : <span className="italic text-xs">—</span>
        }
      </td>
      <td className="px-4 py-3">
        {endDate ? (
          <span className={sub.status === "expired" ? "text-destructive font-medium" : ""}>
            {endDate.toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground italic text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={sub.status} />
          {sub.daysLeft !== null && sub.daysLeft !== undefined && sub.daysLeft >= 0 && (
            <span className="text-xs text-muted-foreground">{sub.daysLeft}d</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/tenants/${item.tenantId}?tab=billing`}>Edit</Link>
        </Button>
      </td>
    </tr>
  );
}
