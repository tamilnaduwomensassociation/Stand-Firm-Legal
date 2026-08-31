# TNWLA Madras — pass 1

Eleven of the nineteen items are done. What remains is listed at the
bottom with the reason each one is a bigger build.

## Done

| # | Change | Where |
|---|---|---|
| 1 | Wordmark now reads **Tamilnadu Women Law Association — Madras** | `components/layout/Navbar.tsx` |
| 2a | **New Membership Registration is its own page** at `/membership`. The hero button navigates instead of scrolling the home page down to a section. | `app/membership/page.tsx` |
| 2b | The three fee cards are replaced by an **empty dropdown** (Practising Advocates / Lawyers / Law Students). Nothing renders until a category is chosen, and **no fee appears on the chooser** — it now shows only at the Payment step. The step tabs are a read-only progress indicator, so nobody can jump to Payment without filling the form. | `components/sections/MembershipRegistration.tsx` |
| 3 | **Main Leaders Panel** — nine office bearers, photographs imported, names, qualifications and designations transcribed from your letterhead. Preethi added as an Executive Committee Member. **The President card is untouched.** | `config/site.config.ts`, `components/sections/Lawyers.tsx` |
| 4 | **Partnerships moved off** the association's page and onto **`/stand-firm/team`**. | `app/stand-firm/team/page.tsx` |
| 5 | `TNWLA/2026/` is now **fixed furniture beside the input**, not an editable value — only the serial is typed. | `config/membership.config.ts` |
| 6 | **ID cards save to the backend.** A new "Save to directory" button writes the card, and Verify Your Membership queries that store live. Issue a card and it is findable immediately. | `app/api/members/route.ts` |
| 7 | "Numbers That Stand **Firm**" → the band is gone entirely (see 15). | — |
| 8 | **Practice Areas → Activity** in the nav and the section heading, both languages. | `lib/i18n.tsx`, `config/site.config.ts` |
| 9 | **Women Development** added after the motto — five tabbed pillars plus the unity note. | `components/sections/WomenDevelopment.tsx` |
| 10a | **Legal News sits between** New Membership and Free Legal Aids in the hero. | `components/sections/Hero.tsx` |
| 15 | The stats band is **replaced by looping video**. | `components/sections/AssociationFilm.tsx` |
| 18 | **Bare Acts store** at `/books`, after Legal News in the nav. Amazon-style grid, filters, a running list. **No price anywhere.** Selecting titles captures a phone number and the request lands in Superadmin. | `config/books.config.ts`, `components/sections/BookShop.tsx` |

### Two judgment calls you should know about

**The stats band (15).** I removed it rather than moving it. Two of the
five figures were unverified placeholders, and "100% client
satisfaction" is a claim no practice can evidence — the Bar Council of
India's rules on advertising are strict about a lawyer publishing
statistics about their own success. The film says the same thing
without the exposure. The old component is kept and marked
`SUPERSEDED` if you disagree.

**Item 7, "remove Firm and add Association".** The string was the
heading of that same band, so fixing it and deleting it were the same
edit. The corrected wording is in `lib/i18n.tsx` should the band ever
come back.

## Still to do — pass 2

| # | Item | Why it is a bigger build |
|---|---|---|
| 10b | Legal news auto-refresh hourly, old items falling down | Needs a scheduled job, not a page change |
| 11 | Birthday / festival wishes panel with notifications | Needs the members' dates of birth, and a notification transport |
| 12 | Grok across all four brands | Built server-side, reading `GROK_API_KEY`; falls back to the current keyword bot until you add a key from console.x.ai |
| 13 | Event booking — seats, dates, voting threshold, post-session certificate forms | The largest single piece; a booking system in its own right |
| 14 | Weekly TNWLA blogs | Depends on 12 for drafting |
| 16 | Membership expiry notifications | Shares the transport with 11 |
| 17 | Superadmin theme editor and image upload | Needs `BLOB_READ_WRITE_TOKEN` — create a Vercel Blob store, it takes about a minute |
| 19 | Letterhead composer → PDF/image → WhatsApp or email | Straightforward once 17's upload path exists |

## Before this deploys

- `npm install && npm run build` — the package registry is blocked here,
  so nothing in this project has been compiled. See `DEPLOYMENT.md`.
- `public/media/upi-qr.png` is still missing. The payment panels fall
  back to a "scan with any UPI app" prompt, so nothing is broken — but
  members get no scannable code until you add your own. I have not
  generated one: a QR pointing at the wrong account sends real money to
  the wrong place.

---

# Pass 2 — the remaining eight items

