import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "@/app/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Tinos } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundAnimations from "@/components/BackgroundAnimations";
import StructuredData from "@/components/StructuredData";
import SmoothScroll from "@/components/SmoothScroll";
import { ASSETS, THEME } from "@/lib/conference";
import { getSiteSettings, normalizeSiteUrl } from "@/lib/siteSettings";

const tinos = Tinos({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-tinos",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const conference = settings.conference;
  const siteUrl = normalizeSiteUrl(conference.siteUrl);

  return {
    title: {
      default: conference.displayName,
      template: `%s | ${conference.displayName}`,
    },
    description: `${conference.sessionName}. Join us on ${conference.dates}. ${conference.hashtag}`,
    keywords: [...conference.keywords, conference.shortName, conference.brandName],
    alternates: { canonical: "/" },
    authors: [{ name: conference.organizer.name || conference.brandName }],
    creator: conference.organizer.name || conference.brandName,
    publisher: conference.organizer.name || conference.brandName,
    icons: {
      icon: [{ url: ASSETS.favicon, type: "image/x-icon" }],
      apple: [{ url: ASSETS.logo, sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: `${conference.displayName} | ${conference.fullName}`,
      description: `${conference.dates} | ${conference.sessionName}.`,
      url: siteUrl,
      siteName: conference.displayName,
      images: [{ url: `${siteUrl}${ASSETS.openGraph}`, width: 640, height: 640, alt: `${conference.displayName} - ${conference.fullName}` }],
      locale: conference.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${conference.displayName} | ${conference.fullName}`,
      description: `${conference.dates} | ${conference.hashtag}`,
      images: [`${siteUrl}${ASSETS.openGraph}`],
    },
    metadataBase: new URL(siteUrl),
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    robots: { index: true, follow: true, nocache: false, googleBot: { index: true, follow: true, noimageindex: false } },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" data-scroll-behavior="smooth" className="overflow-x-hidden max-w-screen scroll-smooth">
      <body
        className={`overflow-x-hidden max-w-screen ${tinos.variable} ${tinos.className} antialiased`}
        style={{
          scrollbarWidth: "none",
          "--background": THEME.background,
          "--foreground": THEME.foreground,
          "--color-accent": THEME.accent,
          "--color-highlight": THEME.highlight,
          "--color-pattern": THEME.pattern,
          "--color-pattern-strong": THEME.patternStrong,
          "--color-middle": THEME.middle,
          "--color-warm": THEME.warm,
        } as CSSProperties}
      >
        <SmoothScroll>
          <div
            aria-hidden="true"
            className="fixed top-0 left-0 z-[-1] h-[1200px] w-full pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${THEME.background} 0%, ${THEME.middle} 48%, ${THEME.warm} 100%)`,
            }}
          />
          <BackgroundAnimations />
          <StructuredData conference={settings.conference} />

          <div className="min-h-screen relative z-10">
            <Navbar
              brandName={settings.conference.brandName}
              showCommittees={settings.pages.committeesEnabled}
              showSecretariat={settings.pages.secretariatEnabled}
            />
            {children}
          </div>
          <Footer
            year={settings.conference.year}
            brandName={settings.conference.brandName}
            organizer={settings.conference.organizer}
          />
          <Analytics />
        </SmoothScroll>
      </body>
    </html>
  );
}
