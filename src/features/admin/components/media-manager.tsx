"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { GripVertical, ImageIcon, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/states";
import { Hint } from "@/components/ui/tooltip";
import { cld } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { useProductImages, useMediaMutations } from "../admin-hooks";
import type { Media } from "@/types/models";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Product image manager: drag-and-drop upload, reordering, featured selection,
 * per-image descriptions and deletion. Every change invalidates the storefront
 * caches so the customer product page updates immediately.
 */
export function MediaManager({ productId, slug }: { productId: string; slug?: string }) {
  const { data: images, isLoading } = useProductImages(productId);
  const m = useMediaMutations(productId, slug);
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const list: Media[] = order
    ? (order.map((id) => images?.find((i) => i.id === id)).filter(Boolean) as Media[])
    : images ?? [];

  const accept = (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    const valid = list.filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES);
    const rejected = list.filter((f) => !valid.includes(f));

    for (const f of rejected) {
      if (!f.type.startsWith("image/")) toast.error(`"${f.name}" isn't a recognized image file`);
      else toast.error(`"${f.name}" is over 10MB`);
    }

    if (valid.length) m.upload.mutate(valid);
  };

  /** Reorder locally for instant feedback, then persist the new order. */
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = list.map((i) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    setOrder(next);
    m.reorder.mutate(next, { onSettled: () => setOrder(null) });
    setDragId(null);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold tracking-tight">Images</h3>
            <p className="text-xs text-muted-foreground">
              Drag to reorder. The featured image is used on product cards.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={m.upload.isPending}>
              {m.upload.isPending ? <><Spinner className="h-4 w-4" /> Uploading…</> : <><Upload size={15} /> Upload</>}
            </Button>
            {!!list.length && (
              <ConfirmDialog
                trigger={<Button size="sm" variant="ghost" className="text-destructive"><Trash2 size={15} /> Remove all</Button>}
                title="Remove all images?"
                description="Every image on this product will be deleted. The product page will show a placeholder until you upload new ones."
                actionLabel="Remove all" confirmText="DELETE"
                pending={m.removeMany.isPending}
                onConfirm={() => m.removeMany.mutateAsync(list.map((i) => i.id))}
              />
            )}
          </div>
        </div>

        <input ref={input} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { accept(e.target.files); e.target.value = ""; }} />

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); accept(e.dataTransfer.files); }}
          className={cn(
            "mb-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border"
          )}>
          <ImageIcon size={22} className="mx-auto mb-1.5 text-muted-foreground" />
          <p className="text-sm font-medium">Drop images here</p>
          <p className="text-xs text-muted-foreground">PNG or JPG, up to 10MB each</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={<ImageIcon size={26} />} title="No images yet"
            description="Products with photos convert far better. Add at least one." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((img) => (
              <li key={img.id} draggable
                onDragStart={() => setDragId(img.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(img.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-muted transition-shadow",
                  img.isFeatured ? "border-primary ring-2 ring-primary/25" : "border-border",
                  dragId === img.id && "opacity-50"
                )}>
                <div className="aspect-square">
                  <img src={cld.card(img.secureUrl)} alt={img.altText ?? ""}
                    className="h-full w-full object-cover" />
                </div>

                <span className="absolute left-1.5 top-1.5 grid h-6 w-6 cursor-grab place-items-center rounded-md bg-foreground/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical size={13} />
                </span>

                {img.isFeatured && (
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Featured
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-foreground/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!img.isFeatured && (
                    <Hint label="Set as featured">
                      <button onClick={() => m.setFeatured.mutate(img.id)} aria-label="Set as featured image"
                        className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-foreground hover:bg-white">
                        <Star size={13} />
                      </button>
                    </Hint>
                  )}
                  <ConfirmDialog
                    trigger={
                      <button aria-label="Delete image"
                        className="ml-auto grid h-7 w-7 place-items-center rounded-md bg-white/90 text-destructive hover:bg-white">
                        <Trash2 size={13} />
                      </button>
                    }
                    title="Delete this image?"
                    description="It will be removed from the product page immediately."
                    actionLabel="Delete"
                    pending={m.remove.isPending}
                    onConfirm={() => m.remove.mutateAsync(img.id)}
                  />
                </div>

                <div className="border-t border-border bg-card p-1.5">
                  <Input defaultValue={img.altText ?? ""}
                    placeholder="Alt text…" aria-label="Image alt text"
                    className="h-7 border-0 px-1 text-xs focus-visible:ring-0"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (img.altText ?? "")) {
                        m.setDescription.mutate({ imageId: img.id, altText: v });
                      }
                    }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
