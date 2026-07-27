"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Minimal line kept locally for signed-out shoppers. */
export interface GuestLine {
  productId: string;
  quantity: number;
  // Cached display fields so the guest cart renders without extra fetches.
  name?: string;
  slug?: string;
  price?: number;
  imageUrl?: string;
}

interface GuestCartState {
  lines: GuestLine[];
  add: (line: GuestLine) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === line.productId ? { ...l, quantity: l.quantity + line.quantity } : l
              ),
            };
          }
          return { lines: [...s.lines, line] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.productId !== productId)
              : s.lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "summy.guest-cart" }
  )
);
