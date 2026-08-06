const STORAGE_KEY = "summy.guest-cart-key";

/**
 * The anonymous cart identifier sent as X-Cart-Key (see CartController.ResolveOwner).
 * Generated once per browser and persisted, so a guest's basket survives a
 * refresh; merged server-side into the customer's cart on login via /cart/merge.
 */
export function getGuestCartKey(): string {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(STORAGE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, key);
  }
  return key;
}

export function clearGuestCartKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
