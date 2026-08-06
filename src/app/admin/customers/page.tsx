"use client";

import Link from "next/link";
import { Search, Users } from "lucide-react";
import { PageHeader } from "@/features/admin/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/**
 * NOTE ON DATA SOURCE
 * The backend has no customer *list* endpoint — AdminCustomersController only
 * exposes per-customer routes (/admin/customers/{id}/profile|addresses|activity|
 * dashboard|status), and AdminOrdersController.Search returns OrderSummaryDto,
 * which carries no customer name/email/id at all (only OrderDetailDto does).
 * There is therefore no way to build an accurate customer directory from the
 * current contract without an N+1 fetch of every order's full detail, which
 * isn't a real fix. This page is left as an honest placeholder rather than a
 * feature that quietly shows wrong or partial data — see the audit report for
 * the backend change needed (either a GET /admin/customers list endpoint, or
 * customer identity fields added to OrderSummaryDto).
 */
export default function AdminCustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer directory"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]}
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Users size={28} />
          </div>
          <div>
            <p className="text-lg font-bold">No customer directory yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              The API doesn&apos;t expose a customer list endpoint, and order summaries don&apos;t carry
              enough customer detail to build one reliably. Search Orders by customer name or email
              instead, or open a specific customer&apos;s record if you already know their ID.
            </p>
          </div>
          <Link href="/admin/orders" className={buttonVariants({ variant: "outline" })}>
            <Search size={15} /> Search orders
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
