"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Envelope, MagnifyingGlass, Spinner, ChatText, User, Buildings, Phone,
  MapPin, Tag, Clock, Check, Archive, Trash,
} from "@phosphor-icons/react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ContactMessage {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  university?: string;
  phone?: string;
  region?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  notes?: string;
  createdAt: string;
}

interface ContactsResponse {
  success: boolean;
  data: ContactMessage[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  read: { label: "Read", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  replied: { label: "Replied", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  archived: { label: "Archived", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const SUBJECT_LABELS: Record<string, string> = {
  demo: "Demo Request",
  sales: "Sales",
  support: "Support",
  partnership: "Partnership",
  pricing: "Pricing",
  implementation: "Implementation",
  other: "Other",
};

function useContacts(params: { status?: string; subject?: string; search?: string; page: number }) {
  return useQuery<ContactsResponse>({
    queryKey: ["contacts", params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.status) qs.set("status", params.status);
      if (params.subject) qs.set("subject", params.subject);
      if (params.search) qs.set("search", params.search);
      qs.set("page", String(params.page));
      qs.set("limit", "25");
      return apiClient.get<ContactsResponse>(`/api/v1/contacts?${qs}`);
    },
  });
}

function useUpdateStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: string; notes?: string }) =>
      apiClient.patch(`/api/v1/contacts/${id}/status`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

function ContactDetailDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: ContactMessage | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const updateStatus = useUpdateStatus(contact?._id ?? "");
  const del = useDeleteContact();

  if (!contact) return null;

  const badge = STATUS_BADGE[contact.status];

  const handleStatus = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ status });
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    try {
      await del.mutateAsync(contact._id);
      toast.success("Message deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete message");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Envelope className="h-5 w-5 text-goldenYellow-400" />
            Contact Message
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Received {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>
            <div className="flex gap-1 ml-auto">
              {contact.status !== "replied" && (
                <Button size="sm" variant="outline" onClick={() => handleStatus("replied")}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs h-7">
                  <Check className="h-3 w-3 mr-1" />Replied
                </Button>
              )}
              {contact.status !== "archived" && (
                <Button size="sm" variant="outline" onClick={() => handleStatus("archived")}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs h-7">
                  <Archive className="h-3 w-3 mr-1" />Archive
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleDelete}
                className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 text-xs h-7">
                <Trash className="h-3 w-3 mr-1" />Delete
              </Button>
            </div>
          </div>

          {/* Sender info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Name</p>
              <p className="text-sm font-medium text-slate-100">{contact.firstName} {contact.lastName}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Email</p>
              <a href={`mailto:${contact.email}`} className="text-sm text-blue-400 hover:text-blue-300 transition-colors break-all">
                {contact.email}
              </a>
            </div>
            {contact.university && (
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">University</p>
                <p className="text-sm text-slate-100">{contact.university}</p>
              </div>
            )}
            {contact.phone && (
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Phone</p>
                <p className="text-sm text-slate-100">{contact.phone}</p>
              </div>
            )}
            {contact.region && (
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Region</p>
                <p className="text-sm text-slate-100 capitalize">{contact.region}</p>
              </div>
            )}
            <div className="bg-slate-800/60 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Subject</p>
              <p className="text-sm text-slate-100">{SUBJECT_LABELS[contact.subject] ?? contact.subject}</p>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Message</p>
            <div className="bg-slate-800/60 rounded-lg p-4">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Submitted on {format(new Date(contact.createdAt), "PPp")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useContacts({
    status: statusFilter || undefined,
    subject: subjectFilter || undefined,
    search: search || undefined,
    page,
  });

  const messages = data?.data ?? [];
  const pagination = data?.pagination;

  const newCount = messages.filter((m) => m.status === "new").length;

  const openDetail = (contact: ContactMessage) => {
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Envelope className="h-5 w-5 text-goldenYellow-400" />
            Contact Messages
            {newCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs ml-1">
                {newCount} new
              </Badge>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Messages submitted via the VersityLife website contact form
          </p>
        </div>
      </div>

      {/* Stats */}
      {pagination && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["new", "read", "replied", "archived"] as const).map((s) => {
            const badge = STATUS_BADGE[s];
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
                className={`bg-slate-900 border rounded-xl p-4 text-left transition-all hover:border-slate-600 ${
                  statusFilter === s ? "border-goldenYellow-500/50" : "border-slate-800"
                }`}
              >
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1 capitalize">{s}</p>
                <p className={`text-2xl font-bold tabular-nums ${badge.className.split(" ")[1]}`}>
                  —
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search name, email, university..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-goldenYellow-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40 h-10 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-slate-300 focus:bg-slate-800">All statuses</SelectItem>
            <SelectItem value="new" className="text-slate-300 focus:bg-slate-800">New</SelectItem>
            <SelectItem value="read" className="text-slate-300 focus:bg-slate-800">Read</SelectItem>
            <SelectItem value="replied" className="text-slate-300 focus:bg-slate-800">Replied</SelectItem>
            <SelectItem value="archived" className="text-slate-300 focus:bg-slate-800">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44 h-10 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-slate-300 focus:bg-slate-800">All subjects</SelectItem>
            {Object.entries(SUBJECT_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val} className="text-slate-300 focus:bg-slate-800">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <Envelope className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No messages found</p>
          <p className="text-sm text-slate-400">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="h-11 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sender</th>
                    <th className="h-11 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subject</th>
                    <th className="h-11 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">University</th>
                    <th className="h-11 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="h-11 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => {
                    const badge = STATUS_BADGE[msg.status];
                    return (
                      <tr
                        key={msg._id}
                        onClick={() => openDetail(msg)}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100 cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center text-slate-900 font-bold text-xs shrink-0">
                              {msg.firstName.charAt(0)}{msg.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-medium ${msg.status === "new" ? "text-white" : "text-slate-300"}`}>
                                {msg.firstName} {msg.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{msg.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-300 text-sm">{SUBJECT_LABELS[msg.subject] ?? msg.subject}</span>
                          <p className="text-xs text-slate-600 truncate max-w-[200px] mt-0.5">{msg.message}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell text-xs">
                          {msg.university ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs hidden lg:table-cell">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                Showing <span className="text-white font-medium">{messages.length}</span> of{" "}
                <span className="text-white font-medium">{pagination.total}</span> messages
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ContactDetailDialog
        contact={selectedContact}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
