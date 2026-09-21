# CLAUDE.md

Guidance for working on the Hand of Porsh Catering codebase.

## Project overview

Hand of Porsh Catering is a small food/pastry business based in Hohoe (By Plan),
Volta Region, Ghana. This project is a customer-facing ordering website plus a
lightweight admin view:

- Customers browse a menu (mains, pastries, snacks) with photos and GHS prices,
  add items to a cart, check out as a guest, pay, and get the order delivered.
- The business owner uses a simple admin view to manage menu items and see/update
  incoming orders.

**v1 scope:** guest checkout only — no user accounts/login, no multi-restaurant
support, no reviews/ratings. Keep the UI simple and mobile-friendly; most
customers will order from their phone.

## Tech stack

The project is scaffolded (Next.js app, Prisma, docker-compose for local
Postgres, health-check route). This is the stack for v1:

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | Next.js (App Router) + TypeScript + Tailwind CSS | One framework for the site and API routes; Tailwind makes mobile-first responsive UI fast; SSR helps menu-page load speed on mobile networks; straightforward path to Vercel later. |
| Database | PostgreSQL via Prisma ORM | Type-safe queries/migrations; easy local dev; drops into a hosted free tier (Neon or Supabase) at deploy time without ORM changes. |
| Payments | Paystack | Native GHS support, a single Charge API for both card and Ghana mobile money (MTN MoMo, Telecel Cash [formerly Vodafone Cash], AirtelTigo Money), solid Node/Next SDKs and docs, widely used by Ghanaian businesses, test-mode keys for local dev, webhook-based payment confirmation. |
| Images | Cloudinary (free tier) | Menu item photo uploads that work both locally and on serverless hosting (no filesystem writes to rely on). |
| Admin auth | Single admin password (env var) + signed session cookie | No need for full user accounts — only the owner logs in; customers stay guest-only. |
| Cart/state | React Context + localStorage | Simple, no external state library needed at this scope. |
| Hosting (later) | Vercel + Neon/Supabase + Cloudinary | Deploy step only — not needed to run locally. |

## Payments

- At checkout the customer picks one of two `paymentMethod`s: `paystack` (card
  or mobile money, chosen on Paystack's own hosted page) or `cash` (cash on
  delivery — no gateway call at all).
- `POST /api/orders` creates the order first (so a Paystack reference always
  has something to attach to), then for `paystack` orders calls
  `initializePaystackTransaction` (`lib/paystack.ts`) with the order total in
  pesewas and `order.ref` as the transaction reference, and returns Paystack's
  `authorization_url` for the client to redirect to. For `cash` orders,
  `paymentStatus` is set to `cod_pending` ("Pending — pay on delivery") and no
  gateway call happens.
- Payment confirmation is **webhook-driven**: `POST /api/payments/paystack/webhook`
  verifies the `x-paystack-signature` header (HMAC-SHA512 with the secret key)
  before trusting the payload, then marks the order `paid` on `charge.success`
  (via `lib/payments.ts#applyPaystackResult`, idempotent). This is the
  authoritative path in production.
- Paystack can't reach a webhook on `localhost`, so the order confirmation page
  (`/order/[ref]?verify=1`, the `callback_url` Paystack redirects back to) also
  calls `GET /api/payments/paystack/verify?reference=...` once on load as a
  best-effort UX fallback — same idempotent `applyPaystackResult` function, just
  triggered by the client instead of Paystack's servers. To test the webhook
  path for real, tunnel it (e.g. `ngrok http 3000`) and set that URL in the
  Paystack dashboard.
- The channel actually used (`card` vs `mobile_money`) is only known once
  Paystack confirms payment — stored in `Order.paymentChannel`, not decided at
  checkout.
- Use Paystack **test keys** (`PAYSTACK_SECRET_KEY`) for local development,
  **live keys** only in the deployed environment.
- Amounts are sent to Paystack in **pesewas** (GHS × 100) for GHS transactions —
  see currency convention below.

## Admin

- Single admin login at `/admin/login` (password from `ADMIN_PASSWORD`) — no
  user accounts, just the one owner. `proxy.ts` (Next.js's post-v16 rename of
  `middleware.ts`) protects `/admin/*` pages and `/api/admin/orders/*`,
  redirecting (pages) or 401-ing (API) anyone without a valid session.
- Sessions are a stateless signed cookie (`lib/adminAuth.ts`): `${expiry}.${hmac}`,
  HMAC-SHA256 over the expiry using `ADMIN_PASSWORD` as the key, 8-hour TTL. No
  session table, nothing to clean up. Built on Web Crypto (`crypto.subtle`)
  rather than Node's `crypto` module so the same code runs in both the Node
  runtime (API routes) and the Edge runtime (`proxy.ts`).
- `/admin` (`app/admin/page.tsx`) lists orders newest-first. **Payment status
  and delivery status are separate fields, toggled independently** — each
  order row has two `<select>`s, and `PATCH /api/admin/orders/[ref]` updates
  whichever field(s) are present in the request body without touching the
  other. Payment status options are scoped to `paymentMethod`
  (`getPaymentStatusOptions` in `lib/orderDisplay.ts`): cash orders offer
  "Pending cash on delivery" / "Paid cash"; Paystack orders offer "Pending
  (Paystack)" / "Paid via Paystack" / "Payment failed (Paystack)". Delivery
  status is always the same four `received → preparing → out_for_delivery →
  delivered` options.

## Currency

- All prices/totals are GHS.
- Store and compute money as **integer pesewas** (e.g. GHS 45.00 → `4500`), not
  floats — avoids rounding bugs and matches the subunit format Paystack expects.
