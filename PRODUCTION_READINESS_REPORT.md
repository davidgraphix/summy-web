# Summy Web — Production Readiness Audit & Refactor Report

Scope: full frontend (`summy-web`) audited against the ASP.NET Core backend
(`summyApi`) as the single source of truth — every controller group, DTO,
enum, form, React Query hook, and API wrapper. Backend behavior was never
changed; the frontend was brought into contract parity with it.

**Nothing in this session was committed.** `git status` currently shows 35
modified files + 1 new file (`src/components/shared/store-footer.tsx`),
all unstaged, from this final cleanup pass. Note: a large body of earlier
audit work in this engagement was already committed directly to `main` and
pushed to `origin/main` prior to this session picking it up — those commits
(`456d158` through `328db1c`) were not made by me; I only found them already
in place. Everything from this session onward has been left for your review.

---

## ✅ Fixed

### Authentication & Account
- `ApiError`/`validationErrors` shape corrected from an imagined `Record<string,string[]>` to the real `ApiValidationError[]` — login/register error rendering was silently broken.
- Reset-password and change-password forms were missing `confirmPassword` in the request body, causing every submission to 422 silently.
- Change-password now handles the backend's session-termination side effect (forces re-login where the backend invalidates the current session).
- Logout was sending no body; backend requires `{ refreshToken }` — fixed, including a working "log out all devices" action wired to session APIs.
- Rebuilt the entire permission system: it was reading `user.permissions`, a field that exists on no DTO. Permissions actually live in JWT claims. Added `lib/jwt.ts` for client-side decode (UI gating only — the server independently authorizes every request via the same claim).
- Auto-refresh-on-401, single-flight refresh, and `X-Refresh-Token` device-identification header implemented in `lib/api-client.ts`.

### Products, Categories, Brands, Media, Inventory
- Full ground-up rewrite of `types/models.ts` and `features/admin/admin-types.ts` to mirror every backend DTO field-for-field (money as `{kobo, formatted, currency}`, enums as backend-serialized strings, correct nullability).
- Product image reorder used `ImageIds`; real field is `OrderedImageIds` — fixed.
- "Delete all images" endpoint doesn't exist; the UI called DELETE with no body. Replaced with `removeMany()` requiring explicit `ImageIds`, and added DELETE-with-body support to the API client.
- Product import was built as a file upload; the backend contract is JSON rows (`ProductImportRequest`). Rewrote with a custom CSV parser that turns a user's CSV into the JSON shape the backend expects.
- Removed the Variants tab from the product form — there is no write DTO for variants on the backend; the form was silently no-oping.
- `SetStatus` endpoints (products/categories/brands/customers) were sending a JSON body; backend expects query params — fixed in all 4 places.

### Cart & Checkout
- **Critical bug**: checkout never sent `Items` in `CreateOrderRequest` — every order creation failed with an empty order. Fixed.
- Cart architecture was entirely wrong for guests: a local Zustand guest-cart store vs. the backend's actual `X-Cart-Key`-header server-side anonymous cart. Deleted the local store, rebuilt cart around the real mechanism (`features/cart/cart-key.ts`).
- `MergeCartRequest` was shaped as `{items:[]}`; real shape is `{anonymousId}` — fixed as part of the same rewrite.
- Cart mutations simplified to match the real API: `add({productId, quantity})` — server computes line totals, not the client.

### Orders & Payments
- Rewrote `orders-api`/`orders-hooks` and `payments-api`/`payments-hooks` to match `OrderDetailDto`/`PaymentDto` exactly (status enums, timeline events, notes, refunds).
- Invoice/receipt PDF downloads always 401'd — plain `<a href>` can't attach a bearer token. Added an authenticated `downloadFile()` blob-download helper; applied to the customer order-detail page.
- Refund reason was a free-text `<Textarea>`; the backend requires an exact `RefundReason` enum name. Changed to a required `<Select>`.
- Money audit: every Kobo↔Naira conversion now goes through `koboToNaira`/`nairaToKobo`/`formatMoney`, and wherever the backend already supplies a `*Formatted` string, the UI uses that directly instead of re-deriving it.

