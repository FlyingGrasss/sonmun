import { getSiteSettings, normalizeSiteUrl } from "@/lib/siteSettings";
import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${normalizeSiteUrl(settings.conference.siteUrl)}/sitemap.xml`,
  };
}
