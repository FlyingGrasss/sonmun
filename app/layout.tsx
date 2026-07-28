import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "@/app/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Tinos } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundAnimations from "@/components/BackgroundAnimations";
import { ASSETS, CONFERENCE, THEME } from "@/lib/conference";
import { getSiteSettings } from "@/lib/siteSettings";

const tinos = Tinos({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-tinos",
});

export const metadata: Metadata = {
  title: {
    default: CONFERENCE.displayName,
    template: `%s | ${CONFERENCE.displayName}`,
  },
  description: `${CONFERENCE.sessionName}. Join us on ${CONFERENCE.dates}. ${CONFERENCE.hashtag}`,
  keywords: [
    ...CONFERENCE.keywords,
    CONFERENCE.shortName,
    CONFERENCE.brandName,
  ],
  icons: {
    icon: [{ url: ASSETS.favicon, type: "image/x-icon" }],
    apple: [
      {
        url: ASSETS.logo,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: `${CONFERENCE.displayName} | ${CONFERENCE.fullName}`,
    description: `${CONFERENCE.dates} | ${CONFERENCE.sessionName}.`,
    url: CONFERENCE.siteUrl,
    siteName: CONFERENCE.displayName,
    images: [
      {
        url: `${CONFERENCE.siteUrl}${ASSETS.openGraph}`,
        width: 1200,
        height: 630,
        alt: `${CONFERENCE.displayName} - ${CONFERENCE.fullName}`,
      },
    ],
    locale: CONFERENCE.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${CONFERENCE.displayName} | ${CONFERENCE.fullName}`,
    description: `${CONFERENCE.dates} | ${CONFERENCE.hashtag}`,
    images: [`${CONFERENCE.siteUrl}${ASSETS.openGraph}`],
  },
  metadataBase: new URL(CONFERENCE.siteUrl),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className="overflow-x-hidden max-w-screen scroll-smooth">
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
        <BackgroundAnimations />

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
      </body>
    </html>
  );
}
