"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { KeyRound, MoreHorizontal, Plus, Power, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { useAdminUsers, useUserMutations, useRoles } from "@/features/admin/admin-hooks";
import { formatDateTime } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { AdminUser } from "@/features/admin/admin-types";

const createSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").optional().or(z.literal("")),
});
type CreateValues = z.infer<typeof createSchema>;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesFor, setRolesFor] = useState<AdminUser | null>(null);

  const m = useUserMutations();
  const { data: roles } = useRoles();

  const query: AdminListQuery = useMemo(() => ({
    pageNumber: page, pageSize, search: search || undefined,
    sort: sorting[0] ? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}` : undefined,
  }), [page, pageSize, search, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminUsers(query);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const submitCreate = form.handleSubmit(async (values) => {
    await m.create.mutateAsync({
      firstName: values.firstName, lastName: values.lastName,
      email: values.email, password: values.password || undefined,
    });
    setCreateOpen(false);
    form.reset();
  });

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(() => [
    {
      id: "name", header: "Name",
      accessorFn: (u) => u.fullName ?? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.email),
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {u.fullName ?? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.email)}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        );
      },
    },
    {
      id: "roles", header: "Roles", enableSorting: false,
      accessorFn: (u) => (u.roleNames ?? u.roles ?? []).join(", "),
      cell: ({ row }) => {
        const list = row.original.roleNames ?? row.original.roles ?? [];
        if (!list.length) return <span className="text-sm text-muted-foreground">No role</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {list.map((r) => <Badge key={r} variant="muted">{r}</Badge>)}
          </div>
        );
      },
    },
    {
      id: "lastLoginAt", header: "Last sign-in", accessorFn: (u) => u.lastLoginAt,
      cell: ({ row }) => formatDateTime(row.original.lastLoginAt),
    },
    {
      id: "status", header: "Status", enableSorting: false,
      accessorFn: (u) => u.status,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status ?? (row.original.isActive === false ? "Disabled" : "Active")} />
      ),
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false, size: 50,
      cell: ({ row }) => {
        const u = row.original;
        const disabled = u.isActive === false || /disabled|suspend/i.test(u.status ?? "");
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.email}`}>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRolesFor(u)}><ShieldCheck size={14} /> Manage roles</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
                  <ConfirmDialog
                    trigger={<button className="flex w-full items-center gap-2"><KeyRound size={14} /> Reset password</button>}
                    title="Send a password reset?"
                    description={`${u.email} will receive an email with instructions to set a new password.`}
                    actionLabel="Send reset email" destructive={false}
                    pending={m.resetPassword.isPending}
                    onConfirm={() => m.resetPassword.mutateAsync(u.id)}
                  />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive={!disabled} onSelect={(e) => e.preventDefault()} asChild>
                  <ConfirmDialog
                    trigger={
                      <button className="flex w-full items-center gap-2">
                        <Power size={14} /> {disabled ? "Enable account" : "Disable account"}
                      </button>
                    }
                    title={disabled ? "Enable this account?" : "Disable this account?"}
                    description={disabled
                      ? "They'll be able to sign in to the admin dashboard again."
                      : "They'll be signed out and blocked from the admin dashboard."}
                    actionLabel={disabled ? "Enable" : "Disable"}
                    destructive={!disabled}
                    pending={m.setStatus.isPending}
                    onConfirm={() => m.setStatus.mutateAsync({
                      id: u.id,
                      body: { status: disabled ? "Active" : "Disabled", isActive: disabled },
                    })}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [m]);

  return (
    <>
      <PageHeader
        title="Team"
        description="Staff accounts with access to this dashboard."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Team" }]}
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Invite user</Button>}
      />

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search team members…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(u) => u.id}
        exportFileName="team"
        emptyTitle="No team members yet"
        emptyDescription="Invite colleagues to help run the store."
        emptyAction={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Invite user</Button>}
      />

      {/* Create user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Leave the password blank to have the backend send them a set-up email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" error={form.formState.errors.firstName?.message}>
                <Input autoFocus {...form.register("firstName")} />
              </Field>
              <Field label="Last name" error={form.formState.errors.lastName?.message}>
                <Input {...form.register("lastName")} />
              </Field>
            </div>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Temporary password (optional)" error={form.formState.errors.password?.message}>
              <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={m.create.isPending}>
                {m.create.isPending ? <><Spinner className="h-4 w-4" /> Creating…</> : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage roles */}
      <RolesDialog user={rolesFor} roles={roles ?? []} onClose={() => setRolesFor(null)}
        onSave={(roleIds) => {
          if (!rolesFor) return;
          m.setRoles.mutate({ id: rolesFor.id, roleIds }, { onSuccess: () => setRolesFor(null) });
        }}
        pending={m.setRoles.isPending} />
    </>
  );
}

function RolesDialog({ user, roles, onClose, onSave, pending }: {
  user: AdminUser | null;
  roles: { id: string; name: string; description?: string }[];
  onClose: () => void;
  onSave: (roleIds: string[]) => void;
  pending?: boolean;
}) {
  // Existing assignments may arrive as names or ids; match on either.
  const assigned = new Set([...(user?.roles ?? []), ...(user?.roleNames ?? [])]);
  const [selected, setSelected] = useState<string[]>([]);

  const initial = roles.filter((r) => assigned.has(r.id) || assigned.has(r.name)).map((r) => r.id);
  const current = selected.length || !user ? selected : initial;

  return (
    <Dialog open={!!user} onOpenChange={(v) => { if (!v) { onClose(); setSelected([]); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage roles</DialogTitle>
          <DialogDescription>
            Roles decide what {user?.email} can see and do in the dashboard.
          </DialogDescription>
        </DialogHeader>

        {roles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No roles defined yet. Create one from the Roles page first.
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {roles.map((r) => {
              const checked = current.includes(r.id);
              return (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50">
                    <Checkbox checked={checked} className="mt-0.5"
                      onCheckedChange={(v) =>
                        setSelected(v ? [...current, r.id] : current.filter((id) => id !== r.id))} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{r.name}</span>
                      {r.description && <span className="block text-xs text-muted-foreground">{r.description}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setSelected([]); }}>Cancel</Button>
          <Button disabled={pending || roles.length === 0} onClick={() => onSave(current)}>
            {pending ? <><Spinner className="h-4 w-4" /> Saving…</> : "Save roles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
