# Ember & Oak — Coffee Shop

## Stack

- Pure HTML/CSS/JS — **no build step, no package.json, no npm**
- Serve with any static server: `npx serve .`, Python `http.server`, VS Code Live Server
- Supabase backend (anon key in `supabase.js`, service key in `admin.js`)
- Google Fonts: Playfair Display (headings) + Lato (body)

## App Architecture

| File | Role |
|------|------|
| `index.html` | Customer-facing shop: menu, cart, orders, auth |
| `admin.html` | Admin panel: gate screen → user/order management |
| `js/supabase.js` | Supabase client + DB helpers (IIFE, `window.EmbOakSupabase`) |
| `js/shop.js` | Menu data, cart logic, renderers (IIFE, `window.EmbOak`) |
| `js/app.js` | Glue code: auth, tab switching, checkout, order polling |
| `js/admin.js` | Admin CRUD (uses Supabase service key directly) |
| `sql/schema.sql` | Full schema: `profiles`, `orders` tables, RLS, real-time, admin delete function |

**Load order (index.html):** `supabase.js` → `shop.js` → `app.js`
**Load order (admin.html):** `shop.js` → `admin.js`

## Critical Constraints

- All JS uses IIFE + `window.*` namespace — **no import/export**
- CSS uses custom properties in `:root` (`--green-deep`, `--cream`, `--gold`, etc.) — use them for any new UI
- Cart is in-memory only (no persistence)
- Orders auto-advance status: frontend polls every 5s and calls `advanceOrderStatus` sequentially through the pipeline (`pending → confirmed → preparing → ready → completed`)
- Admin password hardcoded in `admin.js:84` (`ADMIN_PASSWORD = 'admin123'`)
- Admin uses Supabase **service key** (`supabase.js:5`) — any admin.js change that touches Supabase must use it
- Supabase service key exposed client-side — do NOT add new RLS-bypassing operations without noting the risk

## Schema (from `sql/schema.sql`)

**`profiles`** — `id` (UUID FK auth.users), `email`, `name`, `role` (customer|admin), `created_at`, `updated_at`
**`orders`** — `id` (UUID), `user_id` (FK profiles), `items` (JSONB), `subtotal`, `tax`, `total`, `status` (pending|confirmed|preparing|ready|completed|cancelled), `created_at`, `updated_at`

RSL: users read/update own rows; admins read/update/delete all. Trigger `handle_new_user()` creates profile on signup.

## Styles

9 CSS files organized by concern (`base.css`, `nav.css`, `hero.css`, `sections.css`, `menu.css`, `cart.css`, `login.css`, `status-flow.css`, `admin.css`). Add new styles to the matching file or create new files and add the `<link>` tag.

## RuFlo / Agent Infrastructure

The `.claude/` and `.claude-flow/` directories contain RuFlo agent orchestration config (swarms, hooks, memory) — **not related to the app code**. Do not touch `.claude-flow/`. The existing `CLAUDE.md` is RuFlo documentation, not project instructions.

## MCP

- `.mcp.json` — Claude Code format (auto-discovered)
- `opencode.json` — same MCP server for opencode (manual config)
- Server: `claude-flow` running `ruflo@latest mcp start`
- MCP tools prefixed `claude-flow_*`

## Deployment & Credentials

- **GitHub**: https://github.com/xzOlp/KAPE-ADAM.git
- **Netlify**: Auto-deploys from GitHub — no build command needed (pure static site)
- **Supabase URL**: https://uqvayowsuyrkqcdmdfnw.supabase.co
- **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmF5b3dzdXlya3FjZG1kZm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDA1NzksImV4cCI6MjA5NDM3NjU3OX0.Jfx7QM8yCD9TBw0KFl91jLFGUWIU17F5R7z2bAAW6Lk`
- **Supabase Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmF5b3dzdXlya3FjZG1kZm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgwMDU3OSwiZXhwIjoyMDk0Mzc2NTc5fQ.L2S-w4ujca80A63wfo9-33_fzBfIr82VzA4YjmDwWxk`
