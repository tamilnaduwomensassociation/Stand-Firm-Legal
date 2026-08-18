import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site.config";
import { LangProvider } from "@/lib/i18n";
import SmoothScroll from "@/components/providers/SmoothScroll";

/* Typography: elegant serif display + modern sans body + Tamil */
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500"],
  variable: "--font-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline} | Women Lawyers, Chennai`,
    template: `%s | ${site.name}`,
  },
  description: `${site.name}, Armenian Street, Parrys, Chennai. Civil, criminal, family, consumer, labour, company, writ & MSME cases. Property registration, deed preparation, GST, MSME & all registrations across Tamil Nadu, Pondicherry & Andhra Pradesh. ${site.motto}`,
  keywords: [
    "advocates in Chennai", "lawyers Parrys", "property registration Chennai",
    "deed preparation", "civil lawyer Chennai", "criminal lawyer Chennai",
    "family court advocate", "consumer forum", "MSME cases", "legal opinion",
    "encumbrance certificate", "patta transfer", "Stand Firm Legal Associates",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.motto,
    images: [{ url: "/media/stills/hero-freeze.jpg", width: 1280, height: 720, alt: "Stand Firm Legal Associates — courtroom" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.motto,
    images: ["/media/stills/hero-freeze.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

/* Structured data — LegalService for rich results */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: site.name,
  alternateName: "Stand Firm Legal Associates",
  slogan: site.tagline,
  url: site.url,
  telephone: site.phones[0],
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 26/105, 1st Floor, Armenian Street, Parrys",
    addressLocality: "Chennai",
    postalCode: "600001",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
  areaServed: ["Tamil Nadu", "Pondicherry", "Andhra Pradesh"],
  openingHours: "Mo-Sa 09:30-20:00",
  priceRange: "₹₹",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${tamil.variable} light`}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LangProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </LangProvider>
      </body>
    </html>
  );
}
