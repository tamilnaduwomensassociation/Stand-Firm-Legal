/**
 * Practice-area icons, resolved by name from standfirm.config.
 *
 * The config names an icon as a string so it stays a plain data file —
 * importable from a server component, a script or a sitemap without
 * dragging React in. This is the one place those names become
 * components, and `Scale` is the fallback so a typo in the config
 * renders a generic icon instead of crashing the page.
 */
import {
  Baby, Briefcase, Building2, Gavel, Handshake, HeartCrack,
  Landmark, Scale, ScrollText, ShieldAlert, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  ShieldAlert, Gavel, Scale, HeartCrack, Baby, Landmark, Briefcase, ScrollText, Handshake, Building2,
};

export const areaIcon = (name: string): LucideIcon => map[name] ?? Scale;
