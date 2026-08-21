# Bardi Report Worker

Cloudflare Worker that stores and serves the latest **Bardi Report** edition,
backed by an R2 bucket (`bardi-report`, bound as `REPORTS`).

| Route | Auth | Used by |
|-------|------|---------|
| `GET /latest.json` | public (CORS `*`) | the website |
| `POST /subscribe` | public, rate-limited | newsletter signup form |
| `PUT /latest.json` | write-token header | the Raspberry Pi, after each broadcast |

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

## Newsletter signup secrets

`POST /subscribe` adds contacts to the same Resend segment used by broadcasts.
Set these Worker secrets before deploying:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put BARDI_REPORT_RESEND_SEGMENT_ID
```

The segment ID is currently read from the Bardi Report pipeline, not committed.
The frontend derives `/subscribe` from `VITE_BARDI_REPORT_URL`.

`wrangler.toml` also binds:
- `SUBSCRIBE_RATE_LIMITER_DO`: strict per-key burst control.
- `SUBSCRIBE_RATE_LIMITER`: Cloudflare edge rate-limit API at 8 requests/minute.
- `SUBSCRIBE_RATE_LIMITS`: KV fallback for persisted IP/email cooldowns.

Keep dashboard/API rate rules at least this strict if changed.

## How it's wired

- **Website:** reads `GET /latest.json` via the `BARDI_REPORT_URL` GitHub Actions
  variable → `VITE_BARDI_REPORT_URL` at build time (see `.github/workflows/deploy.yml`).
- **Pi:** `PUT`s the archived edition after a successful broadcast.
- **Signup:** the newsletter header posts to `POST /subscribe`; the Worker validates,
  rate-limits, checks duplicates, and writes to the Resend `Bardi Report` segment.
