# MT Prompts

AI Image & Video prompts sharing app — login/register, KYC-gated prompt
posting, and an admin panel. Built with [Hono](https://hono.dev/) and
runs as a plain Node.js server (Render-ready) using:

- **better-sqlite3** (local file DB) instead of Cloudflare D1
- **local filesystem** (via a tiny R2-compatible shim) instead of Cloudflare R2

## Run locally

```bash
npm install
npm start          # production
npm run dev        # auto-restart on file changes
```

The app starts on `http://localhost:3000` (override with `PORT`). On first
run it creates:
- `data/mt-prompts.sqlite` — the SQLite database (migrations in
  `migrations/0001_init.sql` run automatically on every start; they are
  idempotent)
- `data/media/` — uploaded DP/prompt images & videos

Visit `/setup-admin` once to create your first Admin account (the route
disables itself as soon as any admin exists).

## Deploy to Render

1. Push this repo to GitHub (already done if you're reading this from the
   repo).
2. On [Render](https://render.com), click **New > Web Service**, connect
   this GitHub repo, and Render will auto-detect `render.yaml`:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - A **1GB persistent disk** is mounted at `/var/data` so the SQLite DB and
     uploaded media survive restarts/redeploys.
3. Deploy. Render gives you a public `https://<service>.onrender.com` URL.
4. Open `/setup-admin` on that URL to create your Admin account.

### Environment variables (optional overrides)

| Var        | Default                         | Purpose                         |
|------------|----------------------------------|----------------------------------|
| `PORT`     | `3000`                           | HTTP port Render sets this automatically |
| `DATA_DIR` | `./data`                         | Root folder for DB + media (set to the mounted disk path on Render, e.g. `/var/data`) |
| `DB_PATH`  | `${DATA_DIR}/mt-prompts.sqlite`  | SQLite file path                |
| `MEDIA_DIR`| `${DATA_DIR}/media`              | Uploaded files folder           |

## Project structure

```
server/        Node entrypoint + D1/R2 compatibility shims (db.js, r2.js, migrate.js)
src/           Hono app (routes, views, auth, upload logic) — unchanged from
               the original Cloudflare Workers version
migrations/    SQL schema (idempotent CREATE TABLE IF NOT EXISTS ...)
public/static/ CSS, client JS, default avatar
```
