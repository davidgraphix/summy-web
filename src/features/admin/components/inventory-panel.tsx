"use client";

import { useState } from "react";
import { History, Minus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import {
  useProductInventory, useInventoryHistory, useInventoryMutations,
} from "../admin-hooks";

/** Stock, thresholds and movement history for one product. */
export function InventoryPanel({ productId, slug }: { productId: string; slug?: string }) {
  const { data: inv, isLoading } = useProductInventory(productId);
  const history = useInventoryHistory(productId);
  const m = useInventoryMutations(productId, slug);

  const [stock, setStock] = useState<string>("");
  const [adjustment, setAdjustment] = useState<string>("");
  const [reason, setReason] = useState("");
  const [low, setLow] = useState<string>("");
  const [reorder, setReorder] = useState<string>("");

  const current = inv?.quantity ?? inv?.stockQuantity;

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-bold tracking-tight">Inventory</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Stock changes update storefront availability immediately.
        </p>

        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Metric label="On hand" value={current ?? "—"} />
            <Metric label="Reserved" value={inv?.reserved ?? "—"} />
            <Metric label="Available" value={inv?.available ?? (typeof current === "number" ? current - (inv?.reserved ?? 0) : "—")} />
          </div>
        )}

        <Tabs defaultValue="adjust">
          <TabsList>
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="space-y-4">
            {/* Relative adjustment keeps an audit trail; use Set for corrections. */}
            <div className="space-y-2">
              <Field label="Adjust by">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label="Decrease"
                    onClick={() => setAdjustment(String((Number(adjustment) || 0) - 1))}><Minus size={15} /></Button>
                  <Input type="number" value={adjustment} placeholder="e.g. -3 or 10"
                    onChange={(e) => setAdjustment(e.target.value)} className="text-center" />
                  <Button type="button" variant="outline" size="icon" aria-label="Increase"
                    onClick={() => setAdjustment(String((Number(adjustment) || 0) + 1))}><Plus size={15} /></Button>
                </div>
              </Field>
              <Field label="Reason">
                <Input value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Damaged stock, recount, restock…" />
              </Field>
              <Button size="sm" className="w-full"
                disabled={!adjustment || Number(adjustment) === 0 || m.adjust.isPending}
                onClick={() => m.adjust.mutate(
                  { adjustment: Number(adjustment), reason: reason || undefined },
                  { onSuccess: () => { setAdjustment(""); setReason(""); } }
                )}>
                {m.adjust.isPending ? <><Spinner className="h-4 w-4" /> Applying…</> : "Apply adjustment"}
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <Field label="Set exact quantity">
                <Input type="number" min={0} value={stock} placeholder={String(current ?? 0)}
                  onChange={(e) => setStock(e.target.value)} />
              </Field>
              <Button size="sm" variant="outline" className="w-full"
                disabled={stock === "" || m.setStock.isPending}
                onClick={() => m.setStock.mutate(
                  { quantity: Number(stock), reason: reason || undefined },
                  { onSuccess: () => setStock("") }
                )}>
                {m.setStock.isPending ? <><Spinner className="h-4 w-4" /> Saving…</> : "Set stock level"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="thresholds" className="space-y-2">
            <Field label="Low stock threshold">
              <Input type="number" min={0} value={low} placeholder={String(inv?.lowStockThreshold ?? 5)}
                onChange={(e) => setLow(e.target.value)} />
            </Field>
            <Field label="Reorder point">
              <Input type="number" min={0} value={reorder} placeholder={String(inv?.reorderPoint ?? 10)}
                onChange={(e) => setReorder(e.target.value)} />
            </Field>
            <Button size="sm" className="w-full"
              disabled={(low === "" && reorder === "") || m.thresholds.isPending}
              onClick={() => m.thresholds.mutate({
                lowStockThreshold: low === "" ? undefined : Number(low),
                reorderPoint: reorder === "" ? undefined : Number(reorder),
              })}>
              {m.thresholds.isPending ? <><Spinner className="h-4 w-4" /> Saving…</> : <><Save size={15} /> Save thresholds</>}
            </Button>
          </TabsContent>

          <TabsContent value="history">
            {history.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
              </div>
            ) : !history.data?.length ? (
              <p className="flex flex-col items-center gap-1 py-6 text-center text-sm text-muted-foreground">
                <History size={22} /> No stock movements recorded yet.
              </p>
            ) : (
              <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                {history.data.map((h, i) => {
                  const change = h.change ?? h.quantity ?? 0;
                  return (
                    <li key={h.id ?? i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{h.reason ?? h.type ?? "Adjustment"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(h.occurredAt ?? h.createdAt)}
                          {h.performedBy ? ` · ${h.performedBy}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 font-bold ${change >= 0 ? "text-success" : "text-destructive"}`}>
                        {change >= 0 ? "+" : ""}{change}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold">{value}</p>
    </div>
  );
}
