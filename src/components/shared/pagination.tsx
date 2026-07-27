"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page, totalPages, onPage, hasPrev, hasNext,
}: { page: number; totalPages: number; onPage: (p: number) => void; hasPrev?: boolean; hasNext?: boolean }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Button variant="outline" size="icon" disabled={hasPrev === false || page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={18} />
      </Button>
      <span className="px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <Button variant="outline" size="icon" disabled={hasNext === false || page >= totalPages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
