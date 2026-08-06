"use client";

import { useStorefrontSettings } from "@/features/products/settings-hooks";

export function StoreFooter() {
  const { data: settings } = useStorefrontSettings();
  const companyName = settings?.companyName ?? "Summy";
  const location = [settings?.city, settings?.state, settings?.country].filter(Boolean).join(", ");

  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-muted-foreground">
      {companyName}
      {location && ` · ${location}`}
      {settings?.supportEmail && ` · ${settings.supportEmail}`}
    </footer>
  );
}
