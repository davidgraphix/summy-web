"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Camera, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { useProfile, useUpdateProfile, useUploadAvatar, useRemoveAvatar } from "@/features/customer/customer-hooks";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "sonner";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const update = useUpdateProfile();
  const upload = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const fileInput = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", phoneNumber: "" },
  });

  // Populate the form once the profile arrives.
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        phoneNumber: profile.phoneNumber ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
    } catch (e) {
      // The hook already toasts the top-level message; this additionally
      // pins field-specific failures onto the matching input.
      if (e instanceof ApiRequestError && e.validationErrors) {
        for (const { field, message } of e.validationErrors) {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          if (key === "firstName" || key === "lastName" || key === "phoneNumber") {
            form.setError(key, { message });
          }
        }
      }
    }
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    if (file.size > MAX_AVATAR_BYTES) { toast.error("Image must be under 5MB"); return; }
    upload.mutate(file);
    e.target.value = "";
  };

  if (isLoading) return <LoadingState label="Loading your profile…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const displayName = profile?.fullName ?? "Your account";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Update your personal details.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-muted text-muted-foreground/50">
              {profile?.profilePictureUrl
                ? <img src={profile.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                : <User size={32} />}
            </div>
            <button onClick={() => fileInput.current?.click()} disabled={upload.isPending}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-60">
              {upload.isPending ? <Spinner className="h-4 w-4" /> : <Camera size={15} />}
            </button>
            <input ref={fileInput} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold">{displayName}</p>
              {profile?.emailConfirmed && (
                <Badge variant="success"><BadgeCheck size={13} /> Verified</Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
          </div>

          {profile?.profilePictureUrl && (
            <Button variant="ghost" size="sm" className="text-destructive" disabled={removeAvatar.isPending}
              onClick={() => removeAvatar.mutate()}>
              {removeAvatar.isPending ? <Spinner className="h-4 w-4" /> : <Trash2 size={14} />} Remove photo
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-bold">Personal details</h2>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="Phone number" error={form.formState.errors.phoneNumber?.message} className="sm:col-span-2">
              <Input inputMode="tel" placeholder="0803 000 0000" {...form.register("phoneNumber")} />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              {/* Email changes aren't part of the profile endpoint contract. */}
              <Input value={profile?.email ?? ""} disabled readOnly />
            </Field>

            <div className="pt-1 sm:col-span-2">
              <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
                {update.isPending ? <><Spinner className="h-4 w-4" /> Saving…</> : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
