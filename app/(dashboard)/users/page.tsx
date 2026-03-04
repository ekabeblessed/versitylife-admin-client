"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users-api";
import { useCurrentUser } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, MagnifyingGlass, Spinner, Users, SignOut } from "@phosphor-icons/react";
import { format, formatDistanceToNow } from "date-fns";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "platform_viewer",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["platform-users", search],
    queryFn: () => usersApi.list({ search: search || undefined }),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["user-activity"],
    queryFn: () => usersApi.getActivity(),
    enabled: currentUser?.role === "platform_superadmin",
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("User created");
      setShowCreate(false);
      setNewUser({ email: "", username: "", password: "", firstName: "", lastName: "", role: "platform_viewer" });
    },
    onError: (err: any) => {
      toast.error("Failed to create user", { description: err.data?.message || err.message });
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (userId: string) => usersApi.forceLogout(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-activity"] });
      toast.success(data.message);
    },
    onError: (err: any) => {
      toast.error("Failed to force logout", { description: err.data?.message || err.message });
    },
  });

  const users = data?.users || [];
  const activityUsers = activityData?.users || [];
  const isSuperadmin = currentUser?.role === "platform_superadmin";

  const roleColors: Record<string, "default" | "info" | "secondary"> = {
    platform_superadmin: "default",
    platform_admin: "info",
    platform_viewer: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage users who can access this admin panel</p>
        </div>
        {isSuperadmin && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          {isSuperadmin && <TabsTrigger value="activity">Activity</TabsTrigger>}
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
              <p className="text-sm text-slate-500 mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
                <Users className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-base font-semibold text-white mb-1">No users found</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</th>
                    <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                    <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
                    <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">2FA</th>
                    <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                      <td className="px-4 py-3 font-medium text-white">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleColors[user.role] || "secondary"}>
                          {user.role.replace(/platform_/g, "").replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.status === "active" ? "success" : "secondary"}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.twoFactorEnabled ? (
                          <Badge variant="success">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Off</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {user.lastLogin ? format(new Date(user.lastLogin), "PPp") : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {isSuperadmin && (
          <TabsContent value="activity" className="space-y-4">
            {activityLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
                <p className="text-sm text-slate-500 mt-2">Loading activity...</p>
              </div>
            ) : activityUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
                  <Users className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-base font-semibold text-white mb-1">No activity data</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50">
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Login</th>
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Activity</th>
                      <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityUsers.map((user) => (
                      <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                        <td className="px-4 py-3 font-medium text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={roleColors[user.role] || "secondary"}>
                            {user.role.replace(/platform_/g, "").replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.status === "active" ? "success" : "secondary"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {user.lastLogin
                            ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                            : "Never"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {user.lastActivity
                            ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })
                            : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => forceLogoutMutation.mutate(user._id)}
                            disabled={forceLogoutMutation.isPending || user._id === currentUser?._id}
                          >
                            <SignOut className="h-3 w-3 mr-1" />
                            Force Logout
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={newUser.firstName}
                  onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newUser.lastName}
                  onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_superadmin">Superadmin</SelectItem>
                  <SelectItem value="platform_admin">Admin</SelectItem>
                  <SelectItem value="platform_viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending && <Spinner className="h-4 w-4 animate-spin mr-2" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
