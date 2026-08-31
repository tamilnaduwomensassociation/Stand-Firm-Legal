# Deploying this site

The full, illustrated version is **TSJH-Launch-Runbook.pdf** in this folder.
This file is the same thing in one page, for someone already at a terminal.

## The seven steps

```bash
npm install
npm run build          # fix anything red BEFORE pushing
git push origin main
```

Then, in Vercel:

1. **Storage → Create Database → Upstash → Redis.** Region Mumbai or
   Singapore, Free plan, connected to the project in all environments.
   *Without this every order is silently lost* — Vercel's disk is wiped
   between requests, so the fallback file exists for a moment and then
   does not.
2. **Settings → Environment Variables**, all three scopes:

   | Name | Value | Needed |
   |---|---|---|
   | `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` | yes |
   | `SUPERADMIN_USER` | `Master - TSJH` | yes |
   | `NEXT_PUBLIC_SITE_URL` | your final domain | yes |
   | `CRON_SECRET` | another generated string | yes |
   | `GROK_API_KEY` | console.x.ai — turns the assistant on | optional |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **live** keys only, Production only | when approved |

3. **Redeploy.** New variables do nothing until you do.
4. Framework Preset must be **Next.js**; Output Directory **empty**.
5. Sign in at `/superadmin` — `Master - TSJH` / `Enterprises@2026`.
6. Domain: GoDaddy `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`.
7. Change the Superadmin password from inside the panel.

## Three things that have actually gone wrong here

**Do not set `SUPERADMIN_PASSWORD_HASH`.** Its value contains
`$16384$8$1$`. A shell, a `.env` file or an unquoted CLI flag eats every
`$`-segment as a variable name, leaving a value that matches no password —
and the login form only ever says "Those details were not recognised",
by design. `lib/server/auth.ts` now validates the variable and ignores it
if it is malformed, but the simplest protection is to leave it unset.
`npm run auth-check` proves the built-in password works against every
misconfiguration.

**Cron must stay daily on the Hobby plan.** Vercel refuses any schedule
more frequent than once a day *at deploy time* — the whole deployment
fails, so nothing ships and the last good build keeps serving. The hourly
news behaviour lives in `getNews()` instead: the first reader after the
data passes an hour old triggers a refresh, behind a self-expiring lock.

**A failed Render deploy keeps serving the old site.** Render does not
take a broken build down. Since `output: "export"` was removed there is no
`out` directory, so a Render *Static Site* fails for ever while looking
healthy from outside. Delete the service, or recreate it as a **Web
Service** (`npm run build` / `npm start`).

## Checks you can run without a network

```bash
npx tsc --noEmit        # whole project type-checks
npm run auth-check      # 21 assertions on the Superadmin login
```
