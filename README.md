# Summy Web — Storefront + Admin Dashboard

Customer storefront and staff admin dashboard for **Summy Solution & Technology Ventures** (BN-3217879), a Nigerian
electronics & appliances retailer. Built against the existing ASP.NET Core 10 backend.

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind · Radix (shadcn-style) ·
TanStack Query · TanStack Table · Recharts · React Hook Form + Zod · Zustand · Lucide

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then set NEXT_PUBLIC_API_BASE_URL
npm run dev                    # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | yes | API **origin only**, e.g. `https://api.summy.com`. The client appends `/api/v1`. |
| `API_PROXY_TARGET` | no | Dev-only. Set it to proxy `/api/v1/*` through Next and sidestep CORS. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | no | Only needed for client-side upload widgets. |

---

## Architecture

Feature-first. Each feature owns its API calls, hooks, and types; pages compose features.

```
src/
├─ app/
│  ├─ (shop)/            storefront: home, product, cart, checkout, payment callback
│  ├─ (auth)/            login, register, verify-email, forgot/reset password
│  ├─ (dashboard)/       overview, orders, wishlist, addresses, notifications,
│  │                     referrals, profile, security
│  ├─ admin/             staff dashboard — see "Admin dashboard" below
│  ├─ api/revalidate/    clears cached storefront renders after admin edits
│  ├─ layout.tsx  providers.tsx  globals.css
├─ features/<domain>/    *-api.ts (endpoints) · *-hooks.ts (queries) · schemas · components
├─ features/admin/       admin-api · admin-hooks · admin-types · permissions ·
│                        admin-guard · components/ (DataTable, charts, shell…)
├─ components/ui/        Button, Input, Card, Badge, Skeleton, Spinner…
├─ components/shared/    Header, CartDrawer, Field, states, Pagination, AuthGuard
├─ lib/                  api-client, env, query-client, query-keys, format, cloudinary
├─ types/                api.ts (envelope, PagedResult) · models.ts (domain DTOs)
└─ middleware.ts         gates /dashboard/*
```

### The API client (`src/lib/api-client.ts`)

The single point of contact with the backend. It:

- **Unwraps the standard envelope.** Every response is
  `{ success, data, error, correlationId, timestamp }`. Callers receive `data` directly and never
  see the envelope. A falsy `success` throws `ApiRequestError`.
- **Surfaces validation errors.** `ApiRequestError.validationErrors` exposes the field-keyed map;
  login/register map those onto the matching inputs via `form.setError`.
- **Refreshes tokens transparently.** A `401` triggers `POST /auth/refresh`, then replays the
  original request once. Concurrent 401s share a single in-flight refresh, so a burst of parallel
  queries produces exactly one refresh call. A failed refresh clears the session.
- Handles `204 No Content`, query-string building, and `FormData` (avatar upload).

### Data fetching

TanStack Query throughout, with keys centralised in `lib/query-keys.ts` so invalidation stays
consistent. `400/401/403/404/422` are never retried; transient failures retry twice.

### Cart: guest → server merge

Signed-out shoppers get a `localStorage` cart (Zustand). `useCart()` is a facade presenting one
shape regardless of source. On login, guest lines POST to `/cart/merge`, the local cart clears, and
the server cart becomes authoritative. A failed merge is non-fatal — local lines are kept.

### Auth & route protection

Tokens live in a persisted Zustand store and mirror to a `summy_auth` cookie so `middleware.ts` can
bounce signed-out users off `/dashboard/*` before render. `AuthGuard` re-checks after hydration.
The cookie is a **UX hint only** — real authorization is enforced by the API on every call.

### Payment flow

`Cart → Checkout → POST /orders → POST /payments/initialize → Flutterwave hosted checkout →
/payment/callback → POST /payments/verify/{reference}`

The callback accepts `reference`, `tx_ref`, `transaction_id`, or `trxref`, since the key depends on
gateway configuration. Server verification is authoritative — the gateway's `status` query param is
only a hint. Unpaid orders can be retried from the order detail page.

---

## Verified