| # | Change | Where |
|---|---|---|
| 10b | **Legal news refreshes hourly.** A cron job fetches the four feeds server-side and stores them; items are ordered by the publisher's own timestamp, so older stories fall down because they are older — not because of when we happened to look. The build-time file is still the seed, so the page is never blank. | `lib/server/news.ts`, `vercel.json` |
| 11 | **Wishes panel** — a bell above the chatbot for birthdays and festivals, appearing only when there is something to say. Fourteen festivals; the movable ones (Deepavali, Pongal, Ramzan, Good Friday) carry explicit per-year dates and show **nothing** for a year not filled in, rather than guessing. | `components/features/WishesPanel.tsx`, `config/festivals.config.ts` |
| 12 | **Grok on all four brands**, server-side, with a distinct system prompt each. Falls back to the existing keyword answers when no key is set. TNWLA's answers are *grounded* — the server injects the live session list, so "when is the next session?" is answered from the database, not from memory. | `lib/server/grok.ts`, `app/api/chat/` |
| 13 | **Full booking system.** Seats, dates, times, venues, audiences and amenities — every one a dropdown, none typed. Interest voting with a 30-person threshold. Multi-day agendas. Sessions appear on the home page and at `/events` with a Book Now action. | `lib/server/events.ts`, `components/events/`, `components/admin/EventsPanel.tsx` |
| 13b | **Certificates.** The office ends a session and opens the feedback window; attendees complete the form with the reference from their booking and the certificate is issued immediately as a PDF, sendable over WhatsApp. | `app/events/certificate/`, `components/events/CertificateClaim.tsx` |
| 14 | **Weekly blog.** A draft is written every Monday from that week's headlines and lands in Superadmin. **Nothing publishes itself** — a human reads it and presses publish. | `app/api/blog/`, `components/admin/BlogPanel.tsx` |
| 16 | **Membership expiry notices** — 60 days ahead, in Superadmin only. Whose membership is lapsing is never public. | `lib/server/wishes.ts` |
| 17 | **Appearance editor** — colours, fonts, type scale, corner rounding and image uploads, per brand. A theme that would be hard to read **cannot be saved**: contrast is checked against WCAG AA in the panel *and* again on the server. | `components/admin/ThemePanel.tsx`, `app/api/theme/` |
| 19 | **Letterhead composer.** Type a letter, get a PDF or an image, send by WhatsApp or email. The sheet is rebuilt as real text — masthead, office bearers column, watermark, signature — not typed over a scan. | `components/admin/Letterhead.tsx` |

## Three bugs the tests caught

**Order ids could collide.** `newId` had only 1,000 random values per
millisecond and `put` overwrote on a clash, so two orders placed in the
same millisecond could silently destroy one another. Ids are now 24
bits of CSPRNG output and writes use `insert`, which refuses to
overwrite. *(Found in pass 1, listed here for completeness.)*

**`"use client"` was no longer the first line of `Stats.tsx`.** The
SUPERSEDED banner had been prepended above it. A directive only counts
as a directive when nothing precedes it — the file uses a hook, so this
was a build failure, not a style nit.

**A malformed expiry date became a real one.** `new Date("whenever 1")`
returns 1 January 2001 in V8 rather than failing, and `new Date("Augus
2026 1")` cheerfully accepts the typo. Either way a nonsense value
turned into a date and a member was silently dropped from the renewal
list. Replaced with a strict parser that accepts two shapes and rejects
everything else. A second edge fell out of the same test: `Math.ceil`
returns **negative zero** the day after a card lapses, and `-0 < 0` is
false in JavaScript, so an expired card read "expires in 0 days". Now
counted in whole calendar days.

Also fixed: `useSearchParams()` on the login and certificate pages had
no Suspense boundary. That builds fine in development and fails the
production build outright — the easiest kind of thing to ship broken.

## What you need to set

| Variable | Without it |
|---|---|
| `GROK_API_KEY` | Chatbots use the keyword answers; the blog job reports it was skipped. Nothing breaks. |
| `CRON_SECRET` | The hourly news refresh and Monday blog job refuse cron callers. Superadmin can still trigger both by hand. |
| `BLOB_READ_WRITE_TOKEN` | Colours, fonts and sizes still work; only image upload is disabled, with a line saying why. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | **On Vercel, every order, booking and event is lost.** This is the one that is not optional. |

The cron schedules are in `vercel.json` and start working the moment
`CRON_SECRET` exists.

## Still open

- **Member dates of birth.** The wishes panel is built and reads them
  from the member directory; there is a bulk-import endpoint
  (`POST /api/members/import`) that takes a pasted spreadsheet, so the
  whole roll can be loaded in one go when you have it.
- **`public/media/upi-qr.png`** is still missing. Payment panels fall
  back to a "scan with any UPI app" prompt. I have not generated one —
  a QR pointing at the wrong account sends real money to the wrong
  place.
- **`npm install && npm run build`** has still never been run here; the
  package registry is blocked in this environment. Everything above was
  verified by executing the logic in isolation (**79 assertions across
  sessions, storage, payments, contrast and dates — all passing**) and
  by static checks on imports, exports, directives, routes and assets.
