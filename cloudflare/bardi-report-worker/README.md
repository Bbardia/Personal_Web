# Bardi Report Worker

Cloudflare Worker that stores and serves the latest **Bardi Report** edition,
backed by an R2 bucket (`bardi-report`, bound as `REPORTS`).

| Route | Auth | Used by |
|-------|------|---------|
| `GET /latest.json` | public (CORS `*`) | the website |
| `PUT /latest.json` | `Authorization: Bearer <WRITE_TOKEN>` | the Raspberry Pi, after each broadcast |

This folder is the **source of truth** for the Worker — edit it and redeploy to
change the live Worker. It is intentionally outside the website's build (`tsc`
only compiles `src/`, and `cloudflare/` is in the ESLint ignore list).

## Deploy / update

```bash
cd cloudflare/bardi-report-worker
npm install        # first time only
npm run deploy     # wrangler deploy → updates the live Worker
```

`wrangler deploy` targets the `name` in `wrangler.toml`, so deploying from here
updates the **same** Worker no matter where you run it from.

## Secret (write token)

The token lives on Cloudflare, **not** in this folder, and persists across
deploys. To set or rotate it:

```bash
echo "<token>" | npx wrangler secret put WRITE_TOKEN
```

The same value goes in the Pi's `.env` as `BARDI_REPORT_PUBLISH_TOKEN`. For local
`wrangler dev`, put it in a `.dev.vars` file (gitignored) — never commit secrets.

## How it's wired

- **Website:** reads `GET /latest.json` via the `BARDI_REPORT_URL` GitHub Actions
  variable → `VITE_BARDI_REPORT_URL` at build time (see `.github/workflows/deploy.yml`).
- **Pi:** `PUT`s the archived edition after a successful broadcast.
- **Next:** the subscriber signup endpoint (Resend Audience) will be added to
  `src/index.js` here.
