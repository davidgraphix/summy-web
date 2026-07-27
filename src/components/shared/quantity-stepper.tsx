"use client";
import { Minus, Plus } from "lucide-react";
export function QuantityStepper({
  value, onChange, min = 1, disabled,
}: { value: number; onChange: (v: number) => void; min?: number; disabled?: boolean }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border">
      <button type="button" aria-label="Decrease" disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className="grid h-10 w-10 place-items-center disabled:opacity-40"><Minus size={16} /></button>
      <span className="w-10 text-center text-sm font-semibold">{value}</span>
      <button type="button" aria-label="Increase" disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="grid h-10 w-10 place-items-center disabled:opacity-40"><Plus size={16} /></button>
    </div>
  );
}