- Only convert to a GHS decimal string for display.

## Data model (high level)

- **MenuItem** — id, name, description, category (`mains` | `pastries` | `snacks`),
  price (pesewas), imageUrl, inStock
- **Order** — id, ref (public order number, also the Paystack reference),
  customerName, phone, email (required only for `paystack`), deliveryAddress,
  paymentMethod (`paystack` | `cash`), paymentChannel (`card` | `mobile_money`,
  filled in once Paystack confirms), paymentStatus (`pending` | `paid` |
  `failed` | `cod_pending`), status (`received` → `preparing` →
  `out_for_delivery` → `delivered`), totalPrice (pesewas), createdAt
- **OrderItem** — id, orderId, menuItemId, name/quantity/priceAtOrder (a
  snapshot at order time, so later menu edits don't change past orders)

## Folder structure (target)

```
app/
  (site)/page.tsx              # home / menu landing
  (site)/menu/page.tsx         # full menu with category filters
  (site)/cart/page.tsx
  (site)/checkout/page.tsx
  (site)/order/[ref]/page.tsx  # confirmation + guest status lookup
  admin/login/page.tsx
  admin/page.tsx                # incoming orders dashboard
  admin/menu/page.tsx           # menu item CRUD
  api/orders/route.ts
  api/orders/[ref]/route.ts
  api/menu-items/route.ts
  api/payments/paystack/initiate/route.ts
  api/payments/paystack/webhook/route.ts
components/{ui,menu,cart,admin}/
lib/{db.ts,paystack.ts,cart.ts,auth.ts}
prisma/{schema.prisma,seed.ts}
public/
.env.example
CLAUDE.md
```

## Build order (v1 roadmap)

1. Scaffold Next.js + TypeScript + Tailwind, ESLint/Prettier
2. Prisma schema (MenuItem/Order/OrderItem) against Postgres + seed script
3. Public menu page (categories, photos, GHS prices) reading from the DB
4. Cart (Context + localStorage) and cart page
5. Checkout page (customer info, delivery address, payment method choice)
6. Paystack integration: initiate charge (card/MoMo) + webhook to confirm and
   update the order; cash on delivery just sets `paymentMethod: cash`
7. Order confirmation page + guest order-status lookup (by ref/phone)
8. Admin auth (password + session cookie)
9. Admin dashboard: view orders, update status
10. Admin menu management: add/edit/remove items, photo upload via Cloudinary
11. Mobile polish pass, local end-to-end test
12. Deploy: Vercel + Neon/Supabase + Cloudinary + Paystack live keys

## Conventions

- **Mobile-first, simple UI.** Most customers order from their phone — design
  and test layouts at mobile widths first.
- **Guest checkout only** for v1. No login/accounts, no reviews, no
  multi-restaurant support.
- **Never hardcode API keys or secrets** (Paystack keys, Cloudinary credentials,
  DB connection strings, admin password). All secrets live in `.env` (gitignored)
  and are documented — names only, no values — in `.env.example`.

## Commands

- `npm install` — install dependencies (also runs `prisma generate` via `postinstall`)
- `npm run db:up` / `npm run db:down` — start/stop local Postgres (docker-compose)
- `npm run dev` — start the Next.js dev server at http://localhost:3000
- `npm run prisma:migrate` — run Prisma migrations against local Postgres
- `npm run prisma:generate` — regenerate the Prisma client after a schema change
- `npm run build` / `npm start` — production build / run
- `GET /api/health` — returns `{ status: "ok", db: "connected" }` (200) if the
  app can reach Postgres, or 503 otherwise

Copy `.env.example` to `.env` before running anything — fill in real local
values, never commit `.env`.

Prisma is pinned to the stable v6 line (not the v7/v8 pre-release train, which
requires driver adapters and a separate `prisma.config.ts`) to keep the setup
simple. Revisit this pin deliberately if upgrading later.

## Docker

- `Dockerfile` is a 3-stage build (`deps` → `builder` → `runner`) producing a
  minimal image from Next.js's `output: "standalone"` (`next.config.ts`).
  `node:24-alpine` throughout, matching the local dev Node version so
  Prisma's native query engine binary built in `builder` matches `runner`.
- The standalone output's dependency tracing doesn't reliably catch Prisma's
  generated client + native engine binary, so the runner stage copies
  `node_modules/.prisma` and `node_modules/@prisma/client` explicitly — a
  known gap, not a hypothetical one (the build fails at runtime without it).
- `/menu`, `/admin`, and `/order/[ref]` are `export const dynamic = "force-dynamic"`.
  They always need live DB state anyway, but the immediate reason is that
  `next build` would otherwise try to statically prerender them and fail —
  there's no `DATABASE_URL` at build time, deliberately, since secrets don't
  belong in the image.
- The image does **not** run migrations on startup. Run
  `npx prisma migrate deploy` as its own step before starting a new version
  (CI/CD job, or manually) — baking it into container startup causes problems
  once there's more than one instance.
- Runtime config (`DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `ADMIN_PASSWORD`) is
  injected via `docker run -e` / `--env-file`, never baked into the image.
- Local build/run check: `docker build -t hand-of-porsh .`, then
  `docker run --network hand_of_porsh_default -e DATABASE_URL=... -p 3000:3000 hand-of-porsh`
  (join the compose network so it can reach the `db` service by name).

Local Postgres runs on host port **5433**, not 5432 — chosen to avoid clashing
with a native Postgres install some machines already have listening on 5432.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
