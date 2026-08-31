# Deployment & handover

This project **used to be a static export**. It is now a Next.js server
application. That change was not cosmetic — it is what makes the
Superadmin login, the stored orders and the verified payments possible
at all. On a static site the only place to check a password is the
browser, and a check in the browser is not a check.

---

## 1. What changed about hosting

`next.config.mjs` no longer sets `output: "export"`.

| Host | What to do |
|---|---|
| **Vercel** | Nothing. It runs Next.js natively. **But see §3 — without a KV store every order is lost.** |
| **Render** | Change the service from **Static Site** to **Web Service**. Build `npm run build`, start `npm start`. |
| **A VPS / any Node host** | `npm ci && npm run build && npm start`. Node 20+. |

There is no longer an `out/` directory to publish.

---

## 2. First run

```bash
npm install
cp .env.example .env.local     # then read §3 and §4
npm run dev
```

Superadmin is at **`/superadmin`**.

| | |
|---|---|
| Username | `Master - TSJH` |
| Password | `Enterprises@2026` |

The username is matched leniently on case and spacing — `master - tsjh`
works. **Change the password before the site is publicly reachable:**

```bash
npm run hash-password -- "your new password"
# paste the printed line into SUPERADMIN_PASSWORD_HASH
```

The default password's hash is in `lib/server/auth.ts`. It is
documented, therefore public, therefore not a secret.

---

## 3. Storage — read this before deploying to Vercel

Orders, enquiries and content overrides go through `lib/server/db.ts`,
which has two drivers and picks one automatically:

- **Upstash / Vercel KV** when `KV_REST_API_URL` and `KV_REST_API_TOKEN`
  are set. Works everywhere, including serverless.
- **A JSON file** at `.data/db.json` otherwise. Fine for `npm run dev`
  and for any host with a real disk.

> **On Vercel the filesystem is read-only and thrown away between
> requests.** With no KV credentials the app will appear to work and
> then lose every order. Create a KV store, paste the two REST
> credentials into the environment, and redeploy. The server logs which
> driver it chose on the first write.

To move to Postgres later, replace `lib/server/db.ts`. Every caller
goes through its six functions and none of them knows which driver
answered.

---

## 4. Payments

**Without Razorpay keys** the site uses the UPI hand-off it already
had: the customer pays, types a reference, and the order sits at
*awaiting verification* until someone clears it in Superadmin against
the bank statement. That is a working manual process — you can launch
on it.

**With `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`** set, Checkout
opens and payments verify automatically. Before an order is marked
paid, three things must hold:

1. the signature recomputes with the secret key,
2. Razorpay itself reports the payment *captured*,
3. the captured amount equals the total **we** calculated.

The third check is the one that is easy to leave out and matters most:
without it a signed, captured ₹1 payment would mark a ₹4,000 order
paid.

**Nothing marks an order paid except `/api/payments/verify`.** Not the
admin, not the browser. The Superadmin panel deliberately has no "mark
as paid" button.

### Prices are never taken from the browser
`/api/orders` reprices every line from `config/catalogue.server.ts` and
ignores the total the client sent. To change a price, edit the
catalogue — a price that only exists in a component is a price a
customer can edit in devtools.

---

## 5. Before you sell anything — placeholders to replace

Search the codebase for these markers:

| Marker | Where | What it is |
|---|---|---|
| `TODO stock` | `config/shop.config.ts`, `config/harmonic.config.ts` | ~40 product names, pack sizes and prices we were never given. The tabs, cart and checkout are real; the stock list is a stand-in so the shop could be built and tested. |
| `TODO price` | `config/foods.config.ts` | Pre-existing. Food prices were market-rate guesses. |
| `TODO history` | `config/harmonic.config.ts` | Biography of the masters. **Do not fill this in from a web search** — only the centre can say who taught whom, and a lineage stated wrongly in print is a serious discourtesy in this tradition. |

Also missing: **`public/media/upi-qr.png`**. The payment panels look for
it and fall back to a "scan with any UPI app" prompt when it is absent,
so nothing is broken — but customers do not get a scannable code until
you add your own. We deliberately did not generate one: a QR pointing
at the wrong account sends real money to the wrong place.

---

## 6. What is where

```
app/
  stand-firm/          the firm — its own navbar, footer and mega-menu
    [area]/[topic]/    10 practice areas, 67 sub-practices, all real pages
    services/          the enquiry catalogue (no prices anywhere)
  jeni/[vertical]/     9 counters, each its own page
  harmonic/[tab]/      dhoobam, classes, masters
  superadmin/          4 brand portals, login-gated
  api/                 auth · orders · enquiries · content · payments

lib/server/            db · auth · session · payments · http   (server only)
lib/useCheckout.ts     the client half of a payment it is not trusted with
lib/useContent.ts      Superadmin overrides, with the config as fallback
lib/useLockPageScroll  freezes the page behind a popup

config/
  standfirm.config.ts  the firm, its contacts, its practice structure
  jeni.config.ts       the nine counters
  harmonic.config.ts   the fourth brand
  shop.config.ts       clothing · wholesale · exports · sarees
  catalogue.server.ts  the ONLY price list the server bills from
  editable.config.ts   what Superadmin is allowed to change
  brands.config.ts     the four businesses, as the portal sees them
```

Four components are marked `SUPERSEDED` in their header comment
(`ServiceStore`, `StoreHero`, `JeniEnterprises`, `ScrubHero`). Nothing
imports them. `ServiceStore` in particular is the old **priced** store —
putting it back on a page would reintroduce exactly the pricing that was
asked to be removed.

---

## 7. Not verified by a build

The npm registry was unreachable from the environment this work was
done in, so dependencies could not be installed and **`next build` and
`tsc` were never run**. To compensate, nothing new was added to
`package.json` — the auth, storage and payment layers are built on
Node's own `crypto` and `fetch` — and the following were checked
instead:

- every `@/…` import resolves, and every named import exists in its target;
- the session signing, tamper-rejection, expiry and password hashing
  were **executed** as tests (19 assertions, all passing);
- the storage layer and Razorpay signature check were **executed**
  (31 assertions). This found a real bug: order ids had only 1,000
  random values per millisecond and `put` overwrote on collision, so
  two orders placed in the same millisecond could silently destroy one
  another. Ids are now 24 bits of CSPRNG output and order writes use
  `insert`, which refuses to overwrite.

**Run `npm install && npm run build` once before deploying.** Expect
ordinary type errors in files not touched here; the areas above are
verified as far as they can be without a compiler.
