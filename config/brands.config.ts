/**
 * The four businesses, as the Superadmin portal sees them.
 * One list, so a brand added here appears as a portal tab, a filter on
 * every table and a section in the content editor at once.
 */
export type BrandId = "tnwla" | "stand-firm" | "jeni" | "harmonic";

export type Brand = {
  id: BrandId;
  name: string;
  short: string;
  mark: string;
  /** Where this brand's public pages start */
  site: string;
  accent: string;
  /** Which panels make sense for this brand */
  panels: ("orders" | "enquiries" | "content" | "events" | "theme" | "letterhead" | "blog" | "books" | "live-updates" | "link")[];
};

export const brands: Brand[] = [
  {
    id: "tnwla", name: "TNWLA — Madras", short: "TNWLA",
    mark: "/media/marks/start-mark.png", site: "/",
    accent: "#c9a24b", panels: ["events", "enquiries", "content", "blog", "books", "live-updates", "letterhead"],
  },
  {
    id: "stand-firm", name: "Stand Firm Legal Associates", short: "Stand Firm",
    mark: "/media/marks/sfla-mark.png", site: "/stand-firm",
    accent: "#c9a24b", panels: ["enquiries", "content"],
  },
  {
    id: "jeni", name: "Jeni Enterprises", short: "Jeni",
    mark: "/media/marks/jeni-mark.png", site: "/jeni",
    accent: "#c9a24b", panels: ["orders", "enquiries", "content"],
  },
  {
    id: "harmonic", name: "Harmony Pranic Healing", short: "Harmony",
    mark: "/media/marks/harmony-mark.png", site: "/harmonic",
    accent: "#c9a24b", panels: ["orders", "enquiries", "content", "link"],
  },
];

export const findBrand = (id: string) => brands.find((b) => b.id === id);

/** Order states, in the order an order actually moves through them. */
export const ORDER_STATUSES = [
  { id: "pending", label: "Pending", tone: "neutral" },
  { id: "awaiting-verification", label: "Awaiting verification", tone: "warn" },
  { id: "paid", label: "Paid", tone: "good" },
  { id: "preparing", label: "Preparing", tone: "info" },
  { id: "despatched", label: "Despatched", tone: "info" },
  { id: "delivered", label: "Delivered", tone: "good" },
  { id: "cancelled", label: "Cancelled", tone: "bad" },
] as const;
