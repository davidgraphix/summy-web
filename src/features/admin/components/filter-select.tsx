"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "__all";

/** Compact toolbar filter. Uses a sentinel value because Radix reserves "". */
export function FilterSelect({
  value, onChange, options, placeholder = "All", width = "w-[150px]", label,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  width?: string;
  label?: string;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger className={`h-9 ${width}`} aria-label={label ?? placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/** Date-range filter mapped to the API's `from`/`to` params. */
export function DateRangeFilter({
  from, to, onChange,
}: { from?: string; to?: string; onChange: (next: { from?: string; to?: string }) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input type="date" value={from ?? ""} aria-label="From date"
        onChange={(e) => onChange({ from: e.target.value || undefined, to })}
        className="h-9 rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary" />
      <span className="text-xs text-muted-foreground">to</span>
      <input type="date" value={to ?? ""} aria-label="To date"
        onChange={(e) => onChange({ from, to: e.target.value || undefined })}
        className="h-9 rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary" />
    </div>
  );
}
