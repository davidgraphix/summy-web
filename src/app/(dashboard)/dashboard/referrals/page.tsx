"use client";

import { useState } from "react";
import { Check, Copy, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { formatDate } from "@/lib/format";
import { useReferrals, useReferralSummary } from "@/features/referrals/referrals-hooks";
import { toast } from "sonner";

export default function ReferralsPage() {
  const summary = useReferralSummary();
  const list = useReferrals();
  const [copied, setCopied] = useState(false);

  const code = summary.data?.referralCode;
  const shareUrl = code && typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : "";

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy the link manually");
    }
  };

  if (summary.isLoading) return <LoadingState label="Loading your referrals…" />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Referrals</h1>
        <p className="text-sm text-muted-foreground">Invite friends to Summy and earn rewards.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
            <Gift size={22} />
          </div>
          <h2 className="text-lg font-bold">Your referral code</h2>

          {code ? (
            <>
              <p className="mt-2 font-mono text-2xl font-extrabold tracking-wider text-primary">{code}</p>
              {shareUrl && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl border border-border bg-muted px-3 py-2.5 text-xs">
                    {shareUrl}
                  </code>
                  <Button variant="outline" onClick={copy}>
                    {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy link</>}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No referral code is available on your account yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Users size={18} /></div>
          <p className="text-xs text-muted-foreground">Friends referred</p>
          <p className="mt-0.5 text-xl font-extrabold">{summary.data?.totalReferrals ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent"><Gift size={18} /></div>
          <p className="text-xs text-muted-foreground">Qualified referrals</p>
          <p className="mt-0.5 text-xl font-extrabold">{summary.data?.qualifiedReferrals ?? 0}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-bold">Your referrals</h2>
          {list.isLoading ? (
            <LoadingState />
          ) : !list.data?.items.length ? (
            <EmptyState
              icon={<Users size={28} />}
              title="No referrals yet"
              description="Share your link — you'll see everyone who signs up here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {list.data.items.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium">{r.referredCustomerName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.referredAtUtc)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="muted">{r.status}</Badge>
                    {r.rewardAmountFormatted && <span className="text-sm font-bold">{r.rewardAmountFormatted}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
