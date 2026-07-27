"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface Crumb { label: string; href?: string }

export function PageHeader({
  title, description, breadcrumbs, actions,
}: { title: string; description?: string; breadcrumbs?: Crumb[]; actions?: ReactNode }) {
  return (
    <div className="mb-6 space-y-3">
      {!!breadcrumbs?.length && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={13} className="opacity-50" />}
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-foreground">{c.label}</Link>
                ) : (
                  <span className="text-foreground">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