### Admin domain (Dashboard, Users, Roles, Settings, Audit Logs, Emails, Inventory)
- `AdminUsersController` create form was missing the required `roles` field entirely — every create would 422. Added.
- Full rewrites of admin dashboard, analytics, orders, payments, refunds, inventory, audit logs to match real DTOs and UTC timestamp handling.
- Admin Emails: removed misleading per-row/bulk "retry" controls — the backend only exposes a global retry sweep, not targeted per-item retry. Replaced with an honest "Process retries" action.
- Admin customer directory: no such list endpoint exists on the backend. Replaced a fabricated page with an honest placeholder rather than inventing a contract.

### Customer self-service (Wishlist, Referrals, Notifications, Addresses, Profile)
- Wishlist, referral, and notification list hooks were unwrapping paginated responses incorrectly (missing `.items`) or reading a `count` field that isn't in `UnreadCount` (real field: `unreadCount`) — fixed 3 occurrences of the latter this session (`dashboard/layout.tsx`, `components/shared/header.tsx`, `admin-shell.tsx`).
- Address forms/hooks rewritten to match `CreateAddressRequest`/`UpdateAddressRequest` exactly.

### Product detail page (this session)
- Rewrote `product-detail.tsx` end to end: `product.metaTitle` → `product.seo.metaTitle`; `primaryImageUrl` (doesn't exist on the detail DTO) → derived from `product.images`; `compareAtPrice` → `product.discountPrice`; `inStock` → derived from `isPurchasable`/variant `availableQuantity`; `brandName` → `product.brand?.name`; removed a fabricated star-rating widget (no rating system exists in the backend at all); fixed gallery images (`.url` → `.secureUrl`); fixed variant stock field (`stockQuantity` → `availableQuantity`); fixed `cart.add()` call to the simplified `{productId, quantity}` shape; wired the previously-dead wishlist heart button to the real wishlist API.

### Cross-cutting cleanup (this session)
- Fixed the admin order-detail page's broken invoice download: it linked to `/admin/orders/{id}/invoice` as a plain `<a href>`, but that route returns JSON (not a PDF) and sends no auth header, so it always failed. Confirmed against the backend controller that **no admin-scoped PDF invoice export exists** at all (the PDF route is customer-scoped and checks order ownership by `userId`). Removed the broken link rather than fabricate a working download; staff now use the existing "Print" button as the interim path (flagged below as a backend gap).
- Removed a fabricated business registration number (`BN-3217879`) and hardcoded company name from the storefront footer — neither exists in `PublicSettingsDto`. Extracted a `StoreFooter` component that renders the real `companyName`/city/state/country/`supportEmail` from `/settings/public`.
- Pinned the payment-callback query-param resolution to `tx_ref` first (confirmed against `FlutterwavePaymentProvider`'s `verify_by_reference` call — this is the exact field the backend verifies by), removing a "TODO: pin this" left in the code.
- Removed an unused `Button` import (`app/(shop)/cart/page.tsx`).
- Full sweep confirmed **zero** remaining: `console.log/warn/error` debug statements (the one `console.warn` in `lib/env.ts` is an intentional missing-env-var guard, not debug leftover), TODO/FIXME comments, `any`/unsafe casts, hardcoded API hosts/URLs, hardcoded GUIDs, or dummy/mock data.
- `npm run typecheck` — **0 errors** (started this session at ~86, all resolved).
- `npm run lint` — **0 errors**, only pre-existing `<img>`-vs-`next/image` performance advisories on Cloudinary-hosted thumbnails (accepted tradeoff, see Remaining Issues).
- Removed a leftover 210KB research scratch file (`.audit-dtos-2.md`) that had been written into the repo root during backend DTO extraction.

---

## ⚠ Remaining Issues (need business/backend input — not fixed client-side)

1. **No admin-scoped PDF invoice export.** The backend's only PDF invoice route (`GET /orders/{id}/invoice/pdf`) is scoped to the requesting customer's own `userId`; staff get no equivalent. Admin order detail now falls back to browser print. If staff need a real PDF export, this requires a new backend endpoint (e.g. `GET /admin/orders/{id}/invoice/pdf` with `Orders.View` permission) — not something the frontend can invent safely.
2. **No admin customer directory endpoint.** There's no `GET /admin/customers` list on the backend, only per-customer lookups. `/admin/customers` is currently an honest placeholder page. Needs a backend list endpoint if this is a real product requirement.
3. **Email retry is a global sweep, not per-item.** `AdminEmailsController` only exposes a bulk retry-all-failed operation. If targeted retry of a single failed email is needed, that's a backend contract addition.
4. **Product variants have no write DTO.** Variants can be *read* (`ProductVariant[]`) but there is no create/update/delete endpoint for them on the backend, so the admin product form cannot manage variants at all — the tab was removed rather than shipping dead UI. If variant management is a real requirement, it needs backend endpoints first.
5. **No product rating/review system exists in the backend.** The old product detail page rendered a star rating and review count that were never backed by real data. Removed entirely rather than fabricated.
6. **Admin product search is hard-scoped to published products only** (confirmed in `ProductsController`/search service) — admins cannot search draft/archived products from the same search box used elsewhere. This is a backend constraint, flagged for product-team awareness.
7. **`<img>` vs `next/image` performance warnings** (11 files, all Cloudinary-hosted user/product thumbnails). Left as plain `<img>` deliberately — these are dynamic, arbitrarily-sized remote URLs where `next/image` would require Cloudinary domain allowlisting in `next.config` and offers marginal benefit for small thumbnails. Worth revisiting for the largest hero images (product gallery, product-detail hero) if LCP becomes a measured problem in production.
8. **Pre-existing git history**: this repository's `main` branch already contains commits (`456d158`…`328db1c`, pushed to `origin/main`) covering most of this audit's earlier work, made outside of my involvement in this session. Only this session's final cleanup batch (35 modified + 1 new file) is currently unstaged — review and commit at your discretion.

---

## 🧪 Manual Testing Checklist

**Auth & Account**
- [ ] Register → verify email → confirm auto-login behavior matches `AutoLoginAfterEmailVerification` setting
- [ ] Login with wrong password shows the backend's actual error message, not a generic one
- [ ] Forgot password → reset with matching/mismatched confirm password
- [ ] Change password while logged in on two devices — confirm the other session is invalidated
- [ ] "Log out all devices" from Security page actually clears other sessions
- [ ] Access token expiry mid-session triggers silent refresh, not a logout
- [ ] Refresh token expiry logs the user out cleanly with no console errors

**Catalog / Storefront**
- [ ] Browse products, filter by category/brand, sort by price/newest — matches admin-configured catalog
- [ ] Product detail page: images, price, discount %, variant picker, out-of-stock states, specifications
- [ ] Wishlist heart button on product detail actually adds/removes and persists across reload
- [ ] Storefront footer shows the real company name/contact info from Admin Settings (not hardcoded)

**Cart & Checkout**
- [ ] Add to cart as a guest (no login) — cart persists via `X-Cart-Key`, not localStorage
- [ ] Log in with an existing guest cart — cart merges into the account cart, not lost
- [ ] Update quantity, remove item, cart totals recompute from server response
- [ ] Complete checkout end-to-end — confirm the order actually contains line items (previously silently empty)
- [ ] Payment redirect (Flutterwave) → callback page resolves `tx_ref` and shows correct success/failure state

**Orders (customer)**
- [ ] Order list and detail show correct status/payment-status badges
- [ ] Download invoice — file downloads with auth, opens correctly
- [ ] Reorder from a past order
- [ ] Cancel an eligible order

**Orders & Payments (admin)**
- [ ] Update order status, add tracking number, add internal note
- [ ] Assign order to a staff member
- [ ] Record a manual/offline payment
- [ ] Cancel an order with a reason
- [ ] View a payment's attempt history and refund it with a valid `RefundReason`
- [ ] Invoice button now correctly shows only "Print" (no broken download link)

**Admin catalog management**
- [ ] Create/edit product — all required fields validate against backend rules
- [ ] Upload, reorder, and delete product images
- [ ] Bulk import products via CSV — confirm rows map correctly to `ProductImportRequest`
- [ ] Export products to CSV
- [ ] Create/edit categories and brands; soft-delete and restore from Trash

**Admin users & settings**
- [ ] Create a new admin user — role selection is required and works
- [ ] Edit roles/permissions and confirm the target user's JWT reflects the change on next login
- [ ] Update system settings (company name, support email, etc.) — confirm storefront footer picks it up
- [ ] Audit log entries appear for the above actions

**Notifications & referrals**
- [ ] Unread count badge in header/sidebar matches actual unread notifications
- [ ] Mark one/all as read updates the badge immediately
- [ ] Referral list and summary stats render correctly

**Cross-cutting**
- [ ] Simulate a 500/timeout/network-offline response on any list page — confirm a real error state, not a blank screen or crash
- [ ] Simulate a 403 on an admin page as a lower-permission user — confirm graceful denial, not a broken render
- [ ] Run through the app on mobile viewport widths for the storefront and dashboard

---

## 🚀 Production Readiness Summary

| Category | Score | Notes |
|---|---|---|
| API Contract Compatibility | 9/10 | Every DTO/enum verified against backend source directly. -1 for the handful of backend contract gaps listed above (variants write, admin customer list, per-item email retry, admin invoice PDF) that no frontend fix can close. |
| Authentication | 9/10 | Full JWT/refresh/logout/session lifecycle rebuilt and verified against backend behavior. -1 because token-refresh races and multi-tab session sync weren't exercised under real network conditions (couldn't test against a live backend in this environment). |
| Authorization | 8/10 | Permission gating now correctly reads JWT claims and matches `Permissions.cs` 1:1. -2 because client-side gating is UI convenience only (as it should be) and wasn't verified end-to-end against a running server with real role assignments. |
| Type Safety | 10/10 | `noUncheckedIndexedAccess` clean, zero `any`/unsafe casts, `npm run typecheck` passes with 0 errors. |
| UI Consistency | 8/10 | Dead/misleading controls removed (email retry, customer directory, variants tab) rather than left broken; honest placeholders used where the backend has no contract. -2 for not having done a full visual/design-system consistency pass (out of scope of a contract audit). |
| Performance | 7/10 | No wasted queries, correct cache keys/invalidation, paginated lists throughout. -3 for the `<img>`-vs-`next/image` tradeoff left as-is on 11 files and no bundle-size/Lighthouse pass performed. |
| Accessibility | 6/10 | Standard semantic HTML, labeled form fields, keyboard-operable dialogs from the existing UI kit. -4 because no dedicated a11y audit (screen reader pass, contrast check, focus-trap verification) was performed in this session. |
| Security | 8/10 | No secrets/tokens in code, no `dangerouslySetInnerHTML`/XSS vectors introduced, auth tokens never placed in URLs, blob downloads properly authenticated. -2 because this was a contract/UI audit, not a penetration test — no dependency vulnerability scan (`npm audit`) was run. |
| Maintainability | 9/10 | Dead code, unused imports/files, and stale abstractions removed; types are a single source of truth mirroring backend DTOs with explanatory comments. -1 for a few remaining large files (e.g., `admin-api.ts`, `admin-types.ts`) that are big by necessity (backend surface area) but could eventually be split by domain. |
| **Overall Production Readiness** | **8/10** | The two critical, order-blocking bugs (empty checkout, broken guest/merge cart) are fixed, and the type layer is a verified mirror of the real API. What's left is backend-side contract gaps (listed above) and non-functional hardening (a11y audit, dependency scan, live-backend integration testing) that fall outside what a static code audit can verify. |

---

### What to do next
1. Review the unstaged diff (`git diff` / `git status` in `summy-web`) and commit at your discretion.
2. Decide on the 5 backend contract gaps in **Remaining Issues** — each needs a product/backend decision, not a frontend one.
3. Run the **Manual Testing Checklist** against a live backend before shipping — this audit verified contracts and types exhaustively but could not exercise the app against a running API.
4. Consider `npm audit` and a Lighthouse/a11y pass as separate, focused follow-ups.
