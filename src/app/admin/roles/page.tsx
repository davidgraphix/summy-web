"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { useRoles, usePermissionList, usePermissionMatrix, useRoleMutations } from "@/features/admin/admin-hooks";
import type { Permission, Role } from "@/features/admin/admin-types";

const schema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const permGroup = (p: Permission) => p.group;

export default function AdminRolesPage() {
  return (
    <>
      <PageHeader
        title="Roles &amp; permissions"
        description="Control what each team member can access."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Roles" }]}
      />
      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="matrix">Permission matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="matrix"><MatrixTab /></TabsContent>
      </Tabs>
    </>
  );
}

function RolesTab() {
  const { data: roles, isLoading, isError, refetch } = useRoles();
  const { data: permissions } = usePermissionList();
  const m = useRoleMutations();
  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "" } });

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions ?? []) {
      const g = permGroup(p);
      map.set(g, [...(map.get(g) ?? []), p]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const openNew = () => { form.reset({ name: "", description: "" }); setSelectedPerms([]); setEditing("new"); };
  const openEdit = (r: Role) => {
    form.reset({ name: r.name, description: r.description ?? "" });
    setSelectedPerms(r.permissions);
    setEditing(r);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (editing === "new") {
      await m.create.mutateAsync({
        name: values.name, description: values.description || undefined, permissions: selectedPerms,
      });
    } else if (editing) {
      // Role names cannot be changed once created — only description/permissions.
      await m.update.mutateAsync({
        id: editing.id, body: { description: values.description || undefined, permissions: selectedPerms },
      });
    }
    setEditing(null);
  });

  const saving = m.create.isPending || m.update.isPending;

  if (isLoading) return <LoadingState label="Loading roles…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openNew}><Plus size={15} /> New role</Button>
      </div>

      {!roles?.length ? (
        <Card><CardContent className="p-5">
          <EmptyState icon={<ShieldCheck size={26} />} title="No roles yet"
            description="Create roles to group permissions and assign them to your team."
            action={<Button onClick={openNew}><Plus size={15} /> New role</Button>} />
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.name}</p>
                    {r.description && <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                  {r.isSystemRole && <Badge variant="muted">System</Badge>}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="outline">{r.permissions.length} permissions</Badge>
                  <Badge variant="outline">{r.userCount} users</Badge>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil size={14} /> Edit</Button>
                  {!r.isSystemRole && (
                    <ConfirmDialog
                      trigger={<Button size="sm" variant="ghost" className="text-destructive"><Trash2 size={14} /></Button>}
                      title={`Delete the “${r.name}” role?`}
                      description="Team members with only this role will lose dashboard access."
                      actionLabel="Delete role"
                      pending={m.remove.isPending}
                      onConfirm={() => m.remove.mutateAsync(r.id)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New role" : `Edit “${editing?.name ?? ""}”`}</DialogTitle>
            <DialogDescription>Choose the permissions this role grants.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role name" error={form.formState.errors.name?.message}>
                <Input autoFocus={editing === "new"} disabled={editing !== "new"}
                  placeholder="Store manager" {...form.register("name")} />
                {editing !== "new" && (
                  <p className="text-xs text-muted-foreground">Names can&apos;t be changed after creation.</p>
                )}
              </Field>
              <Field label="Description (optional)">
                <Input placeholder="Runs day-to-day operations" {...form.register("description")} />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Permissions</p>
              {grouped.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  No permissions returned by the API yet.
                </p>
              ) : (
                <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border p-4">
                  {grouped.map(([group, perms]) => (
                    <div key={group}>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group}</p>
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {perms.map((p) => {
                          const checked = selectedPerms.includes(p.name);
                          return (
                            <li key={p.id}>
                              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 hover:bg-muted/50">
                                <Checkbox checked={checked} className="mt-0.5"
                                  onCheckedChange={(v) => setSelectedPerms(
                                    v ? [...selectedPerms, p.name] : selectedPerms.filter((k) => k !== p.name)
                                  )} />
                                <span className="text-sm">{p.name}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Spinner className="h-4 w-4" /> Saving…</> : "Save role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MatrixTab() {
  const { data, isLoading, isError, refetch } = usePermissionMatrix();

  if (isLoading) return <LoadingState label="Loading permission matrix…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  // rolePermissions is keyed by role NAME (not id) — that's the grain the
  // backend's PermissionMatrixDto uses throughout.
  const roleNames = Object.keys(data?.rolePermissions ?? {});
  const permissions = Object.values(data?.permissionGroups ?? {}).flat();
  const granted = (roleName: string, permissionName: string) =>
    !!data?.rolePermissions[roleName]?.includes(permissionName);

  if (!roleNames.length || !permissions.length) {
    return (
      <Card><CardContent className="p-5">
        <EmptyState icon={<ShieldCheck size={26} />} title="Matrix unavailable"
          description="Create at least one role and ensure the permissions endpoint returns data." />
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Permission
                </th>
                {roleNames.map((name) => (
                  <th key={name} scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <th scope="row" className="sticky left-0 bg-card px-4 py-2.5 text-left font-medium">
                    {p.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{p.group}</span>
                  </th>
                  {roleNames.map((name) => (
                    <td key={name} className="px-4 py-2.5 text-center">
                      {granted(name, p.name)
                        ? <Check size={15} className="mx-auto text-success" aria-label="Granted" />
                        : <span className="text-muted-foreground/40" aria-label="Not granted">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
