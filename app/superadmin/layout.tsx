import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Superadmin", template: "%s | Superadmin" },
  robots: { index: false, follow: false },
};

/**
 * The portal deliberately does NOT render the public site's Navbar,
 * Footer, chatbot or smooth-scroll. It is a tool, not a page: the
 * cinematic chrome would be noise, and Lenis fighting a data table is
 * the last thing anyone needs at the end of a working day.
 */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100svh] bg-obsidian-deep">{children}</div>;
}
