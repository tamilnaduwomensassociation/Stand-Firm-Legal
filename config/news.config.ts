/**
 * ============================================================
 * LEGAL NEWS — live sources
 * ============================================================
 * The site is exported statically (next.config: output "export"),
 * so there is no server to poll RSS on a schedule. The feeds are
 * therefore read in the browser, through a public CORS relay, and
 * merged client-side. Nothing is cached on our side; every visit
 * shows whatever the sources are publishing at that moment.
 *
 * To add a source, drop its RSS URL in below. To change the relay
 * order, reorder RELAYS — each is tried until one answers.
 * ============================================================
 */

export type NewsSource = {
  id: string;
  name: string;
  url: string;   // RSS / Atom feed
  site: string;  // human-facing homepage
};

export const newsSources: NewsSource[] = [
  { id: "livelaw",   name: "Live Law",        url: "https://www.livelaw.in/google_feeds.xml", site: "https://www.livelaw.in" },
  { id: "barbench",  name: "Bar & Bench",     url: "https://prod-qt-images.s3.amazonaws.com/production/barandbench/feed.xml", site: "https://www.barandbench.com" },
  { id: "indialegal", name: "India Legal",    url: "https://indialegallive.com/feed/", site: "https://indialegallive.com" },
  { id: "legalbites", name: "Legal Bites",    url: "https://www.legalbites.in/feed", site: "https://www.legalbites.in" },
];

/**
 * CORS relays, tried in order. The first two return the raw feed XML;
 * the third returns pre-parsed JSON and is handled separately.
 */
export const RELAYS = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];
export const JSON_RELAY = (u: string) =>
  `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(u)}&count=25`;

/**
 * Buckets. An item lands in the first bucket whose pattern it matches,
 * so order matters — Women & Law is tested first deliberately.
 */
export const newsBuckets = [
  {
    id: "women",
    en: "Women & Law",
    ta: "பெண்களும் சட்டமும்",
    test: /\b(woman|women|female|POSH|sexual harassment|domestic violence|dowry|maintenance|rape|marital|maternity|custody|streedhan|transgender)\b/i,
  },
  {
    id: "judgments",
    en: "Judgments",
    ta: "தீர்ப்புகள்",
    test: /\b(judgment|judgement|verdict|held|bench|supreme court|high court|tribunal|acquit|convict|quash|bail|petition dismissed|allows plea|upholds|strikes down)\b/i,
  },
  {
    id: "rules",
    en: "Rules & Notifications",
    ta: "விதிகள் & அறிவிப்புகள்",
    test: /\b(act|bill|rules|notification|amendment|gazette|circular|guidelines|ordinance|regulation|policy|centre notifies|govt notifies)\b/i,
  },
  { id: "general", en: "Legal News", ta: "சட்ட செய்திகள்", test: /.*/ },
] as const;

export type BucketId = (typeof newsBuckets)[number]["id"];
