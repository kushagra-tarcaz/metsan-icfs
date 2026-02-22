# Metsan Calculation Tool

This project runs on **Cloudflare Pages** with **Pages Functions** and persists calculator data in **Cloudflare D1**.

## Layout
- `public/` – static assets served by Pages.
  - `index.html` – the calculator UI; configuration is fetched from `/api/config`.
  - `admin/index.html` – admin console to manage products (uses the `/api/admin/*` endpoints).
  - `assets/` – calculator images.
- `functions/` – Pages Functions.
  - `api/config.ts` – read-only configuration endpoint consumed by the calculator.
  - `api/admin/products/*` – CRUD endpoints used by the admin console.
  - `api/admin/cartridges/index.ts` – update cartridge net volumes.
  - `api/admin/constants/index.ts` – tune formula constants.
  - `api/admin/usage-factors/index.ts` – edit usage/waste percentages.
  - `api/admin/eta/index.ts` – toggle ETA approvals per product/anchor.
  - `data/staticConfig.ts` – fallback data used if D1 is unavailable.
  - `data/fetchConfig.ts` – utility that builds the full config payload from D1.
  - `utils/auth.ts` – shared Basic Auth guard for admin endpoints.
  - `utils/db.ts` – helper to access the D1 binding safely.
- `migrations/` – D1 schema and seed data (applied with Wrangler).
- `wrangler.toml` – Wrangler configuration (replace the placeholder `database_id` with the real D1 id).

## Local Development
1. Install Wrangler if you have not already: `npm install -g wrangler`.
2. Apply the migrations to the local D1 instance (once):  
   `wrangler d1 migrations apply DB --local`
3. Provide local admin credentials (optional but recommended):  
   `wrangler secret put ADMIN_USERNAME --local` and `wrangler secret put ADMIN_PASSWORD --local`
4. Run `wrangler pages dev public` to start the Pages + Functions dev server.
5. Visit `http://127.0.0.1:8788` to browse the calculator and `/admin/` for the admin console.

## Deploying to Cloudflare
1. Create a D1 database and copy its `database_id` into `wrangler.toml`.
2. Set the admin credentials via Wrangler secrets (recommended instead of plain `[vars]` values):  
   `wrangler secret put ADMIN_USERNAME` and `wrangler secret put ADMIN_PASSWORD`
3. Run `wrangler d1 migrations apply DB` to seed production with the initial data (this will apply all migrations including ETA tables).
4. Deploy via Cloudflare Pages (CI push or manual upload). Functions are bundled automatically.
5. Protect `/admin/*` and `/api/admin/*` with Cloudflare Access to restrict management endpoints.

## Admin Panel Capabilities
- Authenticate with a static username/password before making changes (Basic Auth enforced on every API call).
- List existing products, edit display name, toggle ETA approval, move products between groups, or delete them.
- Create new products; the calculator immediately reflects the change after deployment.
- Review anchors/cartridges per group, override cartridge net volumes, fine-tune formula constants + usage factors, and toggle ETA approvals per product/anchor size.
