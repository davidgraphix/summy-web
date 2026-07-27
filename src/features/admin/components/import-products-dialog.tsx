"use client";

import { useRef, useState, type ReactNode } from "react";
import { FileUp, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCatalogMutations } from "../admin-hooks";

/** CSV/XLSX bulk import via POST /admin/catalog/products/import. */
export function ImportProductsDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const { importProducts } = useCatalogMutations();

  const submit = async () => {
    if (!file) return;
    await importProducts.mutateAsync(file);
    setOpen(false);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFile(null); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet to create or update products in bulk. Export your catalogue first
            if you want a template with the expected columns.
          </DialogDescription>
        </DialogHeader>

        <button onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/40">
          <FileUp size={26} className="text-muted-foreground" />
          {file ? (
            <>
              <span className="text-sm font-semibold">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · click to change</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">Choose a file</span>
              <span className="text-xs text-muted-foreground">CSV or Excel</span>
            </>
          )}
        </button>
        <input ref={input} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!file || importProducts.isPending}>
            {importProducts.isPending ? <><Spinner className="h-4 w-4" /> Importing…</> : <><Upload size={15} /> Import</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
