"use client";

import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Upload, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useCatalogMutations } from "../admin-hooks";
import type { ProductImportRow, ProductImportResult } from "../admin-types";

/**
 * Parses RFC4180-style CSV (quoted fields, embedded commas/quotes) into rows,
 * matching the escaping used by GET /admin/catalog/products/export so a file
 * exported from this app round-trips through import.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Expected export header — see AdminCatalogBulkController / ProductBulkService.ExportCsvAsync. */
const HEADER = ["Sku", "Name", "Category", "Brand", "PriceInKobo", "DiscountPriceInKobo", "StockQuantity", "Barcode", "WeightGrams", "IsPublished"];

function rowsFromCsv(text: string): { rows: ProductImportRow[]; errors: string[] } {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], errors: ["The file has no data rows."] };

  const header = table[0]!.map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const errors: string[] = [];
  const missing = HEADER.filter((h) => !["Barcode", "WeightGrams", "DiscountPriceInKobo", "StockQuantity", "IsPublished"].includes(h) && idx(h) < 0);
  if (missing.length) {
    return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };
  }

  const rows: ProductImportRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const cells = table[i]!;
    const get = (name: string) => { const j = idx(name); return j >= 0 ? (cells[j] ?? "").trim() : ""; };
    const sku = get("Sku");
    const name = get("Name");
    const categoryName = get("Category");
    if (!sku || !name || !categoryName) {
      errors.push(`Row ${i + 1}: Sku, Name and Category are required — skipped.`);
      continue;
    }
    const priceInKobo = Number(get("PriceInKobo"));
    if (!Number.isFinite(priceInKobo)) {
      errors.push(`Row ${i + 1}: PriceInKobo is not a number — skipped.`);
      continue;
    }
    rows.push({
      sku, name, categoryName,
      brandName: get("Brand") || undefined,
      priceInKobo,
      discountPriceInKobo: get("DiscountPriceInKobo") ? Number(get("DiscountPriceInKobo")) : undefined,
      stockQuantity: get("StockQuantity") ? Number(get("StockQuantity")) : undefined,
      barcode: get("Barcode") || undefined,
      weightGrams: get("WeightGrams") ? Number(get("WeightGrams")) : undefined,
      isPublished: /^true|1|yes$/i.test(get("IsPublished")),
    });
  }
  return { rows, errors };
}

/** Bulk import via POST /admin/catalog/products/import — a JSON row list, not a file upload. */
export function ImportProductsDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ProductImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [result, setResult] = useState<ProductImportResult | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const { importProducts } = useCatalogMutations();

  const reset = () => { setFileName(null); setRows([]); setParseErrors([]); setResult(null); setUpdateExisting(false); };

  const onFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    const { rows: parsed, errors } = rowsFromCsv(text);
    setRows(parsed);
    setParseErrors(errors);
  };

  const run = async (validateOnly: boolean) => {
    const res = await importProducts.mutateAsync({ rows, validateOnly, updateExisting });
    setResult(res);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>
            Upload a CSV matching the Export format to create or update products in bulk.
            Export your catalogue first if you need a template with the expected columns.
          </DialogDescription>
        </DialogHeader>

        <button onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/40">
          <FileUp size={26} className="text-muted-foreground" />
          {fileName ? (
            <>
              <span className="text-sm font-semibold">{fileName}</span>
              <span className="text-xs text-muted-foreground">{rows.length} row(s) parsed · click to change</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">Choose a CSV file</span>
              <span className="text-xs text-muted-foreground">Sku, Name, Category, PriceInKobo required</span>
            </>
          )}
        </button>
        <input ref={input} type="file" accept=".csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />

        {!!parseErrors.length && (
          <div className="max-h-32 overflow-y-auto rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {rows.length > 0 && (
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={updateExisting} onCheckedChange={(v) => setUpdateExisting(!!v)} />
            Update products whose SKU already exists (off by default — matching SKUs are reported as conflicts)
          </label>
        )}

        {result && (
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              {result.failed === 0
                ? <CheckCircle2 size={15} className="text-success" />
                : <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />}
              {result.wasValidationOnly ? "Validation result" : "Import result"}
            </p>
            <p className="text-muted-foreground">
              {result.totalRows} row(s) · {result.created} created · {result.updated} updated · {result.failed} failed
            </p>
            {!!result.rows.some((r) => r.error) && (
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                {result.rows.filter((r) => r.error).map((r) => (
                  <li key={r.rowNumber} className="flex items-start gap-1.5 text-xs text-destructive">
                    <XCircle size={13} className="mt-0.5 shrink-0" /> Row {r.rowNumber} ({r.sku}): {r.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button variant="outline" disabled={!rows.length || importProducts.isPending}
            onClick={() => run(true)}>
            {importProducts.isPending ? <><Spinner className="h-4 w-4" /> Validating…</> : "Validate only"}
          </Button>
          <Button disabled={!rows.length || importProducts.isPending} onClick={() => run(false)}>
            {importProducts.isPending ? <><Spinner className="h-4 w-4" /> Importing…</> : <><Upload size={15} /> Import</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
