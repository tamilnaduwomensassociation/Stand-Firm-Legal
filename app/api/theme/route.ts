import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { get, insert, newId, put } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { checkTheme, normaliseTheme } from "@/lib/theme";
import { fontChoices, type ThemeTokens } from "@/config/theme.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRANDS = ["tnwla", "stand-firm", "jeni", "harmonic"];
const themeKey = (brand: string) => `theme:${brand}`;

/** The saved theme for a brand. Public — the page needs it to render. */
export async function GET(req: NextRequest) {
  try {
    const brand = clean(req.nextUrl.searchParams.get("brand"), 40) || "tnwla";
    if (!BRANDS.includes(brand)) {
      return fail(Object.assign(new Error("Unknown brand"), { status: 400 }));
    }
    const row = await get("content", themeKey(brand));
    return ok({ brand, theme: (row?.data as ThemeTokens) ?? {} });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Save a theme — and REFUSE one that cannot be read.
 *
 * The contrast check is the point of this route. A colour picker with
 * nothing behind it will eventually produce cream on cream at 11pm
 * with nobody around to undo it, and the site would stay that way
 * until somebody noticed. The same function runs in the panel to warn
 * as you pick; running it again here is what makes it a rule rather
 * than a suggestion, because a direct POST walks straight past a
 * browser-side check.
 *
 * The response names the failing pair and the actual ratio, so the
 * fix is obvious rather than a guessing game.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as { brand?: string; theme?: unknown };

    const brand = clean(b.brand, 40);
    if (!BRANDS.includes(brand)) {
      return fail(Object.assign(new Error("Unknown brand"), { status: 400 }));
    }
    if (typeof b.theme !== "object" || b.theme === null || Array.isArray(b.theme)) {
      return fail(Object.assign(new Error("theme must be an object"), { status: 400 }));
    }

    const raw = b.theme as Record<string, unknown>;
    const theme = normaliseTheme({
      bg: clean(raw.bg, 20) || undefined,
      surface: clean(raw.surface, 20) || undefined,
      text: clean(raw.text, 20) || undefined,
      accent: clean(raw.accent, 20) || undefined,
      onAccent: clean(raw.onAccent, 20) || undefined,
      headingFont: fontChoices.some((f) => f.id === raw.headingFont) ? String(raw.headingFont) : undefined,
      bodyFont: fontChoices.some((f) => f.id === raw.bodyFont) ? String(raw.bodyFont) : undefined,
      scale: typeof raw.scale === "number" ? raw.scale : undefined,
      radius: typeof raw.radius === "number" ? raw.radius : undefined,
      heroImage: clean(raw.heroImage, 600) || undefined,
      logo: clean(raw.logo, 600) || undefined,
    });

    const problems = checkTheme(theme);
    if (problems.length) {
      return fail(Object.assign(
        new Error(
          "That theme would be unreadable: " +
          problems.map((p) => `${p.pair} is ${p.ratio}:1, needs ${p.needs}:1`).join("; ")
        ),
        { status: 422 }
      ));
    }

    /* Strip the undefineds so a cleared field genuinely means "no
       override" rather than "override with nothing". */
    const stored = Object.fromEntries(Object.entries(theme).filter(([, v]) => v !== undefined));

    const existing = await get("content", themeKey(brand));
    await put("content", {
      id: themeKey(brand),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: session.user,
      data: stored,
    });

    await insert("audit", {
      id: newId("AUD"),
      createdAt: new Date().toISOString(),
      brand,
      user: session.user,
      action: "theme.update",
      keys: Object.keys(stored),
    });

    return ok({ ok: true, brand, theme: stored });
  } catch (e) {
    return fail(e);
  }
}