- `npm run typecheck` — clean (strict mode, including `noUncheckedIndexedAccess`)
- `npm run build` — all 39 routes compile and prerender (17 storefront, 22 admin)
- `npm run lint` — 0 errors (remaining warnings are `<img>` LCP advisories on
  arbitrary remote Cloudinary URLs, where `next/image` isn't appropriate)
- `npm audit --omit=dev` — 0 vulnerabilities (Next pinned to patched 15.5.21; `overrides` force
  patched `postcss`/`sharp`, which Next pins internally)

---

## Admin dashboard

Lives at `/admin` inside this same app — no separate project, no duplicated infrastructure. It
reuses the existing API client, auth store, design tokens, and shared components.

### Routes

| Area | Route | Backing endpoints |
| --- | --- | --- |
| Dashboard | `/admin` | `/admin/dashboard` + all four `analytics/*` |
| Analytics | `/admin/analytics` | `analytics/{sales,customers,products,payments}` |
| Orders | `/admin/orders`, `/admin/orders/[id]` | list, detail, timeline, status, assign, notes, payments, cancel, invoice |
| Payments | `/admin/payments`, `/admin/payments/[id]` | list, detail, reverify |
| Refunds | `/admin/refunds` | refunds list, create, approve, reject |
| Customers | `/admin/customers`, `/admin/customers/[id]` | profile, addresses, activity, dashboard, status |
| Products | `/admin/products`, `/new`, `/[id]` | products CRUD, publish, unpublish, featured |
| Inventory | `/admin/inventory` | low-stock, stock, adjust, thresholds, history |
| Categories / Brands | `/admin/categories`, `/admin/brands` | CRUD + status |
| Media | `/admin/media` | all nine `media/products/*` endpoints |
| Restore | `/admin/trash` | deleted products/categories + restore |
| Team | `/admin/users` | users CRUD, roles, status, reset-password |
| Roles | `/admin/roles` | roles CRUD, permissions, permission-matrix |
| Settings | `/admin/settings` | company, contact, social, seo, maintenance |
| Email logs | `/admin/emails` | logs, detail, retry, test |
| Audit logs | `/admin/audit-logs` | audit list + by-actor |

### How admin changes reach the storefront

This was the trickiest requirement, and it needs two mechanisms because there are two caches:

1. **Client cache** — every admin mutation invalidates the *public* storefront query keys, not just
   the admin ones (`features/admin/invalidate-storefront.ts`). Publishing a product invalidates the
   product list, the featured list, and that product's slug.
2. **Server render cache** — the storefront product page generates metadata server-side, so a
   client-side invalidation alone wouldn't refresh SEO tags. Product mutations therefore also POST
   to `/api/revalidate`, which calls `revalidatePath()` for that product and the home page.

Concretely: publish/unpublish toggles storefront visibility, the featured switch updates the
Featured section, image edits update the gallery, category and brand edits update navigation and the
filter strip, price edits propagate everywhere, stock changes update the stock badge and checkout
availability, specifications render on the product page, variants become customer-selectable (with
per-variant price and stock feeding the cart), and SEO fields drive `<title>`/`<meta>`.

**One honest limitation:** this synchronises the admin's own browser. A customer already sitting on
another device sees changes on their next fetch (storefront queries use a 60s `staleTime`) or on
navigation. True instant push would need websockets/SSE, which the API doesn't currently expose.

### Tables

Every management page uses one `DataTable` (`features/admin/components/data-table.tsx`) built on
TanStack Table with **server-side** pagination, sorting and filtering — the row model is
`getCoreRowModel` only, so pages stay correct at any data volume rather than assuming the client
holds the full set. It provides debounced search, column visibility, row selection with bulk
actions, CSV export, and responsive horizontal scroll.

### Route protection

`middleware.ts` gates `/admin/*` on the auth cookie; `AdminGuard` then checks for a staff role and
optional per-page permission, and the sidebar hides pages the user can't reach. All of this is UX —
the API authorizes every request independently.

Note the deliberate fallback in `permissions.ts`: if the backend returns *no* permission list, staff
are allowed through rather than locked out of their own dashboard. A false positive shows a button
that fails server-side; a false negative would make the dashboard unusable.

### Dark mode

Added via `next-themes` with a `.dark` token block appended to `globals.css`. Light-mode values are
untouched, so the storefront looks exactly as before. Charts read the same CSS variables, so they
re-theme automatically.

### Changes to existing customer code

Kept deliberately minimal and strictly additive:

- `globals.css` — appended `.dark` tokens and keyframes
- `button.tsx` — added optional `asChild`
- `providers.tsx` — wrapped in `ThemeProvider` + `TooltipProvider`
- `layout.tsx` — `suppressHydrationWarning` (required by next-themes)
- `middleware.ts` — added `/admin/:path*` to the matcher
- `query-keys.ts` — appended the `admin` namespace
- `types/models.ts` — added optional `tags`, `metaTitle`, `metaDescription`, `variants`
- product detail + metadata — consume variants and admin SEO fields

No customer page was redesigned.

### Backend gap worth flagging

**There is no `GET /admin/customers` list endpoint** — the API only exposes
`/admin/customers/{id}/…`. Rather than invent one or fabricate rows, `/admin/customers` derives the
directory from real order data (`/admin/orders`, grouped by customer, with order count and lifetime
spend). The page says so in the UI. Consequence: customers who registered but never ordered don't
appear. If a list endpoint is added, swap the hook — the table and columns need no changes.

---

## Before production: resolve the DTO TODOs

The contract specifies endpoints and the response envelope but **not** field-level DTO shapes.
Rather than invent field names, uncertain fields are typed optional and marked `// TODO: confirm`.
The app degrades gracefully where a field is absent (totals fall back to computed values, statuses
match case-insensitively), but these should be pinned against the real Swagger before launch.

**Start here — `src/types/models.ts` is the single source of truth.** Most fixes are one-line
renames there.

| Area | What to confirm |
| --- | --- |
| `ApiError` (`types/api.ts`) | Field names for code / message / **validationErrors** — the last one drives inline form errors. |
| Auth (`features/auth/auth-types.ts`) | Whether login/register return `user` alongside tokens, and whether register auto-issues tokens (controls redirect to `/verify-email`). |
| `Product` | `compareAtPrice` name; `specifications` shape (array vs record — both are handled). |
| `Cart` / `CartItem` | `unitPrice` vs `price`; totals (`subtotal`, `tax`, `shipping`, `total`). |
| `CreateOrderRequest` | Whether orders take `shippingAddressId`, an inline address, or both. Checkout sends whichever the customer picked. |
| `InitializePaymentResult` | Redirect field name — `resolvePaymentLink()` tries `paymentLink`/`authorizationUrl`/`link`. |
| Payment callback | The exact query-param key Flutterwave returns on your redirect URL. |
| `Address` | `line1`/`line2` vs `street`, `postalCode` vs `zip`. Update `features/addresses/address-schema.ts` to match. |
| Notifications | `unread-count` returns `{ count }` vs a bare number. |
| Avatar upload | The multipart field name (currently `file`). |
| Order statuses | The real enum. `OrderStatusBadge` matches by substring, so it degrades safely. |
| Invoice PDF | If the endpoint needs a bearer token, replace the anchor on the order page with a fetch + blob download. |

### Admin-side TODOs

Same principle — `features/admin/admin-types.ts` is the single source of truth.

| Area | What to confirm |
| --- | --- |
| Permission keys | `features/admin/permissions.ts` guesses `resource.action` strings. Reconcile with `GET /admin/roles/permissions`, and confirm which role names count as super-admin. |
| Dashboard DTO | Field names on `/admin/dashboard` (revenue, counts, growth). Cards show 0 rather than breaking if absent. |
| Analytics series | The x-axis and value keys per endpoint, plus the period query-param name. Charts read the first key that exists (`date`/`label`/`period`, `value`/`revenue`/`orders`/`count`). |
| Write models | `ProductRequest`, `CreateUserRequest`, `RoleRequest`, `UpdateOrderStatusRequest`, `CreateRefundRequest`, `RecordPaymentRequest`. |
| Sort params | Tables send `field_asc` / `field_desc`. Align with what the backend parses. |
| Multipart fields | Product import (`file`), media upload (`file`), bulk media upload (`files`). |
| Status enums | Order, payment, refund, user and email statuses. `StatusBadge` matches by substring so it degrades safely. |
| Featured toggle | `PATCH /products/{id}/featured` body shape (currently `{ isFeatured }`). |

### Other pre-launch notes

- **Sort values.** The homepage sends `price_asc`, `price_desc`, `rating_desc`. Align with what the
  backend accepts.
- **Token storage.** Tokens are in `localStorage`, which is XSS-readable. If your threat model needs
  httpOnly cookies, `api-client.ts` is the only file that reads tokens — the change stays local.
- **Not built** (absent from the contract): product reviews, order search/filtering, and the
  `/customers/me/preferences` + `/notification-preferences` UI (the API functions exist and are
  wired in `customer-api.ts`, but no settings screen consumes them yet).
