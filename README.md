> ## ⚠️ This is no longer a static export
>
> It is a Next.js **server** application. `output: "export"` has been
> removed because the Superadmin login, the stored orders and the
> verified payments cannot exist on a static site — on a static site
> the only place to check a password is the browser.
>
> **Read [DEPLOYMENT.md](./DEPLOYMENT.md) before deploying.** In
> particular: on Vercel, without a KV store configured, every order is
> silently lost.
>
> Superadmin: `/superadmin` — `Master - TSJH` / `Enterprises@2026`
> (change it: `npm run hash-password -- "new password"`).

# STAND FIRM LEGAL ASSOCIATES — Cinematic Luxury Website

Next.js 15 · React 19 · TypeScript · Tailwind CSS · GSAP + ScrollTrigger · Lenis · Framer Motion

A scroll-driven cinematic experience: the Gemini courtroom video freezes into still frames
as you scroll, and each frame becomes a story chapter (Apple-keynote style).

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Where to edit things

| What | File |
|---|---|
| Phones, address, hours, socials, services, FAQs, team, testimonials | `config/site.config.ts` |
| EN / தமிழ் UI strings | `lib/i18n.tsx` |
| Colors & fonts | `tailwind.config.ts`, `app/layout.tsx` |
| Hero video & freeze frames | `public/media/` |

## Adding your other Gemini videos

1. Drop each video in `public/media/` (e.g. `scene-property.mp4`).
2. Extract a freeze frame: `ffmpeg -ss 9.5 -i scene-property.mp4 -frames:v 1 -q:v 2 frames/scene-6.jpg`
3. Point any section's background at the new frame (each section's bg URL is one line),
   or duplicate `components/sections/About.tsx` as a new scene chapter — it already
   implements the pin + zoom + text-reveal pattern.

Currently all scene frames are extracted from the single uploaded hero video —
replace `scene-1..5.jpg` with frames from your other videos any time.

## Architecture notes

- **`lib/gsap.ts`** registers ScrollTrigger once; every component imports gsap from there.
- **`components/providers/SmoothScroll.tsx`** runs Lenis inside GSAP's ticker (one rAF loop).
- **Hero freeze-frame magic** lives in `components/sections/Hero.tsx` — pinned timeline,
  video pauses at 18% progress and cross-dissolves into `hero-freeze.jpg`, then Ken Burns zoom.
- **Horizontal storytelling**: `components/sections/Documentation.tsx` (pinned x-translate).
- Below-the-fold sections are code-split via `next/dynamic` in `app/page.tsx`.
- SEO: metadata + OpenGraph + JSON-LD (LegalService) in `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`.
- Accessibility: aria labels throughout, `prefers-reduced-motion` respected in `globals.css`.

## Zero-backend by design (for now)

- Contact/appointment form composes a pre-filled **WhatsApp message** to the firm.
- Chatbot answers from a rule-based knowledge base in `components/features/Chatbot.tsx`
  (`answer()` — swap for a real LLM API route when ready).
- Document upload is client-side preview only — wire to storage when a backend exists.

## TODO before launch

- [ ] Replace lawyer placeholder names/photos in `config/site.config.ts` (+ `public/media/team/`)
- [ ] Set the real domain in `config/site.config.ts` (`url`)
- [ ] Confirm the firm's preferred email (currently the association's)
- [ ] Replace scene frames with stills from the remaining Gemini videos
- [ ] Optional: Spline / React-Three-Fiber 3D scales-of-justice for the hero (deps ready to add)

## Websites Links

Official website: https://tnwla-madras.com
